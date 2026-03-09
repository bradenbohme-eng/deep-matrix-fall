// Mission Manager — Bounded autonomy mission lifecycle
// Reference: AIOS Master Index §13, §30-39

import { supabase } from '@/integrations/supabase/client';
import { makeId } from '../contracts/ids';
import type {
  MissionObject, MissionStep, BudgetLimits, TaskEnvelope,
  ToolAction, ConfidenceRecord,
} from '../contracts/objects';
import type { AutonomyTier, MissionStatus, ToolClass, RiskClass, AgentRole } from '../contracts/enums';
import { AutonomyTierLabels } from '../contracts/enums';

// ─── Work Order ────────────────────────────────────────────────────────────

export interface WorkOrder {
  id: string;
  missionId: string;
  stepId: string;
  assignedAgent: AgentRole;
  objective: string;
  inputContext: string[];
  expectedOutputType: string;
  toolWhitelist: ToolClass[];
  riskCeiling: RiskClass;
  tokenBudget: number;
  timeoutMs: number;
  status: 'pending' | 'dispatched' | 'completed' | 'failed' | 'cancelled';
  result?: { output: unknown; confidence: number; tokensUsed: number };
  createdAt: string;
  completedAt?: string;
}

// ─── Tool Route ────────────────────────────────────────────────────────────

export interface ToolRoute {
  toolName: string;
  toolClass: ToolClass;
  riskClass: RiskClass;
  requiresApproval: (tier: AutonomyTier) => boolean;
  maxCallsPerMission: number;
}

const TOOL_ROUTES: ToolRoute[] = [
  { toolName: 'read_file', toolClass: 'read', riskClass: 'minimal', requiresApproval: () => false, maxCallsPerMission: 100 },
  { toolName: 'search_code', toolClass: 'read', riskClass: 'minimal', requiresApproval: () => false, maxCallsPerMission: 50 },
  { toolName: 'web_search', toolClass: 'web', riskClass: 'low', requiresApproval: (t) => t < 1, maxCallsPerMission: 20 },
  { toolName: 'write_file', toolClass: 'write', riskClass: 'moderate', requiresApproval: (t) => t < 2, maxCallsPerMission: 30 },
  { toolName: 'delete_file', toolClass: 'delete', riskClass: 'high', requiresApproval: (t) => t < 3, maxCallsPerMission: 5 },
  { toolName: 'execute_code', toolClass: 'shell', riskClass: 'high', requiresApproval: (t) => t < 3, maxCallsPerMission: 10 },
  { toolName: 'api_call', toolClass: 'api', riskClass: 'moderate', requiresApproval: (t) => t < 2, maxCallsPerMission: 20 },
  { toolName: 'db_write', toolClass: 'write', riskClass: 'high', requiresApproval: (t) => t < 3, maxCallsPerMission: 15 },
  { toolName: 'db_read', toolClass: 'read', riskClass: 'low', requiresApproval: (t) => t < 1, maxCallsPerMission: 50 },
  { toolName: 'simulate', toolClass: 'simulation', riskClass: 'low', requiresApproval: (t) => t < 1, maxCallsPerMission: 10 },
];

// ─── Tool Router ───────────────────────────────────────────────────────────

export class ToolRouter {
  private routes: Map<string, ToolRoute>;

  constructor() {
    this.routes = new Map(TOOL_ROUTES.map(r => [r.toolName, r]));
  }

  getRoute(toolName: string): ToolRoute | undefined {
    return this.routes.get(toolName);
  }

  isAllowed(toolName: string, allowedClasses: ToolClass[]): boolean {
    const route = this.routes.get(toolName);
    if (!route) return false;
    return allowedClasses.includes(route.toolClass);
  }

  needsApproval(toolName: string, tier: AutonomyTier): boolean {
    const route = this.routes.get(toolName);
    if (!route) return true; // Unknown tools always need approval
    return route.requiresApproval(tier);
  }

