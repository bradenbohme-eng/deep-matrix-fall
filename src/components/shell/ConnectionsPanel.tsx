// ConnectionsPanel — VM/External AI Connection Manager
// Phase C: Register, test, and route external AI endpoints

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Plus, Plug, Play, Trash2, CheckCircle, XCircle, RefreshCw,
  Globe, Server, Cloud, Cpu, Timer, Wifi,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface VMConnection {
  id: string;
  name: string;
  endpoint_url: string;
  connection_type: string;
  config: any;
  status: string;
  last_tested_at: string | null;
  created_at: string;
}

const CONNECTION_TYPES = [
  { value: 'gemini', label: 'Gemini API', icon: Globe },
  { value: 'openai', label: 'OpenAI API', icon: Cloud },
  { value: 'mcp', label: 'MCP Server', icon: Server },
  { value: 'cloudflare', label: 'Cloudflare Worker', icon: Cloud },
  { value: 'local', label: 'Local Endpoint', icon: Cpu },
];

const STATUS_COLORS: Record<string, string> = {
  ok: 'text-primary border-primary/30',
  error: 'text-destructive border-destructive/30',
  untested: 'text-muted-foreground border-border/50',
  testing: 'text-warning border-warning/30',
};

const ConnectionsPanel: React.FC = () => {
  const [connections, setConnections] = useState<VMConnection[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState('gemini');
  const [testing, setTesting] = useState<string | null>(null);

  const loadConnections = useCallback(async () => {
    const { data } = await supabase
      .from('aimos_vm_connections' as any)
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setConnections(data as unknown as VMConnection[]);
  }, []);

  useEffect(() => { loadConnections(); }, [loadConnections]);

  const addConnection = async () => {
    if (!newName.trim() || !newUrl.trim()) {
      toast.error('Name and URL are required');
      return;
    }

    const { error } = await supabase.from('aimos_vm_connections' as any).insert({
      name: newName.trim(),
      endpoint_url: newUrl.trim(),
      connection_type: newType,
      config: {},
      status: 'untested',
    });

    if (error) {
      toast.error(`Failed to add: ${error.message}`);
    } else {
      toast.success(`Connection "${newName}" added`);
      setNewName('');
      setNewUrl('');
      setShowAdd(false);
      loadConnections();
    }
  };

  const testConnection = async (conn: VMConnection) => {
    setTesting(conn.id);
    const start = performance.now();

    try {
      const { data, error } = await supabase.functions.invoke('vm-proxy', {
        body: {
          action: 'test',
          connectionId: conn.id,
          endpointUrl: conn.endpoint_url,
          connectionType: conn.connection_type,
        },
      });

      const latency = performance.now() - start;
      const status = error ? 'error' : (data?.ok ? 'ok' : 'error');

      await supabase.from('aimos_vm_connections' as any)
        .update({
          status,
          last_tested_at: new Date().toISOString(),
          config: { ...conn.config, lastLatency: latency, lastError: error?.message || data?.error },
        })
        .eq('id', conn.id);

      toast[status === 'ok' ? 'success' : 'error'](
        `${conn.name}: ${status === 'ok' ? `OK (${latency.toFixed(0)}ms)` : 'Connection failed'}`
      );
      loadConnections();
    } catch (e: any) {
      toast.error(`Test failed: ${e.message}`);
      await supabase.from('aimos_vm_connections' as any)
        .update({ status: 'error', last_tested_at: new Date().toISOString() })
        .eq('id', conn.id);
      loadConnections();
    } finally {
      setTesting(null);
    }
  };

  const deleteConnection = async (conn: VMConnection) => {
    const { error } = await supabase.from('aimos_vm_connections' as any).delete().eq('id', conn.id);
    if (error) {
      toast.error(`Delete failed: ${error.message}`);
    } else {
      toast.success(`Deleted "${conn.name}"`);
      loadConnections();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plug className="w-5 h-5 text-primary" />
          <span className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
            VM / External Connections
          </span>
          <Badge variant="outline" className="text-[10px]">{connections.length}</Badge>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} size="sm" variant="outline" className="text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> Add
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {/* Add Form */}
          {showAdd && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="py-3 px-4 space-y-2">
                <div className="text-xs font-mono text-primary mb-1">NEW CONNECTION</div>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Connection name"
                  className="text-xs h-8"
                />
                <Input
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://api.example.com/v1"
                  className="text-xs h-8 font-mono"
                />
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONNECTION_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button onClick={addConnection} size="sm" className="text-xs flex-1">
                    <Plus className="w-3 h-3 mr-1" /> Create
                  </Button>
                  <Button onClick={() => setShowAdd(false)} size="sm" variant="ghost" className="text-xs">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Connection List */}
          {connections.length === 0 && !showAdd && (
            <div className="text-center py-12 text-muted-foreground">
              <Wifi className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No connections registered</p>
              <p className="text-[10px] mt-1">Add external AI endpoints to route agent roles</p>
            </div>
          )}

          {connections.map(conn => {
            const typeInfo = CONNECTION_TYPES.find(t => t.value === conn.connection_type);
            const Icon = typeInfo?.icon || Globe;
            const isTesting = testing === conn.id;

            return (
              <Card key={conn.id} className={`border ${STATUS_COLORS[conn.status] || STATUS_COLORS.untested}`}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-mono font-medium text-foreground">{conn.name}</span>
                      <Badge variant="outline" className="text-[9px]">{conn.connection_type}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {conn.status === 'ok' && <CheckCircle className="w-3.5 h-3.5 text-primary" />}
                      {conn.status === 'error' && <XCircle className="w-3.5 h-3.5 text-destructive" />}
                      <Button
                        onClick={() => testConnection(conn)}
                        disabled={isTesting}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                      >
                        {isTesting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      </Button>
                      <Button
                        onClick={() => deleteConnection(conn)}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-destructive/70 hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground truncate">{conn.endpoint_url}</div>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      {conn.config?.lastLatency ? `${Math.round(conn.config.lastLatency)}ms` : 'untested'}
                    </span>
                    {conn.last_tested_at && (
                      <span>Tested: {new Date(conn.last_tested_at).toLocaleTimeString()}</span>
                    )}
                    {conn.config?.lastError && (
                      <span className="text-destructive truncate max-w-[200px]">{conn.config.lastError}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ConnectionsPanel;
