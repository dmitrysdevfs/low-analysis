// ═══════════════════════════════════════════════════════════════════════
//  ADMIN CONFIG — НЕ ВИДАЛЯТИ
//  Архітектурний перемикач між локальним та серверним режимом.
//  LOCAL_MODE = true  → дані з localStorage / існуючих хуків
//  LOCAL_MODE = false → дані з /api/admin/* (потребує бекенд-готовності)
// ═══════════════════════════════════════════════════════════════════════

export const LOCAL_MODE = true;

// Pagination
export const ADMIN_PAGE_SIZE = 50;

// Max concurrent getLawStats requests in local mode (prevent N+1 overload)
export const ADMIN_STATS_CONCURRENCY = 3;

// TanStack Query stale times (ms)
export const STALE_LAWS = 60_000;
export const STALE_USERS = 30_000;
export const STALE_STATS = 120_000;
export const STALE_AUDIT = 15_000;

// Progress bar thresholds (%)
export const THRESHOLD_WARNING = 60;
export const THRESHOLD_CRITICAL = 85;
