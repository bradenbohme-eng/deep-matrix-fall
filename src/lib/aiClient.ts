const SUPABASE_URL = "https://trevewovdgsxhatsytlw.supabase.co";

type Msg = { role: "user" | "assistant" | "system"; content: string };

export async function streamNeoChat({
  messages,
  mode = "chat",
  userId,
  conversationId,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  mode?: "chat" | "intel" | "hack" | "news";
  userId?: string;
  conversationId?: string;
  onDelta: (deltaText: string) => void;
  onDone: () => void;
  onError?: (error: Error) => void;
}) {
  try {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/neo-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ messages, mode, userId, conversationId }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(errorData.error || `HTTP ${resp.status}`);
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {}
      }
    }

    onDone();
  } catch (e) {
    console.error("streamNeoChat error:", e);
    if (onError) onError(e as Error);
    else throw e;
  }
}

export async function analyzeThreat(target: string, scanType: string = "full", context: string = "") {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/threat-analysis`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ target, scanType, context }),
  });

  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({ error: "Analysis failed" }));
    throw new Error(errorData.error || `HTTP ${resp.status}`);
  }

  return await resp.json();
}

export async function fetchIntelligence(query: string, category: string = "cybersecurity", limit: number = 5) {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/intel-aggregator`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ query, category, limit }),
  });

  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({ error: "Intel fetch failed" }));
    throw new Error(errorData.error || `HTTP ${resp.status}`);
  }

  return await resp.json();
}

export async function analyzeCode(
  code: string,
  language: string,
  task: "analyze" | "explain" | "optimize" | "exploit" | "generate",
  context: string = ""
) {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/code-assistant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ code, language, task, context }),
  });

  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({ error: "Code analysis failed" }));
    throw new Error(errorData.error || `HTTP ${resp.status}`);
  }

  return await resp.json();
}
