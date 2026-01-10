import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  RefreshCw, ExternalLink, Smartphone, Tablet, Monitor,
  Play, Pause, Volume2, VolumeX, Maximize2, Code2, Eye
} from 'lucide-react';
import { FileNode } from './types';
import { cn } from '@/lib/utils';

interface PreviewPanelProps {
  files: FileNode[];
  activeFilePath?: string;
}

type ViewportSize = 'mobile' | 'tablet' | 'desktop';

const viewportSizes: Record<ViewportSize, { width: number; height: number; icon: React.ElementType }> = {
  mobile: { width: 375, height: 667, icon: Smartphone },
  tablet: { width: 768, height: 1024, icon: Tablet },
  desktop: { width: 1280, height: 720, icon: Monitor },
};

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ files, activeFilePath }) => {
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [url, setUrl] = useState('/');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const findNode = useCallback((nodes: FileNode[], path: string): FileNode | null => {
    for (const node of nodes) {
      if (node.path === path) return node;
      if (node.children) {
        const found = findNode(node.children, path);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const buildPreviewHTML = useCallback(() => {
    // Find main files
    const appFile = findNode(files, '/workspace/src/App.tsx');
    const indexFile = findNode(files, '/workspace/src/index.tsx');
    
    // Get all component files
    const getAllFiles = (nodes: FileNode[]): FileNode[] => {
      let result: FileNode[] = [];
      for (const node of nodes) {
        if (node.type === 'file') result.push(node);
        if (node.children) result = result.concat(getAllFiles(node.children));
      }
      return result;
    };

    const allFiles = getAllFiles(files);
    const jsFiles = allFiles.filter(f => 
      f.name.endsWith('.tsx') || f.name.endsWith('.ts') || 
      f.name.endsWith('.jsx') || f.name.endsWith('.js')
    );

    // Build a simple preview
    const appContent = appFile?.content || '';
    
    // Extract the component from App.tsx (simplified)
    let componentCode = appContent;
    
    // Simple transform: remove imports/exports for preview
    componentCode = componentCode
      .replace(/import\s+.*?from\s+['"].*?['"];?\n?/g, '')
      .replace(/export\s+default\s+/g, '')
      .replace(/export\s+/g, '');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { margin: 0; padding: 0; }
    #root { min-height: 100vh; }
    .preview-error {
      padding: 20px;
      background: #fee2e2;
      color: #dc2626;
      font-family: monospace;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    try {
      ${componentCode}
      
      // Try to render App if it exists
      const AppComponent = typeof App !== 'undefined' ? App : () => (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">AI-MOS Preview</h1>
            <p className="text-gray-400">Create an App component to see your preview</p>
          </div>
        </div>
      );
      
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<AppComponent />);
    } catch (error) {
      document.getElementById('root').innerHTML = 
        '<div class="preview-error">Error: ' + error.message + '</div>';
    }
  </script>
</body>
</html>`;
  }, [files, findNode]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setError(null);
    
    try {
      const html = buildPreviewHTML();
      const blob = new Blob([html], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      
      if (iframeRef.current) {
        iframeRef.current.src = blobUrl;
      }
      
      setTimeout(() => setIsLoading(false), 500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to build preview');
      setIsLoading(false);
    }
  }, [buildPreviewHTML]);

  useEffect(() => {
    refresh();
  }, []);

  // Auto-refresh when files change
  useEffect(() => {
    const timeout = setTimeout(refresh, 1000);
    return () => clearTimeout(timeout);
  }, [files, refresh]);

  const currentViewport = viewportSizes[viewport];

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
          {(Object.keys(viewportSizes) as ViewportSize[]).map((size) => {
            const Icon = viewportSizes[size].icon;
            return (
              <Button
                key={size}
                variant={viewport === size ? 'secondary' : 'ghost'}
                size="icon"
                className="h-6 w-6"
                onClick={() => setViewport(size)}
              >
                <Icon className="w-3 h-3" />
              </Button>
            );
          })}
        </div>

        <div className="flex-1 flex items-center gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="h-7 text-xs font-mono flex-1 max-w-xs"
          />
        </div>

        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-[10px]">
            {currentViewport.width}×{currentViewport.height}
          </Badge>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setShowCode(!showCode)}
          >
            {showCode ? <Eye className="w-3 h-3" /> : <Code2 className="w-3 h-3" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={refresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
          </Button>

          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Maximize2 className="w-3 h-3" />
          </Button>

          <Button variant="ghost" size="icon" className="h-6 w-6">
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto bg-muted/50 flex items-center justify-center p-4">
        {error ? (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 max-w-md">
            <p className="text-sm text-destructive font-mono">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={refresh}
            >
              Try Again
            </Button>
          </div>
        ) : showCode ? (
          <pre className="bg-background p-4 rounded-lg overflow-auto max-w-full max-h-full text-xs font-mono">
            {buildPreviewHTML()}
          </pre>
        ) : (
          <div
            className="bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300"
            style={{
              width: viewport === 'desktop' ? '100%' : currentViewport.width,
              height: viewport === 'desktop' ? '100%' : currentViewport.height,
              maxWidth: currentViewport.width,
              maxHeight: currentViewport.height,
            }}
          >
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
            <iframe
              ref={iframeRef}
              className="w-full h-full border-0"
              title="Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-2 px-3 py-1 border-t border-border bg-muted/30 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isLoading ? "bg-yellow-500" : error ? "bg-destructive" : "bg-green-500"
          )} />
          <span>{isLoading ? 'Loading...' : error ? 'Error' : 'Ready'}</span>
        </div>
        <span className="ml-auto font-mono">{viewport}</span>
      </div>
    </div>
  );
};
