import type { Note } from "./types";

const storageKey = (userId: string) => `law-analysis.notes.${userId}`;

export function getNotes(userId: string): Note[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as Note[];
  } catch {
    return [];
  }
}

export function saveNote(userId: string, note: Note): void {
  try {
    const notes = getNotes(userId);
    const index = notes.findIndex((n) => n.id === note.id);
    if (index !== -1) {
      notes[index] = note;
    } else {
      notes.push(note);
    }
    localStorage.setItem(storageKey(userId), JSON.stringify(notes));
  } catch {
    // fail silently
  }
}

export function deleteNote(userId: string, noteId: string): void {
  try {
    const notes = getNotes(userId).filter((n) => n.id !== noteId);
    localStorage.setItem(storageKey(userId), JSON.stringify(notes));
  } catch {
    // fail silently
  }
}

export function updateNote(
  userId: string,
  noteId: string,
  patch: Partial<Pick<Note, "noteText" | "color">>,
): void {
  try {
    const notes = getNotes(userId);
    const index = notes.findIndex((n) => n.id === noteId);
    if (index === -1) return;
    notes[index] = {
      ...notes[index],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(storageKey(userId), JSON.stringify(notes));
  } catch {
    // fail silently
  }
}
