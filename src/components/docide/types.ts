// Document IDE Type Definitions

export interface DocumentNode {
  id: string;
  title: string;
  type: 'document' | 'folder' | 'chapter' | 'section';
  path: string;
  content?: string;
  children?: DocumentNode[];
  metadata?: DocumentMetadata;
  modified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DocumentMetadata {
  author?: string;
  wordCount?: number;
  characterCount?: number;
  readingTime?: number;
  tags?: string[];
  status?: 'draft' | 'review' | 'published';
  language?: string;
  template?: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  content: string;
  message: string;
  author: string;
  createdAt: Date;
  diff?: DocumentDiff;
}

export interface DocumentDiff {
  additions: number;
  deletions: number;
  changes: DiffChange[];
}

export interface DiffChange {
  type: 'add' | 'delete' | 'modify';
  lineStart: number;
  lineEnd: number;
  content: string;
  oldContent?: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  structure: TemplateSection[];
  icon?: string;
}

export interface TemplateSection {
  title: string;
  placeholder: string;
  required: boolean;
  hint?: string;
}

export interface AIWritingContext {
  documentId: string;
  selectedText?: string;
  cursorPosition?: { line: number; column: number };
  surroundingContext?: string;
  masterIndex?: any;
  summaries?: any;
}

export interface AIWritingAction {
  type: 'expand' | 'rewrite' | 'summarize' | 'translate' | 'improve' | 'continue' | 'outline' | 'research';
  prompt?: string;
  style?: string;
  tone?: string;
  length?: 'short' | 'medium' | 'long';
}

export interface AIWritingResult {
  suggestion: string;
  alternatives?: string[];
  rationale?: string;
  confidence: number;
  tokens?: number;
}

export interface DocumentComment {
  id: string;
  documentId: string;
  authorId: string;
  authorName: string;
  content: string;
  range?: { start: number; end: number };
  resolved: boolean;
  createdAt: Date;
  replies?: DocumentComment[];
}

export interface DocumentBookmark {
  id: string;
  documentId: string;
  title: string;
  position: number;
  color?: string;
  createdAt: Date;
}

export interface DocumentOutline {
  level: number;
  title: string;
  position: number;
  children?: DocumentOutline[];
}

export interface ExportOptions {
  format: 'md' | 'html' | 'pdf' | 'docx' | 'txt' | 'json';
  includeMetadata: boolean;
  includeComments: boolean;
  includeVersionHistory: boolean;
  styling?: ExportStyling;
}

export interface ExportStyling {
  theme: 'light' | 'dark' | 'sepia';
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  pageSize: 'a4' | 'letter' | 'legal';
}

export interface DocumentTab {
  id: string;
  documentId: string;
  title: string;
  content: string;
  modified: boolean;
  cursorPosition?: { line: number; column: number };
  scrollPosition?: number;
}

export interface DocumentIDEState {
  documents: DocumentNode[];
  openTabs: DocumentTab[];
  activeTabId: string | null;
  versions: DocumentVersion[];
  templates: DocumentTemplate[];
  comments: DocumentComment[];
  bookmarks: DocumentBookmark[];
  clipboard: {
    type: 'cut' | 'copy';
    nodes: DocumentNode[];
  } | null;
  searchResults: SearchResult[];
  aiContext: AIWritingContext | null;
  outline: DocumentOutline[];
}

export interface SearchResult {
  documentId: string;
  documentTitle: string;
  line: number;
  match: string;
  context: string;
}

export const DEFAULT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Document',
    description: 'Start with a clean slate',
    category: 'Basic',
    content: '',
    structure: [],
    icon: 'file'
  },
  {
    id: 'readme',
    name: 'README',
    description: 'Project documentation template',
    category: 'Development',
    content: `# Project Title

## Overview
Brief description of the project.

## Installation
\`\`\`bash
npm install
\`\`\`

## Usage
Describe how to use the project.

## API Reference
Document the API endpoints.

## Contributing
Guidelines for contributors.

## License
MIT License`,
    structure: [
      { title: 'Overview', placeholder: 'Brief description...', required: true },
      { title: 'Installation', placeholder: 'Setup instructions...', required: true },
      { title: 'Usage', placeholder: 'How to use...', required: true },
    ],
    icon: 'book'
  },
  {
    id: 'technical-spec',
    name: 'Technical Specification',
    description: 'Detailed technical documentation',
    category: 'Development',
    content: `# Technical Specification

## 1. Introduction
### 1.1 Purpose
### 1.2 Scope
### 1.3 Definitions

## 2. System Architecture
### 2.1 Overview
### 2.2 Components
### 2.3 Data Flow

## 3. Functional Requirements
### 3.1 Core Features
### 3.2 User Stories

## 4. Non-Functional Requirements
### 4.1 Performance
### 4.2 Security
### 4.3 Scalability

## 5. Implementation Plan
### 5.1 Phases
### 5.2 Timeline
### 5.3 Resources`,
    structure: [
      { title: 'Introduction', placeholder: 'Purpose and scope...', required: true },
      { title: 'Architecture', placeholder: 'System design...', required: true },
      { title: 'Requirements', placeholder: 'Feature requirements...', required: true },
    ],
    icon: 'settings'
  },
  {
    id: 'blog-post',
    name: 'Blog Post',
    description: 'Content marketing template',
    category: 'Content',
    content: `# Title

*Published: [Date] | Author: [Name] | Tags: [tag1, tag2]*

## Introduction
Hook the reader with an engaging opening.

## Main Content

### Key Point 1
Elaborate on the first major idea.

### Key Point 2
Discuss the second major idea.

### Key Point 3
Present the third major idea.

## Conclusion
Summarize and call to action.

---
*Did you find this helpful? Share your thoughts in the comments!*`,
    structure: [
      { title: 'Introduction', placeholder: 'Hook the reader...', required: true },
      { title: 'Main Content', placeholder: 'Key points...', required: true },
      { title: 'Conclusion', placeholder: 'Wrap up...', required: true },
    ],
    icon: 'pen-tool'
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Structured meeting documentation',
    category: 'Business',
    content: `# Meeting Notes

**Date:** [Date]
**Time:** [Time]
**Attendees:** [Names]
**Facilitator:** [Name]

## Agenda
1. Item 1
2. Item 2
3. Item 3

## Discussion Notes

### Topic 1
- Key points discussed
- Decisions made

### Topic 2
- Key points discussed
- Decisions made

## Action Items
| Task | Owner | Due Date | Status |
|------|-------|----------|--------|
| Task 1 | @name | Date | Pending |
| Task 2 | @name | Date | Pending |

## Next Meeting
**Date:** [Date]
**Agenda:** [Topics]`,
    structure: [
      { title: 'Agenda', placeholder: 'Meeting topics...', required: true },
      { title: 'Discussion', placeholder: 'Notes...', required: true },
      { title: 'Action Items', placeholder: 'Tasks...', required: true },
    ],
    icon: 'users'
  },
  {
    id: 'research-paper',
    name: 'Research Paper',
    description: 'Academic research format',
    category: 'Academic',
    content: `# Title

**Authors:** [Names]
**Institution:** [Name]
**Date:** [Date]

## Abstract
Brief summary of the research (150-300 words).

## 1. Introduction
Background and research questions.

## 2. Literature Review
Previous work and theoretical framework.

## 3. Methodology
Research design and methods.

## 4. Results
Findings and data analysis.

## 5. Discussion
Interpretation and implications.

## 6. Conclusion
Summary and future directions.

## References
1. Author (Year). Title. Journal.
2. Author (Year). Title. Journal.`,
    structure: [
      { title: 'Abstract', placeholder: 'Summary...', required: true },
      { title: 'Introduction', placeholder: 'Background...', required: true },
      { title: 'Methodology', placeholder: 'Methods...', required: true },
      { title: 'Results', placeholder: 'Findings...', required: true },
    ],
    icon: 'graduation-cap'
  }
];

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
};

export const countCharacters = (text: string): number => {
  return text.length;
};

export const estimateReadingTime = (text: string): number => {
  const wordsPerMinute = 200;
  return Math.ceil(countWords(text) / wordsPerMinute);
};

export const extractOutline = (content: string): DocumentOutline[] => {
  const lines = content.split('\n');
  const outline: DocumentOutline[] = [];
  let position = 0;
  
  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2];
      outline.push({ level, title, position });
    }
    position += line.length + 1;
  }
  
  return outline;
};
