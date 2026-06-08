"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, SendHorizontal } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { notify } from "@/lib/toast";
import { formatDateShort } from "@/lib/utils";
import { useSupportChat } from "../hooks/useSupportChat";
import styles from "./SupportChatWidget.module.scss";

const TRIGGER_SIZE = 54;
const DIALOG_SPACING = 16;

function buildPageContext(pathname: string | null) {
  const articleMatch = pathname?.match(/^\/laws\/([^/]+)\/articles\/([^/]+)/);
  if (articleMatch) {
    return {
      pathname: pathname || "/",
      lawId: articleMatch[1],
      articleNum: articleMatch[2],
    };
  }

  const lawMatch = pathname?.match(/^\/laws\/([^/]+)/);
  if (lawMatch) {
    return {
      pathname: pathname || "/",
      lawId: lawMatch[1],
      articleNum: undefined,
    };
  }

  return {
    pathname: pathname || "/",
    lawId: undefined,
    articleNum: undefined,
  };
}

function senderLabel(senderType: string, senderName: string) {
  if (senderType === "admin" || senderType === "telegram_support") {
    return senderName || "Підтримка";
  }
  return senderName || "Ви";
}

export function SupportChatWidget() {
  const pathname = usePathname();
  const isHidden =
    pathname?.startsWith("/admin") || pathname?.startsWith("/auth");

  const { isAuthenticated, isHydrated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [dialogWidth, setDialogWidth] = useState(390);
  const [dialogHeight, setDialogHeight] = useState(560);

  const { configQuery, conversationQuery, sendMutation, markReadMutation } =
    useSupportChat({ enabled: !isHidden });

  const data = conversationQuery.data;
  const conversation = data?.conversation ?? null;
  const messages = data?.messages ?? [];
  const unreadForUser = conversation?.unreadForUser ?? 0;

  useEffect(() => {
    if (!isAuthenticated && conversation) {
      if (!guestName && conversation.guestName) {
        setGuestName(conversation.guestName);
      }
      if (!guestEmail && conversation.guestEmail) {
        setGuestEmail(conversation.guestEmail);
      }
    }
  }, [conversation, guestEmail, guestName, isAuthenticated]);

  useEffect(() => {
    if (!isOpen || !conversation?.id || unreadForUser === 0) return;
    markReadMutation.mutate(conversation.id);
  }, [conversation?.id, isOpen, unreadForUser, markReadMutation]);

  useEffect(() => {
    const updateViewport = () => {
      if (typeof window === "undefined") return;
      setDialogWidth(Math.min(390, Math.max(320, window.innerWidth - 28)));
      setDialogHeight(Math.min(560, Math.max(420, window.innerHeight - 110)));
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const supportEnabled = configQuery.data?.enabled !== false;

  const contextLabel = useMemo(() => {
    if (!pathname) return "Сторінка сайту";
    if (pathname === "/") return "Головна сторінка";
    return pathname;
  }, [pathname]);

  if (isHidden || !supportEnabled) {
    return null;
  }

  const handleSend = async () => {
    if (!message.trim()) return;

    if (!isHydrated) {
      notify.info("Зачекай секунду, ще відновлюємо сесію.");
      return;
    }

    if (!isAuthenticated && (!guestName.trim() || !guestEmail.trim())) {
      notify.warning("Для гостьового звернення вкажи ім’я та email.");
      return;
    }

    try {
      const context = buildPageContext(pathname);
      await sendMutation.mutateAsync({
        text: message,
        guestName: isAuthenticated ? undefined : guestName.trim(),
        guestEmail: isAuthenticated ? undefined : guestEmail.trim(),
        pathname: context.pathname,
        lawId: context.lawId,
        articleNum: context.articleNum,
        pageTitle: typeof document !== "undefined" ? document.title || "" : "",
      });
      setMessage("");
      setIsOpen(true);
    } catch (err) {
      notify.error(
        err instanceof Error
          ? err.message
          : "Не вдалося надіслати повідомлення в підтримку.",
      );
    }
  };

  const springTransition = {
    type: "spring",
    stiffness: 220,
    damping: 26,
    mass: 1,
  } as const;

  return (
    <div className={styles.container}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.dialog}
            initial={{
              opacity: 0,
              width: TRIGGER_SIZE,
              height: TRIGGER_SIZE,
              borderRadius: "50%",
              bottom: 0,
              left: 0,
            }}
            animate={{
              opacity: 1,
              width: dialogWidth,
              height: dialogHeight,
              borderRadius: "24px",
              bottom: TRIGGER_SIZE + DIALOG_SPACING,
              left: -12,
            }}
            exit={{
              opacity: 0,
              width: TRIGGER_SIZE,
              height: TRIGGER_SIZE,
              borderRadius: "50%",
              bottom: 0,
              left: 0,
            }}
            transition={springTransition}
          >
            <motion.div
              className={styles.dialogInner}
              style={{ width: dialogWidth, height: dialogHeight }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className={styles.dialogHeader}>
                <div>
                  <h4 className={styles.dialogTitle}>Підтримка</h4>
                  <p className={styles.dialogSubtitle}>
                    Звернення з {contextLabel}
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={() => setIsOpen(false)}
                  aria-label="Закрити support chat"
                >
                  &times;
                </button>
              </div>

              {!isAuthenticated && !conversation && (
                <div className={styles.identityPanel}>
                  <input
                    className={styles.identityInput}
                    placeholder="Ваше ім’я"
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                  />
                  <input
                    className={styles.identityInput}
                    placeholder="Email для зворотного зв’язку"
                    value={guestEmail}
                    onChange={(event) => setGuestEmail(event.target.value)}
                  />
                </div>
              )}

              <div className={styles.messagesWrap}>
                {conversationQuery.isLoading ? (
                  <div className={styles.emptyState}>Завантаження чату…</div>
                ) : messages.length === 0 ? (
                  <div className={styles.emptyState}>
                    Напиши нам у support. Повідомлення одразу з’явиться в
                    адмінці, а при підключеному Telegram ще й у боті.
                  </div>
                ) : (
                  <div className={styles.messagesList}>
                    {messages.map((item) => {
                      const isSupport =
                        item.senderType === "admin" ||
                        item.senderType === "telegram_support";

                      return (
                        <article
                          key={item.id}
                          className={`${styles.messageRow} ${isSupport ? styles.messageRowSupport : styles.messageRowUser}`}
                        >
                          <div
                            className={`${styles.messageBubble} ${isSupport ? styles.messageBubbleSupport : styles.messageBubbleUser}`}
                          >
                            <div className={styles.messageMeta}>
                              <span className={styles.messageSender}>
                                {senderLabel(item.senderType, item.senderName)}
                              </span>
                              <span className={styles.messageDate}>
                                {formatDateShort(item.createdAt)}
                              </span>
                            </div>
                            <div className={styles.messageText}>
                              {item.text}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className={styles.composer}>
                <textarea
                  className={styles.textarea}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={
                    isAuthenticated
                      ? `Повідомлення для підтримки від ${user?.displayName ?? "клієнта"}`
                      : "Опиши питання або проблему…"
                  }
                />
                <div className={styles.composerFooter}>
                  <span className={styles.footerNote}>
                    Відповідь з’явиться тут і в окремому support-чаті адмінки.
                  </span>
                  <button
                    type="button"
                    className={styles.sendButton}
                    onClick={handleSend}
                    disabled={sendMutation.isPending || !message.trim()}
                  >
                    <SendHorizontal size={14} />
                    Надіслати
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className={styles.circleTrigger}
        aria-label={isOpen ? "Закрити підтримку" : "Відкрити підтримку"}
      >
        <MessageCircle size={20} />
        {unreadForUser > 0 && (
          <span className={styles.badge}>
            {unreadForUser > 9 ? "9+" : unreadForUser}
          </span>
        )}
      </button>
    </div>
  );
}
