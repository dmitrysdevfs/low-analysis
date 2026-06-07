export type AdminInboxStatus = {
  configured: boolean;
  connected: boolean;
  mailboxEmail: string | null;
  connectedAt: string | null;
  connectedBy: string | null;
  lastSyncAt: string | null;
  lastError: string | null;
  scopes: string[];
  totalThreads: number;
  unreadThreads: number;
};

export type AdminInboxThreadSummary = {
  id: string;
  gmailThreadId: string;
  subject: string;
  snippet: string;
  participants: string[];
  unreadCount: number;
  messageCount: number;
  labels: string[];
  lastMessageAt: string | null;
  syncedAt: string | null;
};

export type AdminInboxMessage = {
  id: string;
  gmailMessageId: string;
  gmailThreadId: string;
  from: string;
  to: string[];
  cc: string[];
  subject: string;
  snippet: string;
  plainTextBody: string;
  htmlBody: string;
  labels: string[];
  internalDate: string | null;
  isInbound: boolean;
  syncedAt: string | null;
};

export type AdminInboxThreadDetail = {
  thread: AdminInboxThreadSummary;
  messages: AdminInboxMessage[];
};
