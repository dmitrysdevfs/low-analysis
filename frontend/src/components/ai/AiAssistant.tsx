"use client";

import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { useAssistant } from "@/features/assistant";
import { useAssistantContext } from "@/features/assistant/hooks/useAssistantContext";
import { readStoredToken } from "@/lib/auth/authClient";
import { ROUTES } from "@/constants/routes";
import { AssistantMessageList } from "@/features/assistant/components/AssistantMessageList";
import { AssistantComposer } from "@/features/assistant/components/AssistantComposer";
import { AssistantLimitBanner } from "@/features/assistant/components/AssistantLimitBanner";
import styles from "./AiAssistant.module.scss";

const TRIGGER_SIZE = 50;
const DIALOG_SPACING = 16;

// Widget is only shown on /laws/* pages
export function AiAssistant() {
  const pathname = usePathname();
  const isLawsPage = pathname?.startsWith("/laws");

  if (!isLawsPage) return null;
  return <AiAssistantWidget />;
}

function AiAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const context = useAssistantContext();
  const { messages, isStreaming, limitHit, sendMessage, submitFeedback } =
    useAssistant();

  // Close on mobile
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const handler = (e: MediaQueryList | MediaQueryListEvent) => {
      if (e.matches) setIsOpen(false);
    };
    handler(mq);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  function handleSend(text: string) {
    const token = typeof window !== "undefined" ? readStoredToken() : undefined;
    sendMessage(text, context, token || undefined);
  }

  function handleFeedback(messageId: string, value: 1 | -1) {
    const token = typeof window !== "undefined" ? readStoredToken() : undefined;
    submitFeedback(messageId, value, token || undefined);
  }

  function handleExpand() {
    setIsOpen(false);
    router.push(ROUTES.assistant);
  }

  const springTransition = {
    type: "spring",
    stiffness: 220,
    damping: 26,
    mass: 1,
  } as const;

  // Show last 6 messages in widget
  const visibleMessages = messages.slice(-6);

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
                  Lex — AI Помічник
                </h4>
                <button
                  type="button"
                  className={styles.expandBtn}
                  onClick={handleExpand}
                  title="Відкрити повну версію"
                >
                  <ExternalLink size={14} />
                </button>
              </div>

              {limitHit && (
                <div style={{ padding: "0 12px" }}>
                  <AssistantLimitBanner
                    used={limitHit.used}
                    limit={limitHit.limit}
                    resetAt={limitHit.resetAt}
                  />
                </div>
              )}

              <div className={styles.messagesWrap}>
                {visibleMessages.length === 0 ? (
                  <div className={styles.welcomeMsg}>
                    Вітаю! Я Lex — AI Помічник. Чим можу допомогти з цим
                    законом?
                  </div>
                ) : (
                  <AssistantMessageList
                    messages={visibleMessages}
                    onFeedback={handleFeedback}
                    fontSize={13}
                  />
                )}
              </div>

              <AssistantComposer
                onSend={handleSend}
                disabled={isStreaming || !!limitHit}
                placeholder="Запитайте про цей закон..."
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={styles.circleTrigger}
        aria-label={isOpen ? "Закрити Lex AI" : "Відкрити Lex AI"}
      >
        <span
          className={`${styles.iconBase} ${styles.iconAi} ${isOpen ? styles.iconAiHidden : ""}`}
        >
          Lex
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
