"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  MailOpen,
  Star,
  Clock,
  Send,
  FileText,
  Archive,
  AlertCircle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  MoreHorizontal,
  ArrowRight,
  ArrowLeft,
  Reply,
  Forward,
  ExternalLink,
  User,
  Zap,
  Settings,
  Trash2,
  CheckCheck,
  Paperclip,
  Smile,
  Link2,
  AlignLeft,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { formatDateShort } from "@/lib/utils";
import { notify } from "@/lib/toast";
import { useAdminInbox } from "../hooks/useAdminInbox";
import styles from "./AdminInboxView.module.scss";

// ── Helpers ──────────────────────────────────────────────────────────────────

const SYSTEM_LABELS = new Set([
  "INBOX",
  "UNREAD",
  "SENT",
  "DRAFT",
  "SPAM",
  "TRASH",
  "STARRED",
  "IMPORTANT",
  "CATEGORY_PERSONAL",
  "CATEGORY_SOCIAL",
  "CATEGORY_PROMOTIONS",
  "CATEGORY_UPDATES",
  "CATEGORY_FORUMS",
]);

const LABEL_STYLES: Record<
  string,
  { color: string; bg: string; border: string }
> = {
  billing: {
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.15)",
    border: "rgba(167,139,250,0.3)",
  },
  legal: {
    color: "#52b788",
    bg: "rgba(82,183,136,0.12)",
    border: "rgba(82,183,136,0.28)",
  },
  support: {
    color: "#4a80d4",
    bg: "rgba(74,128,212,0.12)",
    border: "rgba(74,128,212,0.28)",
  },
  vip: {
    color: "#c8a843",
    bg: "rgba(200,168,67,0.14)",
    border: "rgba(200,168,67,0.35)",
  },
};

function getLabelStyle(label: string) {
  return (
    LABEL_STYLES[label.toLowerCase()] ?? {
      color: "#7a98c0",
      bg: "rgba(122,152,192,0.1)",
      border: "rgba(122,152,192,0.2)",
    }
  );
}

function getUserLabels(labels: string[]) {
  return labels.filter((l) => !SYSTEM_LABELS.has(l));
}

function getInitials(emailOrName: string): string {
  if (!emailOrName) return "?";
  const namePart = emailOrName.split("@")[0];
  const parts = namePart.split(/[.\-_\s]+/);
  return (
    parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || emailOrName[0].toUpperCase()
  );
}

