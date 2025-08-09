import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

// AgentsPanel: Provider keys and enablement (local only). For real prod, store in Supabase Secrets.
// Inputs: none
// Outputs: localStorage "neo_provider_keys"
// TODOs: Replace local persistence with Supabase Edge Functions + Secrets.

type Provider = 'anthropic' | 'openai' | 'gemini' | 'deepinfra' | 'cerebras' | 'perplexity';

interface ProviderState {
  enabled: boolean;
  apiKey: string;
}

const PROVIDERS: { id: Provider; label: string }[] = [
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'deepinfra', label: 'DeepInfra' },
  { id: 'cerebras', label: 'Cerebras' },
  { id: 'perplexity', label: 'Perplexity' },
];

const AgentsPanel: React.FC = () => {
  const { toast } = useToast();
  const [state, setState] = useState<Record<Provider, ProviderState>>({
    anthropic: { enabled: false, apiKey: '' },
    openai: { enabled: false, apiKey: '' },
    gemini: { enabled: false, apiKey: '' },
    deepinfra: { enabled: false, apiKey: '' },
    cerebras: { enabled: false, apiKey: '' },
    perplexity: { enabled: false, apiKey: '' },
  });

  useEffect(() => {
    const saved = localStorage.getItem('neo_provider_keys');
    if (saved) {
      try { setState(JSON.parse(saved)); } catch {}
    }
  }, []);

  const save = () => {
    localStorage.setItem('neo_provider_keys', JSON.stringify(state));
    toast({ title: 'Providers saved', description: 'Keys stored locally. For production, use Supabase Secrets.' });
  };

  return (
    <section className="h-full overflow-y-auto p-4">
      <h2 className="text-primary font-mono text-lg mb-4">AI AGENTS & PROVIDERS</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {PROVIDERS.map((p) => (
          <div key={p.id} className="border border-primary/20 rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-mono text-primary">{p.label}</div>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={state[p.id].enabled}
                  onChange={(e) => setState((s) => ({ ...s, [p.id]: { ...s[p.id], enabled: e.target.checked } }))}
                />
                <span>Enabled</span>
              </label>
            </div>
            <Input
              value={state[p.id].apiKey}
              onChange={(e) => setState((s) => ({ ...s, [p.id]: { ...s[p.id], apiKey: e.target.value } }))}
              placeholder={`${p.label} API Key`}
              className="bg-transparent border-primary/30"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Keys are saved locally for now. Connect Supabase to store secrets securely and call Edge Functions.
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <Button onClick={save}>Save Configuration</Button>
      </div>
    </section>
  );
};

export default AgentsPanel;
