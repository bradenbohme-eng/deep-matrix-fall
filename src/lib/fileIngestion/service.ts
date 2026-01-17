// File Ingestion Service
// Handles file, folder, and ZIP ingestion with progress tracking

import JSZip from 'jszip';
import {
  IngestionFile, IngestionProgress, IngestionResult, IngestionOptions,
  IngestionError, DEFAULT_INGESTION_OPTIONS, BINARY_EXTENSIONS, TEXT_EXTENSIONS
} from './types';

type ProgressCallback = (progress: IngestionProgress) => void;

// Check if file should be excluded
const shouldExclude = (path: string, options: IngestionOptions): boolean => {
  const normalizedPath = path.replace(/\\/g, '/');
  
  // Check hidden files
  if (!options.includeHidden) {
    const parts = normalizedPath.split('/');
    if (parts.some(p => p.startsWith('.') && p !== '.')) {
      // Allow some common config files
      const allowedHidden = ['.env', '.gitignore', '.eslintrc', '.prettierrc', '.editorconfig'];
      const fileName = parts[parts.length - 1];
      if (!allowedHidden.some(a => fileName.startsWith(a))) {
        return true;
      }
    }
  }

  // Check exclude patterns
  for (const pattern of options.excludePatterns) {
    if (matchPattern(normalizedPath, pattern)) {
      return true;
    }
  }

  return false;
};

// Simple glob pattern matching
const matchPattern = (path: string, pattern: string): boolean => {
  // Convert glob to regex
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/{{GLOBSTAR}}/g, '.*')
    .replace(/\?/g, '.');
  
  const regex = new RegExp(`^${regexPattern}$|/${regexPattern}$|^${regexPattern}/|/${regexPattern}/`);
  return regex.test(path);
};

// Check if file is binary
const isBinaryFile = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return BINARY_EXTENSIONS.has(ext);
};

// Check if file is text
const isTextFile = (filename: string): boolean => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const name = filename.toLowerCase();
  
  // Common files without extensions
  const noExtFiles = ['dockerfile', 'makefile', 'rakefile', 'gemfile', 'procfile', 'readme', 'license', 'changelog'];
  if (noExtFiles.includes(name)) return true;
  
  return TEXT_EXTENSIONS.has(ext) || ext === '';
};

// Read file as text
const readFileAsText = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};

// Read file as array buffer
const readFileAsArrayBuffer = async (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};

// Process a single file
const processFile = async (
  file: File,
  relativePath: string,
  options: IngestionOptions
): Promise<IngestionFile | null> => {
  // Check size
  if (file.size > options.maxFileSize) {
    return null;
  }

  // Check if binary
  if (isBinaryFile(file.name)) {
    return null;
  }

  try {
    const content = await readFileAsText(file);
    return {
      path: relativePath,
      name: file.name,
      content,
      size: file.size,
      type: 'file',
      mimeType: file.type,
      lastModified: new Date(file.lastModified),
    };
  } catch (error) {
    console.error(`Failed to read file ${relativePath}:`, error);
    return null;
  }
};

