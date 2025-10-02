import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Zap, Eye, Radio } from 'lucide-react';

interface Alert {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  timestamp: string;
  source: string;
}

const AlertsPanel: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: '1', type: 'critical', message: 'Unauthorized access attempt detected', timestamp: new Date().toISOString(), source: 'IDS-01' },
    { id: '2', type: 'high', message: 'Unusual traffic pattern from 203.0.113.0/24', timestamp: new Date().toISOString(), source: 'FIREWALL' },
    { id: '3', type: 'medium', message: 'Port scan detected on DMZ', timestamp: new Date().toISOString(), source: 'NIDS-02' },
  ]);

  useEffect(() => {
    const messages = [
      'SQL injection attempt blocked',
      'DDoS traffic surge detected',
      'Malware signature match',
      'Brute force login detected',
      'Data exfiltration suspected',
      'Privilege escalation attempt',
      'Zero-day exploit detected',
      'APT activity observed',
    ];

    const sources = ['IDS-01', 'IDS-02', 'FIREWALL', 'NIDS-01', 'NIDS-02', 'WAF', 'SIEM'];
    const types: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low'];

    const interval = setInterval(() => {
      const newAlert: Alert = {
        id: Date.now().toString(),
        type: types[Math.floor(Math.random() * types.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        timestamp: new Date().toISOString(),
        source: sources[Math.floor(Math.random() * sources.length)]
      };
      
      setAlerts(prev => [newAlert, ...prev].slice(0, 10));
    }, 5000 + Math.random() * 5000);

    return () => clearInterval(interval);
  }, []);

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'border-red-500/50 bg-red-500/10 text-red-400';
      case 'high': return 'border-orange-500/50 bg-orange-500/10 text-orange-400';
      case 'medium': return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400';
      case 'low': return 'border-blue-500/50 bg-blue-500/10 text-blue-400';
      default: return 'border-primary/50 bg-primary/10';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="w-3 h-3 text-red-400 animate-pulse" />;
      case 'high': return <Shield className="w-3 h-3 text-orange-400" />;
      case 'medium': return <Zap className="w-3 h-3 text-yellow-400" />;
      case 'low': return <Eye className="w-3 h-3 text-blue-400" />;
      default: return <Radio className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
        <span className="text-sm font-mono text-primary font-bold">ACTIVE ALERTS</span>
        <Badge variant="destructive" className="font-mono text-xs ml-auto">
          {alerts.filter(a => a.type === 'critical' || a.type === 'high').length}
        </Badge>
      </div>

      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {alerts.map(alert => (
          <Card key={alert.id} className={`p-2 border ${getAlertColor(alert.type)} animate-fade-in`}>
            <div className="flex items-start gap-2">
              {getAlertIcon(alert.type)}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono text-foreground">{alert.message}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] font-mono text-muted-foreground">{alert.source}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AlertsPanel;
