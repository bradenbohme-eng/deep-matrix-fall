import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NarrativeContext {
  player_id: string;
  faction_id?: string;
  reputation: number;
  clearance_level: number;
  personal_history: any[];
  world_state: any;
  tension_factors: any;
}

interface MissionTemplate {
  type: string;
  templates: {
    title: string;
    description: string;
    objectives: string[];
    rewards: any;
    prerequisites: any;
  }[];
}

const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    type: "intelligence",
    templates: [
      {
        title: "Data Extraction Protocol",
        description: "Infiltrate secure servers and extract classified information without detection. Target contains critical faction intelligence.",
        objectives: ["Bypass security systems", "Extract target data", "Maintain stealth", "Exfiltrate safely"],
        rewards: { isk: 25000, intel: 3, reputation: 5 },
        prerequisites: { clearance_level: 2, reputation: 10 }
      },
      {
        title: "Signal Intelligence Gathering",
        description: "Monitor enemy communications and decode encrypted transmissions. Intelligence suggests major faction movement.",
        objectives: ["Deploy surveillance equipment", "Monitor transmissions", "Decode messages", "Report findings"],
        rewards: { isk: 15000, intel: 5, reputation: 3 },
        prerequisites: { clearance_level: 1, reputation: 0 }
      }
    ]
  },
  {
    type: "sabotage",
    templates: [
      {
        title: "Infrastructure Disruption",
        description: "Disable critical enemy infrastructure to slow their operations. Target is heavily defended.",
        objectives: ["Identify vulnerabilities", "Plant disruption devices", "Avoid detection", "Confirm success"],
        rewards: { isk: 40000, intel: 2, reputation: 8 },
        prerequisites: { clearance_level: 3, reputation: 25 }
      },
      {
        title: "Supply Chain Interference",
        description: "Disrupt enemy supply lines by compromising logistics networks. Subtle approach required.",
        objectives: ["Map supply routes", "Identify weak points", "Execute disruption", "Cover tracks"],
        rewards: { isk: 30000, intel: 1, reputation: 6 },
        prerequisites: { clearance_level: 2, reputation: 15 }
      }
    ]
  },
  {
    type: "diplomacy",
    templates: [
      {
        title: "Asset Recruitment",
        description: "Identify and recruit valuable assets from neutral or hostile factions. High-value target identified.",
        objectives: ["Research target", "Make contact", "Negotiate terms", "Secure loyalty"],
        rewards: { isk: 20000, intel: 4, reputation: 10 },
        prerequisites: { clearance_level: 2, reputation: 20 }
      },
      {
        title: "Information Brokerage",
        description: "Facilitate information exchange between factions while maintaining plausible deniability.",
        objectives: ["Verify intelligence", "Contact parties", "Negotiate exchange", "Complete transaction"],
        rewards: { isk: 35000, intel: 6, reputation: 4 },
        prerequisites: { clearance_level: 3, reputation: 30 }
      }
    ]
  }
];

