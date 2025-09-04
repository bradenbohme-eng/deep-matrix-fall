import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WarfarePlayer {
  id: string;
  user_id: string;
  faction_id: string;
  rank: string;
  resources: {
    isk: number;
    reputation: number;
    intel: number;
  };
  clearance_level: number;
  active_missions: any[];
  personal_history: any[];
}

interface Faction {
  id: string;
  name: string;
  description: string;
  ideology: any;
  resources: {
    isk: number;
    reputation: number;
    intel: number;
  };
}

interface WorldWarClock {
  id: string;
  minutes_to_midnight: number;
  tension_factors: {
    nuclear_tension: number;
    cyber_warfare: number;
    economic_instability: number;
    ai_anomalies: number;
  };
  recent_events: any[];
  escalation_probability: number;
}

interface Mission {
  id: string;
  title: string;
  description: string;
  objectives: any[];
  rewards: any;
  deadline?: string;
  status: string;
  mission_type: string;
}

export const WarfareEngine: React.FC = () => {
  const [player, setPlayer] = useState<WarfarePlayer | null>(null);
  const [factions, setFactions] = useState<Faction[]>([]);
  const [worldClock, setWorldClock] = useState<WorldWarClock | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFaction, setSelectedFaction] = useState<string>('');

  // Initialize player profile
  const initializePlayer = useCallback(async (factionId: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data: existing } = await supabase
      .from('warfare_players')
      .select('*')
      .eq('user_id', userData.user.id)
      .single();

    if (!existing) {
      const { data: newPlayer, error } = await supabase
        .from('warfare_players')
        .insert([{
          user_id: userData.user.id,
          faction_id: factionId,
          rank: 'recruit',
          resources: { isk: 10000, reputation: 0, intel: 0 },
          clearance_level: 1,
          personal_history: [{
            event: 'joined_faction',
            timestamp: new Date().toISOString(),
            data: { faction_id: factionId }
          }]
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating player:', error);
      } else {
        setPlayer(newPlayer as unknown as WarfarePlayer);
        await generateInitialMissions(newPlayer.id);
      }
    } else {
      setPlayer(existing as unknown as WarfarePlayer);
    }
  }, []);

  // Generate personalized missions using AI
  const generateInitialMissions = async (playerId: string) => {
    try {
      const { data } = await supabase.functions.invoke('narrative-engine', {
        body: {
          action: 'generate_missions',
          player_id: playerId,
          count: 3
        }
      });

      if (data?.missions) {
        const missionInserts = data.missions.map((mission: any) => ({
          player_id: playerId,
          ...mission
        }));

        await supabase.from('missions').insert(missionInserts);
        loadMissions();
      }
    } catch (error) {
      console.error('Error generating missions:', error);
    }
  };

  // Load game state
  const loadGameState = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load factions
      const { data: factionsData } = await supabase
        .from('factions')
        .select('*');
      
      if (factionsData) setFactions(factionsData as unknown as Faction[]);

      // Load world clock
      const { data: clockData } = await supabase
        .from('world_war_clock')
        .select('*')
        .single();
      
      if (clockData) setWorldClock(clockData as unknown as WorldWarClock);

      // Load player if authenticated
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { data: playerData } = await supabase
          .from('warfare_players')
          .select('*')
          .eq('user_id', userData.user.id)
          .single();
        
        if (playerData) {
          setPlayer(playerData as unknown as WarfarePlayer);
          loadMissions();
        }
      }
    } catch (error) {
      console.error('Error loading game state:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMissions = async () => {
    if (!player) return;
    
    const { data: missionsData } = await supabase
      .from('missions')
      .select('*')
      .eq('player_id', player.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (missionsData) setMissions(missionsData as unknown as Mission[]);
  };

  // Execute mission action
  const executeMission = async (missionId: string, action: string) => {
    try {
      const { data } = await supabase.functions.invoke('narrative-engine', {
        body: {
          action: 'execute_mission',
          mission_id: missionId,
          player_action: action,
          player_id: player?.id
        }
      });

      if (data?.success) {
        // Update player resources
        if (data.resource_changes) {
          const newResources = {
            ...player!.resources,
            ...data.resource_changes
          };
          
          await supabase
            .from('warfare_players')
            .update({ resources: newResources })
            .eq('id', player!.id);
          
          setPlayer(prev => prev ? { ...prev, resources: newResources } : null);
        }

        // Update mission status
        await supabase
          .from('missions')
          .update({ 
            status: data.mission_complete ? 'completed' : 'active',
            completed_at: data.mission_complete ? new Date().toISOString() : null
          })
          .eq('id', missionId);

        loadMissions();
        loadGameState(); // Refresh world state
      }
    } catch (error) {
      console.error('Error executing mission:', error);
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    loadGameState();

    // Subscribe to world events
    const worldEventsChannel = supabase
      .channel('world-events')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'world_war_clock' 
      }, () => {
        loadGameState();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'warfare_events' 
      }, () => {
        loadGameState();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(worldEventsChannel);
    };
  }, [loadGameState]);

  const getTensionColor = (level: number) => {
    if (level < 0.3) return 'text-green-400';
    if (level < 0.7) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRankColor = (rank: string) => {
    const colors: Record<string, string> = {
      'recruit': 'bg-gray-500',
      'operative': 'bg-blue-500',
      'agent': 'bg-purple-500',
      'commander': 'bg-orange-500',
      'director': 'bg-red-500'
    };
    return colors[rank] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-primary font-mono">INITIALIZING WARFARE SYSTEMS...</div>
      </div>
    );
  }

  // Faction selection screen
  if (!player) {
    return (
      <Card className="p-6 bg-card/80 backdrop-blur border border-primary/20">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-mono text-primary mb-2">FACTION SELECTION</h2>
            <p className="text-muted-foreground">Choose your allegiance in the global conflict</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {factions.map((faction) => (
              <Card 
                key={faction.id} 
                className={`p-4 cursor-pointer transition-all border ${
                  selectedFaction === faction.id 
                    ? 'border-primary bg-primary/10' 
                    : 'border-primary/20 hover:border-primary/40'
                }`}
                onClick={() => setSelectedFaction(faction.id)}
              >
                <h3 className="font-mono text-lg text-primary mb-2">{faction.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{faction.description}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>ISK</span>
                    <span className="text-green-400">{faction.resources.isk.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Intel</span>
                    <span className="text-blue-400">{faction.resources.intel}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Reputation</span>
                    <span className="text-purple-400">{faction.resources.reputation}</span>
                  </div>
                </div>

                {faction.ideology?.focus && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    {faction.ideology.focus}
                  </Badge>
                )}
              </Card>
            ))}
          </div>
          
          <Button 
            onClick={() => selectedFaction && initializePlayer(selectedFaction)}
            disabled={!selectedFaction}
            className="w-full font-mono"
          >
            JOIN SELECTED FACTION
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* World War Clock */}
      {worldClock && (
        <Card className="p-4 bg-card/80 backdrop-blur border border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono text-lg text-primary">WORLD WAR CLOCK</h3>
            <div className="text-right">
              <div className="text-2xl font-mono text-red-400">
                {Math.floor(worldClock.minutes_to_midnight / 60)}:{(worldClock.minutes_to_midnight % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-muted-foreground">TO MIDNIGHT</div>
            </div>
          </div>
          
          <Progress 
            value={(300 - worldClock.minutes_to_midnight) / 300 * 100} 
            className="mb-4"
          />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {Object.entries(worldClock.tension_factors).map(([factor, level]) => (
              <div key={factor} className="text-center">
                <div className="text-xs text-muted-foreground capitalize">
                  {factor.replace('_', ' ')}
                </div>
                <div className={`font-mono ${getTensionColor(level as number)}`}>
                  {((level as number) * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Player Status */}
      <Card className="p-4 bg-card/80 backdrop-blur border border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-mono text-lg text-primary">OPERATIVE STATUS</h3>
            <Badge className={`${getRankColor(player.rank)} text-white`}>
              {player.rank.toUpperCase()}
            </Badge>
          </div>
          <div className="text-right text-sm">
            <div className="text-muted-foreground">Clearance Level</div>
            <div className="text-xl font-mono text-primary">{player.clearance_level}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-green-400 text-lg font-mono">
              {player.resources.isk.toLocaleString()}
            </div>
            <div className="text-muted-foreground">ISK</div>
          </div>
          <div className="text-center">
            <div className="text-blue-400 text-lg font-mono">
              {player.resources.intel}
            </div>
            <div className="text-muted-foreground">INTEL</div>
          </div>
          <div className="text-center">
            <div className="text-purple-400 text-lg font-mono">
              {player.resources.reputation}
            </div>
            <div className="text-muted-foreground">REP</div>
          </div>
        </div>
      </Card>

      {/* Active Missions */}
      <Card className="p-4 bg-card/80 backdrop-blur border border-primary/20">
        <h3 className="font-mono text-lg text-primary mb-4">ACTIVE MISSIONS</h3>
        
        {missions.length === 0 ? (
          <Alert>
            <AlertDescription>
              No active missions. New opportunities will be generated based on global events.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {missions.map((mission) => (
              <Card key={mission.id} className="p-3 bg-card/60 border border-primary/10">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-mono text-primary">{mission.title}</h4>
                    <Badge variant="outline" className="text-xs mt-1">
                      {mission.mission_type}
                    </Badge>
                  </div>
                  {mission.deadline && (
                    <div className="text-xs text-muted-foreground">
                      Due: {new Date(mission.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">{mission.description}</p>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => executeMission(mission.id, 'accept')}
                    className="font-mono text-xs"
                  >
                    EXECUTE
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => executeMission(mission.id, 'investigate')}
                    className="font-mono text-xs"
                  >
                    INVESTIGATE
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};