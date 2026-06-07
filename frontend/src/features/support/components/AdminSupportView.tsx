"use client";

import { useEffect, useMemo, useState } from "react";
import { notify } from "@/lib/toast";
import { formatDateMedium, formatDateShort } from "@/lib/utils";
import { useAdminSupport } from "../hooks/useAdminSupport";
import type { SupportConversationStatus } from "../types";
import styles from "./AdminSupportView.module.scss";

const STATUS_OPTIONS = [
  { key: "all", label: "Усі" },
  { key: "open", label: "Відкриті" },
  { key: "waiting_support", label: "Чекають support" },
  { key: "waiting_user", label: "Чекають клієнта" },
  { key: "unread", label: "Непрочитані" },
  { key: "closed", label: "Закриті" },
] as const;

function formatStatusLabel(value: SupportConversationStatus) {
  switch (value) {
    case "waiting_support":
      return "Чекає support";
    case "waiting_user":
      return "Чекає клієнта";
    case "closed":
      return "Закрито";
    default:
      return "Відкрито";
  }
}

function senderLabel(senderType: string, senderName: string) {
  if (senderType === "admin") return senderName || "Адмін";
  if (senderType === "telegram_support") return senderName || "Telegram support";
  if (senderType === "system") return "Система";
  return senderName || "Клієнт";
}

