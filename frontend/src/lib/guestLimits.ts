"use client";

export const GUEST_LIMITS_STORAGE_KEY = "low-analysis.guest.limits";

export type GuestLimitType = "search" | "view";

type GuestLimitState = {
  searchTimestamps: number[];
  viewTimestamps: number[];
  searchCooldownUntil: number;
  viewCooldownUntil: number;
};

export type GuestLimitSnapshot = {
  search: {
    limit: number;
    used: number;
    remaining: number;
    windowMs: number;
    cooldownMs: number;
    cooldownUntil: number;
    cooldownRemainingMs: number;
    isCoolingDown: boolean;
  };
  view: {
    limit: number;
    used: number;
    remaining: number;
    windowMs: number;
    cooldownMs: number;
    cooldownUntil: number;
    cooldownRemainingMs: number;
    isCoolingDown: boolean;
  };
};

export type GuestLimitAttemptResult = {
  allowed: boolean;
  reason?: "limit" | "cooldown";
  message?: string;
  snapshot: GuestLimitSnapshot;
};

const GUEST_LIMIT_RULES = {
  search: {
    limit: 6,
    windowMs: 10 * 60 * 1000,
    cooldownMs: 2 * 60 * 1000,
  },
  view: {
    limit: 12,
    windowMs: 15 * 60 * 1000,
    cooldownMs: 3 * 60 * 1000,
  },
} as const;

function isBrowser() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function getDefaultState(): GuestLimitState {
  return {
    searchTimestamps: [],
    viewTimestamps: [],
    searchCooldownUntil: 0,
    viewCooldownUntil: 0,
  };
}

function readState() {
  if (!isBrowser()) {
    return getDefaultState();
  }

  const raw = window.localStorage.getItem(GUEST_LIMITS_STORAGE_KEY);

  if (!raw) {
    return getDefaultState();
  }

  try {
    return {
      ...getDefaultState(),
      ...(JSON.parse(raw) as Partial<GuestLimitState>),
    };
  } catch {
    return getDefaultState();
  }
}

function writeState(state: GuestLimitState) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(GUEST_LIMITS_STORAGE_KEY, JSON.stringify(state));
}

function pruneState(state: GuestLimitState, now = Date.now()) {
  return {
    searchTimestamps: state.searchTimestamps.filter(
      (timestamp) => now - timestamp <= GUEST_LIMIT_RULES.search.windowMs,
    ),
    viewTimestamps: state.viewTimestamps.filter(
      (timestamp) => now - timestamp <= GUEST_LIMIT_RULES.view.windowMs,
    ),
    searchCooldownUntil:
      state.searchCooldownUntil > now ? state.searchCooldownUntil : 0,
    viewCooldownUntil:
      state.viewCooldownUntil > now ? state.viewCooldownUntil : 0,
  } satisfies GuestLimitState;
}

function getSessionViewKey(resourceKey: string) {
  return `low-analysis.guest.view.${resourceKey}`;
}

function hasViewedResourceInTab(resourceKey: string) {
  if (
    typeof window === "undefined" ||
    typeof window.sessionStorage === "undefined"
  ) {
    return false;
  }

  return window.sessionStorage.getItem(getSessionViewKey(resourceKey)) === "1";
}

function markResourceViewedInTab(resourceKey: string) {
  if (
    typeof window === "undefined" ||
    typeof window.sessionStorage === "undefined"
  ) {
    return;
  }

  window.sessionStorage.setItem(getSessionViewKey(resourceKey), "1");
}

export function getGuestLimitSnapshot(now = Date.now()): GuestLimitSnapshot {
  const state = pruneState(readState(), now);
  const searchRule = GUEST_LIMIT_RULES.search;
  const viewRule = GUEST_LIMIT_RULES.view;

  return {
    search: {
      limit: searchRule.limit,
      used: state.searchTimestamps.length,
      remaining: Math.max(0, searchRule.limit - state.searchTimestamps.length),
      windowMs: searchRule.windowMs,
      cooldownMs: searchRule.cooldownMs,
      cooldownUntil: state.searchCooldownUntil,
      cooldownRemainingMs: Math.max(0, state.searchCooldownUntil - now),
      isCoolingDown: state.searchCooldownUntil > now,
    },
    view: {
      limit: viewRule.limit,
      used: state.viewTimestamps.length,
      remaining: Math.max(0, viewRule.limit - state.viewTimestamps.length),
      windowMs: viewRule.windowMs,
      cooldownMs: viewRule.cooldownMs,
      cooldownUntil: state.viewCooldownUntil,
      cooldownRemainingMs: Math.max(0, state.viewCooldownUntil - now),
      isCoolingDown: state.viewCooldownUntil > now,
    },
  };
}

export function formatRemainingCooldown(ms: number) {
  const totalMinutes = Math.max(1, Math.ceil(ms / 60000));
  if (totalMinutes === 1) {
    return "1 minute";
  }

  return `${totalMinutes} minutes`;
}

export function attemptGuestAction(
  type: GuestLimitType,
  options?: { resourceKey?: string },
): GuestLimitAttemptResult {
  const now = Date.now();
  const rule = GUEST_LIMIT_RULES[type];
  let state = pruneState(readState(), now);

  if (
    type === "view" &&
    options?.resourceKey &&
    hasViewedResourceInTab(options.resourceKey)
  ) {
    return {
      allowed: true,
      snapshot: getGuestLimitSnapshot(now),
    };
  }

  const cooldownKey =
    type === "search" ? "searchCooldownUntil" : "viewCooldownUntil";
  const timestampsKey =
    type === "search" ? "searchTimestamps" : "viewTimestamps";

  if (state[cooldownKey] > now) {
    const snapshot = getGuestLimitSnapshot(now);
    return {
      allowed: false,
      reason: "cooldown",
      message:
        type === "search"
          ? `Guest search cooldown is active. Please wait ${formatRemainingCooldown(
              snapshot.search.cooldownRemainingMs,
            )} or register for continuous access.`
          : `Guest preview cooldown is active. Please wait ${formatRemainingCooldown(
              snapshot.view.cooldownRemainingMs,
            )} or register for continuous access.`,
      snapshot,
    };
  }

  if (state[timestampsKey].length >= rule.limit) {
    state = {
      ...state,
      [cooldownKey]: now + rule.cooldownMs,
    };
    writeState(state);
    const snapshot = getGuestLimitSnapshot(now);
    return {
      allowed: false,
      reason: "limit",
      message:
        type === "search"
          ? "Guest search limit reached. Please register to keep searching without interruptions."
          : "Guest deep-view limit reached. Please register to continue opening detailed records.",
      snapshot,
    };
  }

  state = {
    ...state,
    [timestampsKey]: [...state[timestampsKey], now],
  };
  writeState(state);

  if (type === "view" && options?.resourceKey) {
    markResourceViewedInTab(options.resourceKey);
  }

  return {
    allowed: true,
    snapshot: getGuestLimitSnapshot(now),
  };
}