// Process ZIP file
const processZipFile = async (
  file: File,
  options: IngestionOptions,
  onProgress: ProgressCallback
): Promise<IngestionFile[]> => {
  const files: IngestionFile[] = [];
  const errors: IngestionError[] = [];

  try {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    const entries = Object.entries(zip.files);
    const totalEntries = entries.length;
    let processed = 0;

    for (const [path, zipEntry] of entries) {
      // Skip directories
      if (zipEntry.dir) {
        processed++;
        continue;
      }

      // Check exclusions
      if (shouldExclude(path, options)) {
        processed++;
        continue;
      }

      // Check if binary
      if (isBinaryFile(path)) {
        processed++;
        continue;
      }

      // Check file count
      if (files.length >= options.maxFiles) {
        break;
      }

      onProgress({
        phase: 'extracting',
        current: processed,
        total: totalEntries,
        currentFile: path,
        bytesProcessed: 0,
        totalBytes: file.size,
        filesProcessed: files.length,
        totalFiles: totalEntries,
        errors,
      });

      try {
        const content = await zipEntry.async('string');
        const fileName = path.split('/').pop() || path;
        
        // Skip large files
        if (content.length > options.maxFileSize) {
          processed++;
          continue;
        }

        files.push({
          path: `/${path}`,
          name: fileName,
          content,
          size: content.length,
          type: 'file',
          lastModified: zipEntry.date,
        });
      } catch (error) {
        errors.push({
          file: path,
          error: error instanceof Error ? error.message : 'Unknown error',
          recoverable: true,
        });
      }

      processed++;
    }
  } catch (error) {
    throw new Error(`Failed to extract ZIP: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return files;
};

// Process folder upload (using webkitdirectory)
const processFolderUpload = async (
  fileList: FileList,
  options: IngestionOptions,
  onProgress: ProgressCallback
): Promise<IngestionFile[]> => {
  const files: IngestionFile[] = [];
  const errors: IngestionError[] = [];
  const totalFiles = fileList.length;
  let processedCount = 0;
  let bytesProcessed = 0;
  let totalBytes = 0;

  // Calculate total bytes
  for (let i = 0; i < fileList.length; i++) {
    totalBytes += fileList[i].size;
  }

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    // Use webkitRelativePath for folder structure
    const relativePath = '/' + ((file as any).webkitRelativePath || file.name);

    // Check exclusions
    if (shouldExclude(relativePath, options)) {
      processedCount++;
      bytesProcessed += file.size;
      continue;
    }

    // Check file count
    if (files.length >= options.maxFiles) {
      break;
    }

    onProgress({
      phase: 'processing',
      current: processedCount,
      total: totalFiles,
      currentFile: relativePath,
      bytesProcessed,
      totalBytes,
      filesProcessed: files.length,
      totalFiles,
      errors,
    });

    const result = await processFile(file, relativePath, options);
    if (result) {
      files.push(result);
    }

    processedCount++;
    bytesProcessed += file.size;
  }

  return files;
};

// Main ingestion function
export const ingestFiles = async (
  input: FileList | File[],
  options: Partial<IngestionOptions> = {},
  onProgress?: ProgressCallback
): Promise<IngestionResult> => {
  const startTime = Date.now();
  const opts: IngestionOptions = { ...DEFAULT_INGESTION_OPTIONS, ...options };
  const files: IngestionFile[] = [];
  const errors: IngestionError[] = [];
  
  const progressCallback: ProgressCallback = onProgress || (() => {});

  progressCallback({
    phase: 'reading',
    current: 0,
    total: input.length,
    bytesProcessed: 0,
    totalBytes: 0,
    filesProcessed: 0,
    totalFiles: input.length,
    errors: [],
  });

  try {
    const fileArray = Array.from(input);
    
    // Check if it's a single ZIP file
    if (fileArray.length === 1 && fileArray[0].name.endsWith('.zip') && opts.extractZip) {
      const zipFiles = await processZipFile(fileArray[0], opts, progressCallback);
      files.push(...zipFiles);
    } 
    // Check if it's a folder upload (webkitRelativePath present)
    else if (fileArray.some(f => (f as any).webkitRelativePath)) {
      const folderFiles = await processFolderUpload(input as FileList, opts, progressCallback);
      files.push(...folderFiles);
    }
    // Regular file upload
    else {
      let processedCount = 0;
      let bytesProcessed = 0;
      const totalBytes = fileArray.reduce((sum, f) => sum + f.size, 0);

      for (const file of fileArray) {
        if (files.length >= opts.maxFiles) break;

        progressCallback({
          phase: 'processing',
          current: processedCount,
          total: fileArray.length,
          currentFile: file.name,
          bytesProcessed,
          totalBytes,
          filesProcessed: files.length,
          totalFiles: fileArray.length,
          errors,
        });

        // Handle ZIP files
        if (file.name.endsWith('.zip') && opts.extractZip) {
          const zipFiles = await processZipFile(file, opts, progressCallback);
          files.push(...zipFiles);
        } else {
          const result = await processFile(file, `/${file.name}`, opts);
          if (result) {
            files.push(result);
          }
        }

        processedCount++;
        bytesProcessed += file.size;
      }
    }

    // Build folder structure
    const folders = new Set<string>();
    for (const file of files) {
      const parts = file.path.split('/').filter(Boolean);
      let current = '';
      for (let i = 0; i < parts.length - 1; i++) {
        current += '/' + parts[i];
        folders.add(current);
      }
    }

    // Find root path
    let rootPath = '/';
    if (files.length > 0) {
      const firstPath = files[0].path;
      const parts = firstPath.split('/').filter(Boolean);
      if (parts.length > 0) {
        rootPath = '/' + parts[0];
      }
    }

    progressCallback({
      phase: 'complete',
      current: files.length,
      total: files.length,
      bytesProcessed: files.reduce((sum, f) => sum + f.size, 0),
      totalBytes: files.reduce((sum, f) => sum + f.size, 0),
      filesProcessed: files.length,
      totalFiles: files.length,
      errors,
    });

    return {
      success: true,
      files,
      stats: {
        totalFiles: files.length,
        totalFolders: folders.size,
        totalBytes: files.reduce((sum, f) => sum + f.size, 0),
        processingTime: Date.now() - startTime,
        skippedFiles: (input.length || 0) - files.length,
      },
      errors,
      rootPath,
    };
  } catch (error) {
    progressCallback({
      phase: 'error',
      current: 0,
      total: 0,
      bytesProcessed: 0,
      totalBytes: 0,
      filesProcessed: 0,
      totalFiles: 0,
      errors: [{
        file: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        recoverable: false,
      }],
    });

    return {
      success: false,
      files: [],
      stats: {
        totalFiles: 0,
        totalFolders: 0,
        totalBytes: 0,
        processingTime: Date.now() - startTime,
        skippedFiles: 0,
      },
      errors: [{
        file: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        recoverable: false,
      }],
      rootPath: '/',
    };
  }
};

export default ingestFiles;
