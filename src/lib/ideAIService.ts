import { streamNeoChat, analyzeCode } from './aiClient';

const SUPABASE_URL = "https://trevewovdgsxhatsytlw.supabase.co";

export type AIAction = 
  | 'explain' | 'optimize' | 'refactor' | 'debug' | 'generate' | 'complete' | 'test'
  | 'expand' | 'summarize' | 'improve' | 'simplify' | 'translate' | 'outline' | 'proofread';

export interface AIResult {
  content: string;
  confidence: number;
  tokens?: number;
  model?: string;
}

// ============ CODE IDE AI SERVICE ============

export async function aiCodeAction(
  action: AIAction,
  code: string,
  language: string,
  context?: string,
  onStream?: (delta: string) => void
): Promise<AIResult> {
  const prompts: Record<AIAction, string> = {
    explain: `Explain this ${language} code in detail, covering its purpose, logic flow, and key concepts:\n\n\`\`\`${language}\n${code}\n\`\`\``,
    optimize: `Optimize this ${language} code for better performance while maintaining functionality:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide the optimized code and explain the improvements.`,
    refactor: `Refactor this ${language} code to improve readability, maintainability, and follow best practices:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide the refactored code and explain the changes.`,
    debug: `Analyze this ${language} code for potential bugs, issues, and edge cases:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nIdentify problems and provide fixes.`,
    generate: `Generate ${language} code for: ${context || 'the described functionality'}\n\nContext: ${code}`,
    complete: `Complete this ${language} code, adding the missing implementation:\n\n\`\`\`${language}\n${code}\n\`\`\``,
    test: `Generate comprehensive unit tests for this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nInclude edge cases and common scenarios.`,
    expand: `Expand this ${language} code with additional features and error handling:\n\n\`\`\`${language}\n${code}\n\`\`\``,
    summarize: `Provide a concise summary of what this ${language} code does:\n\n\`\`\`${language}\n${code}\n\`\`\``,
    improve: `Improve this ${language} code with better error handling, validation, and edge case coverage:\n\n\`\`\`${language}\n${code}\n\`\`\``,
    simplify: `Simplify this ${language} code while maintaining functionality:\n\n\`\`\`${language}\n${code}\n\`\`\``,
    translate: `Translate this code to ${context || 'TypeScript'}:\n\n\`\`\`${language}\n${code}\n\`\`\``,
    outline: `Create an outline of the structure and components in this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``,
    proofread: `Review this ${language} code for style issues, naming conventions, and potential improvements:\n\n\`\`\`${language}\n${code}\n\`\`\``,
  };

  const prompt = prompts[action] || prompts.explain;

  if (onStream) {
    let fullContent = '';
    await streamNeoChat({
      messages: [{ role: 'user', content: prompt }],
      mode: 'building',
      onDelta: (delta) => {
        fullContent += delta;
        onStream(delta);
      },
      onDone: () => {},
      onError: (err) => { throw err; },
    });
    return { content: fullContent, confidence: 0.85 };
  } else {
    const result = await analyzeCode(code, language, action === 'generate' ? 'generate' : 'analyze', context);
    return { content: result.analysis || result.code || '', confidence: result.confidence || 0.8 };
  }
}

export async function aiTerminalCommand(
  command: string,
  context: { files: string[]; currentPath: string },
  onStream?: (delta: string) => void
): Promise<string> {
  const prompt = `You are an AI terminal assistant. Execute or simulate this command and provide realistic output.

Current directory: ${context.currentPath}
Available files: ${context.files.slice(0, 20).join(', ')}${context.files.length > 20 ? '...' : ''}

Command: ${command}

Provide terminal-style output. If it's an AI command (starting with 'ai'), provide intelligent assistance.`;

  let result = '';
  await streamNeoChat({
    messages: [{ role: 'user', content: prompt }],
    mode: 'building',
    onDelta: (delta) => {
      result += delta;
      onStream?.(delta);
    },
    onDone: () => {},
    onError: (err) => { throw err; },
  });
  return result;
}

