"use client";

export const CLIENT_WORKSPACE_STORAGE_KEY = "low-analysis.client.workspace";

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

export type ClientWorkspace = {
  preferences: ClientWorkspacePreferences;
  savedArticles: SavedArticleItem[];
  focusTopics: ClientFocusTopic[];
  activity: ClientActivityItem[];
  lastViewedLawId?: string;
  lastViewedLawTitle?: string;
  lastViewedArticleNum?: string;
  lastViewedArticleTitle?: string;
  lastSearchQuery?: string;
};

type WorkspaceStore = Record<string, ClientWorkspace>;

function isBrowser() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function readStore() {
  if (!isBrowser()) {
    return {} as WorkspaceStore;
  }

  const raw = window.localStorage.getItem(CLIENT_WORKSPACE_STORAGE_KEY);

  if (!raw) {
    return {} as WorkspaceStore;
  }

  try {
    return JSON.parse(raw) as WorkspaceStore;
  } catch {
    return {} as WorkspaceStore;
  }
}

function writeStore(store: WorkspaceStore) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(
    CLIENT_WORKSPACE_STORAGE_KEY,
    JSON.stringify(store),
  );
}

function createDefaultWorkspace(): ClientWorkspace {
  const now = new Date().toISOString();

  return {
    preferences: {
      emailAlerts: true,
      searchHighlights: true,
      compactMode: false,
      weeklyDigest: true,
    },
    savedArticles: [],
    focusTopics: [],
    activity: [
      {
        id: "activity-workspace-ready",
        type: "workspace",
        title: "Workspace initialized",
        detail:
          "Your personal research cabinet is ready for notes, saved laws, and tracked topics.",
        createdAt: now,
      },
    ],
  };
}

function appendActivity(
  workspace: ClientWorkspace,
  payload: Pick<ClientActivityItem, "type" | "title" | "detail">,
) {
  const nextEntry: ClientActivityItem = {
    id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...payload,
  };

  return {
    ...workspace,
    activity: [nextEntry, ...workspace.activity].slice(0, 18),
  };
}

export function readClientWorkspace(userId: string) {
  const store = readStore();
  const fallback = createDefaultWorkspace();
  const storedWorkspace = store[userId];

  if (!storedWorkspace) {
    return fallback;
  }

  return {
    ...fallback,
    ...storedWorkspace,
    preferences: {
      ...fallback.preferences,
      ...storedWorkspace.preferences,
    },
    savedArticles: storedWorkspace.savedArticles ?? fallback.savedArticles,
    focusTopics: storedWorkspace.focusTopics ?? fallback.focusTopics,
    activity: storedWorkspace.activity ?? fallback.activity,
  };
}

export function writeClientWorkspace(
  userId: string,
  workspace: ClientWorkspace,
) {
  const store = readStore();
  writeStore({
    ...store,
    [userId]: workspace,
  });
}

export function updateWorkspacePreferences(
  userId: string,
  patch: Partial<ClientWorkspacePreferences>,
) {
  const current = readClientWorkspace(userId);
  const changedKeys = Object.keys(patch).filter((key) => {
    const preferenceKey = key as WorkspacePreferenceKey;
    return (
      patch[preferenceKey] !== undefined &&
      current.preferences[preferenceKey] !== patch[preferenceKey]
    );
  }) as WorkspacePreferenceKey[];
  const next = {
    ...current,
    preferences: {
      ...current.preferences,
      ...patch,
    },
  };

  const nextWithActivity =
    changedKeys.length > 0
      ? appendActivity(next, {
          type: "preference",
          title: "Workspace preferences updated",
          detail: changedKeys
            .map(
              (key) =>
                `${key}: ${next.preferences[key] ? "enabled" : "disabled"}`,
            )
            .join(" · "),
        })
      : next;

  writeClientWorkspace(userId, nextWithActivity);
  return nextWithActivity;
}

