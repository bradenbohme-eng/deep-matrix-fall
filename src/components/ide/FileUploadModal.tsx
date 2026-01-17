import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, FolderUp, FileArchive, X, CheckCircle, AlertCircle,
  FileCode, Folder, Loader2
} from 'lucide-react';
import { ingestFiles, IngestionProgress, IngestionResult, IngestionOptions } from '@/lib/fileIngestion';
import { cn } from '@/lib/utils';

interface FileUploadModalProps {
  open: boolean;
  onClose: () => void;
  onFilesIngested: (result: IngestionResult) => void;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  open,
  onClose,
  onFilesIngested,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<IngestionProgress | null>(null);
  const [result, setResult] = useState<IngestionResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const items = e.dataTransfer.items;
    const files: File[] = [];

    // Collect all files from drag
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      await processFiles(files);
    }
  }, []);

  const processFiles = async (files: File[] | FileList) => {
    setIsProcessing(true);
    setProgress(null);
    setResult(null);

    try {
      const ingestionResult = await ingestFiles(
        files as FileList,
        {},
        (prog) => setProgress({ ...prog })
      );
      
      setResult(ingestionResult);
      
      if (ingestionResult.success && ingestionResult.files.length > 0) {
        onFilesIngested(ingestionResult);
      }
    } catch (error) {
      console.error('Ingestion failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFiles(files);
    }
  };

  const handleReset = () => {
    setProgress(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getPhaseLabel = (phase: IngestionProgress['phase']): string => {
    switch (phase) {
      case 'reading': return 'Reading files...';
      case 'extracting': return 'Extracting archive...';
      case 'processing': return 'Processing files...';
      case 'indexing': return 'Indexing structure...';
      case 'complete': return 'Complete!';
      case 'error': return 'Error occurred';
      default: return 'Processing...';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Import Codebase
          </DialogTitle>
          <DialogDescription>
            Upload files, folders, or ZIP archives. Large codebases are supported with automatic filtering.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Hidden inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".zip,.ts,.tsx,.js,.jsx,.json,.md,.css,.html,.py,.go,.rs,.java,.yml,.yaml,.toml,.sql,.graphql,.vue,.svelte"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={folderInputRef}
            type="file"
            // @ts-ignore - webkitdirectory is non-standard
            webkitdirectory=""
            // @ts-ignore
            directory=""
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Drop zone */}
          {!isProcessing && !result && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                isDragOver 
                  ? "border-primary bg-primary/10" 
                  : "border-border hover:border-primary/50 bg-muted/30"
              )}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Drag & drop your codebase here</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Files, folders, or ZIP archives up to 500MB
                  </p>
                </div>
                
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileCode className="w-4 h-4 mr-2" />
                    Files
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => folderInputRef.current?.click()}
                  >
                    <FolderUp className="w-4 h-4 mr-2" />
                    Folder
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileArchive className="w-4 h-4 mr-2" />
                    ZIP
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Progress */}
          {isProcessing && progress && (
            <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm font-medium">{getPhaseLabel(progress.phase)}</span>
                </div>
                <Badge variant="outline">
                  {progress.filesProcessed} / {progress.totalFiles} files
                </Badge>
              </div>
              
              <Progress 
                value={(progress.bytesProcessed / Math.max(progress.totalBytes, 1)) * 100} 
                className="h-2" 
              />
              
              {progress.currentFile && (
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {progress.currentFile}
                </p>
              )}
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatBytes(progress.bytesProcessed)} processed</span>
                <span>{progress.errors.length} errors</span>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-4">
              <div className={cn(
                "p-4 rounded-lg border",
                result.success ? "bg-green-500/10 border-green-500/30" : "bg-destructive/10 border-destructive/30"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  )}
                  <span className="font-medium">
                    {result.success ? 'Import Successful!' : 'Import Failed'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-muted-foreground" />
                    <span>{result.stats.totalFiles} files</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-muted-foreground" />
                    <span>{result.stats.totalFolders} folders</span>
                  </div>
                  <div className="text-muted-foreground">
                    {formatBytes(result.stats.totalBytes)} total
                  </div>
                  <div className="text-muted-foreground">
                    {result.stats.processingTime}ms
                  </div>
                </div>
              </div>

              {/* File preview */}
              {result.files.length > 0 && (
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="px-3 py-2 bg-muted/50 text-xs font-medium">
                    Imported Files ({result.files.length})
                  </div>
                  <ScrollArea className="h-40">
                    <div className="p-2 space-y-1">
                      {result.files.slice(0, 50).map((file, i) => (
                        <div 
                          key={i}
                          className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground"
                        >
                          <FileCode className="w-3 h-3 shrink-0" />
                          <span className="truncate">{file.path}</span>
                          <span className="ml-auto text-[10px]">{formatBytes(file.size)}</span>
                        </div>
                      ))}
                      {result.files.length > 50 && (
                        <div className="text-xs text-muted-foreground pl-5">
                          ... and {result.files.length - 50} more files
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="rounded-lg border border-destructive/30 overflow-hidden">
                  <div className="px-3 py-2 bg-destructive/10 text-xs font-medium text-destructive">
                    Errors ({result.errors.length})
                  </div>
                  <ScrollArea className="h-24">
                    <div className="p-2 space-y-1">
                      {result.errors.map((err, i) => (
                        <div key={i} className="text-xs text-destructive">
                          {err.file}: {err.error}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Import More
                </Button>
                <Button size="sm" onClick={handleClose}>
                  Done
                </Button>
              </div>
            </div>
          )}

          {/* Info */}
          {!isProcessing && !result && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Supported:</strong> TypeScript, JavaScript, JSON, Markdown, CSS, HTML, Python, Go, Rust, Java, and more</p>
              <p><strong>Auto-filtered:</strong> node_modules, .git, dist, build, binary files, lock files</p>
              <p><strong>Limits:</strong> 10MB per file, 5000 files max, 500MB total</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadModal;
