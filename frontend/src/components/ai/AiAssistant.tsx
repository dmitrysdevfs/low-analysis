"use client";

import styles from "./AiAssistant.module.scss";
import { useState, useRef, SyntheticEvent, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

// Структура повідомлення
interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 22;
const TRIGGER_SIZE = 50;
const DIALOG_SPACING = 16;

// Якщо це не сторінка "/laws..." то повністю зупиняємо виконання хуків та рендер
export function AiAssistant() {
  const pathname = usePathname();
  const isLawsPage = pathname?.startsWith("/laws");

  if (!isLawsPage) return null;

  return <AiAssistantInner />;
}

function AiAssistantInner() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-message",
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
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isOpen]);

  const handleSendMessage = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      setInputValue("");
      return;
    }

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: inputValue.trim(), isUser: true },
    ]);
    setInputValue("");
  };

  const changeFontSize = (amount: number) => {
    setFontSize((prev) =>
      Math.max(MIN_FONT_SIZE, Math.min(prev + amount, MAX_FONT_SIZE)),
    );
  };

  const springTransition = {
    type: "spring",
    stiffness: 220,
    damping: 26,
    mass: 1,
  } as const;

  return (
    <div className={`${styles.container} hide-mobile`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`${styles.dialog} panel`}
            initial={{
              opacity: 0,
              width: TRIGGER_SIZE,
              height: TRIGGER_SIZE,
              borderRadius: "50%",
              bottom: 0,
              right: 0,
            }}
            animate={{
              opacity: 1,
              width: 380,
              height: 550,
              borderRadius: "24px",
              bottom: TRIGGER_SIZE + DIALOG_SPACING,
              right: -20,
            }}
            exit={{
              opacity: 0,
              width: TRIGGER_SIZE,
              height: TRIGGER_SIZE,
              borderRadius: "50%",
              bottom: 0,
              right: 0,
            }}
            transition={springTransition}
          >
            <motion.div
              className={styles.dialogInner}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.dialogHeader}>
                <h4 className={`${styles.dialogTitleText} display`}>
                  AI Аналітик
                </h4>

                <div className={styles.fontControls}>
                  <button
                    type="button"
                    onClick={() => changeFontSize(-1)}
                    title="Зменшити шрифт"
                    disabled={fontSize <= MIN_FONT_SIZE}
                    className={styles.fontBtn}
                  >
                    А-
                  </button>
                  <button
                    type="button"
                    onClick={() => changeFontSize(1)}
                    title="Збільшити шрифт"
                    disabled={fontSize >= MAX_FONT_SIZE}
                    className={styles.fontBtn}
                  >
                    А+
                  </button>
                </div>
              </div>

              <div
                ref={messagesContainerRef}
                className={styles.messagesContainer}
              >
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
                <button
                  type="submit"
                  className={`btn btn-primary ${styles.sendBtn}`}
                >
                  Надіслати
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${styles.circleTrigger}`}
        aria-label={isOpen ? "Закрити AI Аналітик" : "Відкрити AI Аналітик"}
      >
        <span
          className={`${styles.iconBase} ${styles.iconAi} ${isOpen ? styles.iconAiHidden : ""}`}
        >
          AI
        </span>
        <span
          className={`${styles.iconBase} ${styles.iconCross} ${isOpen ? styles.iconCrossVisible : ""}`}
        >
          &times;
        </span>
      </button>
    </div>
  );
}
