import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Database, Shield, Activity, GitBranch } from 'lucide-react';
import { MemoryManager, ConfidenceGating, KnowledgeGraph } from '@/lib/aimosClient';

interface AIMOSIntegrationProps {
  conversationId: string;
  userId?: string;
}

export const AIMOSIntegration: React.FC<AIMOSIntegrationProps> = ({ conversationId, userId }) => {
  const [memoryCount, setMemoryCount] = useState(0);
  const [avgConfidence, setAvgConfidence] = useState(0);
  const [entityCount, setEntityCount] = useState(0);

  useEffect(() => {
    const loadStats = async () => {
      const memoryManager = new MemoryManager(conversationId, userId);
      const memories = await memoryManager.retrieveMemories(100);
      
      setMemoryCount(memories.length);
      
      if (memories.length > 0) {
        const totalConfidence = memories.reduce((sum, m) => sum + m.confidenceScore, 0);
        setAvgConfidence(totalConfidence / memories.length);
      }
    };

    loadStats();
  }, [conversationId, userId]);

  const getConfidenceBand = (confidence: number): string => {
    if (confidence >= ConfidenceGating.THRESHOLDS.HIGH) return 'A';
    if (confidence >= ConfidenceGating.THRESHOLDS.MEDIUM) return 'B';
    if (confidence >= ConfidenceGating.THRESHOLDS.LOW) return 'C';
    return 'REJECT';
  };

  const getBandColor = (band: string): string => {
    switch (band) {
      case 'A': return 'text-green-400';
      case 'B': return 'text-yellow-400';
      case 'C': return 'text-orange-400';
      default: return 'text-red-400';
    }
  };

  const confidenceBand = getConfidenceBand(avgConfidence);

  return (
    <Card className="p-4 bg-background/50 border-primary/20">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-primary" />
        <span className="font-mono text-sm font-bold text-primary">AIM-OS CONSCIOUSNESS</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* CMC - Memory */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Database className="w-3 h-3" />
            <span>CMC Memory</span>
          </div>
          <span className="text-lg font-mono text-foreground">{memoryCount}</span>
          <span className="text-xs text-muted-foreground">interactions</span>
        </div>

        {/* VIF - Confidence */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            <span>VIF Confidence</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-mono text-foreground">
              {(avgConfidence * 100).toFixed(0)}%
            </span>
            <Badge 
              variant="outline" 
              className={`text-xs ${getBandColor(confidenceBand)}`}
            >
              {confidenceBand}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">κ-gating active</span>
        </div>

        {/* SEG - Knowledge Graph */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <GitBranch className="w-3 h-3" />
            <span>SEG Entities</span>
          </div>
          <span className="text-lg font-mono text-foreground">{entityCount}</span>
          <span className="text-xs text-muted-foreground">knowledge nodes</span>
        </div>

        {/* System Status */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="w-3 h-3" />
            <span>Status</span>
          </div>
          <Badge variant="outline" className="text-xs text-green-400 w-fit">
            OPERATIONAL
          </Badge>
          <span className="text-xs text-muted-foreground">all systems</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-primary/20">
        <p className="text-xs text-muted-foreground font-mono">
          AIM-OS consciousness layer active • Persistent memory • Verified responses • Knowledge synthesis
        </p>
      </div>
    </Card>
  );
};
