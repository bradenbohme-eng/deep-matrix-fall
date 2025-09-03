import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface TerminalCommand {
  command: string;
  response: string;
  timestamp: Date;
  type: 'input' | 'output' | 'error' | 'system';
}

interface SystemStatus {
  connected: boolean;
  user: string;
  clearance: number;
  faction: string;
  uptime: string;
}

export const TerminalInterface: React.FC = () => {
  const [history, setHistory] = useState<TerminalCommand[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    connected: false,
    user: 'ANONYMOUS',
    clearance: 0,
    faction: 'UNAFFILIATED',
    uptime: '00:00:00'
  });
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize terminal
  useEffect(() => {
    const initMessage: TerminalCommand = {
      command: '',
      response: `
╔══════════════════════════════════════════════════════════════╗
║                    WARFARE TERMINAL v3.7.1                   ║
║                  SECURE CONNECTION ESTABLISHED               ║
╚══════════════════════════════════════════════════════════════╝

Type 'help' for available commands
Type 'status' for system information
Type 'scan' to detect nearby intelligence

[CLASSIFIED] Temporal graph database online
[CLASSIFIED] AI narrative engine active
[CLASSIFIED] World war clock synchronized
      `,
      timestamp: new Date(),
      type: 'system'
    };
    setHistory([initMessage]);
    
    loadUserStatus();
    startUptime();
  }, []);

  const startUptime = () => {
    const startTime = Date.now();
    const updateUptime = () => {
      const elapsed = Date.now() - startTime;
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      setSystemStatus(prev => ({
        ...prev,
        uptime: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      }));
    };
    
    const interval = setInterval(updateUptime, 1000);
    return () => clearInterval(interval);
  };

  const loadUserStatus = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const { data: player } = await supabase
          .from('warfare_players')
          .select(`
            *,
            factions (name)
          `)
          .eq('user_id', user.user.id)
          .single();

        if (player) {
          setSystemStatus(prev => ({
            ...prev,
            connected: true,
            user: user.user.email?.split('@')[0].toUpperCase() || 'OPERATIVE',
            clearance: player.clearance_level,
            faction: player.factions?.name || 'UNKNOWN'
          }));
        }
      }
    } catch (error) {
      console.error('Error loading user status:', error);
    }
  };

  const addToHistory = useCallback((command: string, response: string, type: 'input' | 'output' | 'error' | 'system' = 'output') => {
    const newEntry: TerminalCommand = {
      command,
      response,
      timestamp: new Date(),
      type
    };
    setHistory(prev => [...prev, newEntry]);
  }, []);

  const executeCommand = async (cmd: string) => {
    const command = cmd.trim().toLowerCase();
    const args = command.split(' ');
    const baseCommand = args[0];

    // Add to command history
    if (cmd.trim()) {
      setCommandHistory(prev => [cmd.trim(), ...prev.slice(0, 49)]);
    }

    // Add input to history
    addToHistory(cmd, '', 'input');

    switch (baseCommand) {
      case 'help':
        addToHistory('', `
Available Commands:
═══════════════════════════════════════════════════════════════
INTELLIGENCE:
  scan                 - Scan for intelligence opportunities
  intel [id]          - View specific intelligence asset
  trade [id] [price]  - Trade intelligence asset
  
OPERATIONS:
  missions            - List active missions
  execute [id]        - Execute mission
  status              - Show system status
  
FACTION:
  factions            - List all factions
  diplomacy           - Show diplomatic status
  reputation          - View reputation standings
  
WARFARE:
  clock               - Show world war clock
  events              - Recent warfare events
  threat              - Assess current threat level
  
SYSTEM:
  clear               - Clear terminal
  history             - Show command history
  logout              - Terminate session
═══════════════════════════════════════════════════════════════
        `);
        break;

      case 'status':
        addToHistory('', `
System Status Report
═══════════════════════════════════════════════════════════════
Connection:     ${systemStatus.connected ? '[SECURE]' : '[DISCONNECTED]'}
User:           ${systemStatus.user}
Clearance:      LEVEL ${systemStatus.clearance}
Faction:        ${systemStatus.faction}
Uptime:         ${systemStatus.uptime}
Location:       [CLASSIFIED]
Neural Link:    ACTIVE
Quantum Sync:   STABLE
═══════════════════════════════════════════════════════════════
        `);
        break;

      case 'scan':
        addToHistory('', 'Scanning for intelligence opportunities...');
        try {
          const { data: intel } = await supabase
            .from('intel_assets')
            .select('*')
            .eq('tradeable', true)
            .limit(5);
          
          if (intel && intel.length > 0) {
            const intelList = intel.map(item => 
              `[${item.id.slice(0, 8)}] ${item.title} - Classification: ${item.classification_level} - Value: ${item.value_isk} ISK`
            ).join('\n');
            
            addToHistory('', `
Intelligence Assets Detected:
═══════════════════════════════════════════════════════════════
${intelList}
═══════════════════════════════════════════════════════════════
Use 'intel [id]' to examine specific assets
            `);
          } else {
            addToHistory('', 'No tradeable intelligence assets detected in current sector.');
          }
        } catch (error) {
          addToHistory('', 'Error accessing intelligence network.', 'error');
        }
        break;

      case 'missions':
        try {
          const { data: user } = await supabase.auth.getUser();
          if (user.user) {
            const { data: player } = await supabase
              .from('warfare_players')
              .select('id')
              .eq('user_id', user.user.id)
              .single();
            
            if (player) {
              const { data: missions } = await supabase
                .from('missions')
                .select('*')
                .eq('player_id', player.id)
                .eq('status', 'active');
              
              if (missions && missions.length > 0) {
                const missionList = missions.map(mission => 
                  `[${mission.id.slice(0, 8)}] ${mission.title}\n  Type: ${mission.mission_type}\n  Status: ${mission.status.toUpperCase()}`
                ).join('\n\n');
                
                addToHistory('', `
Active Missions:
═══════════════════════════════════════════════════════════════
${missionList}
═══════════════════════════════════════════════════════════════
Use 'execute [id]' to begin mission execution
                `);
              } else {
                addToHistory('', 'No active missions. Await new intelligence reports.');
              }
            }
          }
        } catch (error) {
          addToHistory('', 'Error accessing mission database.', 'error');
        }
        break;

      case 'clock':
        try {
          const { data: clock } = await supabase
            .from('world_war_clock')
            .select('*')
            .single();
          
          if (clock) {
            const minutes = Math.floor(clock.minutes_to_midnight);
            const seconds = Math.floor((clock.minutes_to_midnight % 1) * 60);
            
            addToHistory('', `
World War Clock Status:
═══════════════════════════════════════════════════════════════
Time to Midnight:    ${Math.floor(minutes / 60)}:${(minutes % 60).toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}
Escalation Prob:     ${(clock.escalation_probability * 100).toFixed(1)}%

Tension Factors:
Nuclear:            ${(clock.tension_factors.nuclear_tension * 100).toFixed(1)}%
Cyber Warfare:      ${(clock.tension_factors.cyber_warfare * 100).toFixed(1)}%
Economic:           ${(clock.tension_factors.economic_instability * 100).toFixed(1)}%
AI Anomalies:       ${(clock.tension_factors.ai_anomalies * 100).toFixed(1)}%
═══════════════════════════════════════════════════════════════
            `);
          }
        } catch (error) {
          addToHistory('', 'Error accessing world war clock.', 'error');
        }
        break;

      case 'factions':
        try {
          const { data: factions } = await supabase
            .from('factions')
            .select('*');
          
          if (factions) {
            const factionList = factions.map(faction => 
              `${faction.name}\n  Resources: ${faction.resources.isk.toLocaleString()} ISK | Rep: ${faction.resources.reputation} | Intel: ${faction.resources.intel}\n  Focus: ${faction.ideology?.focus || 'Unknown'}`
            ).join('\n\n');
            
            addToHistory('', `
Known Factions:
═══════════════════════════════════════════════════════════════
${factionList}
═══════════════════════════════════════════════════════════════
            `);
          }
        } catch (error) {
          addToHistory('', 'Error accessing faction database.', 'error');
        }
        break;

      case 'events':
        try {
          const { data: events } = await supabase
            .from('warfare_events')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(10);
          
          if (events && events.length > 0) {
            const eventList = events.map(event => 
              `[${new Date(event.timestamp).toLocaleTimeString()}] ${event.event_type.toUpperCase()}\n  Impact: ${event.impact_score}`
            ).join('\n\n');
            
            addToHistory('', `
Recent Warfare Events:
═══════════════════════════════════════════════════════════════
${eventList}
═══════════════════════════════════════════════════════════════
            `);
          } else {
            addToHistory('', 'No recent warfare events detected.');
          }
        } catch (error) {
          addToHistory('', 'Error accessing event log.', 'error');
        }
        break;

      case 'clear':
        setHistory([]);
        break;

      case 'history':
        const historyList = commandHistory.slice(0, 10).map((cmd, idx) => 
          `${idx + 1}. ${cmd}`
        ).join('\n');
        addToHistory('', `Command History:\n${historyList}`);
        break;

      case 'logout':
        addToHistory('', 'Terminating secure session...\nConnection closed.');
        // Could add actual logout logic here
        break;

      default:
        addToHistory('', `Command not recognized: ${baseCommand}\nType 'help' for available commands.`, 'error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentInput.trim()) {
      executeCommand(currentInput);
      setCurrentInput('');
      setHistoryIndex(-1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
      setHistoryIndex(newIndex);
      if (commandHistory[newIndex]) {
        setCurrentInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = Math.max(historyIndex - 1, -1);
      setHistoryIndex(newIndex);
      if (newIndex === -1) {
        setCurrentInput('');
      } else if (commandHistory[newIndex]) {
        setCurrentInput(commandHistory[newIndex]);
      }
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input when clicking terminal
  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  return (
    <Card className="h-[600px] bg-black/90 backdrop-blur border border-primary/30 font-mono text-green-400 text-sm">
      {/* Terminal Header */}
      <div className="flex items-center justify-between p-2 border-b border-primary/30 bg-primary/5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-xs text-muted-foreground">
          WARFARE TERMINAL - {systemStatus.user}@{systemStatus.faction}
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-xs">
            {systemStatus.connected ? 'ONLINE' : 'OFFLINE'}
          </Badge>
          <Badge variant="outline" className="text-xs">
            CL{systemStatus.clearance}
          </Badge>
        </div>
      </div>

      {/* Terminal Content */}
      <div 
        ref={terminalRef}
        className="h-[calc(100%-120px)] overflow-y-auto p-4 cursor-text"
        onClick={handleTerminalClick}
      >
        {history.map((entry, index) => (
          <div key={index} className="mb-1">
            {entry.type === 'input' && (
              <div className="text-blue-400">
                <span className="text-green-400">user@warfare:~$</span> {entry.command}
              </div>
            )}
            {entry.type === 'output' && (
              <pre className="text-green-400 whitespace-pre-wrap">{entry.response}</pre>
            )}
            {entry.type === 'error' && (
              <div className="text-red-400">{entry.response}</div>
            )}
            {entry.type === 'system' && (
              <pre className="text-cyan-400 whitespace-pre-wrap">{entry.response}</pre>
            )}
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="flex items-center p-4 border-t border-primary/30 bg-primary/5">
        <span className="text-green-400 mr-2">user@warfare:~$</span>
        <Input
          ref={inputRef}
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none text-green-400 font-mono focus:ring-0 p-0"
          placeholder="Type command..."
          autoFocus
        />
      </div>
    </Card>
  );
};