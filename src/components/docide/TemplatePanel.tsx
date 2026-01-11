import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  FileText,
  FolderPlus,
  BookOpen,
  Code,
  Users,
  PenTool,
  GraduationCap,
  Settings,
  Search,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DocumentTemplate } from './types';

interface TemplatePanelProps {
  templates: DocumentTemplate[];
  onSelectTemplate: (template: DocumentTemplate) => void;
  onCreateBlank: () => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  Basic: <FileText className="w-4 h-4" />,
  Development: <Code className="w-4 h-4" />,
  Content: <PenTool className="w-4 h-4" />,
  Business: <Users className="w-4 h-4" />,
  Academic: <GraduationCap className="w-4 h-4" />,
};

export const TemplatePanel = ({
  templates,
  onSelectTemplate,
  onCreateBlank,
}: TemplatePanelProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [...new Set(templates.map(t => t.category))];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-full flex flex-col bg-background/50">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-primary" />
          Document Templates
        </h3>
        
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="px-4 py-2 border-b border-border/50">
        <div className="flex flex-wrap gap-1">
          <Button
            variant={selectedCategory === null ? 'secondary' : 'ghost'}
            size="sm"
            className="h-6 text-xs"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'secondary' : 'ghost'}
              size="sm"
              className="h-6 text-xs gap-1"
              onClick={() => setSelectedCategory(category)}
            >
              {categoryIcons[category]}
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-border/50">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={onCreateBlank}
        >
          <Plus className="w-4 h-4" />
          Blank Document
        </Button>
      </div>

      {/* Template Grid */}
      <ScrollArea className="flex-1">
        <div className="p-4 grid grid-cols-1 gap-3">
          {filteredTemplates.map(template => (
            <Card
              key={template.id}
              className={cn(
                'p-3 cursor-pointer transition-all hover:bg-accent/50 hover:border-primary/50',
                'border-border/50'
              )}
              onClick={() => onSelectTemplate(template)}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded bg-primary/10">
                  {categoryIcons[template.category] || <FileText className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{template.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground">
                      {template.category}
                    </span>
                    {template.structure.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {template.structure.length} sections
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {filteredTemplates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No templates found</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
