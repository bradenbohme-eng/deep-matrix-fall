import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  History,
  GitCommit,
  Clock,
  ChevronRight,
  RotateCcw,
  Diff,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DocumentVersion } from './types';
import { formatDistanceToNow } from 'date-fns';

interface VersionPanelProps {
  versions: DocumentVersion[];
  documentId: string | null;
  currentContent: string;
  onRestore: (versionId: string) => void;
  onCompare: (versionId: string) => void;
}

export const VersionPanel = ({
  versions,
  documentId,
  currentContent,
  onRestore,
  onCompare,
}: VersionPanelProps) => {
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  const documentVersions = versions
    .filter(v => v.documentId === documentId)
    .sort((a, b) => b.version - a.version);

  const selected = documentVersions.find(v => v.id === selectedVersion);

  // Simple diff calculation
  const calculateDiff = (oldContent: string, newContent: string) => {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    let additions = 0;
    let deletions = 0;
    
    // Very simple line-based diff
    const maxLines = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLines; i++) {
      if (oldLines[i] !== newLines[i]) {
        if (!oldLines[i]) additions++;
        else if (!newLines[i]) deletions++;
        else {
          additions++;
          deletions++;
        }
      }
    }

    return { additions, deletions };
  };

  return (
    <div className="h-full flex flex-col bg-background/50">
      {/* Header */}
      <div className="p-3 border-b border-border/50">
        <h3 className="font-semibold flex items-center gap-2 text-sm">
          <History className="w-4 h-4 text-primary" />
          Version History
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {documentVersions.length} saved version{documentVersions.length !== 1 ? 's' : ''}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Current Version */}
          <div className="p-2 rounded bg-primary/10 border border-primary/20 mb-2">
            <div className="flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Current (unsaved)</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentContent.split(/\s+/).filter(w => w).length} words
            </p>
          </div>

          {/* Version List */}
          {documentVersions.length > 0 ? (
            documentVersions.map((version, index) => {
              const isSelected = version.id === selectedVersion;
              const prevVersion = documentVersions[index + 1];
              const diff = prevVersion 
                ? calculateDiff(prevVersion.content, version.content)
                : { additions: 0, deletions: 0 };

              return (
                <div
                  key={version.id}
                  className={cn(
                    'p-2 rounded cursor-pointer transition-colors mb-1',
                    'hover:bg-accent/50',
                    isSelected && 'bg-accent'
                  )}
                  onClick={() => setSelectedVersion(isSelected ? null : version.id)}
                >
                  <div className="flex items-center gap-2">
                    <GitCommit className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium flex-1 truncate">
                      v{version.version}
                    </span>
                    <ChevronRight 
                      className={cn(
                        'w-3.5 h-3.5 transition-transform',
                        isSelected && 'rotate-90'
                      )}
                    />
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {version.message}
                  </p>
                  
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {version.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  {diff.additions > 0 || diff.deletions > 0 ? (
                    <div className="flex items-center gap-2 mt-1.5">
                      {diff.additions > 0 && (
                        <Badge variant="outline" className="text-[10px] h-4 text-green-500 border-green-500/30">
                          +{diff.additions}
                        </Badge>
                      )}
                      {diff.deletions > 0 && (
                        <Badge variant="outline" className="text-[10px] h-4 text-red-500 border-red-500/30">
                          -{diff.deletions}
                        </Badge>
                      )}
                    </div>
                  ) : null}

                  {/* Expanded Actions */}
                  {isSelected && (
                    <div className="flex gap-2 mt-3 pt-2 border-t border-border/50">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-xs gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRestore(version.id);
                        }}
                      >
                        <RotateCcw className="w-3 h-3" />
                        Restore
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-xs gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDiff(true);
                        }}
                      >
                        <Diff className="w-3 h-3" />
                        Compare
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No versions saved</p>
              <p className="text-xs mt-1">Save to create a version</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Diff View Modal/Panel would go here */}
      {showDiff && selected && (
        <div className="absolute inset-0 bg-background/95 z-50 flex flex-col">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="font-medium text-sm">Comparing v{selected.version}</span>
            <Button variant="ghost" size="sm" onClick={() => setShowDiff(false)}>
              Close
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4">
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {selected.content}
              </pre>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};
