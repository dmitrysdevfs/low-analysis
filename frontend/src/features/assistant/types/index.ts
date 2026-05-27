export interface AssistantSource {
  title: string;
  href: string | null;
  type: "faq" | "article" | "law" | "help";
}

export interface AssistantMessage {
  _id: string;
  role: "user" | "assistant";
  content: string;
  feedback: 1 | -1 | null;
  sources: AssistantSource[];
  createdAt: string;
}

export interface AssistantSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface AssistantSessionFull {
  _id: string;
  title: string;
  messages: AssistantMessage[];
  mode: "general" | "law" | "article";
  contextLawId: string | null;
  contextArticleNum: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssistantConfig {
  enabled: boolean;
  mode: "stub" | "llm";
}

export interface AssistantChatContext {
  mode?: "general" | "law" | "article";
  contextLawId?: string;
  contextArticleNum?: string;
  planId?: string;
}

export interface StreamEvent {
  type: "token" | "done" | "error" | "limit" | "session";
  content?: string;
  sources?: AssistantSource[];
  message?: string;
  sessionId?: string;
  title?: string;
  used?: number;
  limit?: number;
  resetAt?: number;
}

export interface QuotaStatus {
  allowed: boolean;
  used: number | null;
  limit: number | null;
  resetAt?: number;
}
