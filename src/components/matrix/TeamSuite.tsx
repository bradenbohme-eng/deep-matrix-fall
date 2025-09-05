import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface TeamSuiteProps {
  onRun: (command: string) => void;
}

const tools = [
  { label: 'Nmap', cmd: (t: string) => `/nmap ${t}`, desc: 'Advanced port scanner & host discovery' },
  { label: 'Metasploit', cmd: (t: string) => `/metasploit ${t}`, desc: 'Penetration testing framework' },
  { label: 'Burp Suite', cmd: (t: string) => `/burp ${t}`, desc: 'Web application security testing' },
  { label: 'SQLMap', cmd: (t: string) => `/sqlmap ${t}`, desc: 'Automated SQL injection testing' },
  { label: 'BloodHound', cmd: (t: string) => `/bloodhound ${t}`, desc: 'Active Directory attack paths' },
  { label: 'Responder', cmd: (t: string) => `/responder ${t}`, desc: 'LLMNR/NBT-NS/mDNS poisoner' },
  { label: 'Wireshark', cmd: (t: string) => `/wireshark ${t}`, desc: 'Network protocol analyzer' },
  { label: 'AI Recon', cmd: (t: string) => `/ai-recon ${t}`, desc: 'AI-powered reconnaissance' },
  { label: 'AI Exploit', cmd: (t: string) => `/ai-exploit ${t}`, desc: 'AI-assisted exploitation' },
  { label: 'OpenVAS', cmd: (t: string) => `/openvas ${t}`, desc: 'Vulnerability assessment scanner' },
  { label: 'Nessus', cmd: (t: string) => `/nessus ${t}`, desc: 'Enterprise vulnerability scanner' },
  { label: 'Masscan', cmd: (t: string) => `/masscan ${t}`, desc: 'High-speed port scanner' },
  { label: 'Gobuster', cmd: (t: string) => `/gobuster ${t}`, desc: 'Directory/file & DNS brute-forcer' },
  { label: 'Hydra', cmd: (t: string) => `/hydra ${t}`, desc: 'Password brute-force tool' },
  { label: 'John', cmd: (t: string) => `/john ${t}`, desc: 'Password cracking tool' },
  { label: 'Hashcat', cmd: (t: string) => `/hashcat ${t}`, desc: 'Advanced password recovery' }
];

const TeamSuite: React.FC<TeamSuiteProps> = ({ onRun }) => {
  const [target, setTarget] = useState('target.local');

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-primary/20 flex items-center gap-2">
        <div className="font-mono text-sm text-primary">HACKER TOOLKIT v2.0</div>
        <div className="ml-auto flex items-center gap-2">
          <Input 
            value={target} 
            onChange={(e) => setTarget(e.target.value)} 
            className="w-64 bg-background/60 border-primary/20 font-mono text-sm" 
            placeholder="target.com / 192.168.1.0/24 / interface" 
          />
          <Button variant="default" onClick={() => onRun(`/nmap ${target}`)}>
            Quick Scan
          </Button>
          <Button variant="secondary" onClick={() => onRun(`/ai-recon ${target}`)}>
            AI Recon
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {tools.map(t => (
          <Card key={t.label} className="p-3 bg-card/60 border-primary/20 hover:bg-card/80 transition-colors">
            <div className="font-mono text-sm text-primary font-bold">{t.label}</div>
            <div className="text-xs text-muted-foreground font-mono mt-1 mb-3 h-8 overflow-hidden">
              {t.desc}
            </div>
            <Button className="w-full" variant="secondary" onClick={() => onRun(t.cmd(target))}>
              Execute
            </Button>
          </Card>
        ))}
      </div>

      <div className="p-3 border-t border-primary/20 text-xs text-muted-foreground font-mono flex items-center justify-between">
        <span>Educational simulation only. No real network actions are performed.</span>
        <span className="text-primary">TOOLS: {tools.length} • TARGET: {target}</span>
      </div>
    </div>
  );
};

export default TeamSuite;