export async function aiProjectAnalysis(
  files: Array<{ path: string; content: string }>,
  analysisType: 'overview' | 'security' | 'performance' | 'architecture' | 'dependencies',
  onStream?: (delta: string) => void
): Promise<AIResult> {
  const filesSummary = files.slice(0, 15).map(f => 
    `### ${f.path}\n\`\`\`\n${f.content.slice(0, 500)}${f.content.length > 500 ? '...' : ''}\n\`\`\``
  ).join('\n\n');

  const prompts: Record<string, string> = {
    overview: `Analyze this project and provide a comprehensive overview including purpose, structure, technologies, and key components:\n\n${filesSummary}`,
    security: `Perform a security audit on this project. Identify vulnerabilities, potential attack vectors, and provide remediation recommendations:\n\n${filesSummary}`,
    performance: `Analyze this project for performance issues. Identify bottlenecks, optimization opportunities, and provide specific recommendations:\n\n${filesSummary}`,
    architecture: `Analyze the architecture of this project. Evaluate patterns, suggest improvements, and identify potential issues:\n\n${filesSummary}`,
    dependencies: `Analyze the dependencies and imports in this project. Identify unused, outdated, or problematic dependencies:\n\n${filesSummary}`,
  };

  let result = '';
  await streamNeoChat({
    messages: [{ role: 'user', content: prompts[analysisType] || prompts.overview }],
    mode: 'building',
    onDelta: (delta) => {
      result += delta;
      onStream?.(delta);
    },
    onDone: () => {},
    onError: (err) => { throw err; },
  });

  return { content: result, confidence: 0.85 };
}

export async function aiGenerateComponent(
  componentName: string,
  description: string,
  framework: 'react' | 'vue' | 'angular' = 'react',
  onStream?: (delta: string) => void
): Promise<AIResult> {
  const prompt = `Generate a production-ready ${framework} component called "${componentName}".

Description: ${description}

Requirements:
- Use TypeScript
- Include proper types and interfaces
- Add JSDoc comments
- Follow best practices for ${framework}
- Include error handling
- Make it accessible (ARIA labels, keyboard navigation)

Provide the complete component code.`;

  let result = '';
  await streamNeoChat({
    messages: [{ role: 'user', content: prompt }],
    mode: 'building',
    onDelta: (delta) => {
      result += delta;
      onStream?.(delta);
    },
    onDone: () => {},
    onError: (err) => { throw err; },
  });

  return { content: result, confidence: 0.9 };
}

// ============ DOCUMENT IDE AI SERVICE ============

export async function aiWritingAction(
  action: AIAction,
  text: string,
  context?: string,
  onStream?: (delta: string) => void
): Promise<AIResult> {
  const prompts: Record<AIAction, string> = {
    expand: `Expand this text with more detail, examples, and depth while maintaining the original voice:\n\n${text}`,
    summarize: `Summarize this text concisely, capturing the key points:\n\n${text}`,
    improve: `Improve this text for clarity, flow, and impact:\n\n${text}`,
    simplify: `Simplify this text for easier understanding while preserving the meaning:\n\n${text}`,
    translate: `Translate this text to ${context || 'Spanish'}:\n\n${text}`,
    outline: `Create a detailed outline from this content:\n\n${text}`,
    proofread: `Proofread this text and fix grammar, spelling, punctuation, and style issues:\n\n${text}`,
    explain: `Explain the key concepts in this text:\n\n${text}`,
    optimize: `Optimize this text for SEO and readability:\n\n${text}`,
    refactor: `Restructure this text for better organization and flow:\n\n${text}`,
    debug: `Identify issues, inconsistencies, or factual errors in this text:\n\n${text}`,
    generate: `Generate content about: ${context || text}`,
    complete: `Continue writing from where this text ends:\n\n${text}`,
    test: `Generate discussion questions or quiz items for this text:\n\n${text}`,
  };

  const prompt = prompts[action] || prompts.improve;

  let result = '';
  await streamNeoChat({
    messages: [{ role: 'user', content: prompt }],
    mode: 'developing',
    onDelta: (delta) => {
      result += delta;
      onStream?.(delta);
    },
    onDone: () => {},
    onError: (err) => { throw err; },
  });

  return { content: result, confidence: 0.85 };
}

