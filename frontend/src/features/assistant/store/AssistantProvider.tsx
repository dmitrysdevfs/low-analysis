"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  AssistantMessage,
  AssistantSession,
  AssistantSessionFull,
  AssistantSource,
  AssistantChatContext,
} from "../types";
import {
  streamChatMessage,
  fetchSessions,
  fetchSession,
  deleteSession as apiDeleteSession,
  submitFeedback as apiSubmitFeedback,
} from "../api/assistantApi";
import { notify } from "@/lib/toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { readStoredToken } from "@/lib/auth/authClient";

interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: AssistantSource[];
  feedback: 1 | -1 | null;
  isStreaming?: boolean;
}

interface AssistantContextValue {
  sessions: AssistantSession[];
  activeSessionId: string | null;
  messages: LocalMessage[];
  streamingText: string;
  isStreaming: boolean;
  limitHit: { used: number; limit: number; resetAt?: number } | null;
  sources: AssistantSource[];
  loadSessions: (token: string) => Promise<void>;
  selectSession: (id: string, token: string) => Promise<void>;
  deleteSession: (id: string, token: string) => Promise<void>;
  sendMessage: (
    text: string,
    context: AssistantChatContext,
    token?: string,
  ) => Promise<void>;
  submitFeedback: (
    messageId: string,
    feedback: 1 | -1,
    token?: string,
  ) => Promise<void>;
  clearSession: () => void;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<AssistantSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [limitHit, setLimitHit] = useState<{
    used: number;
    limit: number;
    resetAt?: number;
  } | null>(null);
  const [sources, setSources] = useState<AssistantSource[]>([]);
  const streamingIdRef = useRef<string | null>(null);
 
  const { user } = useAuth();
  const prevUserRef = useRef(user);
 
  const clearSession = useCallback(() => {
    setActiveSessionId(null);
    setMessages([]);
    setSources([]);
    setLimitHit(null);
    setStreamingText("");
  }, []);
 
  useEffect(() => {
    if (prevUserRef.current?.id !== user?.id) {
      clearSession();
      const storedToken = readStoredToken();
      if (user && storedToken) {
        fetchSessions(storedToken)
          .then(setSessions)
          .catch(() => null);
      } else {
        setSessions([]);
      }
    }
    prevUserRef.current = user;
  }, [user, clearSession]);

  const loadSessions = useCallback(async (token: string) => {
    const data = await fetchSessions(token);
    setSessions(data);
  }, []);

  const selectSession = useCallback(async (id: string, token: string) => {
    const full: AssistantSessionFull | null = await fetchSession(id, token);
    if (!full) return;

    setActiveSessionId(id);
    setMessages(
      full.messages.map((m: AssistantMessage) => ({
        id: m._id,
        role: m.role,
        content: m.content,
        sources: m.sources,
        feedback: m.feedback,
      })),
    );
    setSources(
      full.messages
        .flatMap((m) => m.sources)
        .filter((s, i, arr) => arr.findIndex((x) => x.href === s.href) === i),
    );
  }, []);

  const deleteSessionFn = useCallback(
    async (id: string, token: string) => {
      try {
        await apiDeleteSession(id, token);
        setSessions((prev) => prev.filter((s) => s.id !== id));
        if (activeSessionId === id) {
          setActiveSessionId(null);
          setMessages([]);
          setSources([]);
        }
      } catch {
        notify.error("Не вдалося видалити сесію. Спробуйте ще раз.");
      }
    },
    [activeSessionId],
  );

  const sendMessage = useCallback(
    async (text: string, context: AssistantChatContext, token?: string) => {
      if (isStreaming) return;

      setLimitHit(null);

      const userMsg: LocalMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        sources: [],
        feedback: null,
      };

      const assistantMsgId = crypto.randomUUID();
      streamingIdRef.current = assistantMsgId;

      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: assistantMsgId,
          role: "assistant",
          content: "",
          sources: [],
          feedback: null,
          isStreaming: true,
        },
      ]);
      setStreamingText("");
      setIsStreaming(true);

      let accumulated = "";

      try {
        const gen = streamChatMessage(text, context, activeSessionId, token);

        for await (const event of gen) {
          if (event.type === "token" && event.content) {
            accumulated += event.content;
            setStreamingText(accumulated);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, content: accumulated } : m,
              ),
            );
          } else if (event.type === "done") {
            const finalSources = event.sources ?? [];
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: accumulated,
                      sources: finalSources,
                      isStreaming: false,
                    }
                  : m,
              ),
            );
            setSources((prev) => {
              const all = [...prev, ...finalSources];
              return all.filter(
                (s, i, arr) => arr.findIndex((x) => x.href === s.href) === i,
              );
            });
          } else if (event.type === "session") {
            if (event.sessionId) {
              setActiveSessionId(event.sessionId);
              if (token) {
                // Refresh sessions list in background
                fetchSessions(token)
                  .then(setSessions)
                  .catch(() => null);
              }
            }
          } else if (event.type === "limit") {
            setLimitHit({
              used: event.used ?? 0,
              limit: event.limit ?? 0,
              resetAt: event.resetAt,
            });
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: event.message ?? "Ліміт запитів вичерпано.",
                      isStreaming: false,
                    }
                  : m,
              ),
            );
          } else if (event.type === "error") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: event.message ?? "Сталася помилка.",
                      isStreaming: false,
                    }
                  : m,
              ),
            );
          }
        }
      } finally {
        setIsStreaming(false);
        setStreamingText("");
        streamingIdRef.current = null;
      }
    },
    [isStreaming, activeSessionId],
  );

  const submitFeedbackFn = useCallback(
    async (messageId: string, feedback: 1 | -1, token?: string) => {
      if (!activeSessionId) return;
      try {
        await apiSubmitFeedback(activeSessionId, messageId, feedback, token);
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, feedback } : m)),
        );
      } catch {
        notify.warning("Оцінку не вдалося зберегти. Спробуйте ще раз.");
      }
    },
    [activeSessionId],
  );


  return (
    <AssistantContext.Provider
      value={{
        sessions,
        activeSessionId,
        messages,
        streamingText,
        isStreaming,
        limitHit,
        sources,
        loadSessions,
        selectSession,
        deleteSession: deleteSessionFn,
        sendMessage,
        submitFeedback: submitFeedbackFn,
        clearSession,
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx)
    throw new Error("useAssistant must be used inside AssistantProvider");
  return ctx;
}
