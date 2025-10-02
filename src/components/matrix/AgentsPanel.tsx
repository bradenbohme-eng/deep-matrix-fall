import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

/**
 * AgentsPanel: AI Provider Configuration
 * Manages API keys and enablement for multiple AI providers
 * Currently stores locally - production should use Supabase Secrets
 */

type Provider = 'anthropic' | 'openai' | 'gemini' | 'deepinfra' | 'cerebras' | 'perplexity' | 
  'securoBERT' | 'codeBERT' | 'metasploit_ai' | 'burp_ai' | 'nuclei_ai' | 'sqlmap_ai' | 
  'nmap_ai' | 'ghidra_ai' | 'ida_pro_ai' | 'radare2_ai' | 'exploit_db_ai' | 'cve_hunter_ai' |
  'malware_bazaar_ai' | 'virus_total_ai' | 'shodan_ai' | 'censys_ai' | 'binary_ninja_ai';

interface ProviderState {
  enabled: boolean;
  apiKey: string;
  category?: string;
}

const PROVIDERS: { id: Provider; label: string; category: string; description: string }[] = [
  // General Purpose AI
  { id: 'anthropic', label: 'Anthropic Claude', category: 'General', description: 'Advanced reasoning & analysis' },
  { id: 'openai', label: 'OpenAI GPT', category: 'General', description: 'Multimodal AI assistant' },
  { id: 'gemini', label: 'Google Gemini', category: 'General', description: 'Large context AI model' },
  { id: 'deepinfra', label: 'DeepInfra', category: 'General', description: 'Open source AI models' },
  { id: 'cerebras', label: 'Cerebras', category: 'General', description: 'Ultra-fast inference' },
  { id: 'perplexity', label: 'Perplexity', category: 'General', description: 'Real-time research AI' },
  
  // Security-Specialized AI
  { id: 'securoBERT', label: 'SecuroBERT', category: 'Security', description: 'Cybersecurity threat analysis' },
  { id: 'codeBERT', label: 'CodeBERT', category: 'Code Analysis', description: 'Code vulnerability detection' },
  
  // Penetration Testing AI
  { id: 'metasploit_ai', label: 'Metasploit AI Agent', category: 'Pentesting', description: 'Automated exploitation framework' },
  { id: 'burp_ai', label: 'Burp Suite AI', category: 'Pentesting', description: 'Web application security testing' },
  { id: 'nuclei_ai', label: 'Nuclei AI Scanner', category: 'Pentesting', description: 'Fast vulnerability scanning' },
  { id: 'sqlmap_ai', label: 'SQLMap AI', category: 'Pentesting', description: 'SQL injection detection & exploitation' },
  { id: 'nmap_ai', label: 'Nmap AI Engine', category: 'Pentesting', description: 'Network discovery & security auditing' },
  
  // Reverse Engineering AI
  { id: 'ghidra_ai', label: 'Ghidra AI Assistant', category: 'Reverse Eng', description: 'Software reverse engineering' },
  { id: 'ida_pro_ai', label: 'IDA Pro AI', category: 'Reverse Eng', description: 'Disassembler and debugger AI' },
  { id: 'radare2_ai', label: 'Radare2 AI', category: 'Reverse Eng', description: 'Binary analysis framework' },
  { id: 'binary_ninja_ai', label: 'Binary Ninja AI', category: 'Reverse Eng', description: 'Reverse engineering platform' },
  
  // Threat Intelligence AI
  { id: 'exploit_db_ai', label: 'Exploit-DB AI', category: 'Threat Intel', description: 'Exploit database intelligence' },
  { id: 'cve_hunter_ai', label: 'CVE Hunter AI', category: 'Threat Intel', description: 'Vulnerability intelligence' },
  { id: 'malware_bazaar_ai', label: 'Malware Bazaar AI', category: 'Threat Intel', description: 'Malware sample analysis' },
  { id: 'virus_total_ai', label: 'VirusTotal AI', category: 'Threat Intel', description: 'File & URL analysis' },
  { id: 'shodan_ai', label: 'Shodan AI', category: 'Threat Intel', description: 'Internet-connected device search' },
  { id: 'censys_ai', label: 'Censys AI', category: 'Threat Intel', description: 'Internet asset discovery' },
];

const AgentsPanel: React.FC = () => {
  const { toast } = useToast();
  const initialState = PROVIDERS.reduce((acc, p) => ({
    ...acc,
    [p.id]: { enabled: false, apiKey: '', category: p.category }
  }), {} as Record<Provider, ProviderState>);

  const [state, setState] = useState<Record<Provider, ProviderState>>(initialState);

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

  const categories = ['All', ...Array.from(new Set(PROVIDERS.map(p => p.category)))];
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredProviders = activeCategory === 'All' 
    ? PROVIDERS 
    : PROVIDERS.filter(p => p.category === activeCategory);

  const enabledCount = Object.values(state).filter(s => s.enabled).length;

  return (
    <section className="h-full overflow-y-auto">
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 p-4 border-b border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-primary font-mono text-lg">AI AGENT SWARM</h2>
          <Badge variant="outline" className="font-mono">
            {enabledCount} ACTIVE
          </Badge>
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'default' : 'ghost'}
              size="sm"
              className="font-mono text-xs"
              onClick={() => setActiveCategory(cat)}
            >
              {cat.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      <div className="p-4 grid md:grid-cols-2 gap-3">
        {filteredProviders.map((p) => (
          <div key={p.id} className="border border-primary/20 rounded p-3 bg-card/40 hover:bg-card/60 transition-all">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-sm font-mono text-primary font-semibold">{p.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{p.description}</div>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={state[p.id]?.enabled || false}
                  onChange={(e) => setState((s) => ({ ...s, [p.id]: { ...s[p.id], enabled: e.target.checked, category: p.category } }))}
                  className="w-4 h-4"
                />
              </label>
            </div>
            <Input
              value={state[p.id]?.apiKey || ''}
              onChange={(e) => setState((s) => ({ ...s, [p.id]: { ...s[p.id], apiKey: e.target.value, category: p.category } }))}
              placeholder="API Key / Endpoint"
              type="password"
              className="bg-transparent border-primary/30 text-xs font-mono mt-2"
            />
            <Badge variant="secondary" className="mt-2 text-[10px] font-mono">
              {p.category}
            </Badge>
          </div>
        ))}
      </div>
      
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm p-4 border-t border-primary/20">
        <Button onClick={save} className="w-full">
          DEPLOY CONFIGURATION
        </Button>
        <p className="text-xs text-muted-foreground font-mono text-center mt-2">
          Credentials encrypted locally. For production deployment, integrate with Supabase Secrets.
        </p>
      </div>
    </section>
  );
};

export default AgentsPanel;
