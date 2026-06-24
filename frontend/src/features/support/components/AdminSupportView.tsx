"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  Send,
  MessageSquare,
  RefreshCw,
  ShieldOff,
  User,
  Zap,
  StickyNote,
  ExternalLink,
  Shield,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Bell,
  Pencil,
  Wifi,
} from "lucide-react";
import { notify } from "@/lib/toast";
import { formatDateShort, formatDateMedium } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { adminApi } from "@/lib/api/admin";
import { useAdminSupport } from "../hooks/useAdminSupport";
import type { SupportConversation, SupportConversationStatus } from "../types";
import styles from "./AdminSupport.module.scss";

const AVATAR_COLORS = [
  { bg: "rgba(233,119,75,0.22)", text: "#e9774b" },
  { bg: "rgba(74,128,212,0.22)", text: "#4a80d4" },
  { bg: "rgba(82,183,136,0.22)", text: "#52b788" },
  { bg: "rgba(200,168,67,0.22)", text: "#c8a843" },
  { bg: "rgba(233,30,154,0.22)", text: "#e91e9a" },
  { bg: "rgba(42,171,238,0.18)", text: "#2aabee" },
  { bg: "rgba(139,195,74,0.18)", text: "#8bc34a" },
];

function hashColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const STATUS_TABS = [
  { key: "all", label: "Усі" },
  { key: "open", label: "Відкриті" },
  { key: "waiting_support", label: "Чекають support" },
  { key: "waiting_user", label: "Чекають клієнта" },
  { key: "unread", label: "Непрочитані" },
  { key: "closed", label: "Закриті" },
] as const;

type StatusTab = (typeof STATUS_TABS)[number]["key"];

function statusBadgeClass(
  s: SupportConversationStatus,
  styles: Record<string, string>,
) {
  if (s === "closed") return styles.statusBadgeClosed;
  if (s === "waiting_support" || s === "waiting_user")
    return styles.statusBadgeWaiting;
  return styles.statusBadge;
}

function statusLabel(s: SupportConversationStatus) {
  if (s === "waiting_support") return "Чекає support";
  if (s === "waiting_user") return "Чекає клієнта";
  if (s === "closed") return "Закрито";
  return "Відкрито";
}

const PAGE_SIZE = 8;

