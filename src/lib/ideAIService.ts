// ============ IDE AI SERVICE — Phase 4: Code Analysis & Generation ============

const CODE_ASSISTANT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/code-assistant`;

export type AIAction = 
  | 'explain' | 'optimize' | 'refactor' | 'debug' | 'generate' | 'complete' | 'test'
  | 'expand' | 'summarize' | 'improve' | 'simplify' | 'translate' | 'outline' | 'proofread';

export interface AIResult {
  content: string;
  confidence: number;
  tokens?: number;
  model?: string;
}

// ─── SSE Streaming Parser ───

async function streamFromCodeAssistant(
  body: Record<string, unknown>,
  onDelta: (delta: string) => void,
  onDone: () => void,
  signal?: AbortSignal,
): Promise<string> {
  const resp = await fetch(CODE_ASSISTANT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ ...body, stream: true }),
    signal,
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }

  if (!resp.body) throw new Error("No response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  let done = false;

  while (!done) {
    const { done: readerDone, value } = await reader.read();
    if (readerDone) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { done = true; break; }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) {
          full += content;
          onDelta(content);
        }
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  // Final flush
  if (buffer.trim()) {
    for (let raw of buffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) { full += content; onDelta(content); }
      } catch { /* ignore */ }
    }
  }

  onDone();
  return full;
}

// ============ CODE IDE AI SERVICE ============

export async function aiCodeAction(
  action: AIAction,
  code: string,
  language: string,
  context?: string,
  onStream?: (delta: string) => void,
  signal?: AbortSignal,
): Promise<AIResult> {
  // Map writing-oriented actions to code tasks
  const taskMap: Record<string, string> = {
    explain: 'explain', optimize: 'optimize', refactor: 'refactor',
    debug: 'debug', generate: 'generate', complete: 'complete',
    test: 'test', improve: 'optimize', simplify: 'refactor',
    expand: 'generate', summarize: 'explain', outline: 'analyze',
    proofread: 'analyze', translate: 'generate',
  };

  const task = taskMap[action] || 'analyze';

  if (onStream) {
    const content = await streamFromCodeAssistant(
      { code, language, task, context },
      onStream,
      () => {},
      signal,
    );
    return { content, confidence: 0.85 };
  } else {
    const resp = await fetch(CODE_ASSISTANT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ code, language, task, context, stream: false }),
      signal,
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    return { content: data.result || '', confidence: 0.8 };
  }
}

export async function aiProjectAnalysis(
  files: Array<{ path: string; content: string }>,
  analysisType: 'overview' | 'security' | 'performance' | 'architecture' | 'dependencies',
  onStream?: (delta: string) => void,
  signal?: AbortSignal,
): Promise<AIResult> {
  const filesSummary = files.slice(0, 15).map(f =>
    `### ${f.path}\n\`\`\`\n${f.content.slice(0, 500)}${f.content.length > 500 ? '...' : ''}\n\`\`\``
  ).join('\n\n');

  const content = await streamFromCodeAssistant(
    { code: filesSummary, language: 'multi', task: analysisType, context: `Project analysis: ${analysisType}` },
    onStream || (() => {}),
    () => {},
    signal,
  );
  return { content, confidence: 0.85 };
}

export async function aiGenerateComponent(
  componentName: string,
  description: string,
  framework: 'react' | 'vue' | 'angular' = 'react',
  onStream?: (delta: string) => void,
  signal?: AbortSignal,
): Promise<AIResult> {
  const context = `Generate a production-ready ${framework} component called "${componentName}". Requirements: TypeScript, proper types/interfaces, JSDoc comments, error handling, accessibility (ARIA labels). Description: ${description}`;

  const content = await streamFromCodeAssistant(
    { code: '', language: 'typescript', task: 'generate', context },
    onStream || (() => {}),
    () => {},
    signal,
  );
  return { content, confidence: 0.9 };
}

export async function aiTerminalCommand(
  command: string,
  context: { files: string[]; currentPath: string },
  onStream?: (delta: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const ctx = `Terminal command simulation. Current directory: ${context.currentPath}. Available files: ${context.files.slice(0, 20).join(', ')}${context.files.length > 20 ? '...' : ''}`;
  
  const content = await streamFromCodeAssistant(
    { code: command, language: 'bash', task: 'generate', context: ctx },
    onStream || (() => {}),
    () => {},
    signal,
  );
  return content;
}

// ============ DOCUMENT IDE AI SERVICE ============

export async function aiWritingAction(
  action: AIAction,
  text: string,
  context?: string,
  onStream?: (delta: string) => void,
  signal?: AbortSignal,
): Promise<AIResult> {
  const content = await streamFromCodeAssistant(
    { code: text, language: 'markdown', task: action === 'generate' ? 'generate' : 'analyze', context: context || `Writing action: ${action}` },
    onStream || (() => {}),
    () => {},
    signal,
  );
  return { content, confidence: 0.85 };
}

export async function aiGenerateDocument(
  documentType: string,
  topic: string,
  additionalContext?: string,
  onStream?: (delta: string) => void,
  signal?: AbortSignal,
): Promise<AIResult> {
  const context = `Generate a comprehensive ${documentType} about "${topic}". Use proper Markdown formatting, include relevant sections. ${additionalContext || ''}`;

  const content = await streamFromCodeAssistant(
    { code: '', language: 'markdown', task: 'generate', context },
    onStream || (() => {}),
    () => {},
    signal,
  );
  return { content, confidence: 0.9 };
}

export async function aiDocumentAnalysis(
  content: string,
  analysisType: 'structure' | 'readability' | 'seo' | 'fact-check' | 'tone',
  onStream?: (delta: string) => void,
  signal?: AbortSignal,
): Promise<AIResult> {
  const result = await streamFromCodeAssistant(
    { code: content, language: 'markdown', task: 'analyze', context: `Document analysis: ${analysisType}` },
    onStream || (() => {}),
    () => {},
    signal,
  );
  return { content: result, confidence: 0.85 };
}

export async function aiChatAssistant(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  context: { documentContent?: string; selectedText?: string },
  onStream?: (delta: string) => void,
  signal?: AbortSignal,
): Promise<AIResult> {
  const systemContext = context.documentContent
    ? `Working on document:\n${context.documentContent.slice(0, 2000)}${context.documentContent.length > 2000 ? '...' : ''}\n${context.selectedText ? `Selected: "${context.selectedText}"` : ''}`
    : '';

  const enhancedMessages = systemContext
    ? [{ role: 'user' as const, content: systemContext }, ...messages]
    : messages;

  const content = await streamFromCodeAssistant(
    { messages: enhancedMessages, language: 'markdown', task: 'generate' },
    onStream || (() => {}),
    () => {},
    signal,
  );
  return { content, confidence: 0.85 };
}

// ============ SHARED UTILITIES ============

export function extractCodeFromResponse(response: string): string {
  const codeBlockMatch = response.match(/```(?:\w+)?\n([\s\S]*?)```/);
  return codeBlockMatch ? codeBlockMatch[1].trim() : response;
}

export function parseAIResponse(response: string): {
  code?: string;
  explanation?: string;
  suggestions?: string[];
} {
  const codeMatch = response.match(/```(?:\w+)?\n([\s\S]*?)```/);
  const code = codeMatch ? codeMatch[1].trim() : undefined;
  const explanation = response.replace(/```[\s\S]*?```/g, '').trim();
  const suggestionMatches = response.matchAll(/[-•]\s*(.+)/g);
  const suggestions = Array.from(suggestionMatches).map(m => m[1].trim());
  return { code, explanation, suggestions: suggestions.length > 0 ? suggestions : undefined };
}