const GLOBAL_EVENTS = [
  {
    type: "faction_betrayal",
    preconditions: { min_tension: 0.6, alliance_exists: true },
    consequences: { tension_increase: 0.2, reputation_shifts: true },
    narrative: "Intelligence reports suggest imminent betrayal between allied factions."
  },
  {
    type: "resource_crisis",
    preconditions: { economic_instability: 0.4 },
    consequences: { isk_scarcity: true, increased_competition: true },
    narrative: "Global resource shortages threaten faction stability."
  },
  {
    type: "ai_anomaly",
    preconditions: { ai_anomalies: 0.3 },
    consequences: { mission_complications: true, new_threats: true },
    narrative: "Rogue AI systems detected. All operations proceed with extreme caution."
  }
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, ...params } = await req.json();

    switch (action) {
      case 'generate_missions':
        return await generateMissions(supabase, params);
      case 'execute_mission':
        return await executeMission(supabase, params);
      case 'process_world_event':
        return await processWorldEvent(supabase, params);
      case 'update_narrative_state':
        return await updateNarrativeState(supabase, params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Narrative engine error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function generateMissions(supabase: any, params: any) {
  const { player_id, count = 3 } = params;

  // Get player context
  const { data: player } = await supabase
    .from('warfare_players')
    .select(`
      *,
      factions (*)
    `)
    .eq('id', player_id)
    .single();

  if (!player) {
    throw new Error('Player not found');
  }

  // Get world state
  const { data: worldClock } = await supabase
    .from('world_war_clock')
    .select('*')
    .single();

  const context: NarrativeContext = {
    player_id,
    faction_id: player.faction_id,
    reputation: player.resources.reputation,
    clearance_level: player.clearance_level,
    personal_history: player.personal_history,
    world_state: worldClock,
    tension_factors: worldClock?.tension_factors || {}
  };

  // Generate missions based on context
  const missions = [];
  const availableTypes = MISSION_TEMPLATES.filter(template => 
    template.templates.some(t => 
      context.clearance_level >= t.prerequisites.clearance_level &&
      context.reputation >= t.prerequisites.reputation
    )
  );

  for (let i = 0; i < Math.min(count, availableTypes.length); i++) {
    const template = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    const missionTemplate = template.templates.find(t => 
      context.clearance_level >= t.prerequisites.clearance_level &&
      context.reputation >= t.prerequisites.reputation
    );

    if (missionTemplate) {
      const mission = {
        mission_type: template.type,
        title: personalizeTitle(missionTemplate.title, context),
        description: personalizeDescription(missionTemplate.description, context),
        objectives: missionTemplate.objectives,
        rewards: scalerewards(missionTemplate.rewards, context),
        deadline: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        context_data: {
          generated_by: 'narrative_engine',
          world_tension: worldClock?.escalation_probability || 0,
          faction_context: player.factions?.name || 'unknown'
        }
      };

      missions.push(mission);
    }
  }

  // Log generation event
  await supabase.from('warfare_events').insert({
    event_type: 'mission_generation',
    actor_type: 'ai',
    actor_id: 'narrative_engine',
    action_data: {
      player_id,
      missions_generated: missions.length,
      context_factors: Object.keys(context.tension_factors)
    },
    impact_score: 0.1
  });

  return new Response(
    JSON.stringify({ missions, success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function executeMission(supabase: any, params: any) {
  const { mission_id, player_action, player_id } = params;

  // Get mission and player data
  const { data: mission } = await supabase
    .from('missions')
    .select('*')
    .eq('id', mission_id)
    .single();

  const { data: player } = await supabase
    .from('warfare_players')
    .select('*')
    .eq('id', player_id)
    .single();

  if (!mission || !player) {
    throw new Error('Mission or player not found');
  }

  // Simulate mission execution based on player action and world state
  const success_probability = calculateSuccessProbability(mission, player, player_action);
  const success = Math.random() < success_probability;

  let resource_changes = {};
  let mission_complete = false;
  let narrative_result = '';

  if (success) {
    resource_changes = mission.rewards;
    mission_complete = true;
    narrative_result = `Mission "${mission.title}" completed successfully. ${player_action.toUpperCase()} was effective.`;
    
    // Update world state based on mission impact
    await updateWorldTension(supabase, mission.mission_type, 0.05);
  } else {
    // Failure consequences
    resource_changes = { reputation: -2 };
    narrative_result = `Mission "${mission.title}" failed. ${player_action.toUpperCase()} was ineffective. Reputation damaged.`;
    
    await updateWorldTension(supabase, 'mission_failure', 0.1);
  }

  // Log the event
  await supabase.from('warfare_events').insert({
    event_type: 'mission_execution',
    actor_type: 'player',
    actor_id: player_id,
    action_data: {
      mission_id,
      mission_type: mission.mission_type,
      player_action,
      success,
      resource_changes
    },
    impact_score: success ? 0.3 : 0.1
  });

  return new Response(
    JSON.stringify({
      success: true,
      mission_complete,
      resource_changes,
      narrative_result
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function processWorldEvent(supabase: any, params: any) {
  const { event_type, trigger_data } = params;

  // Get current world state
  const { data: worldClock } = await supabase
    .from('world_war_clock')
    .select('*')
    .single();

  // Find matching global event
  const globalEvent = GLOBAL_EVENTS.find(event => event.type === event_type);
  if (!globalEvent) {
    throw new Error(`Unknown event type: ${event_type}`);
  }

  // Check preconditions
  const preconditionsMet = checkPreconditions(globalEvent.preconditions, worldClock, trigger_data);
  
  if (!preconditionsMet) {
    return new Response(
      JSON.stringify({ success: false, reason: 'Preconditions not met' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Apply consequences
  const consequences = globalEvent.consequences;
  let tension_updates = { ...worldClock.tension_factors };

  if (consequences.tension_increase) {
    // Increase random tension factor
    const factors = Object.keys(tension_updates);
    const randomFactor = factors[Math.floor(Math.random() * factors.length)];
    tension_updates[randomFactor] = Math.min(1.0, tension_updates[randomFactor] + consequences.tension_increase);
  }

  // Update world clock
  const newMinutesToMidnight = Math.max(1, worldClock.minutes_to_midnight - (consequences.tension_increase * 10));
  
  await supabase
    .from('world_war_clock')
    .update({
      minutes_to_midnight: newMinutesToMidnight,
      tension_factors: tension_updates,
      recent_events: [
        { event: event_type, timestamp: new Date().toISOString(), narrative: globalEvent.narrative },
        ...worldClock.recent_events.slice(0, 9)
      ],
      escalation_probability: calculateEscalationProbability(tension_updates)
    })
    .eq('id', worldClock.id);

  // Create global event record
  await supabase.from('global_events').insert({
    event_type,
    title: `Global Event: ${event_type.replace('_', ' ').toUpperCase()}`,
    description: globalEvent.narrative,
    consequences: consequences,
    active: true
  });

  return new Response(
    JSON.stringify({ success: true, consequences, new_tension: tension_updates }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function updateNarrativeState(supabase: any, params: any) {
  const { context_type, context_id, narrative_updates } = params;

  await supabase
    .from('narrative_state')
    .upsert({
      context_type,
      context_id,
      ...narrative_updates,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'context_type,context_id'
    });

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Helper functions
function personalizeTitle(title: string, context: NarrativeContext): string {
  const variations = {
    'Data Extraction Protocol': [
      'Classified Data Retrieval',
      'Intelligence Harvesting Operation',
      'Secure Server Infiltration'
    ],
    'Signal Intelligence Gathering': [
      'Communications Monitoring',
      'Electronic Surveillance Mission',
      'Signal Interception Protocol'
    ]
  };
  
  const options = variations[title] || [title];
  return options[Math.floor(Math.random() * options.length)];
}

function personalizeDescription(description: string, context: NarrativeContext): string {
  // Add faction-specific context
  const factionContext = context.faction_id ? ` Your faction's intelligence networks have identified this as a priority target.` : '';
  const tensionContext = context.world_state?.escalation_probability > 0.7 ? 
    ' WARNING: High global tension detected. Exercise extreme caution.' : '';
  
  return description + factionContext + tensionContext;
}

function scalerewards(rewards: any, context: NarrativeContext): any {
  const multiplier = 1 + (context.clearance_level - 1) * 0.5;
  return {
    isk: Math.floor(rewards.isk * multiplier),
    intel: rewards.intel,
    reputation: rewards.reputation
  };
}

function calculateSuccessProbability(mission: any, player: any, action: string): number {
  let base_probability = 0.7;
  
  // Adjust based on player clearance
  base_probability += (player.clearance_level - 1) * 0.1;
  
  // Adjust based on action type
  const action_bonuses: Record<string, number> = {
    'accept': 0.0,
    'investigate': 0.15,
    'infiltrate': -0.1,
    'negotiate': 0.1
  };
  
  base_probability += action_bonuses[action] || 0;
  
  // Clamp between 0.1 and 0.9
  return Math.max(0.1, Math.min(0.9, base_probability));
}

async function updateWorldTension(supabase: any, trigger: string, amount: number) {
  const { data: worldClock } = await supabase
    .from('world_war_clock')
    .select('*')
    .single();

  if (!worldClock) return;

  const tension_updates = { ...worldClock.tension_factors };
  
  // Map triggers to tension factors
  const trigger_mappings: Record<string, string> = {
    'intelligence': 'cyber_warfare',
    'sabotage': 'nuclear_tension',
    'diplomacy': 'economic_instability',
    'mission_failure': 'ai_anomalies'
  };

  const target_factor = trigger_mappings[trigger] || 'cyber_warfare';
  tension_updates[target_factor] = Math.min(1.0, tension_updates[target_factor] + amount);

  await supabase
    .from('world_war_clock')
    .update({ 
      tension_factors: tension_updates,
      escalation_probability: calculateEscalationProbability(tension_updates)
    })
    .eq('id', worldClock.id);
}

function checkPreconditions(preconditions: any, worldState: any, triggerData: any): boolean {
  // Implement precondition checking logic
  for (const [key, value] of Object.entries(preconditions)) {
    if (key === 'min_tension') {
      const avgTension = Object.values(worldState.tension_factors).reduce((a: any, b: any) => a + b, 0) / 4;
      if (avgTension < value) return false;
    }
    // Add more precondition checks as needed
  }
  return true;
}

function calculateEscalationProbability(tensionFactors: any): number {
  const avgTension = Object.values(tensionFactors).reduce((a: any, b: any) => a + b, 0) / 4;
  return Math.min(0.95, avgTension * 1.2);
}