  filterByRiskCeiling(ceiling: RiskClass): ToolRoute[] {
    const riskOrder: RiskClass[] = ['minimal', 'low', 'moderate', 'high', 'critical'];
    const ceilingIdx = riskOrder.indexOf(ceiling);
    return TOOL_ROUTES.filter(r => riskOrder.indexOf(r.riskClass) <= ceilingIdx);
  }

  getAllRoutes(): ToolRoute[] {
    return [...TOOL_ROUTES];
  }
}

// ─── Mission Manager ───────────────────────────────────────────────────────

export class MissionManager {
  private toolRouter: ToolRouter;

  constructor() {
    this.toolRouter = new ToolRouter();
  }

  // Create a new mission
  async createMission(input: {
    title: string;
    objective: string;
    autonomyTier: AutonomyTier;
    allowedTools: ToolClass[];
    forbiddenActions: string[];
    budgetLimits: BudgetLimits;
    stopConditions: string[];
    escalationConditions: string[];
    successMetrics: string[];
    steps: Array<{ actionSummary: string }>;
    rollbackPlan?: string;
  }): Promise<string | null> {
    const id = makeId('mission');
    const steps: MissionStep[] = input.steps.map((s, i) => ({
      id: makeId('step'),
      sequenceNo: i + 1,
      status: 'pending' as const,
      actionSummary: s.actionSummary,
    }));

    const { error } = await supabase
      .from('missions' as any)
      .insert({
        id,
        title: input.title,
        objective: input.objective,
        status: 'draft',
        autonomy_tier: input.autonomyTier,
        allowed_tools: input.allowedTools,
        forbidden_actions: input.forbiddenActions,
        budget_limits: input.budgetLimits,
        stop_conditions: input.stopConditions,
        escalation_conditions: input.escalationConditions,
        success_metrics: input.successMetrics,
        steps,
        rollback_plan: input.rollbackPlan,
      });

    if (error) {
      console.error('Failed to create mission:', error);
      return null;
    }

    return id;
  }

  // Approve and start a mission
  async approveMission(missionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('missions' as any)
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', missionId);

    return !error;
  }