function timeAgo(dateStr: string | null, now: number): string {
  if (!dateStr) return "—";
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "щойно";
  if (mins < 60) return `${mins} хв тому`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} год тому`;
  return formatDateShort(dateStr);
}

function formatMsgTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("uk", { hour: "2-digit", minute: "2-digit" });
}

// ── Constants ─────────────────────────────────────────────────────────────────

const FOLDERS = [
  { id: "inbox", label: "Вхідні", icon: Mail },
  { id: "working", label: "У роботі", icon: Zap },
  { id: "unread", label: "Непрочитані", icon: MailOpen },
  { id: "starred", label: "Важливі", icon: Star },
  { id: "deferred", label: "Відкладені", icon: Clock },
  { id: "sent", label: "Надіслані", icon: Send },
  { id: "drafts", label: "Чернетки", icon: FileText },
  { id: "spam", label: "Спам", icon: AlertCircle },
  { id: "archive", label: "Архів", icon: Archive },
];

const SIDEBAR_LABELS = [
  { id: "billing", label: "Billing", color: "#a78bfa" },
  { id: "legal", label: "Legal", color: "#52b788" },
  { id: "support", label: "Support", color: "#4a80d4" },
  { id: "vip", label: "VIP", color: "#c8a843" },
];

const FILTER_TABS = [
  { id: "all", label: "Всі" },
  { id: "unread", label: "Непрочитані" },
  { id: "assigned", label: "Призначені мені" },
  { id: "pending", label: "Потребують відповіді" },
];

const SIDEBAR_LABEL_COUNTS: Record<string, number> = {
  billing: 18,
  legal: 22,
  support: 14,
  vip: 6,
};

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminInboxView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const connectHandledRef = useRef(false);

  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  const [now] = useState(Date.now);
  const [activeFolder, setActiveFolder] = useState("inbox");
  const [filterTab, setFilterTab] = useState("all");
  const [threadStatus, setThreadStatus] = useState<
    "open" | "pending" | "closed"
  >("open");

  const {
    statusQuery,
    threadsQuery,
    threadQuery,
    connectMutation,
    disconnectMutation,
    syncMutation,
    markReadMutation,
    replyMutation,
    composeMutation,
  } = useAdminInbox({ query, unreadOnly, selectedThreadId });

  const status = statusQuery.data;
  const threads = useMemo(() => threadsQuery.data ?? [], [threadsQuery.data]);
  const detail = threadQuery.data;
  const selectedThread = detail?.thread ?? null;

  useEffect(() => {
    setUnreadOnly(filterTab === "unread");
  }, [filterTab]);

  useEffect(() => {
    if (!threads.length) {
      setSelectedThreadId(null);
      return;
    }
    setSelectedThreadId((current) => {
      if (current && threads.some((t) => t.id === current)) return current;
      return threads[0]?.id ?? null;
    });
  }, [threads]);

  useEffect(() => {
    const gmailStatus = searchParams.get("gmail");
    if (!gmailStatus || connectHandledRef.current) return;
    connectHandledRef.current = true;
    const mailbox = searchParams.get("mailbox");
    if (gmailStatus === "connected") {
      notify.success(
        mailbox
          ? `Gmail-скриньку ${mailbox} підключено. Синхронізую вхідні…`
          : "Gmail-скриньку підключено.",
      );
      statusQuery.refetch();
      syncMutation.mutate(undefined, {
        onSuccess: (result) =>
          notify.success(`Оновлено ${result.syncedThreads} тредів.`),
        onError: () =>
          notify.warning(
            "Підключення збережено, але синхронізація не вдалася.",
          ),
      });
    } else if (gmailStatus === "error") {
      notify.error("Не вдалося завершити підключення Gmail.");
    }
    router.replace(pathname, { scroll: false });
  }, [pathname, router, searchParams, statusQuery, syncMutation]);

  const handleConnect = async () => {
    try {
      const result = await connectMutation.mutateAsync(
        window.location.pathname,
      );
      window.location.href = result.authUrl;
    } catch {
      notify.error("Не вдалося побудувати Gmail OAuth URL.");
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectMutation.mutateAsync();
      notify.success("Спільну Gmail-скриньку відключено.");
      setSelectedThreadId(null);
      setReplyBody("");
    } catch {
      notify.error("Не вдалося відключити Gmail-скриньку.");
    }
  };

  const handleSync = async () => {
    try {
      const result = await syncMutation.mutateAsync();
      notify.success(`Оновлено ${result.syncedThreads} тредів.`);
    } catch {
      notify.error("Не вдалося синхронізувати inbox.");
    }
  };

  const handleMarkRead = async () => {
    if (!selectedThread) return;
    try {
      await markReadMutation.mutateAsync(selectedThread.id);
      notify.success("Тред позначено прочитаним.");
    } catch {
      notify.error("Не вдалося оновити статус треду.");
    }
  };

  const handleReply = async () => {
    if (!selectedThread || !replyBody.trim()) return;
    try {
      await replyMutation.mutateAsync({
        threadId: selectedThread.id,
        body: replyBody,
      });
      notify.success("Відповідь надіслано зі спільної Gmail-скриньки.");
      setReplyBody("");
      await threadQuery.refetch();
    } catch {
      notify.error("Не вдалося надіслати відповідь.");
    }
  };

  const handleCompose = async () => {
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim())
      return;
    try {
      await composeMutation.mutateAsync({
        to: composeTo.trim(),
        subject: composeSubject.trim(),
        body: composeBody.trim(),
      });
      notify.success("Лист надіслано зі спільної Gmail-скриньки.");
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      setShowCompose(false);
    } catch {
      notify.error("Не вдалося надіслати лист.");
    }
  };

  const clientEmail = useMemo(() => {
    if (!selectedThread) return null;
    const mailbox = status?.mailboxEmail;
    return (
      selectedThread.participants.find((p) => p !== mailbox) ??
      selectedThread.participants[0] ??
      null
    );
  }, [selectedThread, status?.mailboxEmail]);

  const folderCounts = useMemo(
    () => ({
      inbox: status?.totalThreads ?? 0,
      working: 12,
      unread: status?.unreadThreads ?? 0,
      starred: 9,
      deferred: 0,
      sent: 0,
      drafts: 3,
      spam: 5,
      archive: 0,
    }),
    [status],
  );

  if (statusQuery.isLoading) {
    return <div className={styles.loadingState}>Завантаження inbox…</div>;
  }

  const isConnected = status?.connected ?? false;
  const lastSyncAt = status?.lastSyncAt ?? null;
  const scopeList = status?.scopes?.length
    ? status.scopes
    : ["gmail.readonly", "gmail.modify", "gmail.send"];

  return (
    <div className={styles.page}>
      {/* ── HERO ── */}
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <span className={styles.eyebrow}>Inbox</span>
          <h2 className={styles.heroTitle}>Спільний Inbox</h2>
          <p className={styles.heroDesc}>
            Gmail-скринька, треди, синхронізація та відповіді
          </p>
          <p className={styles.heroSub}>
            Адміністратори працюють з однієї спільної Gmail-скриньки.
            <br />
            Листи синхронізуються через API та відкриваються як треди.
          </p>
          <div className={styles.heroChips}>
            {[
              "Gmail API",
              "Shared mailbox",
              "Thread replies",
              "SLA tracking",
            ].map((c) => (
              <span key={c} className={styles.heroChip}>
                {c}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.heroStatus}>
          <div className={styles.heroStatusTop}>
            {isConnected ? (
              <div className={styles.connectedBadge}>
                <span className={styles.connectedDot} />
                <span className={styles.connectedLabel}>Підключено</span>
              </div>
            ) : (
              <div className={styles.disconnectedBadge}>
                <span className={styles.disconnectedDot} />
                <span>
                  {status?.configured ? "Not connected" : "Not configured"}
                </span>
              </div>
            )}
            <span className={styles.connectedSub}>Gmail API активний</span>
          </div>

          {isConnected && (
            <div className={styles.heroStatusMeta}>
              <div className={styles.heroStatusRow}>
                <span className={styles.heroStatusKey}>
                  Остання синхронізація
                </span>
                <span className={styles.heroStatusVal}>
                  {timeAgo(lastSyncAt, now)}
                </span>
              </div>
              <div className={styles.heroStatusRow}>
                <span className={styles.heroStatusKey}>1 спільна скринька</span>
              </div>
            </div>
          )}

          <div className={styles.heroStatusActions}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleConnect}
              disabled={!status?.configured || connectMutation.isPending}
            >
              Підключити Gmail
            </button>
            <button
              type="button"
              className={styles.btnGhost}
              onClick={handleSync}
              disabled={!isConnected || syncMutation.isPending}
            >
              <RefreshCw size={12} />
              Синхронізувати
            </button>
            <button
              type="button"
              className={styles.btnGhost}
              onClick={handleDisconnect}
              disabled={!isConnected || disconnectMutation.isPending}
            >
              <Settings size={12} />
              Налаштування
            </button>
          </div>
        </div>

        <div className={styles.heroScopes}>
          <span className={styles.heroScopesTitle}>
            Scopes та здоров&apos;я API
          </span>
          <div className={styles.scopeList}>
            {scopeList.map((scope) => (
              <div key={scope} className={styles.scopeRow}>
                <span className={styles.scopeDot} />
                <span className={styles.scopeLabel}>{scope}</span>
              </div>
            ))}
          </div>
          <button type="button" className={styles.btnScopesMore}>
            Детальніше
          </button>
        </div>
      </div>

      {/* ── KPI STRIP ── */}
      <div className={styles.kpiStrip}>
        <div className={styles.kpiItem}>
          <Mail size={15} className={styles.kpiIcon} />
          <div>
            <div className={styles.kpiRow}>
              <span className={styles.kpiNum}>
                {(status?.totalThreads ?? 1284).toLocaleString("uk")}
              </span>
              <span className={styles.kpiDelta}>+18 за сьогодні</span>
            </div>
            <span className={styles.kpiLabel}>Усього тредів</span>
          </div>
        </div>
        <div className={styles.kpiItem}>
          <MailOpen
            size={15}
            className={styles.kpiIcon}
            style={{ color: "#c8a843" }}
          />
          <div>
            <div className={styles.kpiRow}>
              <span className={styles.kpiNum}>
                {status?.unreadThreads ?? 37}
              </span>
              <span className={styles.kpiDelta}>+5 за сьогодні</span>
            </div>
            <span className={styles.kpiLabel}>Непрочитані</span>
          </div>
        </div>
        <div className={styles.kpiItem}>
          <Clock
            size={15}
            className={styles.kpiIcon}
            style={{ color: "#e9774b" }}
          />
          <div>
            <div className={styles.kpiRow}>
              <span className={styles.kpiNum}>12</span>
              <span className={styles.kpiDelta} style={{ color: "#52b788" }}>
                SLA в нормі
              </span>
            </div>
            <span className={styles.kpiLabel}>Очікують відповіді</span>
          </div>
        </div>
        <div className={styles.kpiItem}>
          <RefreshCw
            size={15}
            className={styles.kpiIcon}
            style={{ color: "#52b788" }}
          />
          <div>
            <div className={styles.kpiRow}>
              <span className={`${styles.kpiNum} ${styles.kpiNumGreen}`}>
                Active
              </span>
              <span className={styles.kpiDelta} style={{ color: "#7a98c0" }}>
                {timeAgo(lastSyncAt, now)}
              </span>
            </div>
            <span className={styles.kpiLabel}>Синхронізація</span>
          </div>
        </div>
      </div>

      {/* ── WORKSPACE ── */}
      <div className={styles.workspace}>
        {/* ── Mailbox Sidebar ── */}
        <div className={styles.mailboxSidebar}>
          <div className={styles.sidebarTop}>
            <button
              type="button"
              className={styles.composeBtn}
              onClick={() => setShowCompose(true)}
              disabled={!isConnected}
            >
              <Plus size={13} />
              Написати
            </button>
          </div>

          <nav className={styles.folderNav}>
            {FOLDERS.map((folder) => {
              const Icon = folder.icon;
              const count =
                folderCounts[folder.id as keyof typeof folderCounts];
              const isActive = activeFolder === folder.id;
              return (
                <button
                  key={folder.id}
                  type="button"
                  className={`${styles.folderItem} ${isActive ? styles.folderItemActive : ""}`}
                  onClick={() => setActiveFolder(folder.id)}
                >
                  <Icon size={13} className={styles.folderIcon} />
                  <span className={styles.folderLabel}>{folder.label}</span>
                  {count ? (
                    <span className={styles.folderCount}>{count}</span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className={styles.sidebarSection}>
            <div className={styles.sidebarSectionHead}>
              <span className={styles.sidebarSectionLabel}>Мітки</span>
              <button type="button" className={styles.addLabelBtn}>
                <Plus size={10} />
              </button>
            </div>
            {SIDEBAR_LABELS.map((lbl) => (
              <button key={lbl.id} type="button" className={styles.labelItem}>
                <span
                  className={styles.labelDot}
                  style={{ background: lbl.color }}
                />
                <span className={styles.labelName}>{lbl.label}</span>
                <span className={styles.labelCount}>
                  {SIDEBAR_LABEL_COUNTS[lbl.id]}
                </span>
              </button>
            ))}
            <button type="button" className={styles.moreLabelBtn}>
              Більше міток
              <ChevronRight size={11} />
            </button>
          </div>
        </div>

        {/* ── Thread List ── */}
        <div className={styles.threadListPanel}>
          <div className={styles.threadSearch}>
            <Search size={13} className={styles.searchIcon} />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Пошук у листах"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="button" className={styles.filterBtn}>
              <Filter size={13} />
            </button>
          </div>

          <div className={styles.filterTabs}>
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`${styles.filterTab} ${filterTab === tab.id ? styles.filterTabActive : ""}`}
                onClick={() => setFilterTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={styles.threadToolbar}>
            <button
              type="button"
              className={styles.toolbarBtn}
              title="Оновити"
              onClick={handleSync}
              disabled={!isConnected || syncMutation.isPending}
            >
              <RefreshCw size={13} />
            </button>
            <span className={styles.toolbarChip}>Непрочитані</span>
            <span className={styles.toolbarChip}>Призначено</span>
            <span className={styles.toolbarChip}>Мітка</span>
            <button type="button" className={styles.toolbarBtn}>
              <MoreHorizontal size={13} />
            </button>
          </div>

          <div className={styles.threadListScroll}>
            {!status?.configured ? (
              <div className={styles.emptyHint}>
                Налаштуйте Google OAuth у backend для активації модуля.
              </div>
            ) : !isConnected ? (
              <div className={styles.emptyHint}>
                Gmail ще не підключено. Після &ldquo;Connect Gmail&rdquo; тут
                з&apos;явиться список синхронізованих тредів.
              </div>
            ) : threadsQuery.isLoading ? (
              <div className={styles.emptyHint}>Оновлення списку тредів…</div>
            ) : threads.length === 0 ? (
              <div className={styles.emptyHint}>
                Немає тредів. Спробуйте синхронізувати.
              </div>
            ) : (
              threads.map((thread) => {
                const isActive = selectedThreadId === thread.id;
                const initials = getInitials(thread.participants[0] ?? "");
                const userLabels = getUserLabels(thread.labels ?? []);
                const isUnread = thread.unreadCount > 0;
                return (
                  <div
                    key={thread.id}
                    role="button"
                    tabIndex={0}
                    className={`${styles.threadItem} ${isActive ? styles.threadItemActive : ""}`}
                    onClick={() => setSelectedThreadId(thread.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        setSelectedThreadId(thread.id);
                    }}
                  >
                    <div className={styles.threadAvatar}>
                      <span className={styles.avatarInitials}>{initials}</span>
                    </div>
                    <div className={styles.threadContent}>
                      <div className={styles.threadRow1}>
                        <span
                          className={`${styles.threadSender} ${isUnread ? styles.threadSenderBold : ""}`}
                        >
                          {thread.participants[0]?.split("@")[0] ??
                            "(Невідомий)"}
                        </span>
                        <span className={styles.threadTime}>
                          {timeAgo(thread.lastMessageAt, now)}
                        </span>
                      </div>
                      <div
                        className={`${styles.threadSubject} ${isUnread ? styles.threadSubjectBold : ""}`}
                      >
                        {thread.subject || "(Без теми)"}
                      </div>
                      <div className={styles.threadPreview}>
                        {thread.snippet}
                      </div>
                      {(userLabels.length > 0 || isUnread) && (
                        <div className={styles.threadLabelRow}>
                          {userLabels.map((lbl) => {
                            const s = getLabelStyle(lbl);
                            return (
                              <span
                                key={lbl}
                                className={styles.threadLabel}
                                style={{
                                  color: s.color,
                                  background: s.bg,
                                  borderColor: s.border,
                                }}
                              >
                                {lbl}
                              </span>
                            );
                          })}
                          {isUnread && (
                            <span className={styles.unreadBadge}>
                              {thread.unreadCount}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className={styles.starBtn}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Star size={11} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {threads.length > 0 && (
            <div className={styles.pagination}>
              <span className={styles.paginationInfo}>
                Показано 1–{threads.length} з{" "}
                {status?.totalThreads ?? threads.length}
              </span>
              <div className={styles.paginationBtns}>
                <button type="button" className={styles.pageBtn} disabled>
                  <ArrowLeft size={10} />
                </button>
                <button
                  type="button"
                  className={`${styles.pageBtn} ${styles.pageBtnActive}`}
                >
                  1
                </button>
                <button type="button" className={styles.pageBtn}>
                  2
                </button>
                <button type="button" className={styles.pageBtn}>
                  <ArrowRight size={10} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Conversation Panel ── */}
        <div className={styles.conversationPanel}>
          {!selectedThreadId ? (
            <div className={styles.conversationEmpty}>
              <Mail size={30} className={styles.conversationEmptyIcon} />
              <span>Оберіть тред зліва, щоб побачити листування</span>
            </div>
          ) : threadQuery.isLoading ? (
            <div className={styles.conversationEmpty}>
              Завантаження листування…
            </div>
          ) : !detail ? (
            <div className={styles.conversationEmpty}>
              Не вдалося завантажити тред.
            </div>
          ) : (
            <>
              <div className={styles.convHeader}>
                <div className={styles.convHeaderLeft}>
                  <h3 className={styles.convTitle}>
                    {selectedThread?.subject || "(Без теми)"}
                  </h3>
                  <div className={styles.convChips}>
                    <span className={styles.convChip}>Inbox</span>
                    {getUserLabels(selectedThread?.labels ?? []).map((lbl) => {
                      const s = getLabelStyle(lbl);
                      return (
                        <span
                          key={lbl}
                          className={styles.convChip}
                          style={{
                            color: s.color,
                            background: s.bg,
                            borderColor: s.border,
                          }}
                        >
                          {lbl}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className={styles.convActions}>
                  <button
                    type="button"
                    className={styles.convActionBtn}
                    title="Відповісти"
                  >
                    <Reply size={14} />
                  </button>
                  <button
                    type="button"
                    className={styles.convActionBtn}
                    title="Переслати"
                  >
                    <Forward size={14} />
                  </button>
                  <button
                    type="button"
                    className={styles.convActionBtn}
                    title="Позначити прочитаним"
                    onClick={handleMarkRead}
                    disabled={
                      !selectedThread || selectedThread.unreadCount === 0
                    }
                  >
                    <CheckCheck size={14} />
                  </button>
                  <button type="button" className={styles.convActionBtn}>
                    <MoreHorizontal size={14} />
                  </button>
                  <button type="button" className={styles.convActionBtn}>
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>

              <div className={styles.messages}>
                {detail.messages.map((msg) => {
                  const initials = getInitials(msg.from);
                  const senderName =
                    msg.from.split("<")[0].trim() || msg.from.split("@")[0];
                  const senderEmailRaw = msg.from.includes("<")
                    ? (msg.from.match(/<(.+)>/)?.[1] ?? "")
                    : msg.from;
                  return (
                    <div
                      key={msg.id}
                      className={`${styles.message} ${msg.isInbound ? styles.messageIn : styles.messageOut}`}
                    >
                      <div className={styles.msgAvatar}>
                        <span
                          className={styles.avatarInitials}
                          style={
                            msg.isInbound
                              ? {}
                              : {
                                  background: "rgba(74,128,212,0.2)",
                                  color: "#4a80d4",
                                }
                          }
                        >
                          {initials}
                        </span>
                      </div>
                      <div className={styles.msgBody}>
                        <div className={styles.msgHeader}>
                          <div>
                            <span className={styles.msgFrom}>{senderName}</span>
                            {senderEmailRaw && (
                              <span className={styles.msgFromEmail}>
                                &lt;{senderEmailRaw}&gt;
                              </span>
                            )}
                            <div className={styles.msgTo}>
                              кому: {msg.to.join(", ") || "—"}
                            </div>
                          </div>
                          <div className={styles.msgMeta}>
                            <span className={styles.msgTime}>
                              {formatMsgTime(msg.internalDate)}
                            </span>
                            <button
                              type="button"
                              className={styles.convActionBtn}
                            >
                              <MoreHorizontal size={12} />
                            </button>
                          </div>
                        </div>
                        <pre className={styles.msgText}>
                          {msg.plainTextBody ||
                            msg.snippet ||
                            "(Порожній лист)"}
                        </pre>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.composer}>
                <div className={styles.composerHeader}>
                  <span className={styles.composerLabel}>Відповідь</span>
                  <span className={styles.composerShared}>
                    Відповідь буде надіслано з shared mailbox:{" "}
                    <a
                      href={`mailto:${status?.mailboxEmail ?? "inbox@law-analysis.dev"}`}
                      className={styles.composerEmail}
                    >
                      {status?.mailboxEmail ?? "inbox@law-analysis.dev"}
                    </a>
                  </span>
                </div>
                <div className={styles.composerTo}>
                  <span className={styles.composerToLabel}>кому:</span>
                  <span className={styles.composerToValue}>
                    {clientEmail ?? "—"}
                  </span>
                </div>
                <div className={styles.richToolbar}>
                  {(["B", "I", "U"] as const).map((f) => (
                    <button key={f} type="button" className={styles.richBtn}>
                      <b>{f}</b>
                    </button>
                  ))}
                  <div className={styles.richDivider} />
                  <button type="button" className={styles.richBtn}>
                    <AlignLeft size={11} />
                  </button>
                  <button type="button" className={styles.richBtn}>
                    <Link2 size={11} />
                  </button>
                  <button type="button" className={styles.richBtn}>
                    <Smile size={11} />
                  </button>
                  <button type="button" className={styles.richBtn}>
                    <MoreHorizontal size={11} />
                  </button>
                </div>
                <textarea
                  className={styles.composerTextarea}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Напишіть відповідь клієнту…"
                />
                <div className={styles.composerFooter}>
                  <div className={styles.composerFooterLeft}>
                    <button type="button" className={styles.iconBtn}>
                      <Paperclip size={14} />
                    </button>
                    <button type="button" className={styles.iconBtn}>
                      <Smile size={14} />
                    </button>
                  </div>
                  <div className={styles.composerFooterRight}>
                    <button
                      type="button"
                      className={styles.sendBtn}
                      onClick={handleReply}
                      disabled={!replyBody.trim() || replyMutation.isPending}
                    >
                      Надіслати
                      <ChevronDown size={12} />
                    </button>
                    <button type="button" className={styles.draftBtn}>
                      Зберегти чернетку
                    </button>
                    <button type="button" className={styles.iconBtn}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Right Panel ── */}
        <div className={styles.rightPanel}>
          <div className={styles.rpCard}>
            <span className={styles.rpCardTitle}>Контакт</span>
            <div className={styles.contactRow}>
              <div className={styles.contactAvatar}>
                <span>{getInitials(clientEmail ?? "")}</span>
              </div>
              <div>
                <div className={styles.contactName}>
                  {clientEmail?.split("@")[0]?.replace(/[._]/g, " ") ?? "—"}
                </div>
                <div className={styles.contactEmail}>{clientEmail ?? "—"}</div>
                <div className={styles.contactOrg}>ТОВ «Правовий Партнер»</div>
                <div className={styles.contactCity}>Україна, Київ</div>
              </div>
            </div>
            <button type="button" className={styles.rpLinkBtn}>
              Відкрити профіль <ArrowRight size={11} />
            </button>
          </div>

          <div className={styles.rpCard}>
            <span className={styles.rpCardLabel}>Статус треду</span>
            <div className={styles.statusSeg}>
              {(["open", "pending", "closed"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`${styles.statusSegBtn} ${threadStatus === s ? styles.statusSegBtnActive : ""}`}
                  onClick={() => setThreadStatus(s)}
                >
                  {s === "open"
                    ? "Відкрито"
                    : s === "pending"
                      ? "Очікує"
                      : "Закрито"}
                </button>
              ))}
            </div>
            <div className={styles.rpRow}>
              <span className={styles.rpKey}>Призначено</span>
              <button type="button" className={styles.assignedBtn}>
                <span className={styles.assignedAvatar}>D</span>
                Dev Admin
                <ChevronDown size={11} />
              </button>
            </div>
          </div>

          <div className={styles.rpCard}>
            <div className={styles.slaRow}>
              <span className={styles.rpCardLabel}>SLA / Відповідь</span>
              <span className={styles.slaTime}>2г 15хв</span>
            </div>
            <div className={styles.slaNote}>
              Перший відповідь до 18:05 сьогодні
            </div>
            <div className={styles.slaBar}>
              <div className={styles.slaBarFill} style={{ width: "62%" }} />
            </div>
          </div>

          <div className={styles.rpCard}>
            <span className={styles.rpCardLabel}>Мітки</span>
            <div className={styles.rpLabelRow}>
              {getUserLabels(
                selectedThread?.labels?.length
                  ? selectedThread.labels
                  : ["Billing", "VIP"],
              ).map((lbl) => {
                const s = getLabelStyle(lbl);
                return (
                  <span
                    key={lbl}
                    className={styles.rpLabelChip}
                    style={{
                      color: s.color,
                      background: s.bg,
                      borderColor: s.border,
                    }}
                  >
                    {lbl}
                  </span>
                );
              })}
              <button type="button" className={styles.addLabelChipBtn}>
                Додати мітку +
              </button>
            </div>
          </div>

          <div className={styles.rpCard}>
            <span className={styles.rpCardLabel}>Остання активність</span>
            <div className={styles.activityList}>
              {[
                { label: "Лист отримано", time: "20 хв тому" },
                { label: "Відкрито адміном", time: "19 хв тому" },
                { label: "Призначено", time: "19 хв тому" },
              ].map((a) => (
                <div key={a.label} className={styles.activityRow}>
                  <span className={styles.activityLabel}>{a.label}</span>
                  <span className={styles.activityTime}>{a.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.rpCard}>
            <span className={styles.rpCardLabel}>Інтеграція</span>
            <div className={styles.integrationList}>
              <div className={styles.integrationRow}>
                <span className={styles.integrationName}>Gmail Webhook</span>
                <span className={styles.integrationStatus}>
                  Активний <span className={styles.statusDotGreen} />
                </span>
              </div>
              <div className={styles.integrationRow}>
                <span className={styles.integrationName}>Синхронізація</span>
                <span className={styles.integrationStatus}>
                  {timeAgo(lastSyncAt, now)}{" "}
                  <span className={styles.statusDotGreen} />
                </span>
              </div>
            </div>
          </div>

          <div className={styles.rpCard}>
            <span className={styles.rpCardLabel}>Швидкі дії</span>
            <div className={styles.quickActions}>
              <button type="button" className={styles.qaBtn}>
                <User size={13} />
                Призначити
              </button>
              <button type="button" className={styles.qaBtn}>
                <FileText size={13} />
                Створити задачу
              </button>
              <button
                type="button"
                className={`${styles.qaBtn} ${styles.qaBtnDanger}`}
              >
                <AlertCircle size={13} />
                Позначити як спам
              </button>
              <button type="button" className={styles.qaBtn}>
                <ExternalLink size={13} />
                Відкрити в Gmail
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Compose overlay ── */}
      {showCompose && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "24px",
            width: "480px",
            background: "#131c2e",
            border: "1px solid rgba(122,152,192,0.22)",
            borderRadius: "12px",
            boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "11px 16px",
              borderBottom: "1px solid rgba(122,152,192,0.15)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ fontWeight: 600, fontSize: "13px", color: "#c8d8f0" }}
            >
              Новий лист
            </span>
            <button
              type="button"
              onClick={() => setShowCompose(false)}
              style={{
                background: "none",
                border: "none",
                color: "#7a98c0",
                cursor: "pointer",
                fontSize: "18px",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          <div
            style={{
              padding: "8px 16px",
              borderBottom: "1px solid rgba(122,152,192,0.1)",
            }}
          >
            <input
              type="email"
              placeholder="Кому"
              value={composeTo}
              onChange={(e) => setComposeTo(e.target.value)}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                color: "#c8d8f0",
                fontSize: "13px",
                outline: "none",
              }}
            />
          </div>

          <div
            style={{
              padding: "8px 16px",
              borderBottom: "1px solid rgba(122,152,192,0.1)",
            }}
          >
            <input
              type="text"
              placeholder="Тема"
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                color: "#c8d8f0",
                fontSize: "13px",
                outline: "none",
              }}
            />
          </div>

          <textarea
            placeholder="Текст листа…"
            value={composeBody}
            onChange={(e) => setComposeBody(e.target.value)}
            style={{
              minHeight: "200px",
              padding: "12px 16px",
              background: "none",
              border: "none",
              color: "#c8d8f0",
              fontSize: "13px",
              resize: "vertical",
              outline: "none",
              fontFamily: "inherit",
            }}
          />

          <div
            style={{
              padding: "10px 16px",
              borderTop: "1px solid rgba(122,152,192,0.1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={handleCompose}
              disabled={
                !composeTo.trim() ||
                !composeSubject.trim() ||
                !composeBody.trim() ||
                composeMutation.isPending
              }
              style={{
                background: "#4a80d4",
                border: "none",
                borderRadius: "6px",
                color: "#fff",
                padding: "7px 18px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                opacity:
                  !composeTo.trim() ||
                  !composeSubject.trim() ||
                  !composeBody.trim() ||
                  composeMutation.isPending
                    ? 0.5
                    : 1,
              }}
            >
              {composeMutation.isPending ? "Надсилаю…" : "Надіслати"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCompose(false);
                setComposeTo("");
                setComposeSubject("");
                setComposeBody("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#7a98c0",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Відхилити
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
