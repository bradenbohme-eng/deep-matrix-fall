import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

// ApiRegistryPanel: Manage custom API endpoints (local only)
// Inputs: none
// Outputs: localStorage "neo_api_registry"
// TODOs: Move to Supabase (tables + RLS) and add Edge Functions for proxying requests securely.

interface ApiEntry {
  id: string;
  name: string;
  baseUrl: string;
  docsUrl?: string;
}

const ApiRegistryPanel: React.FC = () => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<ApiEntry[]>([]);
  const [draft, setDraft] = useState<ApiEntry>({ id: '', name: '', baseUrl: '' });

  useEffect(() => {
    const saved = localStorage.getItem('neo_api_registry');
    if (saved) {
      try { setEntries(JSON.parse(saved)); } catch {}
    }
  }, []);

  const saveAll = () => {
    localStorage.setItem('neo_api_registry', JSON.stringify(entries));
    toast({ title: 'API registry saved', description: 'Stored locally. Connect Supabase for multi-user sync.' });
  };

  const add = () => {
    if (!draft.name || !draft.baseUrl) return;
    const newEntry = { ...draft, id: crypto.randomUUID() };
    setEntries((e) => [...e, newEntry]);
    setDraft({ id: '', name: '', baseUrl: '', docsUrl: '' });
  };

  const remove = (id: string) => setEntries((e) => e.filter((x) => x.id !== id));

  return (
    <section className="h-full p-4 overflow-y-auto">
      <h2 className="text-primary font-mono text-lg mb-4">API REGISTRY</h2>
      <div className="grid md:grid-cols-3 gap-3 mb-3">
        <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Name" className="bg-transparent border-primary/30" />
        <Input value={draft.baseUrl} onChange={(e) => setDraft((d) => ({ ...d, baseUrl: e.target.value }))} placeholder="Base URL" className="bg-transparent border-primary/30" />
        <Input value={draft.docsUrl || ''} onChange={(e) => setDraft((d) => ({ ...d, docsUrl: e.target.value }))} placeholder="Docs URL (optional)" className="bg-transparent border-primary/30" />
      </div>
      <div className="mb-4">
        <Button onClick={add} className="mr-2">Add</Button>
        <Button variant="secondary" onClick={saveAll}>Save</Button>
      </div>
      <div className="space-y-2">
        {entries.map((e) => (
          <article key={e.id} className="p-3 border border-primary/20 rounded">
            <header className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-mono text-primary">{e.name}</h3>
                <p className="text-xs text-muted-foreground">{e.baseUrl}</p>
                {e.docsUrl && (
                  <a href={e.docsUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Docs</a>
                )}
              </div>
              <Button variant="destructive" size="sm" onClick={() => remove(e.id)}>Remove</Button>
            </header>
          </article>
        ))}
        {entries.length === 0 && (
          <p className="text-xs text-muted-foreground">No APIs yet. Add your services to orchestrate calls.</p>
        )}
      </div>
    </section>
  );
};

export default ApiRegistryPanel;
