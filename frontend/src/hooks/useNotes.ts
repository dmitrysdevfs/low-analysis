"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Note, NoteDraft } from "@/lib/notes/types";
import { notesApi } from "@/lib/api/notes";
import { readLegacyNotes, clearLegacyNotes } from "@/lib/notes/storage";

const MIGRATION_FLAG_KEY = (userId: string) =>
  `law-analysis.notes.migrated.${userId}`;

function isMigrationDone(userId: string) {
  try {
    return localStorage.getItem(MIGRATION_FLAG_KEY(userId)) === "1";
  } catch {
    return true;
  }
}

function markMigrationDone(userId: string) {
  try {
    localStorage.setItem(MIGRATION_FLAG_KEY(userId), "1");
  } catch {
    // ignore
  }
}

export function useNotes(): {
  notes: Note[];
  loading: boolean;
  addNote: (draft: NoteDraft) => Promise<Note>;
  removeNote: (id: string) => Promise<void>;
  updateNote: (
    id: string,
    patch: Partial<Pick<Note, "noteText" | "color">>,
  ) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  hasArticleNote: (lawId: string, articleNum: string) => boolean;
} {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const loadedRef = useRef<string | null>(null);

  const reload = useCallback(async () => {
    if (!userId) {
      setNotes([]);
      return;
    }
    setLoading(true);
    try {
      const data = await notesApi.getAll();
      setNotes(data);
    } catch {
      // API unavailable — keep current state
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // on user change: migrate legacy notes then load from API
  useEffect(() => {
    if (!userId || loadedRef.current === userId) return;
    loadedRef.current = userId;

    (async () => {
      // one-time migration from localStorage
      if (!isMigrationDone(userId)) {
        const legacy = readLegacyNotes(userId);
        if (legacy.length > 0) {
          try {
            await notesApi.migrate(legacy);
            clearLegacyNotes(userId);
          } catch {
            // migration failed — will retry next session
          }
        }
        markMigrationDone(userId);
      }
      await reload();
    })();
  }, [userId, reload]);

  const addNote = useCallback(async (draft: NoteDraft): Promise<Note> => {
    const note = await notesApi.create(draft);
    setNotes((prev) => [note, ...prev]);
    return note;
  }, []);

  const removeNote = useCallback(async (id: string): Promise<void> => {
    await notesApi.delete(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const updateNote = useCallback(
    async (
      id: string,
      patch: Partial<Pick<Note, "noteText" | "color">>,
    ): Promise<void> => {
      const updated = await notesApi.update(id, patch);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    },
    [],
  );

  const togglePin = useCallback(async (id: string): Promise<void> => {
    const updated = await notesApi.togglePin(id);
    setNotes((prev) =>
      prev
        .map((n) => (n.id === id ? updated : n))
        .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)),
    );
  }, []);

  const hasArticleNote = useCallback(
    (lawId: string, articleNum: string): boolean =>
      notes.some(
        (n) =>
          n.type === "article" &&
          n.lawId === lawId &&
          n.articleNum === articleNum,
      ),
    [notes],
  );

  return {
    notes,
    loading,
    addNote,
    removeNote,
    updateNote,
    togglePin,
    hasArticleNote,
  };
}