  async startMission(missionId: string): Promise<boolean> {
    const { data: mission, error: fetchErr } = await supabase
      .from('missions' as any)
      .select('*')
      .eq('id', missionId)
      .single();

    if (fetchErr || !mission) return false;
    const m = mission as any;
    if (m.status !== 'approved') return false;

    // Update first step to active
    const steps = (m.steps as MissionStep[]) || [];
    if (steps.length > 0) steps[0].status = 'active';

    const { error } = await supabase
      .from('missions' as any)
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
        current_step_index: 0,
        steps,
      })
      .eq('id', missionId);

    return !error;
  }

  // Generate work order for current step
  async generateWorkOrder(
    missionId: string,
    agentRole: AgentRole
  ): Promise<WorkOrder | null> {
    const { data, error } = await supabase
      .from('missions' as any)
      .select('*')
      .eq('id', missionId)
      .single();

    if (error || !data) return null;
    const m = data as any;

    const stepIdx = m.current_step_index ?? 0;
    const steps = (m.steps as MissionStep[]) || [];
    const currentStep = steps[stepIdx];
    if (!currentStep) return null;

    const allowedTools = (m.allowed_tools || []) as ToolClass[];
    const budgets = (m.budget_limits || {}) as BudgetLimits;
    const tier = (m.autonomy_tier ?? 0) as AutonomyTier;

    // Filter tools by mission's allowed classes and risk ceiling
    const availableRoutes = this.toolRouter.filterByRiskCeiling(
      tier >= 3 ? 'critical' : tier >= 2 ? 'high' : tier >= 1 ? 'moderate' : 'low'
    );
    const toolWhitelist = availableRoutes
      .filter(r => allowedTools.includes(r.toolClass))
      .map(r => r.toolClass);

    const workOrder: WorkOrder = {
      id: makeId('workorder'),
      missionId,
      stepId: currentStep.id,
      assignedAgent: agentRole,
      objective: currentStep.actionSummary,
      inputContext: [],
      expectedOutputType: 'structured',
      toolWhitelist: [...new Set(toolWhitelist)],
      riskCeiling: tier >= 3 ? 'critical' : tier >= 2 ? 'high' : tier >= 1 ? 'moderate' : 'low',
      tokenBudget: budgets.maxTokens ?? 10000,
      timeoutMs: budgets.maxDurationMs ?? 60000,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Persist work order
    await supabase
      .from('work_orders' as any)
      .insert({
        id: workOrder.id,
        mission_id: workOrder.missionId,
        step_id: workOrder.stepId,
        assigned_agent: workOrder.assignedAgent,
        objective: workOrder.objective,
        tool_whitelist: workOrder.toolWhitelist,
        risk_ceiling: workOrder.riskCeiling,
        token_budget: workOrder.tokenBudget,
        timeout_ms: workOrder.timeoutMs,
        status: workOrder.status,
      });

    return workOrder;
  }

  // Complete a work order and advance mission
  async completeWorkOrder(
    workOrderId: string,
    result: { output: unknown; confidence: number; tokensUsed: number }
  ): Promise<boolean> {
    // Update work order
    const { error: woErr } = await supabase
      .from('work_orders' as any)
      .update({
        status: 'completed',
        result,
        completed_at: new Date().toISOString(),
      })
      .eq('id', workOrderId);

    if (woErr) return false;

    // Get work order to find mission
    const { data: wo } = await supabase
      .from('work_orders' as any)
      .select('mission_id, step_id')
      .eq('id', workOrderId)
      .single();

    if (!wo) return false;
    const { mission_id } = wo as any;

    // Advance mission step
    const { data: mission } = await supabase
      .from('missions' as any)
      .select('*')
      .eq('id', mission_id)
      .single();

    if (!mission) return false;
    const m = mission as any;

    const steps = (m.steps as MissionStep[]) || [];
    const currentIdx = m.current_step_index ?? 0;

    // Mark current step done
    if (steps[currentIdx]) {
      steps[currentIdx].status = 'completed';
      steps[currentIdx].confidence = result.confidence;
    }

    // Check if mission is complete
    const nextIdx = currentIdx + 1;
    if (nextIdx >= steps.length) {
      // Mission complete
      await supabase
        .from('missions' as any)
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          steps,
          current_step_index: currentIdx,
        })
        .eq('id', mission_id);
    } else {
      // Advance to next step
      steps[nextIdx].status = 'active';
      await supabase
        .from('missions' as any)
        .update({
          steps,
          current_step_index: nextIdx,
        })
        .eq('id', mission_id);
    }

    return true;
  }

  // Abort mission with rollback
  async abortMission(missionId: string, reason: string): Promise<boolean> {
    const { error } = await supabase
      .from('missions' as any)
      .update({
        status: 'aborted',
        abort_reason: reason,
        completed_at: new Date().toISOString(),
      })
      .eq('id', missionId);

    return !error;
  }

  // List missions
  async listMissions(status?: MissionStatus): Promise<any[]> {
    let query = supabase
      .from('missions' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) return [];
    return (data ?? []) as any[];
  }

  // Get mission detail
  async getMission(missionId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('missions' as any)
      .select('*')
      .eq('id', missionId)
      .single();

    if (error) return null;
    return data;
  }

  // Get work orders for a mission
  async getWorkOrders(missionId: string): Promise<WorkOrder[]> {
    const { data, error } = await supabase
      .from('work_orders' as any)
      .select('*')
      .eq('mission_id', missionId)
      .order('created_at', { ascending: true });

    if (error) return [];
    return (data ?? []) as unknown as WorkOrder[];
  }

  getToolRouter(): ToolRouter {
    return this.toolRouter;
  }
}

// Singleton
let _missionManager: MissionManager | null = null;
export function getMissionManager(): MissionManager {
  if (!_missionManager) _missionManager = new MissionManager();
  return _missionManager;
}
