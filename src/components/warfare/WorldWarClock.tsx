import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

interface WorldWarClockData {
  minutes_to_midnight: number;
  tension_factors: {
    nuclear_tension: number;
    cyber_warfare: number;
    economic_instability: number;
    ai_anomalies: number;
  };
  recent_events: Array<{
    event: string;
    timestamp: string;
    narrative: string;
  }>;
  escalation_probability: number;
}

interface ThreatLevel {
  level: string;
  color: string;
  description: string;
}

export const WorldWarClock: React.FC = () => {
  const [clockData, setClockData] = useState<WorldWarClockData | null>(null);
  const [threatLevel, setThreatLevel] = useState<ThreatLevel | null>(null);
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    loadClockData();
    
    // Real-time subscription
    const channel = supabase
      .channel('world-war-clock')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'world_war_clock' 
      }, () => {
        loadClockData();
        triggerPulse();
      })
      .subscribe();

    // Update every 30 seconds for smooth countdown
    const interval = setInterval(loadClockData, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const loadClockData = async () => {
    try {
      const { data } = await supabase
        .from('world_war_clock')
        .select('*')
        .single();
      
      if (data) {
        setClockData(data as unknown as WorldWarClockData);
        setThreatLevel(calculateThreatLevel(data as unknown as WorldWarClockData));
      }
    } catch (error) {
      console.error('Error loading world war clock:', error);
    }
  };

  const triggerPulse = () => {
    setPulsing(true);
    setTimeout(() => setPulsing(false), 1000);
  };

  const calculateThreatLevel = (data: WorldWarClockData): ThreatLevel => {
    const avgTension = Object.values(data.tension_factors).reduce((sum, val) => sum + val, 0) / 4;
    const timeRatio = (300 - data.minutes_to_midnight) / 300;
    const overallThreat = (avgTension + timeRatio + data.escalation_probability) / 3;

    if (overallThreat < 0.3) {
      return { level: 'LOW', color: 'text-green-400', description: 'Global tensions remain manageable' };
    } else if (overallThreat < 0.6) {
      return { level: 'MODERATE', color: 'text-yellow-400', description: 'Increasing tensions require monitoring' };
    } else if (overallThreat < 0.8) {
      return { level: 'HIGH', color: 'text-orange-400', description: 'Critical tensions detected. Immediate action required' };
    } else {
      return { level: 'CRITICAL', color: 'text-red-400', description: 'IMMINENT ESCALATION - ALL OPERATIVES ON HIGH ALERT' };
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes % 1) * 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTensionColor = (value: number) => {
    if (value < 0.3) return 'text-green-400';
    if (value < 0.6) return 'text-yellow-400';
    if (value < 0.8) return 'text-orange-400';
    return 'text-red-400';
  };

  const getTensionProgress = (value: number) => {
    return value * 100;
  };

  if (!clockData || !threatLevel) {
    return (
      <Card className="p-6 bg-card/80 backdrop-blur border border-primary/20">
        <div className="text-center text-muted-foreground font-mono">
          CONNECTING TO GLOBAL THREAT ASSESSMENT NETWORK...
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 bg-card/80 backdrop-blur border border-primary/20 ${pulsing ? 'animate-pulse' : ''}`}>
      {/* Main Clock Display */}
      <div className="text-center mb-6">
        <div className="text-sm font-mono text-muted-foreground mb-2">
          WORLD WAR CLOCK
        </div>
        <div className={`text-6xl font-mono ${threatLevel.color} mb-2`}>
          {formatTime(clockData.minutes_to_midnight)}
        </div>
        <div className="text-sm font-mono text-muted-foreground">
          TO MIDNIGHT
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <Progress 
            value={(300 - clockData.minutes_to_midnight) / 300 * 100}
            className="h-3"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1 font-mono">
            <span>PEACE</span>
            <span>WAR</span>
          </div>
        </div>
      </div>

      {/* Threat Level Alert */}
      <Alert className={`mb-6 border-l-4 ${
        threatLevel.level === 'CRITICAL' ? 'border-red-400 bg-red-950/20' :
        threatLevel.level === 'HIGH' ? 'border-orange-400 bg-orange-950/20' :
        threatLevel.level === 'MODERATE' ? 'border-yellow-400 bg-yellow-950/20' :
        'border-green-400 bg-green-950/20'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <Badge className={`${threatLevel.color} bg-transparent border-current mb-2`}>
              THREAT LEVEL: {threatLevel.level}
            </Badge>
            <AlertDescription className="font-mono text-sm">
              {threatLevel.description}
            </AlertDescription>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground font-mono">ESCALATION PROB</div>
            <div className={`text-2xl font-mono ${getTensionColor(clockData.escalation_probability)}`}>
              {(clockData.escalation_probability * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </Alert>

      {/* Tension Factors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {Object.entries(clockData.tension_factors).map(([factor, value]) => (
          <Card key={factor} className="p-3 bg-card/60 border border-primary/10">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-mono text-muted-foreground capitalize">
                {factor.replace('_', ' ')}
              </div>
              <div className={`text-lg font-mono ${getTensionColor(value as number)}`}>
                {((value as number) * 100).toFixed(0)}%
              </div>
            </div>
            <Progress value={getTensionProgress(value as number)} className="h-2" />
          </Card>
        ))}
      </div>

      {/* Recent Events */}
      <Card className="p-4 bg-card/60 border border-primary/10">
        <h4 className="font-mono text-sm text-primary mb-3">RECENT GLOBAL EVENTS</h4>
        {clockData.recent_events.length === 0 ? (
          <div className="text-xs text-muted-foreground font-mono text-center py-2">
            No recent events detected
          </div>
        ) : (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {clockData.recent_events.slice(0, 5).map((event, index) => (
              <div key={index} className="text-xs font-mono">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </Badge>
                  <span className="text-primary uppercase">
                    {event.event.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-muted-foreground pl-2 text-xs">
                  {event.narrative}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Status Indicators */}
      <div className="flex justify-between items-center mt-4 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-muted-foreground">SYSTEM ONLINE</span>
        </div>
        <div className="text-muted-foreground">
          LAST UPDATED: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </Card>
  );
};