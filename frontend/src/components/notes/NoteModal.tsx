"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNotes } from "@/hooks/useNotes";
import type { Note, NoteDraft } from "@/lib/notes/types";
import styles from "./NoteModal.module.scss";

interface NoteModalProps {
  open: boolean;
  draft: NoteDraft | null;
  onClose: () => void;
  onSaved?: (note: Note) => void;
}

const COLOR_OPTIONS: { value: "gold" | "blue" | "green"; hex: string }[] = [
  { value: "gold", hex: "#C8A843" },
  { value: "blue", hex: "#4A80D4" },
  { value: "green", hex: "#2D8A4E" },
];

export function NoteModal({ open, draft, onClose, onSaved }: NoteModalProps) {
  const { addNote } = useNotes();
  const [selectedColor, setSelectedColor] = useState<"gold" | "blue" | "green">("gold");
  const [noteText, setNoteText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset state when modal opens with a new draft
  useEffect(() => {
    if (open && draft) {
      setSelectedColor("gold");
      setNoteText("");
    }
  }, [open, draft]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Auto-grow textarea
  function handleTextareaChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setNoteText(event.target.value);
    const el = event.target;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  function handleOverlayClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  async function handleSave() {
    if (!draft) return;

    const note = await addNote({ ...draft, color: selectedColor, noteText });
    onSaved?.(note);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && draft && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={handleOverlayClick}
        >
          <motion.div
            className={styles.card}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Header */}
            <div className={styles.header}>
              <span className={styles.title}>Нова нотатка</span>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Закрити"
              >
                ×
              </button>
            </div>

            {/* Info row: article type */}
            {draft.type === "article" && (
              <div className={styles.infoRow}>
                {draft.lawTitle && <span>{draft.lawTitle}</span>}
                {draft.articleNum && (
                  <span> · Стаття {draft.articleNum}</span>
                )}
              </div>
            )}

            {/* Blockquote: selection type */}
            {draft.type === "selection" && draft.selectedText && (
              <blockquote className={styles.blockquote}>
                {draft.selectedText}
              </blockquote>
            )}

            {/* Color picker */}
            <div className={styles.colorPicker}>
              {COLOR_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.colorBtn} ${
                    selectedColor === option.value ? styles.colorBtnActive : ""
                  }`}
                  style={{ backgroundColor: option.hex }}
                  aria-label={`Колір ${option.value}`}
                  onClick={() => setSelectedColor(option.value)}
                />
              ))}
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              placeholder="Ваша нотатка…"
              rows={4}
              value={noteText}
              onChange={handleTextareaChange}
            />

            {/* Footer */}
            <div className={styles.footer}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onClose}
              >
                Скасувати
              </button>
              <button
                type="button"
                className={styles.saveBtn}
                onClick={handleSave}
              >
                Зберегти
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
