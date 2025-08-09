import React from 'react';

// CloudOrchestratorPanel: Visual status of logical nodes (simulated)
// Inputs: none
// Outputs: none
// TODOs: Fetch real status from Supabase Edge Functions, render live graph

const nodes = [
  { id: 'ingress', label: 'Ingress', status: 'OK' },
  { id: 'router', label: 'Router', status: 'OK' },
  { id: 'agents', label: 'Agents', status: 'INIT' },
  { id: 'apis', label: 'APIs', status: 'OK' },
  { id: 'queue', label: 'Queue', status: 'IDLE' },
  { id: 'storage', label: 'Storage', status: 'OK' },
];

const badge = (status: string) => (
  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
    status === 'OK' ? 'text-green-400 border-green-500/40 bg-green-500/10' :
    status === 'INIT' ? 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10' :
    'text-muted-foreground border-muted/30'
  }`}>{status}</span>
);

const CloudOrchestratorPanel: React.FC = () => {
  return (
    <section className="h-full p-4 overflow-y-auto">
      <h2 className="text-primary font-mono text-lg mb-4">CLOUD ORCHESTRATOR</h2>
      <div className="grid grid-cols-3 gap-4">
        {nodes.map((n) => (
          <div key={n.id} className="p-4 border border-primary/20 rounded bg-muted/5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-mono text-primary">{n.label}</div>
              {badge(n.status)}
            </div>
            <div className="h-16 mt-3 rounded bg-gradient-to-br from-primary/10 to-transparent border border-primary/10" />
          </div>
        ))}
      </div>
      <aside className="mt-4 text-xs text-muted-foreground">
        Connect Supabase to run orchestrations securely and store provider secrets in Supabase Secrets.
      </aside>
    </section>
  );
};

export default CloudOrchestratorPanel;
