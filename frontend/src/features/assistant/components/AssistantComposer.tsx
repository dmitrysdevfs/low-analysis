"use client";

import { useRef, useState } from "react";
import { Send } from "lucide-react";
import styles from "./AssistantComposer.module.scss";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  suggestions?: string[];
}

export function AssistantComposer({
  onSend,
  disabled,
  placeholder = "Запитайте про закон або статтю...",
  suggestions = [],
}: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }

  function autoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    setValue(el.value);
  }

  return (
    <div className={styles.wrap}>
      {suggestions.length > 0 && (
        <div className={styles.suggestions}>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className={styles.suggestion}
              onClick={() => onSend(s)}
              disabled={disabled}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className={styles.form}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={value}
          onChange={autoResize}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
          maxLength={2000}
        />
        <button
          type="submit"
          className={styles.sendBtn}
          disabled={!value.trim() || disabled}
          aria-label="Надіслати"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
