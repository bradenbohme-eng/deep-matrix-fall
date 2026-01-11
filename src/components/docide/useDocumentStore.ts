import { useState, useCallback, useEffect } from 'react';
import {
  DocumentNode,
  DocumentTab,
  DocumentVersion,
  DocumentComment,
  DocumentBookmark,
  DocumentOutline,
  DocumentIDEState,
  SearchResult,
  AIWritingContext,
  DEFAULT_TEMPLATES,
  generateId,
  countWords,
  countCharacters,
  estimateReadingTime,
  extractOutline,
} from './types';

const STORAGE_KEY = 'docide-state';

const createInitialDocuments = (): DocumentNode[] => [
  {
    id: 'root',
    title: 'Documents',
    type: 'folder',
    path: '/',
    children: [
      {
        id: 'getting-started',
        title: 'Getting Started',
        type: 'document',
        path: '/Getting Started.md',
        content: `# Welcome to Document IDE

This is your production-grade document editor powered by AI-MOS.

## Features

- **Rich Markdown Editing**: Full markdown support with live preview
- **AI Writing Assistant**: Get help with writing, expanding, and improving content
- **Version Control**: Track changes and restore previous versions
- **Templates**: Start from professional templates
- **Export Options**: Export to multiple formats

## Getting Started

1. Create a new document or open a template
2. Use the AI assistant to help with writing
3. Save versions as you work
4. Export when ready

Happy writing! 🚀`,
        metadata: {
          author: 'System',
          status: 'published',
          tags: ['documentation', 'tutorial'],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'folder-projects',
        title: 'Projects',
        type: 'folder',
        path: '/Projects',
        children: [
          {
            id: 'project-spec',
            title: 'Project Specification',
            type: 'document',
            path: '/Projects/Project Specification.md',
            content: `# Project Specification

## Overview
Describe your project here.

## Goals
- Goal 1
- Goal 2
- Goal 3

## Timeline
| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1 | 2 weeks | Initial setup |
| Phase 2 | 4 weeks | Core features |
| Phase 3 | 2 weeks | Testing |`,
            metadata: {
              author: 'User',
              status: 'draft',
              tags: ['project', 'planning'],
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
      {
        id: 'folder-notes',
        title: 'Notes',
        type: 'folder',
        path: '/Notes',
        children: [],
      },
    ],
  },
];

export const useDocumentStore = () => {
  const [state, setState] = useState<DocumentIDEState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          templates: DEFAULT_TEMPLATES,
        };
      }
    } catch (e) {
      console.error('Failed to load document state:', e);
    }
    
    return {
      documents: createInitialDocuments(),
      openTabs: [],
      activeTabId: null,
      versions: [],
      templates: DEFAULT_TEMPLATES,
      comments: [],
      bookmarks: [],
      clipboard: null,
      searchResults: [],
      aiContext: null,
      outline: [],
    };
  });

  // Persist state to localStorage
  useEffect(() => {
    try {
      const { templates, ...stateToSave } = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Failed to save document state:', e);
    }
  }, [state]);

  // Document Operations
  const findDocument = useCallback((id: string, nodes: DocumentNode[] = state.documents): DocumentNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findDocument(id, node.children);
        if (found) return found;
      }
    }
    return null;
  }, [state.documents]);

  const findParent = useCallback((id: string, nodes: DocumentNode[] = state.documents, parent: DocumentNode | null = null): DocumentNode | null => {
    for (const node of nodes) {
      if (node.id === id) return parent;
      if (node.children) {
        const found = findParent(id, node.children, node);
        if (found) return found;
      }
    }
    return null;
  }, [state.documents]);

  const createDocument = useCallback((parentId: string, title: string, content: string = '', type: 'document' | 'folder' = 'document') => {
    const newDoc: DocumentNode = {
      id: generateId(),
      title,
      type,
      path: `/${title}${type === 'document' ? '.md' : ''}`,
      content: type === 'document' ? content : undefined,
      children: type === 'folder' ? [] : undefined,
      metadata: {
        author: 'User',
        status: 'draft',
        wordCount: countWords(content),
        characterCount: countCharacters(content),
        readingTime: estimateReadingTime(content),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setState(prev => {
      const updateChildren = (nodes: DocumentNode[]): DocumentNode[] => {
        return nodes.map(node => {
          if (node.id === parentId && node.children) {
            return { ...node, children: [...node.children, newDoc] };
          }
          if (node.children) {
            return { ...node, children: updateChildren(node.children) };
          }
          return node;
        });
      };

      return { ...prev, documents: updateChildren(prev.documents) };
    });

    return newDoc;
  }, []);

  const deleteDocument = useCallback((id: string) => {
    setState(prev => {
      const removeNode = (nodes: DocumentNode[]): DocumentNode[] => {
        return nodes.filter(node => node.id !== id).map(node => ({
          ...node,
          children: node.children ? removeNode(node.children) : undefined,
        }));
      };

      return {
        ...prev,
        documents: removeNode(prev.documents),
        openTabs: prev.openTabs.filter(tab => tab.documentId !== id),
        activeTabId: prev.activeTabId === id ? null : prev.activeTabId,
      };
    });
  }, []);

  const renameDocument = useCallback((id: string, newTitle: string) => {
    setState(prev => {
      const updateNode = (nodes: DocumentNode[]): DocumentNode[] => {
        return nodes.map(node => {
          if (node.id === id) {
            return { ...node, title: newTitle, updatedAt: new Date() };
          }
          if (node.children) {
            return { ...node, children: updateNode(node.children) };
          }
          return node;
        });
      };

      return {
        ...prev,
        documents: updateNode(prev.documents),
        openTabs: prev.openTabs.map(tab => 
          tab.documentId === id ? { ...tab, title: newTitle } : tab
        ),
      };
    });
  }, []);

  const updateDocumentContent = useCallback((id: string, content: string) => {
    setState(prev => {
      const updateNode = (nodes: DocumentNode[]): DocumentNode[] => {
        return nodes.map(node => {
          if (node.id === id) {
            return {
              ...node,
              content,
              modified: true,
              updatedAt: new Date(),
              metadata: {
                ...node.metadata,
                wordCount: countWords(content),
                characterCount: countCharacters(content),
                readingTime: estimateReadingTime(content),
              },
            };
          }
          if (node.children) {
            return { ...node, children: updateNode(node.children) };
          }
          return node;
        });
      };

      return {
        ...prev,
        documents: updateNode(prev.documents),
        openTabs: prev.openTabs.map(tab =>
          tab.documentId === id ? { ...tab, content, modified: true } : tab
        ),
        outline: extractOutline(content),
      };
    });
  }, []);

  const moveDocument = useCallback((sourceId: string, targetId: string) => {
    const source = findDocument(sourceId);
    if (!source) return;

    setState(prev => {
      const removeNode = (nodes: DocumentNode[]): DocumentNode[] => {
        return nodes.filter(n => n.id !== sourceId).map(node => ({
          ...node,
          children: node.children ? removeNode(node.children) : undefined,
        }));
      };

      const addToTarget = (nodes: DocumentNode[]): DocumentNode[] => {
        return nodes.map(node => {
          if (node.id === targetId && node.type === 'folder') {
            return { ...node, children: [...(node.children || []), source] };
          }
          if (node.children) {
            return { ...node, children: addToTarget(node.children) };
          }
          return node;
        });
      };

      const documentsWithoutSource = removeNode(prev.documents);
      return { ...prev, documents: addToTarget(documentsWithoutSource) };
    });
  }, [findDocument]);

  // Tab Operations
  const openTab = useCallback((documentId: string) => {
    const doc = findDocument(documentId);
    if (!doc || doc.type !== 'document') return;

    setState(prev => {
      const existingTab = prev.openTabs.find(t => t.documentId === documentId);
      if (existingTab) {
        return { ...prev, activeTabId: existingTab.id, outline: extractOutline(doc.content || '') };
      }

      const newTab: DocumentTab = {
        id: generateId(),
        documentId,
        title: doc.title,
        content: doc.content || '',
        modified: false,
      };

      return {
        ...prev,
        openTabs: [...prev.openTabs, newTab],
        activeTabId: newTab.id,
        outline: extractOutline(doc.content || ''),
      };
    });
  }, [findDocument]);

  const closeTab = useCallback((tabId: string) => {
    setState(prev => {
      const tabIndex = prev.openTabs.findIndex(t => t.id === tabId);
      const newTabs = prev.openTabs.filter(t => t.id !== tabId);
      
      let newActiveId = prev.activeTabId;
      if (prev.activeTabId === tabId) {
        if (newTabs.length > 0) {
          const newIndex = Math.min(tabIndex, newTabs.length - 1);
          newActiveId = newTabs[newIndex].id;
        } else {
          newActiveId = null;
        }
      }

      return { ...prev, openTabs: newTabs, activeTabId: newActiveId };
    });
  }, []);

  const updateTabContent = useCallback((tabId: string, content: string) => {
    setState(prev => {
      const tab = prev.openTabs.find(t => t.id === tabId);
      if (!tab) return prev;

      // Update both tab and document
      const updateNode = (nodes: DocumentNode[]): DocumentNode[] => {
        return nodes.map(node => {
          if (node.id === tab.documentId) {
            return {
              ...node,
              content,
              modified: true,
              updatedAt: new Date(),
              metadata: {
                ...node.metadata,
                wordCount: countWords(content),
                characterCount: countCharacters(content),
                readingTime: estimateReadingTime(content),
              },
            };
          }
          if (node.children) {
            return { ...node, children: updateNode(node.children) };
          }
          return node;
        });
      };

      return {
        ...prev,
        documents: updateNode(prev.documents),
        openTabs: prev.openTabs.map(t =>
          t.id === tabId ? { ...t, content, modified: true } : t
        ),
        outline: extractOutline(content),
      };
    });
  }, []);

  const saveTab = useCallback((tabId: string, message: string = 'Auto-save') => {
    const tab = state.openTabs.find(t => t.id === tabId);
    if (!tab) return;

    // Create version
    const version: DocumentVersion = {
      id: generateId(),
      documentId: tab.documentId,
      version: state.versions.filter(v => v.documentId === tab.documentId).length + 1,
      content: tab.content,
      message,
      author: 'User',
      createdAt: new Date(),
    };

    setState(prev => ({
      ...prev,
      versions: [...prev.versions, version],
      openTabs: prev.openTabs.map(t =>
        t.id === tabId ? { ...t, modified: false } : t
      ),
    }));
  }, [state.openTabs, state.versions]);

  // Version Operations
  const getVersions = useCallback((documentId: string): DocumentVersion[] => {
    return state.versions.filter(v => v.documentId === documentId).sort((a, b) => b.version - a.version);
  }, [state.versions]);

  const restoreVersion = useCallback((versionId: string) => {
    const version = state.versions.find(v => v.id === versionId);
    if (!version) return;

    updateDocumentContent(version.documentId, version.content);
  }, [state.versions, updateDocumentContent]);

  // Comment Operations
  const addComment = useCallback((documentId: string, content: string, range?: { start: number; end: number }) => {
    const comment: DocumentComment = {
      id: generateId(),
      documentId,
      authorId: 'user',
      authorName: 'User',
      content,
      range,
      resolved: false,
      createdAt: new Date(),
    };

    setState(prev => ({
      ...prev,
      comments: [...prev.comments, comment],
    }));
  }, []);

  const resolveComment = useCallback((commentId: string) => {
    setState(prev => ({
      ...prev,
      comments: prev.comments.map(c =>
        c.id === commentId ? { ...c, resolved: true } : c
      ),
    }));
  }, []);

  // Bookmark Operations
  const addBookmark = useCallback((documentId: string, title: string, position: number, color?: string) => {
    const bookmark: DocumentBookmark = {
      id: generateId(),
      documentId,
      title,
      position,
      color,
      createdAt: new Date(),
    };

    setState(prev => ({
      ...prev,
      bookmarks: [...prev.bookmarks, bookmark],
    }));
  }, []);

  const removeBookmark = useCallback((bookmarkId: string) => {
    setState(prev => ({
      ...prev,
      bookmarks: prev.bookmarks.filter(b => b.id !== bookmarkId),
    }));
  }, []);

  // Search Operations
  const searchDocuments = useCallback((query: string) => {
    if (!query.trim()) {
      setState(prev => ({ ...prev, searchResults: [] }));
      return;
    }

    const results: SearchResult[] = [];
    const searchInNodes = (nodes: DocumentNode[]) => {
      for (const node of nodes) {
        if (node.type === 'document' && node.content) {
          const lines = node.content.split('\n');
          lines.forEach((line, index) => {
            if (line.toLowerCase().includes(query.toLowerCase())) {
              results.push({
                documentId: node.id,
                documentTitle: node.title,
                line: index + 1,
                match: query,
                context: line.trim(),
              });
            }
          });
        }
        if (node.children) {
          searchInNodes(node.children);
        }
      }
    };

    searchInNodes(state.documents);
    setState(prev => ({ ...prev, searchResults: results }));
  }, [state.documents]);

  // Clipboard Operations
  const copyDocument = useCallback((id: string) => {
    const doc = findDocument(id);
    if (doc) {
      setState(prev => ({ ...prev, clipboard: { type: 'copy', nodes: [doc] } }));
    }
  }, [findDocument]);

  const cutDocument = useCallback((id: string) => {
    const doc = findDocument(id);
    if (doc) {
      setState(prev => ({ ...prev, clipboard: { type: 'cut', nodes: [doc] } }));
    }
  }, [findDocument]);

  const pasteDocument = useCallback((targetId: string) => {
    if (!state.clipboard) return;

    const { type, nodes } = state.clipboard;
    for (const node of nodes) {
      if (type === 'cut') {
        moveDocument(node.id, targetId);
      } else {
        // Deep copy
        const copyNode = (n: DocumentNode): DocumentNode => ({
          ...n,
          id: generateId(),
          title: `${n.title} (copy)`,
          children: n.children?.map(copyNode),
        });
        
        const copied = copyNode(node);
        setState(prev => {
          const addToTarget = (nodes: DocumentNode[]): DocumentNode[] => {
            return nodes.map(n => {
              if (n.id === targetId && n.type === 'folder') {
                return { ...n, children: [...(n.children || []), copied] };
              }
              if (n.children) {
                return { ...n, children: addToTarget(n.children) };
              }
              return n;
            });
          };

          return { ...prev, documents: addToTarget(prev.documents) };
        });
      }
    }

    if (type === 'cut') {
      setState(prev => ({ ...prev, clipboard: null }));
    }
  }, [state.clipboard, moveDocument]);

  // AI Context
  const setAIContext = useCallback((context: AIWritingContext | null) => {
    setState(prev => ({ ...prev, aiContext: context }));
  }, []);

  // Get active tab
  const getActiveTab = useCallback((): DocumentTab | null => {
    return state.openTabs.find(t => t.id === state.activeTabId) || null;
  }, [state.openTabs, state.activeTabId]);

  // Get active document
  const getActiveDocument = useCallback((): DocumentNode | null => {
    const tab = getActiveTab();
    return tab ? findDocument(tab.documentId) : null;
  }, [getActiveTab, findDocument]);

  return {
    // State
    ...state,

    // Document Operations
    findDocument,
    findParent,
    createDocument,
    deleteDocument,
    renameDocument,
    updateDocumentContent,
    moveDocument,

    // Tab Operations
    openTab,
    closeTab,
    updateTabContent,
    saveTab,
    getActiveTab,
    getActiveDocument,

    // Version Operations
    getVersions,
    restoreVersion,

    // Comment Operations
    addComment,
    resolveComment,

    // Bookmark Operations
    addBookmark,
    removeBookmark,

    // Search Operations
    searchDocuments,

    // Clipboard Operations
    copyDocument,
    cutDocument,
    pasteDocument,

    // AI Context
    setAIContext,
  };
};