export async function aiGenerateDocument(
  documentType: string,
  topic: string,
  additionalContext?: string,
  onStream?: (delta: string) => void
): Promise<AIResult> {
  const prompt = `Generate a comprehensive ${documentType} about "${topic}".

${additionalContext ? `Additional context: ${additionalContext}` : ''}

Requirements:
- Use proper Markdown formatting
- Include relevant sections and headings
- Add examples where appropriate
- Be thorough but concise
- Make it professional and well-organized`;

  let result = '';
  await streamNeoChat({
    messages: [{ role: 'user', content: prompt }],
    mode: 'developing',
    onDelta: (delta) => {
      result += delta;
      onStream?.(delta);
    },
    onDone: () => {},
    onError: (err) => { throw err; },
  });

  return { content: result, confidence: 0.9 };
}

export async function aiDocumentAnalysis(
  content: string,
  analysisType: 'structure' | 'readability' | 'seo' | 'fact-check' | 'tone',
  onStream?: (delta: string) => void
): Promise<AIResult> {
  const prompts: Record<string, string> = {
    structure: `Analyze the structure of this document. Evaluate organization, heading hierarchy, flow, and provide suggestions:\n\n${content}`,
    readability: `Analyze the readability of this document. Evaluate grade level, sentence complexity, and provide improvement suggestions:\n\n${content}`,
    seo: `Analyze this document for SEO. Evaluate keyword usage, meta descriptions, headings, and provide optimization suggestions:\n\n${content}`,
    'fact-check': `Review this document for potential factual claims that should be verified. Flag uncertain or unverified statements:\n\n${content}`,
    tone: `Analyze the tone and voice of this document. Evaluate consistency, professionalism, and audience appropriateness:\n\n${content}`,
  };

  let result = '';
  await streamNeoChat({
    messages: [{ role: 'user', content: prompts[analysisType] || prompts.structure }],
    mode: 'developing',
    onDelta: (delta) => {
      result += delta;
      onStream?.(delta);
    },
    onDone: () => {},
    onError: (err) => { throw err; },
  });

  return { content: result, confidence: 0.85 };
}

export async function aiChatAssistant(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  context: { documentContent?: string; selectedText?: string },
  onStream?: (delta: string) => void
): Promise<AIResult> {
  const systemContext = context.documentContent 
    ? `You are an AI writing assistant. The user is working on a document:\n\n${context.documentContent.slice(0, 2000)}${context.documentContent.length > 2000 ? '...' : ''}\n\n${context.selectedText ? `Selected text: "${context.selectedText}"` : ''}`
    : '';

  const enhancedMessages = systemContext
    ? [{ role: 'user' as const, content: systemContext }, ...messages]
    : messages;

  let result = '';
  await streamNeoChat({
    messages: enhancedMessages,
    mode: 'developing',
    onDelta: (delta) => {
      result += delta;
      onStream?.(delta);
    },
    onDone: () => {},
    onError: (err) => { throw err; },
  });

  return { content: result, confidence: 0.85 };
}

// ============ SHARED UTILITIES ============

export function extractCodeFromResponse(response: string): string {
  const codeBlockMatch = response.match(/```(?:\w+)?\n([\s\S]*?)```/);
  return codeBlockMatch ? codeBlockMatch[1].trim() : response;
}

export function parseAIResponse(response: string): { 
  code?: string; 
  explanation?: string; 
  suggestions?: string[] 
} {
  const codeMatch = response.match(/```(?:\w+)?\n([\s\S]*?)```/);
  const code = codeMatch ? codeMatch[1].trim() : undefined;
  
  const explanation = response.replace(/```[\s\S]*?```/g, '').trim();
  
  const suggestionMatches = response.matchAll(/[-•]\s*(.+)/g);
  const suggestions = Array.from(suggestionMatches).map(m => m[1].trim());

  return { code, explanation, suggestions: suggestions.length > 0 ? suggestions : undefined };
}
