export const RECENTLY_VIEWED_KEY = "law-analysis.recently-viewed";
export const MAX_RECENTLY_VIEWED = 5;

export interface RecentLaw {
  _id: string;
  title: string;
  code: string;
}

export function loadRecentlyViewed(): RecentLaw[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return raw ? (JSON.parse(raw) as RecentLaw[]) : [];
  } catch {
    return [];
  }
}

export function saveRecentlyViewed(entry: RecentLaw): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadRecentlyViewed();
    const filtered = current.filter((item) => item._id !== entry._id);
    const updated = [entry, ...filtered].slice(0, MAX_RECENTLY_VIEWED);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable — skip silently
  }
}