export function addSavedArticle(
  userId: string,
  payload: Omit<SavedArticleItem, "id" | "savedAt">,
) {
  const current = readClientWorkspace(userId);

  if (
    current.savedArticles.some(
      (item) => item.lawId === payload.lawId && item.code === payload.code,
    )
  ) {
    return current;
  }

  const next = {
    ...current,
    savedArticles: [
      {
        id: `saved-${Date.now()}`,
        savedAt: new Date().toISOString(),
        ...payload,
      },
      ...current.savedArticles,
    ],
  };

  const nextWithActivity = appendActivity(next, {
    type: "saved",
    title: "Law saved",
    detail: payload.title,
  });

  writeClientWorkspace(userId, nextWithActivity);
  return nextWithActivity;
}

export function removeSavedArticle(userId: string, articleId: string) {
  const current = readClientWorkspace(userId);
  const next = {
    ...current,
    savedArticles: current.savedArticles.filter(
      (item) => item.id !== articleId,
    ),
  };

  const removedItem = current.savedArticles.find(
    (item) => item.id === articleId,
  );
  const nextWithActivity = removedItem
    ? appendActivity(next, {
        type: "saved",
        title: "Saved law removed",
        detail: removedItem.title,
      })
    : next;

  writeClientWorkspace(userId, nextWithActivity);
  return nextWithActivity;
}

export function addWorkspaceFocusTopic(userId: string, label: string) {
  const current = readClientWorkspace(userId);
  const normalized = label.trim();

  if (normalized.length < 2) {
    return current;
  }

  const exists = current.focusTopics.some(
    (topic) => topic.label.toLowerCase() === normalized.toLowerCase(),
  );

  if (exists) {
    return current;
  }

  const next = {
    ...current,
    focusTopics: [
      {
        id: `focus-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        label: normalized,
        createdAt: new Date().toISOString(),
      },
      ...current.focusTopics,
    ],
  };

  const nextWithActivity = appendActivity(next, {
    type: "focus",
    title: "Research focus added",
    detail: normalized,
  });

  writeClientWorkspace(userId, nextWithActivity);
  return nextWithActivity;
}

export function removeWorkspaceFocusTopic(userId: string, topicId: string) {
  const current = readClientWorkspace(userId);
  const removedTopic = current.focusTopics.find(
    (topic) => topic.id === topicId,
  );
  const next = {
    ...current,
    focusTopics: current.focusTopics.filter((topic) => topic.id !== topicId),
  };

  const nextWithActivity = removedTopic
    ? appendActivity(next, {
        type: "focus",
        title: "Research focus removed",
        detail: removedTopic.label,
      })
    : next;

  writeClientWorkspace(userId, nextWithActivity);
  return nextWithActivity;
}

export function appendWorkspaceActivity(
  userId: string,
  payload: Pick<ClientActivityItem, "type" | "title" | "detail">,
) {
  const current = readClientWorkspace(userId);
  const next = appendActivity(current, payload);
  writeClientWorkspace(userId, next);
  return next;
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
  const current = readClientWorkspace(userId);
  const next: ClientWorkspace = {
    ...current,
    lastViewedLawId: data.lawId ?? current.lastViewedLawId,
    lastViewedLawTitle: data.lawTitle ?? current.lastViewedLawTitle,
    lastViewedArticleNum: data.articleNum ?? current.lastViewedArticleNum,
    lastViewedArticleTitle: data.articleTitle ?? current.lastViewedArticleTitle,
  };

  const detail = [data.lawTitle, data.articleNum, data.articleTitle]
    .filter(Boolean)
    .join(" · ");

  const nextWithActivity = appendActivity(next, {
    type: "view",
    title: "Viewed",
    detail: detail || data.lawId || "",
  });

  writeClientWorkspace(userId, nextWithActivity);
}

export function recordWorkspaceSearch(userId: string, query: string): void {
  const current = readClientWorkspace(userId);
  const trimmed = query.trim();

  if (!trimmed) {
    return;
  }

  const next: ClientWorkspace = {
    ...current,
    lastSearchQuery: trimmed,
  };

  const nextWithActivity = appendActivity(next, {
    type: "search",
    title: "Search",
    detail: trimmed,
  });

  writeClientWorkspace(userId, nextWithActivity);
}

export function exportClientWorkspaceSnapshot(userId: string) {
  const workspace = readClientWorkspace(userId);

  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      summary: {
        savedArticles: workspace.savedArticles.length,
        focusTopics: workspace.focusTopics.length,
      },
      workspace,
    },
    null,
    2,
  );
}
