"use client";

export type SupportConversationStatus =
  | "open"
  | "waiting_support"
  | "waiting_user"
  | "closed";

export interface SupportConfig {
  enabled: boolean;
  telegramConfigured: boolean;
}

export type SupportPriority = "normal" | "high" | "urgent";

export interface SupportConversation {
  id: string;
  participantType: "user" | "guest";
  participantLabel: string;
  guestName: string;
  guestEmail: string;
  userId: string | null;
  status: SupportConversationStatus;
  priority: SupportPriority;
  spamFlag: boolean;
  escalatedAt: string | null;
  subject: string;
  startedFromPathname: string;
  startedFromPageTitle: string;
  contextLawId: string | null;
  contextArticleNum: string | null;
  lastMessageAt: string | null;
  lastMessageSnippet: string;
  lastSenderType: string;
  unreadForAdmin: number;
  unreadForUser: number;
  assignedAdminId: string | null;
  assignedAt: string | null;
  telegramChatId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportNote {
  id: string;
  conversationId: string;
  authorName: string;
  authorEmail: string;
  text: string;
  createdAt: string;
}

export interface SupportSyncResult {
  ok: boolean;
  webhookStatus: "ok" | "degraded" | "down";
  botUsername?: string;
  latencyMs?: number;
  error?: string;
  lastCheckedAt: string;
}

export interface SupportMessage {
  id: string;
  senderType: "user" | "admin" | "telegram_support" | "system";
  senderName: string;
  senderEmail: string;
  text: string;
  channel: "web" | "telegram" | "system";
  deliveredToTelegram: boolean;
  telegramMessageId: number | null;
  createdAt: string;
}

export interface SupportConversationPayload {
  conversation: SupportConversation | null;
  messages: SupportMessage[];
}

export interface SupportSendPayload {
  text: string;
  guestName?: string;
  guestEmail?: string;
  pathname?: string;
  pageTitle?: string;
  lawId?: string;
  articleNum?: string;
}

export interface AdminSupportStatus {
  enabled: boolean;
  telegramConfigured: boolean;
  mailboxMode: "telegram-bridge" | "web-only";
  totalConversations: number;
  openConversations: number;
  unreadConversations: number;
  todayConversations: number;
  yesterdayConversations: number;
  lastSyncAt: string | null;
  webhookStatus: "ok" | "degraded" | "down";
}
