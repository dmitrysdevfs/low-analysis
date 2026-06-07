// localStorage key used only for one-time migration of pre-existing notes
export const legacyStorageKey = (userId: string) =>
  `law-analysis.notes.${userId}`;

export function readLegacyNotes(userId: string) {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem(legacyStorageKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as import("./types").Note[];
  } catch {
    return [];
  }
}

export function clearLegacyNotes(userId: string) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(legacyStorageKey(userId));
    }
  } catch {
    // ignore
  }
}
