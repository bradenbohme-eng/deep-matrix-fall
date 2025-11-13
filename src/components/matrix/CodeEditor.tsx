import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FileCode2, 
  Save, 
  Folder, 
  File, 
  Plus,
  Trash2,
  Play,
  Code2
} from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
  children?: FileNode[];
}

interface CodeEditorProps {
  onCodeExecution?: (code: string, language: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ onCodeExecution }) => {
  const [fileTree, setFileTree] = useState<FileNode[]>([
    {
      name: 'src',
      type: 'folder',
      path: 'src',
      children: [
        {
          name: 'App.tsx',
          type: 'file',
          path: 'src/App.tsx',
          content: '// Welcome to the Code Editor\n// Create and edit files here\n\nfunction App() {\n  return <div>Hello World</div>;\n}\n\nexport default App;'
        },
        {
          name: 'components',
          type: 'folder',
          path: 'src/components',
          children: []
        }
      ]
    }
  ]);
  
  const [activeFile, setActiveFile] = useState<string>('src/App.tsx');
  const [code, setCode] = useState<string>('// Welcome to the Code Editor\n// Create and edit files here\n\nfunction App() {\n  return <div>Hello World</div>;\n}\n\nexport default App;');
  const [newFileName, setNewFileName] = useState('');
  const [showNewFileInput, setShowNewFileInput] = useState(false);

  const findFile = (tree: FileNode[], path: string): FileNode | null => {
    for (const node of tree) {
      if (node.path === path) return node;
      if (node.children) {
        const found = findFile(node.children, path);
        if (found) return found;
      }
    }
    return null;
  };

  const updateFileContent = (tree: FileNode[], path: string, content: string): FileNode[] => {
    return tree.map(node => {
      if (node.path === path && node.type === 'file') {
        return { ...node, content };
      }
      if (node.children) {
        return { ...node, children: updateFileContent(node.children, path, content) };
      }
      return node;
    });
  };

  const handleFileClick = (file: FileNode) => {
    if (file.type === 'file') {
      setActiveFile(file.path);
      setCode(file.content || '');
    }
  };

  const handleSave = () => {
    setFileTree(prev => updateFileContent(prev, activeFile, code));
  };

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    
    const newFile: FileNode = {
      name: newFileName,
      type: newFileName.includes('.') ? 'file' : 'folder',
      path: `src/${newFileName}`,
      content: newFileName.includes('.') ? '// New file\n' : undefined,
      children: newFileName.includes('.') ? undefined : []
    };

    setFileTree(prev => {
      const srcFolder = prev.find(n => n.name === 'src');
      if (srcFolder && srcFolder.children) {
        srcFolder.children.push(newFile);
      }
      return [...prev];
    });

    setNewFileName('');
    setShowNewFileInput(false);

    if (newFile.type === 'file') {
      setActiveFile(newFile.path);
      setCode(newFile.content || '');
    }
  };

  const handleExecute = () => {
    const language = activeFile.endsWith('.ts') || activeFile.endsWith('.tsx') ? 'typescript' :
                    activeFile.endsWith('.js') || activeFile.endsWith('.jsx') ? 'javascript' :
                    activeFile.endsWith('.py') ? 'python' : 'text';
    onCodeExecution?.(code, language);
  };

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map((node, idx) => (
      <div key={node.path} style={{ marginLeft: `${depth * 12}px` }}>
        <div
          className={`flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-primary/10 rounded text-xs font-mono ${
            activeFile === node.path ? 'bg-primary/20 text-primary' : 'text-muted-foreground'
          }`}
          onClick={() => handleFileClick(node)}
        >
          {node.type === 'folder' ? (
            <Folder className="w-3 h-3" />
          ) : (
            <File className="w-3 h-3" />
          )}
          <span>{node.name}</span>
        </div>
        {node.children && renderFileTree(node.children, depth + 1)}
      </div>
    ));
  };

  return (
    <div className="h-full flex gap-4">
      {/* File Explorer */}
      <Card className="w-64 bg-card/50 border-primary/20 p-3 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-mono text-primary font-bold">FILES</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNewFileInput(!showNewFileInput)}
            className="h-6 w-6 p-0"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        {showNewFileInput && (
          <div className="mb-3 flex gap-1">
            <Input
              placeholder="filename.tsx"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="h-7 text-xs"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateFile}
              className="h-7 px-2"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        )}

        <div className="space-y-1">
          {renderFileTree(fileTree)}
        </div>
      </Card>

      {/* Code Editor */}
      <div className="flex-1 flex flex-col gap-3">
        <Card className="bg-card/50 border-primary/20 p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-mono text-primary font-bold">{activeFile}</h3>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                className="h-7 px-3 text-xs"
              >
                <Save className="w-3 h-3 mr-1" />
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExecute}
                className="h-7 px-3 text-xs"
              >
                <Play className="w-3 h-3 mr-1" />
                Run
              </Button>
            </div>
          </div>
          
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="min-h-[500px] font-mono text-xs bg-background/50 border-primary/20"
            placeholder="Write your code here..."
          />
        </Card>

        <Card className="bg-card/50 border-primary/20 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              Lines: {code.split('\n').length}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Characters: {code.length}
            </Badge>
          </div>
        </Card>
      </div>
    </div>
  );
};
