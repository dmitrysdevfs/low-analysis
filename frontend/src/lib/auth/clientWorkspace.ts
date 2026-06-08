"use client";

// Types are still exported so consumers don't need to change import paths
export type WorkspacePreferenceKey =
  | "emailAlerts"
  | "searchHighlights"
  | "compactMode"
  | "weeklyDigest";

export type ClientWorkspacePreferences = {
  emailAlerts: boolean;
  searchHighlights: boolean;
  compactMode: boolean;
  weeklyDigest: boolean;
};

export type SavedArticleItem = {
  id: string;
  lawId: string;
  title: string;
  code: string;
  note: string;
  savedAt: string;
  tags?: string[];
};

export type ClientFocusTopic = {
  id: string;
  label: string;
  createdAt: string;
};

export type ClientActivityType =
  | "workspace"
  | "profile"
  | "security"
  | "preference"
  | "saved"
  | "focus"
  | "export"
  | "view"
  | "search";

export type ClientActivityItem = {
  id: string;
  type: ClientActivityType;
  title: string;
  detail: string;
  createdAt: string;
};

// ── UI cache — stays in localStorage (not user data, pure navigation state) ──

const UI_CACHE_KEY = "low-analysis.client.ui-cache";

type UiCache = {
  lastViewedLawId?: string;
  lastViewedLawTitle?: string;
  lastViewedArticleNum?: string;
  lastViewedArticleTitle?: string;
  lastSearchQuery?: string;
};

// Per-user cache keyed by userId
type UiCacheStore = Record<string, UiCache>;

function isBrowser() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function readUiCacheStore(): UiCacheStore {
  if (!isBrowser()) return {};
  try {
    const raw = localStorage.getItem(UI_CACHE_KEY);
    return raw ? (JSON.parse(raw) as UiCacheStore) : {};
  } catch {
    return {};
  }
}

function writeUiCacheStore(store: UiCacheStore) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(UI_CACHE_KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

export function readUiCache(userId: string): UiCache {
  return readUiCacheStore()[userId] ?? {};
}

function patchUiCache(userId: string, patch: Partial<UiCache>) {
  const store = readUiCacheStore();
  writeUiCacheStore({ ...store, [userId]: { ...store[userId], ...patch } });
}

export function recordWorkspaceView(
  userId: string,
  data: {
    lawId?: string;
    lawTitle?: string;
    articleNum?: string;
    articleTitle?: string;
  },
): void {
  patchUiCache(userId, {
    lastViewedLawId: data.lawId,
    lastViewedLawTitle: data.lawTitle,
    lastViewedArticleNum: data.articleNum,
    lastViewedArticleTitle: data.articleTitle,
  });
}

export function recordWorkspaceSearch(userId: string, query: string): void {
  const trimmed = query.trim();
  if (!trimmed) return;
  patchUiCache(userId, { lastSearchQuery: trimmed });
}

// ── Legacy migration helpers ──────────────────────────────────────────────────
// Reads old workspace format (before MongoDB migration) for one-time data migration.

const LEGACY_WORKSPACE_KEY = "low-analysis.client.workspace";
const LEGACY_MIGRATION_KEY = (userId: string) =>
  `low-analysis.client.workspace.migrated.${userId}`;

export type LegacyWorkspace = {
  preferences?: Partial<ClientWorkspacePreferences>;
  savedArticles?: SavedArticleItem[];
  focusTopics?: ClientFocusTopic[];
  activity?: ClientActivityItem[];
  lastViewedLawId?: string;
  lastViewedLawTitle?: string;
  lastViewedArticleNum?: string;
  lastViewedArticleTitle?: string;
  lastSearchQuery?: string;
};

export function readLegacyWorkspace(userId: string): LegacyWorkspace | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(LEGACY_WORKSPACE_KEY);
    if (!raw) return null;
    const store = JSON.parse(raw) as Record<string, LegacyWorkspace>;
    return store[userId] ?? null;
  } catch {
    return null;
  }
}

export function clearLegacyWorkspace(userId: string) {
  if (!isBrowser()) return;
  try {
    const raw = localStorage.getItem(LEGACY_WORKSPACE_KEY);
    if (!raw) return;
    const store = JSON.parse(raw) as Record<string, unknown>;
    delete store[userId];
    if (Object.keys(store).length === 0) {
      localStorage.removeItem(LEGACY_WORKSPACE_KEY);
    } else {
      localStorage.setItem(LEGACY_WORKSPACE_KEY, JSON.stringify(store));
    }
  } catch {
    // ignore
  }
}

export function isWorkspaceMigrationDone(userId: string): boolean {
  if (!isBrowser()) return true;
  return localStorage.getItem(LEGACY_MIGRATION_KEY(userId)) === "1";
}

export function markWorkspaceMigrationDone(userId: string) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(LEGACY_MIGRATION_KEY(userId), "1");
  } catch {
    // ignore
  }
}

// ── Export snapshot (reads from API now, just returns a stub) ─────────────────
// Components that need export should call API directly; this is kept for compat.
export function exportClientWorkspaceSnapshot(_userId: string): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      note: "Data is now stored in the database. Use the API to export your workspace.",
    },
    null,
    2,
  );
}
