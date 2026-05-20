"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Note, NoteDraft } from "@/lib/notes/types";
import {
  getNotes,
  saveNote,
  deleteNote,
  updateNote as storageUpdateNote,
} from "@/lib/notes/storage";

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return String(Date.now());
}

export function useNotes(): {
  notes: Note[];
  addNote: (draft: NoteDraft) => Note;
  removeNote: (id: string) => void;
  updateNote: (
    id: string,
    patch: Partial<Pick<Note, "noteText" | "color">>,
  ) => void;
  hasArticleNote: (lawId: string, articleNum: string) => boolean;
} {
  const { user } = useAuth();
  const userId = user?.id ?? "guest";

  const [notes, setNotes] = useState<Note[]>(() => getNotes(userId));

  useEffect(() => {
    setNotes(getNotes(userId));
  }, [userId]);

  function addNote(draft: NoteDraft): Note {
    const now = new Date().toISOString();
    const note: Note = {
      ...draft,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    saveNote(userId, note);
    setNotes(getNotes(userId));
    return note;
  }

  function removeNote(id: string): void {
    deleteNote(userId, id);
    setNotes(getNotes(userId));
  }

  function updateNote(
    id: string,
    patch: Partial<Pick<Note, "noteText" | "color">>,
  ): void {
    storageUpdateNote(userId, id, patch);
    setNotes(getNotes(userId));
  }

  function hasArticleNote(lawId: string, articleNum: string): boolean {
    return notes.some(
      (n) =>
        n.type === "article" &&
        n.lawId === lawId &&
        n.articleNum === articleNum,
    );
  }

  return { notes, addNote, removeNote, updateNote, hasArticleNote };
}
