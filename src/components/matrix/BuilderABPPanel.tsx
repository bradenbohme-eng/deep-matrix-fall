import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

// BuilderABPPanel: UI for Autopoiesis Builder Protocol (simulated)
// Inputs: none
// Outputs: localStorage keys: abp_master_index, abp_state
// TODOs: Wire to Edge Functions to run builders, commit files, and checkpoint state server-side.

interface AbpState {
  phase: string;
  processed: number;
  pending: number;
  lastCheckpoint: string | null;
}

const BuilderABPPanel: React.FC = () => {
  const [indexYaml, setIndexYaml] = useState<string>('sections: []');
  const [state, setState] = useState<AbpState>({ phase: 'IDLE', processed: 0, pending: 0, lastCheckpoint: null });

  useEffect(() => {
    const i = localStorage.getItem('abp_master_index');
    const s = localStorage.getItem('abp_state');
    if (i) setIndexYaml(i);
    if (s) try { setState(JSON.parse(s)); } catch {}
  }, []);

  const saveIndex = () => {
    localStorage.setItem('abp_master_index', indexYaml);
  };

  const start = () => {
    const newState = { phase: 'AUTOPOIESIS', processed: 0, pending: 12, lastCheckpoint: new Date().toISOString() };
    setState(newState);
    localStorage.setItem('abp_state', JSON.stringify(newState));
  };

  const checkpoint = () => {
    const newState = { ...state, processed: state.processed + 6, pending: Math.max(0, state.pending - 6), lastCheckpoint: new Date().toISOString() };
    setState(newState);
    localStorage.setItem('abp_state', JSON.stringify(newState));
  };

  const stop = () => {
    const newState = { ...state, phase: 'PAUSED', lastCheckpoint: new Date().toISOString() };
    setState(newState);
    localStorage.setItem('abp_state', JSON.stringify(newState));
  };

  return (
    <section className="h-full p-4 overflow-y-auto">
      <h2 className="text-primary font-mono text-lg mb-4">BUILDER: AUTOPOIESIS PROTOCOL</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-muted-foreground mb-2">master_index.yaml</div>
          <Textarea value={indexYaml} onChange={(e) => setIndexYaml(e.target.value)} className="min-h-[220px] bg-transparent border-primary/30" />
          <Button className="mt-2" onClick={saveIndex}>Save Index</Button>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-2">State</div>
          <div className="p-3 border border-primary/20 rounded font-mono text-xs">
            <div>phase: {state.phase}</div>
            <div>processed: {state.processed}</div>
            <div>pending: {state.pending}</div>
            <div>lastCheckpoint: {state.lastCheckpoint || '-'}</div>
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="default" onClick={start}>Start</Button>
            <Button variant="secondary" onClick={checkpoint}>Checkpoint</Button>
            <Button variant="destructive" onClick={stop}>Stop</Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">For a real builder, connect Supabase and implement Edge Functions to write files, checkpoint, and resume.</p>
        </div>
      </div>
    </section>
  );
};

export default BuilderABPPanel;