export function AdminSupportView() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [composeMode, setComposeMode] = useState<"reply" | "note">("reply");
  const [channel, setChannel] = useState<"web" | "telegram">("web");
  const [noteText, setNoteText] = useState("");
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "checking" | "ok" | "error"
  >("idle");
  const [page, setPage] = useState(1);

  const {
    statusQuery,
    conversationsQuery,
    conversationQuery,
    notesQuery,
    sendMutation,
    markReadMutation,
    updateStatusMutation,
    assignMutation,
    spamMutation,
    escalateMutation,
    addNoteMutation,
    syncCheckMutation,
  } = useAdminSupport({
    query,
    status: statusTab as Parameters<typeof useAdminSupport>[0]["status"],
    selectedConversationId: selectedId,
  });

  const allConversations = useMemo(
    () => conversationsQuery.data ?? [],
    [conversationsQuery.data],
  );
  const totalPages = Math.max(
    1,
    Math.ceil(allConversations.length / PAGE_SIZE),
  );
  const conversations = useMemo(
    () => allConversations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [allConversations, page],
  );

  const detail = conversationQuery.data;
  const conversation = detail?.conversation ?? null;
  const messages = detail?.messages ?? [];
  const notes = notesQuery.data ?? [];
  const [now] = useState(Date.now);
  const st = statusQuery.data;

  useEffect(() => {
    if (!allConversations.length) {
      setSelectedId(null);
      return;
    }
    setSelectedId((cur) => {
      if (cur && allConversations.some((c) => c.id === cur)) return cur;
      return allConversations[0]?.id ?? null;
    });
  }, [allConversations]);

  useEffect(() => {
    if (!conversation?.id || !conversation.unreadForAdmin) return;
    markReadMutation.mutate(conversation.id);
  }, [conversation?.id, conversation?.unreadForAdmin, markReadMutation]);

  const handleReply = async () => {
    if (!conversation?.id || !replyText.trim()) return;
    try {
      await sendMutation.mutateAsync({ id: conversation.id, text: replyText });
      notify.success("Відповідь надіслано.");
      setReplyText("");
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Помилка надсилання.");
    }
  };

  const handleAddNote = async () => {
    if (!conversation?.id || !noteText.trim()) return;
    try {
      await addNoteMutation.mutateAsync({
        id: conversation.id,
        text: noteText,
      });
      notify.success("Нотатку збережено.");
      setNoteText("");
    } catch {
      notify.error("Помилка нотатки.");
    }
  };

  const handleStatus = async (s: SupportConversationStatus) => {
    if (!conversation?.id) return;
    try {
      await updateStatusMutation.mutateAsync({
        id: conversation.id,
        status: s,
      });
      notify.success(`Статус: ${statusLabel(s)}`);
    } catch {
      notify.error("Помилка зміни статусу.");
    }
  };

  const handleSpam = async () => {
    if (!conversation?.id) return;
    try {
      await spamMutation.mutateAsync(conversation.id);
      notify.success("Діалог позначено як спам.");
    } catch {
      notify.error("Помилка.");
    }
  };

  const handleEscalate = async () => {
    if (!conversation?.id) return;
    try {
      await escalateMutation.mutateAsync(conversation.id);
      notify.success("Пріоритет: Urgent.");
    } catch {
      notify.error("Помилка ескалації.");
    }
  };

  const handleAssignSelf = async () => {
    if (!conversation?.id) return;
    try {
      await assignMutation.mutateAsync({ id: conversation.id, adminId: "me" });
      notify.success("Призначено вам.");
    } catch {
      notify.error("Помилка призначення.");
    }
  };

  const handleSyncCheck = async () => {
    setSyncStatus("checking");
    try {
      const res = await syncCheckMutation.mutateAsync();
      setSyncStatus(res.ok ? "ok" : "error");
      if (res.ok)
        notify.success(
          `Telegram OK · ${res.latencyMs}ms · @${res.botUsername}`,
        );
      else notify.error(`Telegram: ${res.error}`);
    } catch {
      setSyncStatus("error");
      notify.error("Помилка sync-check.");
    }
  };

  const handleBlockClient = async () => {
    if (!conversation?.userId) {
      notify.error("Тільки для авторизованих користувачів.");
      return;
    }
    try {
      await adminApi.setUserStatus(conversation.userId, "inactive");
      notify.success("Клієнта заблоковано.");
    } catch {
      notify.error("Помилка блокування.");
    }
  };

  const handleOpenProfile = () => {
    if (conversation?.userId || conversation?.participantType === "user")
      router.push(ROUTES.adminUsers);
    else
      notify.error("Профіль доступний тільки для авторизованих користувачів.");
  };

  const syncTimeStr = st?.lastSyncAt
    ? new Date(st.lastSyncAt).toLocaleTimeString("uk-UA", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";

  if (statusQuery.isLoading) {
    return (
      <section className={styles.loadingState}>Завантаження support…</section>
    );
  }

  return (
    <section className={styles.page}>
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Support</span>
          <h2 className={styles.title}>
            Багатоканальна підтримка: web-віджет + доставка у Telegram.
          </h2>
          <p className={styles.description}>
            Усі повідомлення синхронізуються в одному треді. Відповідайте
            клієнтам з одного місця.
          </p>
          <div className={styles.featureChips}>
            {[
              { icon: <Globe size={10} />, label: "Web-віджет" },
              { icon: <Send size={10} />, label: "Telegram-доставка" },
              { icon: <MessageSquare size={10} />, label: "Єдиний тред" },
              { icon: <User size={10} />, label: "Один інтерфейс" },
            ].map(({ icon, label }) => (
              <span key={label} className={styles.featureChip}>
                {icon}
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Режим доставки */}
        <div className={styles.heroCard}>
          <span className={styles.heroCardLabel}>Режим доставки</span>
          <span className={styles.heroCardValue}>
            {st?.telegramConfigured ? "Web + Telegram" : "Web only"}
          </span>
          <span className={styles.heroCardMeta}>
            <span
              className={
                st?.telegramConfigured ? styles.syncDot : styles.syncDotDown
              }
            />
            {st?.telegramConfigured
              ? "Синхронізація з Telegram увімкнено"
              : "Telegram не налаштовано"}
          </span>
          <button
            type="button"
            className={styles.syncBtn}
            onClick={handleSyncCheck}
            disabled={syncStatus === "checking"}
          >
            <RefreshCw size={11} />
            {syncStatus === "checking"
              ? "Перевірка…"
              : "Перевірити синхронізацію"}
          </button>
          <span className={styles.syncSubtext}>
            Надіслати test ping у bot / support chat
          </span>
        </div>

        {/* Остання перевірка */}
        <div className={styles.heroCard}>
          <span className={styles.heroCardLabel}>Остання перевірка</span>
          <span className={styles.heroCardValue}>{syncTimeStr}</span>
          <div className={styles.heroStatusRow}>
            <span className={styles.heroStatusKey}>Статус</span>
            <span
              className={
                st?.telegramConfigured
                  ? styles.heroStatusValGreen
                  : styles.heroStatusValRed
              }
            >
              {st?.telegramConfigured ? "● Підключено" : "● Відключено"}
            </span>
          </div>
          <div className={styles.heroStatusRow}>
            <span className={styles.heroStatusKey}>Канал</span>
            <span className={styles.heroStatusVal}>
              {st?.telegramConfigured ? "bot → chat → статус" : "web only"}
            </span>
          </div>
          <div className={styles.heroStatusRow}>
            <span className={styles.heroStatusKey}>Web webhook</span>
            <span className={styles.heroStatusValOk}>OK</span>
          </div>
        </div>
      </section>

      {/* ── KPI ──────────────────────────────────────────── */}
      <section className={styles.kpiRow}>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            <span className={`${styles.kpiIcon} ${styles.kpiIconTotal}`}>
              <Globe size={12} />
            </span>
            Усього діалогів
          </span>
          <div className={styles.kpiRight}>
            <strong className={styles.kpiValue}>
              {st?.totalConversations ?? 0}
            </strong>
            <span
              className={`${styles.kpiDelta} ${(st?.todayConversations ?? 0) > 0 ? styles.kpiDeltaPos : ""}`}
            >
              {(st?.todayConversations ?? 0) > 0
                ? `+${st!.todayConversations} сьогодні`
                : "0 сьогодні"}
            </span>
          </div>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            <span className={`${styles.kpiIcon} ${styles.kpiIconOpen}`}>
              <MessageSquare size={12} />
            </span>
            Відкриті
          </span>
          <div className={styles.kpiRight}>
            <strong className={styles.kpiValue}>
              {st?.openConversations ?? 0}
            </strong>
            <span className={styles.kpiDelta}>
              {st?.openConversations ?? 0} активних
            </span>
          </div>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            <span className={`${styles.kpiIcon} ${styles.kpiIconUnread}`}>
              <Bell size={12} />
            </span>
            Непрочитані
          </span>
          <div className={styles.kpiRight}>
            <strong className={styles.kpiValue}>
              {st?.unreadConversations ?? 0}
            </strong>
            <span
              className={`${styles.kpiDelta} ${(st?.unreadConversations ?? 0) > 0 ? styles.kpiDeltaNeg : ""}`}
            >
              {(st?.unreadConversations ?? 0) > 0
                ? "потребують відповіді"
                : "все прочитано"}
            </span>
          </div>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            <span className={`${styles.kpiIcon} ${styles.kpiIconTelegram}`}>
              <Send size={12} />
            </span>
            Telegram
          </span>
          <div className={styles.kpiRight}>
            <span className={styles.telegramReady}>
              {st?.telegramConfigured ? "Ready" : "Not set"}
            </span>
            <span
              className={`${styles.kpiDelta} ${st?.telegramConfigured ? styles.kpiDeltaPos : styles.kpiDeltaNeg}`}
            >
              {st?.telegramConfigured
                ? "Синхронізація активна"
                : "Налаштуйте в .env"}
            </span>
          </div>
        </article>
      </section>

      {/* ── WORKSPACE ────────────────────────────────────── */}
      <div className={styles.workspace}>
        {/* LEFT — INBOX */}
        <div className={styles.inboxPanel}>
          <div className={styles.inboxHeader}>
            <span className={styles.panelEyebrow}>Діалоги</span>
            <div className={styles.panelTitle}>Список звернень</div>
          </div>
          <div className={styles.searchWrap}>
            <input
              className={styles.searchInput}
              placeholder="Пошук за ім'ям, email або сторінкою"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            className={styles.filterSelect}
            value={statusTab}
            onChange={(e) => {
              setStatusTab(e.target.value as StatusTab);
              setPage(1);
            }}
          >
            {STATUS_TABS.map((tab) => (
              <option key={tab.key} value={tab.key}>
                {tab.label}
              </option>
            ))}
          </select>

          <div className={styles.conversationList}>
            {conversationsQuery.isLoading ? (
              <div className={styles.loadingState}>Оновлення…</div>
            ) : conversations.length === 0 ? (
              <div className={styles.emptyState}>Немає діалогів.</div>
            ) : (
              conversations.map((item: SupportConversation) => {
                const color = hashColor(item.participantLabel);
                const isTelegram = Boolean(item.telegramChatId);
                const sc = statusBadgeClass(item.status, styles);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles.convCard} ${selectedId === item.id ? styles.convCardActive : ""}`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <div className={styles.convCardTop}>
                      <div
                        className={styles.avatar}
                        style={{ background: color.bg, color: color.text }}
                      >
                        {initials(item.participantLabel)}
                      </div>
                      <div className={styles.convCardInfo}>
                        <div className={styles.convCardName}>
                          {item.participantLabel}
                        </div>
                        <div className={styles.convCardEmail}>
                          {item.guestEmail || "Авторизований"}
                        </div>
                      </div>
                      <span className={styles.convDate}>
                        {formatDateShort(item.lastMessageAt || item.updatedAt)}
                      </span>
                    </div>
                    <div className={styles.convCardMeta}>
                      <span
                        className={`${styles.channelBadge} ${isTelegram ? styles.channelBadgeTelegram : styles.channelBadgeWeb}`}
                      >
                        {isTelegram ? "Telegram" : "Web"}
                      </span>
                      <span className={sc}>{statusLabel(item.status)}</span>
                      {item.unreadForAdmin > 0 && (
                        <span className={styles.unreadBadge}>
                          {item.unreadForAdmin}
                        </span>
                      )}
                    </div>
                    {item.lastMessageSnippet && (
                      <div className={styles.convSnippet}>
                        {item.lastMessageSnippet}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Pagination */}
          <div className={styles.inboxPagination}>
            <span className={styles.paginationInfo}>
              Показано{" "}
              {Math.min((page - 1) * PAGE_SIZE + 1, allConversations.length)}–
              {Math.min(page * PAGE_SIZE, allConversations.length)} з{" "}
              {allConversations.length}
            </span>
            <div className={styles.paginationBtns}>
              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={12} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`${styles.pageBtn} ${page === p ? styles.pageBtnActive : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* CENTER — THREAD */}
        <div className={styles.thread}>
          {!selectedId ? (
            <div className={styles.emptyState}>Оберіть діалог зліва.</div>
          ) : conversationQuery.isLoading ? (
            <div className={styles.loadingState}>Завантаження…</div>
          ) : !conversation ? (
            <div className={styles.emptyState}>
              Не вдалося завантажити діалог.
            </div>
          ) : (
            <>
              <div className={styles.threadHeader}>
                <div className={styles.threadHeaderTop}>
                  {(() => {
                    const color = hashColor(conversation.participantLabel);
                    return (
                      <div
                        className={styles.threadAvatar}
                        style={{ background: color.bg, color: color.text }}
                      >
                        {initials(conversation.participantLabel)}
                      </div>
                    );
                  })()}
                  <div className={styles.threadClientInfo}>
                    <div className={styles.threadClientName}>
                      {conversation.participantLabel}
                    </div>
                    <div className={styles.threadClientEmail}>
                      {conversation.guestEmail || "Авторизований клієнт"}
                    </div>
                  </div>
                  <div className={styles.threadHeaderRight}>
                    <span
                      className={`${styles.channelBadge} ${conversation.telegramChatId ? styles.channelBadgeTelegram : styles.channelBadgeWeb}`}
                    >
                      {conversation.telegramChatId ? "Telegram" : "Web"}
                    </span>
                    <span
                      className={statusBadgeClass(conversation.status, styles)}
                    >
                      {statusLabel(conversation.status)}
                    </span>
                    {conversation.assignedAdminId && (
                      <span className={styles.assignedLabel}>
                        Призначено: DA
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.threadMeta}>
                  <span
                    className={`${styles.priorityBadge} ${conversation.priority === "urgent" ? styles.priorityUrgent2 : conversation.priority === "high" ? styles.priorityHigh2 : styles.priorityNormal}`}
                  >
                    {conversation.priority === "urgent"
                      ? "⚡ Urgent"
                      : conversation.priority === "high"
                        ? "▲ High"
                        : "Normal"}
                  </span>
                  {conversation.spamFlag && (
                    <span style={{ fontSize: "0.62rem", color: "#f08080" }}>
                      ● Спам
                    </span>
                  )}
                </div>

                <div className={styles.threadActions}>
                  {conversation.status === "closed" ? (
                    <button
                      type="button"
                      className={styles.threadActionBtn}
                      onClick={() => handleStatus("open")}
                      disabled={updateStatusMutation.isPending}
                    >
                      <CheckCircle size={11} /> Відкрити знову
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.threadActionBtn}
                      onClick={() => handleStatus("closed")}
                      disabled={updateStatusMutation.isPending}
                    >
                      <CheckCircle size={11} /> Закрити тікет
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${styles.threadActionBtn} ${styles.threadActionBtnDanger}`}
                    onClick={handleSpam}
                    disabled={spamMutation.isPending || conversation.spamFlag}
                  >
                    <ShieldOff size={11} /> Позначити як спам
                  </button>
                  {conversation.telegramChatId && (
                    <button
                      type="button"
                      className={`${styles.threadActionBtn} ${styles.threadActionBtnBlue}`}
                      onClick={() => handleStatus("waiting_user")}
                      disabled={updateStatusMutation.isPending}
                    >
                      <Send size={11} /> Перевести в Telegram
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.threadActionBtn}
                    onClick={handleAssignSelf}
                    disabled={assignMutation.isPending}
                  >
                    <User size={11} />{" "}
                    {conversation.assignedAdminId
                      ? "Перепризначити"
                      : "Призначити"}
                  </button>
                </div>
              </div>

              <div className={styles.contextLine}>
                Контекст: {conversation.startedFromPageTitle || "Без заголовка"}{" "}
                · {conversation.startedFromPathname || "/"}
              </div>

              {/* Messages */}
              <div className={styles.messages}>
                {messages
                  .reduce<{ label: string; msgs: typeof messages }[]>(
                    (acc, msg) => {
                      const d = new Date(msg.createdAt);
                      const today = new Date();
                      const yesterday = new Date(today);
                      yesterday.setDate(today.getDate() - 1);
                      const label =
                        d.toDateString() === today.toDateString()
                          ? "Сьогодні"
                          : d.toDateString() === yesterday.toDateString()
                            ? "Вчора"
                            : d.toLocaleDateString("uk-UA", {
                                day: "numeric",
                                month: "long",
                              });
                      if (!acc.length || acc[acc.length - 1].label !== label)
                        acc.push({ label, msgs: [msg] });
                      else acc[acc.length - 1].msgs.push(msg);
                      return acc;
                    },
                    [],
                  )
                  .map(({ label, msgs: grpMsgs }) => (
                    <div key={label}>
                      <div className={styles.dateGroup}>{label}</div>
                      {grpMsgs.map((msg) => {
                        const isAdmin =
                          msg.senderType === "admin" ||
                          msg.senderType === "telegram_support";
                        const isTg =
                          msg.channel === "telegram" || msg.deliveredToTelegram;
                        return (
                          <div
                            key={msg.id}
                            className={`${styles.messageRow} ${isAdmin ? styles.messageRowAdmin : styles.messageRowUser}`}
                          >
                            <div
                              className={`${styles.messageBubble} ${isAdmin ? styles.messageBubbleAdmin : styles.messageBubbleUser}`}
                            >
                              <span className={styles.messageSender}>
                                {msg.senderType === "admin"
                                  ? msg.senderName || "Dev Admin"
                                  : msg.senderType === "telegram_support"
                                    ? "Telegram support"
                                    : msg.senderType === "system"
                                      ? "Система"
                                      : msg.senderName || "Клієнт"}
                              </span>
                              <div className={styles.messageText}>
                                {msg.text}
                              </div>
                              <div className={styles.messageFooter}>
                                <span className={styles.messageDate}>
                                  {formatDateShort(msg.createdAt)}
                                </span>
                                <span
                                  className={`${styles.msgChannelBadge} ${isTg ? styles.msgChannelBadgeTg : ""}`}
                                >
                                  {isTg ? "Telegram" : "Web"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
              </div>

              {/* Compose */}
              <div className={styles.compose}>
                <div className={styles.composeTabs}>
                  <button
                    type="button"
                    className={`${styles.composeTab} ${composeMode === "reply" ? styles.composeTabActive : ""}`}
                    onClick={() => setComposeMode("reply")}
                  >
                    Відповідь клієнту
                  </button>
                  <button
                    type="button"
                    className={`${styles.composeTab} ${styles.composeTabNote} ${composeMode === "note" ? styles.composeTabActive : ""}`}
                    onClick={() => setComposeMode("note")}
                  >
                    Внутрішня нотатка
                  </button>
                </div>

                <textarea
                  className={`${styles.textarea} ${composeMode === "note" ? styles.textareaNoteMode : ""}`}
                  value={composeMode === "reply" ? replyText : noteText}
                  onChange={(e) =>
                    composeMode === "reply"
                      ? setReplyText(e.target.value)
                      : setNoteText(e.target.value)
                  }
                  placeholder={
                    composeMode === "reply"
                      ? "Напишіть відповідь клієнту…"
                      : "Внутрішня нотатка — клієнт не побачить…"
                  }
                />

                <div className={styles.composeFooter}>
                  <button
                    type="button"
                    className={styles.composeIconBtn}
                    title="Прикріпити файл"
                  >
                    <Paperclip size={13} />
                  </button>
                  <button
                    type="button"
                    className={styles.composeIconBtn}
                    title="Швидкі відповіді"
                  >
                    <Zap size={13} />
                  </button>

                  {composeMode === "reply" && (
                    <div className={styles.channelToggle}>
                      <button
                        type="button"
                        className={`${styles.channelToggleBtn} ${channel === "web" ? styles.channelToggleBtnActiveWeb : ""}`}
                        onClick={() => setChannel("web")}
                      >
                        <Globe size={10} /> Web
                      </button>
                      <button
                        type="button"
                        className={`${styles.channelToggleBtn} ${channel === "telegram" ? styles.channelToggleBtnActiveTg : ""}`}
                        onClick={() => setChannel("telegram")}
                        disabled={!conversation.telegramChatId}
                      >
                        <Send size={10} /> Telegram
                      </button>
                    </div>
                  )}

                  {composeMode === "reply" ? (
                    <button
                      type="button"
                      className={styles.sendBtn}
                      onClick={handleReply}
                      disabled={!replyText.trim() || sendMutation.isPending}
                    >
                      <Send size={12} /> Надіслати відповідь
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`${styles.sendBtn} ${styles.sendBtnGreen}`}
                      onClick={handleAddNote}
                      disabled={!noteText.trim() || addNoteMutation.isPending}
                    >
                      <StickyNote size={12} /> Зберегти нотатку
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT — OPS RAIL */}
        <div className={styles.rail}>
          {/* Статус каналу */}
          <div className={styles.railCard}>
            <span className={styles.railCardTitle}>Статус каналу</span>
            {[
              {
                icon: <Globe size={11} />,
                label: "Web-віджет",
                val: "Активний",
                ok: true,
              },
              {
                icon: <Send size={11} />,
                label: "Telegram chat",
                val: st?.telegramConfigured ? "Підключено" : "Відключено",
                ok: st?.telegramConfigured ?? false,
              },
              {
                icon: <Wifi size={11} />,
                label: "Bot webhook",
                val: "OK",
                ok: true,
              },
              {
                icon: <RefreshCw size={11} />,
                label: "Остання синхронізація",
                val: syncTimeStr,
                ok: true,
              },
            ].map(({ icon, label, val, ok }) => (
              <div key={label} className={styles.statusChRow}>
                <span className={styles.statusChKey}>
                  {icon}
                  {label}
                </span>
                <span
                  className={
                    ok ? styles.statusChValGreen : styles.statusChValRed
                  }
                >
                  {val}
                </span>
              </div>
            ))}
          </div>

          {/* Клієнт */}
          <div className={styles.railCard}>
            <span className={styles.railCardTitle}>Клієнт</span>
            {conversation ? (
              <>
                {[
                  { key: "Ім'я", val: conversation.participantLabel },
                  { key: "Email", val: conversation.guestEmail || "—" },
                  {
                    key: "Тип",
                    val:
                      conversation.participantType === "user"
                        ? "Авторизований"
                        : "Гість",
                  },
                  {
                    key: "Поточна сторінка",
                    val: conversation.startedFromPathname || "/",
                  },
                  {
                    key: "Джерело",
                    val: conversation.telegramChatId
                      ? "Telegram"
                      : "Web-віджет",
                  },
                  {
                    key: "ID треду",
                    val: `#WEB-${conversation.id.slice(-8).toUpperCase()}`,
                  },
                ].map(({ key, val }) => (
                  <div key={key} className={styles.clientRow}>
                    <span className={styles.clientKey}>{key}</span>
                    <span className={styles.clientVal}>{val}</span>
                  </div>
                ))}
              </>
            ) : (
              <span
                style={{ fontSize: "0.72rem", color: "rgba(216,228,246,0.4)" }}
              >
                Оберіть діалог
              </span>
            )}
          </div>

          {/* SLA / Пріоритет */}
          <div className={styles.railCard}>
            <span className={styles.railCardTitle}>SLA / Пріоритет</span>
            {conversation ? (
              <>
                {(() => {
                  const elapsedMin = Math.floor(
                    (now - new Date(conversation.createdAt).getTime()) / 60000,
                  );
                  const slaMin = 480;
                  const pct = Math.min(
                    100,
                    Math.round((elapsedMin / slaMin) * 100),
                  );
                  const elapsedStr =
                    elapsedMin < 60
                      ? `${elapsedMin} хв`
                      : `${Math.floor(elapsedMin / 60)} год`;
                  return (
                    <>
                      <div className={styles.slaRow}>
                        <span className={styles.slaKey}>Відповідь</span>
                        <span
                          className={
                            pct > 80 ? styles.slaValRed : styles.slaVal
                          }
                        >
                          {elapsedStr} {pct > 80 ? "— залишилось мало" : ""}
                        </span>
                      </div>
                      <div className={styles.slaRow}>
                        <span className={styles.slaKey}>Пріоритет</span>
                        <span
                          className={`${styles.priorityBadge} ${conversation.priority === "urgent" ? styles.priorityUrgent2 : conversation.priority === "high" ? styles.priorityHigh2 : styles.priorityMed}`}
                        >
                          {conversation.priority === "urgent"
                            ? "⚡ Urgent"
                            : conversation.priority === "high"
                              ? "▲ High"
                              : "🟡 Середній"}
                        </span>
                      </div>
                      <div className={styles.slaRow}>
                        <span className={styles.slaKey}>Відкрито</span>
                        <span className={styles.slaVal}>
                          {formatDateMedium(conversation.createdAt)}
                        </span>
                      </div>
                      <div className={styles.slaBarWrap}>
                        <span>{elapsedStr}</span>
                        <div className={styles.slaBar}>
                          <div
                            className={`${styles.slaBarFill} ${pct > 80 ? styles.slaBarFillDanger : pct > 50 ? styles.slaBarFillWarn : ""}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span>{slaMin} хв</span>
                      </div>
                    </>
                  );
                })()}
              </>
            ) : (
              <span
                style={{ fontSize: "0.72rem", color: "rgba(216,228,246,0.4)" }}
              >
                Оберіть діалог
              </span>
            )}
          </div>

          {/* Внутрішні нотатки */}
          <div className={styles.railCard}>
            <div className={styles.railCardHeader}>
              <span className={styles.railCardTitle}>Внутрішні нотатки</span>
              {conversation && (
                <button
                  type="button"
                  className={styles.railCardEditBtn}
                  onClick={() => setComposeMode("note")}
                >
                  <Pencil size={12} />
                </button>
              )}
            </div>
            {notes.length > 0 ? (
              <div className={styles.notesList}>
                {notes.map((n) => (
                  <div key={n.id} className={styles.noteItem}>
                    <div className={styles.noteText}>{n.text}</div>
                    <div className={styles.noteAuthorDate}>
                      Оновлено {n.authorEmail || n.authorName} ·{" "}
                      {formatDateShort(n.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <span
                style={{ fontSize: "0.72rem", color: "rgba(216,228,246,0.38)" }}
              >
                {conversation ? "Нотаток немає" : "Оберіть діалог"}
              </span>
            )}
            {conversation && (
              <>
                <textarea
                  className={styles.noteTextarea}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder={`Оновлено Dev Admin\nНотатка…`}
                />
                <button
                  type="button"
                  className={styles.noteSubmitBtn}
                  onClick={handleAddNote}
                  disabled={!noteText.trim() || addNoteMutation.isPending}
                >
                  Зберегти нотатку
                </button>
              </>
            )}
          </div>

          {/* Швидкі дії */}
          <div className={styles.railCard}>
            <span className={styles.railCardTitle}>Швидкі дії</span>
            <div className={styles.quickActions}>
              <button
                type="button"
                className={styles.quickActionBtn}
                onClick={() => handleStatus("waiting_support")}
                disabled={!conversation || updateStatusMutation.isPending}
              >
                <StickyNote size={11} /> Створити задачу
              </button>
              <button
                type="button"
                className={`${styles.quickActionBtn} ${styles.quickActionBtnBlue}`}
                onClick={handleOpenProfile}
                disabled={!conversation}
              >
                <ExternalLink size={11} /> Відкрити профіль
              </button>
              <button
                type="button"
                className={`${styles.quickActionBtn} ${styles.quickActionBtnDanger}`}
                onClick={handleBlockClient}
                disabled={!conversation}
              >
                <Shield size={11} /> Блокувати клієнта
              </button>
              <button
                type="button"
                className={`${styles.quickActionBtn} ${styles.quickActionBtnDanger}`}
                onClick={handleEscalate}
                disabled={!conversation || escalateMutation.isPending}
              >
                <Bell size={11} /> Ескалація
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
