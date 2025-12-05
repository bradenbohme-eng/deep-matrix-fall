// AIMOS Memory Service - Perfect Context Management
// Implements hierarchical memory with priority-based retrieval

import { supabase } from "@/integrations/supabase/client";

export interface MemoryAtom {
  id: string;
  content: string;
  content_type: 'message' | 'thought' | 'reasoning_chain' | 'agent_action' | 'user_insight' | 'decision' | 'context';
  priority: number; // 1-10, higher = more important
  importance: number; // 0-1, semantic importance
  recency_score: number; // 0-1, time decay
  confidence_score: number;
  tags: string[];
  thread_id?: string;
  user_id?: string;
  parent_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ReasoningTrace {
  id: string;
  phase: string;
  thought: string;
  confidence: number;
  agent_id?: string;
  agent_name?: string;
  depth: number;
  children?: ReasoningTrace[];
  source_refs?: string[];
  timestamp: string;
}

export interface ConversationContext {
  recentMessages: MemoryAtom[];
  relatedMemories: MemoryAtom[];
  userInsights: MemoryAtom[];
  reasoningHistory: ReasoningTrace[];
  hierarchicalSummary: string;
  totalTokenEstimate: number;
}

// Calculate time decay for recency weighting
const calculateRecencyScore = (createdAt: string): number => {
  const now = Date.now();
  const created = new Date(createdAt).getTime();
  const hoursSince = (now - created) / (1000 * 60 * 60);
  
  // Exponential decay - recent items score higher
  // Half-life of ~24 hours
  return Math.exp(-hoursSince / 24);
};

// Calculate composite relevance score
const calculateRelevanceScore = (atom: MemoryAtom, queryTags: string[]): number => {
  const priorityWeight = 0.3;
  const importanceWeight = 0.3;
  const recencyWeight = 0.2;
  const tagMatchWeight = 0.2;
  
  const normalizedPriority = atom.priority / 10;
  const recency = calculateRecencyScore(atom.created_at);
  
  // Tag match score
  const matchingTags = atom.tags.filter(t => queryTags.includes(t.toLowerCase())).length;
  const tagScore = queryTags.length > 0 ? matchingTags / queryTags.length : 0.5;
  
  return (
    normalizedPriority * priorityWeight +
    atom.importance * importanceWeight +
    recency * recencyWeight +
    tagScore * tagMatchWeight
  );
};

// Priority assignment based on content type and context
export const assignPriority = (
  content: string,
  contentType: MemoryAtom['content_type'],
  context: { isUserMessage?: boolean; hasDecision?: boolean; hasInsight?: boolean; errorContext?: boolean }
): number => {
  let base = 5;
  
  // Content type bonuses
  const typeBonus: Record<string, number> = {
    user_insight: 3,
    decision: 3,
    reasoning_chain: 2,
    thought: 1,
    agent_action: 1,
    message: 0,
    context: -1
  };
  base += typeBonus[contentType] || 0;
  
  // Context bonuses
  if (context.isUserMessage) base += 2;
  if (context.hasDecision) base += 2;
  if (context.hasInsight) base += 1;
  if (context.errorContext) base += 1;
  
  // Content analysis bonuses
  if (content.includes('IMPORTANT') || content.includes('CRITICAL')) base += 1;
  if (content.includes('remember') || content.includes('note')) base += 1;
  if (content.length > 500) base += 1; // Longer content likely more substantial
  
  return Math.min(10, Math.max(1, base));
};

// Importance scoring based on semantic analysis
export const calculateImportance = (content: string, contentType: MemoryAtom['content_type']): number => {
  let score = 0.5;
  
  // Length factor
  const words = content.split(/\s+/).length;
  if (words > 100) score += 0.1;
  if (words > 300) score += 0.1;
  
  // Semantic markers
  const importanceMarkers = [
    'conclusion', 'decision', 'important', 'key', 'critical', 
    'must', 'should', 'always', 'never', 'insight', 'learned',
    'understanding', 'realized', 'discovered'
  ];
  const markerMatches = importanceMarkers.filter(m => 
    content.toLowerCase().includes(m)
  ).length;
  score += Math.min(0.2, markerMatches * 0.05);
  
  // Content type factor
  if (contentType === 'decision' || contentType === 'user_insight') score += 0.15;
  if (contentType === 'reasoning_chain') score += 0.1;
  
  return Math.min(1, score);
};

// Store memory with full metadata
export const storeMemory = async (
  content: string,
  contentType: MemoryAtom['content_type'],
  userId: string,
  conversationId: string,
  options: {
    tags?: string[];
    confidence?: number;
    metadata?: Record<string, any>;
    parentId?: string;
    isUserMessage?: boolean;
  } = {}
): Promise<string | null> => {
  const priority = assignPriority(content, contentType, {
    isUserMessage: options.isUserMessage,
    hasDecision: content.toLowerCase().includes('decision') || content.toLowerCase().includes('decided'),
    hasInsight: content.toLowerCase().includes('insight') || content.toLowerCase().includes('realize')
  });
  
  const importance = calculateImportance(content, contentType);
  
  const { data, error } = await supabase
    .from('aimos_memory_atoms')
    .insert({
      content,
      content_type: contentType,
      user_id: userId,
      thread_id: conversationId,
      tags: options.tags || extractTags(content),
      confidence_score: options.confidence || 0.8,
      quality_score: priority / 10,
      relevance_score: importance,
      metadata: {
        ...options.metadata,
        priority,
        importance,
        stored_via: 'aimos_memory_service'
      },
      parent_id: options.parentId
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Failed to store memory:', error);
    return null;
  }
  
  return data?.id || null;
};

// Extract tags from content
const extractTags = (content: string): string[] => {
  const tags: string[] = [];
  
  // Common topic detection
  const topics = ['code', 'design', 'architecture', 'bug', 'feature', 'user', 'api', 
                  'database', 'security', 'performance', 'ui', 'logic', 'error', 'plan'];
  topics.forEach(topic => {
    if (content.toLowerCase().includes(topic)) tags.push(topic);
  });
  
  // Detect reasoning phases
  const phases = ['analysis', 'synthesis', 'validation', 'research', 'decomposition'];
  phases.forEach(phase => {
    if (content.toLowerCase().includes(phase)) tags.push(phase);
  });
  
  return tags.slice(0, 10); // Limit tags
};

// Store reasoning trace with hierarchical structure
export const storeReasoningTrace = async (
  traces: ReasoningTrace[],
  userId: string,
  conversationId: string,
  mode: string
): Promise<string | null> => {
  if (traces.length === 0) return null;
  
  const content = traces.map(t => 
    `[${t.phase.toUpperCase()}] ${t.thought} (κ=${Math.round(t.confidence * 100)}%)`
  ).join('\n');
  
  const avgConfidence = traces.reduce((sum, t) => sum + t.confidence, 0) / traces.length;
  
  return storeMemory(content, 'reasoning_chain', userId, conversationId, {
    tags: ['reasoning', mode, ...new Set(traces.map(t => t.phase.toLowerCase()))],
    confidence: avgConfidence,
    metadata: {
      traces,
      phases: [...new Set(traces.map(t => t.phase))],
      total_steps: traces.length,
      max_depth: Math.max(...traces.map(t => t.depth)),
      mode
    }
  });
};

// Hierarchical context retrieval with weighted scoring
export const retrieveHierarchicalContext = async (
  userId: string,
  conversationId: string,
  query: string,
  options: {
    maxTokens?: number;
    includeReasoning?: boolean;
    priorityThreshold?: number;
    timeWindowHours?: number;
  } = {}
): Promise<ConversationContext> => {
  const maxTokens = options.maxTokens || 8000;
  const priorityThreshold = options.priorityThreshold || 3;
  const timeWindowHours = options.timeWindowHours || 168; // 1 week default
  
  const queryTags = extractTags(query);
  const cutoffTime = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000).toISOString();
  
  // Fetch recent conversation messages
  const { data: recentData } = await supabase
    .from('chat_memories')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(50);
  
  // Fetch related memory atoms with priority
  const { data: memoryData } = await supabase
    .from('aimos_memory_atoms')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', cutoffTime)
    .order('created_at', { ascending: false })
    .limit(100);
  
  // Fetch user insights specifically
  const { data: insightData } = await supabase
    .from('aimos_memory_atoms')
    .select('*')
    .eq('user_id', userId)
    .eq('content_type', 'user_insight')
    .order('created_at', { ascending: false })
    .limit(20);
  
  // Transform and score memories
  const transformMemory = (item: any): MemoryAtom => ({
    id: item.id,
    content: item.content || item.summary || '',
    content_type: item.content_type || 'message',
    priority: item.metadata?.priority || item.quality_score * 10 || 5,
    importance: item.relevance_score || item.metadata?.importance || 0.5,
    recency_score: calculateRecencyScore(item.created_at),
    confidence_score: item.confidence_score || 0.7,
    tags: item.tags || [],
    thread_id: item.thread_id || item.conversation_id,
    user_id: item.user_id,
    parent_id: item.parent_id,
    metadata: item.metadata,
    created_at: item.created_at
  });
  
  const recentMessages = (recentData || []).map(transformMemory);
  const allMemories = (memoryData || []).map(transformMemory);
  const userInsights = (insightData || []).map(transformMemory);
  
  // Score and sort by relevance
  const scoredMemories = allMemories
    .map(m => ({ ...m, relevanceScore: calculateRelevanceScore(m, queryTags) }))
    .filter(m => m.priority >= priorityThreshold)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  // Extract reasoning history from memories
  const reasoningHistory: ReasoningTrace[] = [];
  scoredMemories
    .filter(m => m.content_type === 'reasoning_chain')
    .forEach(m => {
      if (m.metadata?.traces) {
        reasoningHistory.push(...m.metadata.traces);
      }
    });
  
  // Build hierarchical summary
  let tokenEstimate = 0;
  const summaryParts: string[] = [];
  
  // Most important memories first
  const highPriority = scoredMemories.filter(m => m.priority >= 7);
  if (highPriority.length > 0) {
    summaryParts.push('=== HIGH PRIORITY CONTEXT ===');
    highPriority.slice(0, 5).forEach(m => {
      summaryParts.push(`[P${m.priority}] ${m.content.slice(0, 200)}...`);
      tokenEstimate += m.content.length / 4;
    });
  }
  
  // User insights
  if (userInsights.length > 0) {
    summaryParts.push('\n=== USER INSIGHTS ===');
    userInsights.slice(0, 5).forEach(m => {
      summaryParts.push(`• ${m.content.slice(0, 150)}`);
      tokenEstimate += m.content.length / 4;
    });
  }
  
  // Recent reasoning
  if (reasoningHistory.length > 0) {
    summaryParts.push('\n=== RECENT REASONING ===');
    reasoningHistory.slice(-10).forEach(t => {
      summaryParts.push(`[${t.phase}] ${t.thought.slice(0, 100)}...`);
      tokenEstimate += t.thought.length / 4;
    });
  }
  
  return {
    recentMessages: recentMessages.slice(0, 20),
    relatedMemories: scoredMemories.slice(0, 30),
    userInsights,
    reasoningHistory,
    hierarchicalSummary: summaryParts.join('\n'),
    totalTokenEstimate: Math.round(tokenEstimate)
  };
};

// Determine optimal reasoning depth based on query analysis
export const determineReasoningDepth = (query: string, context: ConversationContext): {
  depth: 'shallow' | 'moderate' | 'deep' | 'maximum';
  phases: string[];
  shouldActivateAgents: string[];
  tokenBudget: number;
} => {
  const queryLower = query.toLowerCase();
  const words = query.split(/\s+/).length;
  
  // Complexity indicators
  const complexitySignals = {
    multiStep: queryLower.includes('and then') || queryLower.includes('after that') || queryLower.includes('step'),
    deepAnalysis: queryLower.includes('analyze') || queryLower.includes('explain') || queryLower.includes('why'),
    creative: queryLower.includes('create') || queryLower.includes('design') || queryLower.includes('build'),
    research: queryLower.includes('find') || queryLower.includes('search') || queryLower.includes('research'),
    planning: queryLower.includes('plan') || queryLower.includes('strategy') || queryLower.includes('roadmap'),
    debugging: queryLower.includes('bug') || queryLower.includes('error') || queryLower.includes('fix') || queryLower.includes('issue'),
    simple: words < 10 && !queryLower.includes('?'),
    complex: words > 50 || query.includes('\n'),
    deepThinkRequest: queryLower.includes('deep') || queryLower.includes('thoroughly') || queryLower.includes('comprehensive'),
    hasContext: context.relatedMemories.length > 10
  };
  
  // Calculate complexity score
  let complexity = 0;
  if (complexitySignals.multiStep) complexity += 2;
  if (complexitySignals.deepAnalysis) complexity += 2;
  if (complexitySignals.creative) complexity += 2;
  if (complexitySignals.research) complexity += 1;
  if (complexitySignals.planning) complexity += 2;
  if (complexitySignals.debugging) complexity += 1;
  if (complexitySignals.complex) complexity += 1;
  if (complexitySignals.deepThinkRequest) complexity += 3;
  if (complexitySignals.hasContext) complexity += 1;
  if (complexitySignals.simple) complexity -= 2;
  
  // Determine depth
  let depth: 'shallow' | 'moderate' | 'deep' | 'maximum';
  let phases: string[];
  let agents: string[];
  let tokenBudget: number;
  
  if (complexity <= 0) {
    depth = 'shallow';
    phases = ['SYNTHESIS'];
    agents = ['apoe-orchestrator'];
    tokenBudget = 2000;
  } else if (complexity <= 2) {
    depth = 'moderate';
    phases = ['ANALYSIS', 'SYNTHESIS', 'VALIDATION'];
    agents = ['apoe-orchestrator', 'memory-agent'];
    tokenBudget = 4000;
  } else if (complexity <= 5) {
    depth = 'deep';
    phases = ['ANALYSIS', 'DECOMPOSITION', 'RESEARCH', 'SYNTHESIS', 'VALIDATION'];
    agents = ['apoe-orchestrator', 'code-architect', 'research-agent', 'memory-agent'];
    tokenBudget = 8000;
  } else {
    depth = 'maximum';
    phases = ['ANALYSIS', 'DECOMPOSITION', 'RESEARCH', 'SYNTHESIS', 'VALIDATION', 'AUDIT', 'INTEGRATION'];
    agents = ['apoe-orchestrator', 'code-architect', 'research-agent', 'memory-agent', 'security-agent', 'meta-observer', 'quality-gate'];
    tokenBudget = 16000;
  }
  
  return {
    depth,
    phases,
    shouldActivateAgents: agents,
    tokenBudget
  };
};

// Store user message with analysis
export const storeUserMessage = async (
  content: string,
  userId: string,
  conversationId: string
): Promise<void> => {
  // Store as chat memory
  await supabase.from('chat_memories').insert({
    conversation_id: conversationId,
    user_id: userId,
    role: 'user',
    content,
    summary: content.slice(0, 250),
    confidence_score: 1.0,
    metadata: {
      word_count: content.split(/\s+/).length,
      stored_at: new Date().toISOString()
    }
  });
  
  // Also store as memory atom for cross-conversation retrieval
  await storeMemory(content, 'message', userId, conversationId, {
    isUserMessage: true,
    tags: extractTags(content),
    confidence: 1.0
  });
};

// Store assistant response with full trace
export const storeAssistantResponse = async (
  content: string,
  userId: string,
  conversationId: string,
  traces: ReasoningTrace[],
  mode: string,
  confidence: number
): Promise<void> => {
  // Store as chat memory
  await supabase.from('chat_memories').insert({
    conversation_id: conversationId,
    user_id: userId,
    role: 'assistant',
    content,
    summary: content.slice(0, 250),
    confidence_score: confidence,
    mode,
    metadata: {
      reasoning_steps: traces.length,
      phases: [...new Set(traces.map(t => t.phase))],
      stored_at: new Date().toISOString()
    }
  });
  
  // Store reasoning trace separately
  if (traces.length > 0) {
    await storeReasoningTrace(traces, userId, conversationId, mode);
  }
  
  // Store as memory atom
  await storeMemory(content, 'message', userId, conversationId, {
    tags: [...extractTags(content), mode],
    confidence,
    metadata: { mode, reasoning_depth: traces.length }
  });
};

// Store user insight for long-term learning
export const storeUserInsight = async (
  insight: string,
  userId: string,
  conversationId: string,
  context: string
): Promise<void> => {
  await storeMemory(insight, 'user_insight', userId, conversationId, {
    tags: ['user_preference', 'insight', 'learning'],
    confidence: 0.9,
    metadata: {
      context,
      learned_at: new Date().toISOString()
    }
  });
};

export default {
  storeMemory,
  storeReasoningTrace,
  retrieveHierarchicalContext,
  determineReasoningDepth,
  storeUserMessage,
  storeAssistantResponse,
  storeUserInsight,
  assignPriority,
  calculateImportance
};