export function AdminSupportView() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<
    "all" | "open" | "waiting_support" | "waiting_user" | "closed" | "unread"
  >("all");
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [replyText, setReplyText] = useState("");

  const {
    statusQuery,
    conversationsQuery,
    conversationQuery,
    sendMutation,
    markReadMutation,
    updateStatusMutation,
  } = useAdminSupport({
    query,
    status,
    selectedConversationId,
  });

  const conversations = conversationsQuery.data ?? [];
  const detail = conversationQuery.data;
  const conversation = detail?.conversation ?? null;
  const messages = detail?.messages ?? [];

  useEffect(() => {
    if (!conversations.length) {
      setSelectedConversationId(null);
      return;
    }

    setSelectedConversationId((current) => {
      if (current && conversations.some((item) => item.id === current)) {
        return current;
      }
      return conversations[0]?.id ?? null;
    });
  }, [conversations]);

  useEffect(() => {
    if (!conversation?.id || !conversation.unreadForAdmin) return;
    markReadMutation.mutate(conversation.id);
  }, [conversation?.id, conversation?.unreadForAdmin, markReadMutation]);

  const handleReply = async () => {
    if (!conversation?.id || !replyText.trim()) return;

    try {
      await sendMutation.mutateAsync({
        id: conversation.id,
        text: replyText,
      });
      notify.success("Відповідь надіслано в support-діалог.");
      setReplyText("");
      await conversationQuery.refetch();
    } catch (err) {
      notify.error(
        err instanceof Error
          ? err.message
          : "Не вдалося надіслати support-відповідь.",
      );
    }
  };

  const handleStatusChange = async (nextStatus: SupportConversationStatus) => {
    if (!conversation?.id) return;
    try {
      await updateStatusMutation.mutateAsync({
        id: conversation.id,
        status: nextStatus,
      });
      notify.success(`Статус змінено на «${formatStatusLabel(nextStatus)}».`);
    } catch (err) {
      notify.error(
        err instanceof Error ? err.message : "Не вдалося оновити статус діалогу.",
      );
    }
  };

  const statusNote = useMemo(() => {
    if (!statusQuery.data) return "Завантаження support-метрик…";
    return statusQuery.data.telegramConfigured
      ? "Web-чат синхронізовано з Telegram bot bridge."
      : "Працює web-only режим. Додай Telegram env на backend, щоб увімкнути bridge.";
  }, [statusQuery.data]);

  if (statusQuery.isLoading) {
    return <section className={styles.loadingState}>Завантаження support…</section>;
  }

  return (
    <section className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Support</span>
          <h2 className={styles.title}>Окремий живий support-чат для клієнтів.</h2>
          <p className={styles.description}>
            Клієнт пише з будь-якої сторінки сайту, повідомлення з’являється в
            цьому адміністраторському модулі, а при підключеному Telegram ще й
            дублюється в боті. Lex AI лишається окремим і не змішується з живою
            підтримкою.
          </p>
        </div>

        <aside className={styles.heroAside}>
          <span className={styles.tag}>Режим</span>
          <div className={styles.heroValue}>
            {statusQuery.data?.telegramConfigured ? "Web + Telegram" : "Web only"}
          </div>
          <div className={styles.heroMeta}>{statusNote}</div>
        </aside>
      </section>

      <section className={styles.metricGrid}>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Усього діалогів</span>
          <strong className={styles.metricValue}>
            {statusQuery.data?.totalConversations ?? 0}
          </strong>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Відкриті</span>
          <strong className={styles.metricValue}>
            {statusQuery.data?.openConversations ?? 0}
          </strong>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Непрочитані</span>
          <strong className={styles.metricValue}>
            {statusQuery.data?.unreadConversations ?? 0}
          </strong>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Telegram</span>
          <strong className={styles.metricValue}>
            {statusQuery.data?.telegramConfigured ? "Ready" : "Not set"}
          </strong>
        </article>
      </section>

      <section className={styles.workspace}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Діалоги</span>
              <h3 className={styles.panelTitle}>Список звернень</h3>
            </div>
          </div>
          <div className={styles.toolbar}>
            <input
              className={styles.searchInput}
              placeholder="Пошук за ім’ям, email або сторінкою"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className={styles.filterRow}>
            {STATUS_OPTIONS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`${styles.filterButton} ${status === item.key ? styles.filterButtonActive : ""}`}
                onClick={() => setStatus(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className={styles.conversationList}>
            {conversationsQuery.isLoading ? (
              <div className={styles.loadingState}>Оновлення списку діалогів…</div>
            ) : conversations.length === 0 ? (
              <div className={styles.emptyState}>
                За поточним фільтром немає жодного support-діалогу.
              </div>
            ) : (
              conversations.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.conversationCard} ${selectedConversationId === item.id ? styles.conversationCardActive : ""}`}
                  onClick={() => setSelectedConversationId(item.id)}
                >
                  <div className={styles.cardTopRow}>
                    <div>
                      <h4 className={styles.cardTitle}>{item.participantLabel}</h4>
                      <div className={styles.cardEmail}>
                        {item.guestEmail || "Авторизований клієнт"}
                      </div>
                    </div>
                    <span className={styles.cardDate}>
                      {formatDateShort(item.lastMessageAt || item.updatedAt)}
                    </span>
                  </div>
                  <div className={styles.cardMeta}>
                    <span className={styles.chip}>
                      {formatStatusLabel(item.status)}
                    </span>
                    {item.unreadForAdmin > 0 && (
                      <span className={`${styles.chip} ${styles.chipHighlight}`}>
                        Нові {item.unreadForAdmin}
                      </span>
                    )}
                  </div>
                  <div className={styles.cardPath}>
                    {item.startedFromPageTitle || item.startedFromPathname || "Сторінка невідома"}
                  </div>
                  <div className={styles.cardSnippet}>
                    {item.lastMessageSnippet || "Без фрагмента повідомлення."}
                  </div>
                </button>
              ))
            )}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Support thread</span>
              <h3 className={styles.panelTitle}>Переписка</h3>
            </div>
          </div>
          <div className={styles.threadBody}>
            {!selectedConversationId ? (
              <div className={styles.emptyState}>
                Обери діалог зліва, щоб побачити переписку.
              </div>
            ) : conversationQuery.isLoading ? (
              <div className={styles.loadingState}>Завантаження support-чату…</div>
            ) : !conversation ? (
              <div className={styles.emptyState}>
                Не вдалося завантажити діалог. Спробуй ще раз.
              </div>
            ) : (
              <>
                <section className={styles.detailHero}>
                  <div className={styles.cardTopRow}>
                    <div>
                      <h4 className={styles.cardTitle}>{conversation.participantLabel}</h4>
                      <div className={styles.cardEmail}>
                        {conversation.guestEmail || "Авторизований клієнт"}
                      </div>
                    </div>
                    <span className={styles.cardDate}>
                      {formatDateMedium(conversation.lastMessageAt || conversation.updatedAt)}
                    </span>
                  </div>
                  <div className={styles.cardMeta}>
                    <span className={styles.chip}>
                      {formatStatusLabel(conversation.status)}
                    </span>
                    {conversation.telegramChatId && (
                      <span className={`${styles.chip} ${styles.chipHighlight}`}>
                        Telegram mirrored
                      </span>
                    )}
                  </div>
                  <div className={styles.contextBlock}>
                    <strong>Контекст:</strong>{" "}
                    {conversation.startedFromPageTitle || "Без заголовка"} ·{" "}
                    {conversation.startedFromPathname || "Без шляху"}
                  </div>
                  <div className={styles.detailActions}>
                    {conversation.status === "closed" ? (
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => handleStatusChange("open")}
                        disabled={updateStatusMutation.isPending}
                      >
                        Відкрити знову
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.ghostButton}
                        onClick={() => handleStatusChange("closed")}
                        disabled={updateStatusMutation.isPending}
                      >
                        Закрити діалог
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => handleStatusChange("waiting_user")}
                      disabled={updateStatusMutation.isPending}
                    >
                      Позначити «чекає клієнта»
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => handleStatusChange("waiting_support")}
                      disabled={updateStatusMutation.isPending}
                    >
                      Позначити «чекає support»
                    </button>
                  </div>
                </section>

                <section className={styles.messages}>
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
                          <div className={styles.messageText}>{item.text}</div>
                          <div className={styles.messageChannel}>
                            {item.channel === "telegram"
                              ? "Отримано з Telegram"
                              : item.deliveredToTelegram
                                ? "Відправлено в web + Telegram"
                                : "Web"}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </section>

                <section className={styles.replyPanel}>
                  <span className={styles.panelEyebrow}>Відповідь support</span>
                  <textarea
                    className={styles.textarea}
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    placeholder="Напиши відповідь клієнту…"
                  />
                  <div className={styles.detailActions}>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={handleReply}
                      disabled={!replyText.trim() || sendMutation.isPending}
                    >
                      Надіслати відповідь
                    </button>
                  </div>
                </section>
              </>
            )}
          </div>
        </article>
      </section>
    </section>
  );
}
