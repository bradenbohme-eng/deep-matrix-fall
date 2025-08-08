import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface TeamSuiteProps {
  onRun: (command: string) => void;
}

const tools = [
  { label: 'Nmap', cmd: (t: string) => `/nmap ${t}` },
  { label: 'Metasploit', cmd: (t: string) => `/metasploit ${t}` },
  { label: 'Burp Suite', cmd: (t: string) => `/burp ${t}` },
  { label: 'SQLMap', cmd: (t: string) => `/sqlmap ${t}` },
  { label: 'BloodHound', cmd: (t: string) => `/bloodhound ${t}` },
  { label: 'Responder', cmd: (t: string) => `/responder ${t}` },
  { label: 'Wireshark', cmd: (t: string) => `/wireshark ${t}` },
  { label: 'AI Recon', cmd: (t: string) => `/ai-recon ${t}` },
  { label: 'AI Exploit', cmd: (t: string) => `/ai-exploit ${t}` },
  { label: 'OpenVAS', cmd: (t: string) => `/openvas ${t}` },
  { label: 'Nessus', cmd: (t: string) => `/nessus ${t}` },
  { label: 'Trace', cmd: (t: string) => `/trace` },
];

const TeamSuite: React.FC<TeamSuiteProps> = ({ onRun }) => {
  const [target, setTarget] = useState('target.local');

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-primary/20 flex items-center gap-2">
        <div className="font-mono text-sm text-primary">TEAM SUITE</div>
        <div className="ml-auto flex items-center gap-2">
          <Input value={target} onChange={(e) => setTarget(e.target.value)} className="w-56 bg-background/60 border-primary/20" placeholder="host / url / iface" />
          <Button variant="default" onClick={() => onRun(`/nmap ${target}`)}>Quick Recon</Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
        {tools.map(t => (
          <Card key={t.label} className="p-3 bg-card/60 border-primary/20">
            <div className="font-mono text-sm text-foreground">{t.label}</div>
            <div className="text-xs text-muted-foreground font-mono">Simulation UI • Uses Neo command bridge</div>
            <Button className="mt-3 w-full" variant="secondary" onClick={() => onRun(t.cmd(target))}>
              Run
            </Button>
          </Card>
        ))}
      </div>

      <div className="p-3 border-t border-primary/20 text-xs text-muted-foreground font-mono">
        Educational simulation only. No real network actions are performed.
      </div>
    </div>
  );
};

export default TeamSuite;
