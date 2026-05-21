"use client";

import styles from "./AiAssistant.module.scss";
import { useState, useRef, SyntheticEvent, useEffect } from "react";
import { usePathname } from "next/navigation";
import { IconArrow } from "./IconArrow";

// Структура повідомлення
interface Message {
  id: number;
  text: string;
  isUser: boolean;
}

export function AiAssistant() {
  const pathname = usePathname();
  const isLawsPage = pathname?.startsWith("/laws");

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
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  /* Автоматичне закриття чату на мобільних */
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)");

    const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setIsOpen(false);
    };

    handleMediaChange(mediaQuery);

    mediaQuery.addEventListener("change", handleMediaChange);

    return () => mediaQuery.removeEventListener("change", handleMediaChange);
  }, []);

  /* Прокрутка до останнього повідомлення */
  useEffect(() => {
    if (isLawsPage && messagesContainerRef.current) {
      const container = messagesContainerRef.current;

      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isOpen, isLawsPage]);

  useEffect(() => {}, []);

  if (!isLawsPage) return null;

  const handleSendMessage = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      setInputValue("");
      return;
    }

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
        <IconArrow
          size={14}
          className={`${styles.arrowIcon} ${isOpen ? styles.arrowRotate : ""}`}
        />
      </button>

      <div className={`${styles.dialog} panel`}>
        <div className={styles.dialogHeader}>
          <h4 className={`${styles.dialogTitleText} display`}>AI Аналітик</h4>

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

        <div ref={messagesContainerRef} className={styles.messagesContainer}>
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
        </div>

        <form onSubmit={handleSendMessage} className={styles.inputArea}>
          <input
            type="text"
            className="form-control"
            placeholder="Запитайте щось про закон..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit" className={`btn btn-primary ${styles.sendBtn}`}>
            Надіслати
          </button>
        </form>
      </div>
    </div>
  );
}
