import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Lightbulb, 
  Code, 
  Hammer, 
  Shield, 
  Brain,
  Database,
  Search
} from 'lucide-react';

export type ChatMode = 'chat' | 'planning' | 'developing' | 'building' | 'hacking' | 'deep-think' | 'research';

interface ChatModeSelectorProps {
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}

const modes = [
  {
    id: 'chat' as ChatMode,
    label: 'Chat',
    icon: MessageCircle,
    description: 'General conversation with AIMOS',
    color: 'text-blue-400'
  },
  {
    id: 'planning' as ChatMode,
    label: 'Planning',
    icon: Lightbulb,
    description: 'Strategic planning with APOE',
    color: 'text-yellow-400'
  },
  {
    id: 'developing' as ChatMode,
    label: 'Developing',
    icon: Code,
    description: 'Code development with IDE tools',
    color: 'text-green-400'
  },
  {
    id: 'building' as ChatMode,
    label: 'Building',
    icon: Hammer,
    description: 'System building and architecture',
    color: 'text-orange-400'
  },
  {
    id: 'hacking' as ChatMode,
    label: 'Hacking',
    icon: Shield,
    description: 'Security analysis and pentesting',
    color: 'text-red-400'
  },
  {
    id: 'deep-think' as ChatMode,
    label: 'Deep Think',
    icon: Brain,
    description: 'Multi-step recursive reasoning',
    color: 'text-purple-400'
  },
  {
    id: 'research' as ChatMode,
    label: 'Research',
    icon: Search,
    description: 'Deep research with web search',
    color: 'text-cyan-400'
  }
];

export const ChatModeSelector: React.FC<ChatModeSelectorProps> = ({ currentMode, onModeChange }) => {
  return (
    <div className="flex flex-wrap gap-2 p-3 bg-black/40 border border-primary/20 rounded-lg">
      {modes.map(mode => {
        const Icon = mode.icon;
        const isActive = currentMode === mode.id;
        
        return (
          <Button
            key={mode.id}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onModeChange(mode.id)}
            className={`gap-2 ${!isActive && 'hover:' + mode.color} ${isActive && mode.color}`}
          >
            <Icon className="w-4 h-4" />
            {mode.label}
            {isActive && (
              <Badge variant="secondary" className="ml-1 text-xs px-1">
                ACTIVE
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
};
