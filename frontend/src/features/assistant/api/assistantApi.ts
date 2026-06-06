import type {
  AssistantConfig,
  AssistantSession,
  AssistantSessionFull,
  AssistantChatContext,
  StreamEvent,
  QuotaStatus,
} from "../types";

const BASE = "/api/assistant";

function authHeaders(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchAssistantConfig(): Promise<AssistantConfig> {
  const res = await fetch(`${BASE}/config`);
  if (!res.ok) throw new Error("Failed to fetch assistant config");
  return res.json();
}

export async function fetchSuggestions(): Promise<string[]> {
  const res = await fetch(`${BASE}/suggestions`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.suggestions ?? [];
}

export async function fetchQuotaStatus(
  token?: string,
  planId?: string,
): Promise<QuotaStatus> {
  const params = planId ? `?planId=${planId}` : "";
  const res = await fetch(`${BASE}/quota${params}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) return { allowed: true, used: null, limit: null };
  return res.json();
}

export async function fetchSessions(
  token: string,
): Promise<AssistantSession[]> {
  const res = await fetch(`${BASE}/sessions`, {
    headers: authHeaders(token),
  });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchSession(
  id: string,
  token: string,
): Promise<AssistantSessionFull | null> {
  const res = await fetch(`${BASE}/sessions/${id}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function deleteSession(id: string, token: string): Promise<void> {
  const res = await fetch(`${BASE}/sessions/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Не вдалося видалити сесію`);
  }
}

export async function submitFeedback(
  sessionId: string,
  messageId: string,
  feedback: 1 | -1,
  token?: string,
): Promise<void> {
  const res = await fetch(`${BASE}/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({ sessionId, messageId, feedback }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Не вдалося зберегти оцінку`);
  }
}

/**
 * Stream a chat message via SSE. Yields StreamEvent objects.
 */
export async function* streamChatMessage(
  message: string,
  context: AssistantChatContext,
  sessionId: string | null,
  token?: string,
): AsyncGenerator<StreamEvent> {
  const res = await fetch(`${BASE}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({
      message,
      sessionId,
      ...context,
    }),
  });

  if (!res.ok || !res.body) {
    yield { type: "error", message: "Не вдалося з'єднатися з сервером" };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const event: StreamEvent = JSON.parse(line.slice(6));
        yield event;
      } catch {
        // skip malformed lines
      }
    }
  }
}
