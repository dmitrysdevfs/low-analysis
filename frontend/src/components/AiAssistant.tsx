"use client";

import { useState, useRef, SyntheticEvent, useEffect } from "react";
import { usePathname } from "next/navigation";
import styles from "./AiAssistant.module.scss";

// Структура повідомлення
interface Message {
  id: number;
  text: string;
  isUser: boolean;
}

export default function AiAssistant() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Вітаю! Я ваш AI Аналітик. Чим можу допомогти?",
      isUser: false,
    },
  ]);
  const [inputValue, setInputValue] = useState<string>("");
  const [fontSize, setFontSize] = useState<number>(14);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isLawsPage = pathname?.startsWith("/laws");

  /* Прокрутка до останнього повідомлення */
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (!isLawsPage) return null;

  const handleSendMessage = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: inputValue.trim(), isUser: true },
    ]);
    setInputValue("");
  };

  const changeFontSize = (amount: number) => {
    setFontSize((prev) => Math.max(12, Math.min(prev + amount, 22)));
  };

  return (
    <div
      className={`${styles.wrapper} ${isOpen ? styles.wrapperOpen : ""} hide-mobile`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={styles.tabTrigger}
        aria-label={isOpen ? "Закрити AI Аналітик" : "Відкрити AI Аналітик"}
      >
        AI
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${styles.arrowIcon} ${isOpen ? styles.arrowRotate : ""}`}
        >
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      <div className={`${styles.dialog} panel`}>
        <div className={styles.dialogHeader}>
          <h4 className="display text-lg font-semibold tracking-wide m-0">
            AI Аналітик
          </h4>

          <div className={styles.fontControls}>
            <button
              type="button"
              onClick={() => changeFontSize(-1)}
              title="Зменшити шрифт"
              disabled={fontSize <= 12}
              className={styles.fontBtn}
            >
              А-
            </button>
            <button
              type="button"
              onClick={() => changeFontSize(1)}
              title="Збільшити шрифт"
              disabled={fontSize >= 22}
              className={styles.fontBtn}
            >
              А+
            </button>
          </div>
        </div>

        <div className={styles.messagesContainer}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.messageRow} ${msg.isUser ? styles.userRow : styles.aiRow}`}
            >
              <div
                className={`${styles.messageBubble} ${msg.isUser ? styles.userBubble : styles.aiBubble}`}
                style={{ fontSize: `${fontSize}px` }}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className={styles.inputArea}>
          <input
            type="text"
            className="form-control"
            placeholder="Запитайте щось про закон..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-primary px-4 py-2 text-xs capitalize"
          >
            Надіслати
          </button>
        </form>
      </div>
    </div>
  );
}
