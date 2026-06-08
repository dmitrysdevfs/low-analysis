"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatDateMedium, formatDateShort } from "@/lib/utils";
import { notify } from "@/lib/toast";
import { useAdminInbox } from "../hooks/useAdminInbox";
import styles from "./AdminInboxView.module.scss";

function formatWhen(value: string | null) {
  if (!value) return "—";
  return formatDateMedium(value);
}

function compactDate(value: string | null) {
  if (!value) return "—";
  return formatDateShort(value);
}

export function AdminInboxView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const connectHandledRef = useRef(false);

  const {
    statusQuery,
    threadsQuery,
    threadQuery,
    connectMutation,
    disconnectMutation,
    syncMutation,
    markReadMutation,
    replyMutation,
  } = useAdminInbox({
    query,
    unreadOnly,
    selectedThreadId,
  });

  const status = statusQuery.data;
  const threads = useMemo(() => threadsQuery.data ?? [], [threadsQuery.data]);
  const detail = threadQuery.data;
  const selectedThread = detail?.thread ?? null;

  useEffect(() => {
    if (!threads.length) {
      setSelectedThreadId(null);
      return;
    }

    setSelectedThreadId((current) => {
      if (current && threads.some((thread) => thread.id === current)) {
        return current;
      }
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
          : "Gmail-скриньку підключено. Синхронізую вхідні…",
      );
      statusQuery.refetch();
      syncMutation.mutate(undefined, {
        onSuccess: (result) => {
          notify.success(`Оновлено ${result.syncedThreads} тредів.`);
        },
        onError: () => {
          notify.warning(
            "Підключення збережено, але автоматична синхронізація не вдалася.",
          );
        },
      });
    } else if (gmailStatus === "error") {
      notify.error("Не вдалося завершити підключення Gmail.");
    }

    router.replace(pathname, { scroll: false });
  }, [pathname, router, searchParams, statusQuery, syncMutation]);

  const connectionSummary = useMemo(() => {
    if (!status?.configured) {
      return "Google OAuth ще не налаштовано в середовищі backend.";
    }
    if (!status.connected) {
      return "Спільна Gmail-скринька ще не підключена.";
    }
    return status.mailboxEmail
      ? `Підключено скриньку ${status.mailboxEmail}.`
      : "Gmail-скриньку підключено.";
  }, [status]);

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

  if (statusQuery.isLoading) {
    return (
      <section className={styles.loadingState}>Завантаження inbox…</section>
    );
  }

  return (
    <section className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Inbox</span>
          <h2 className={styles.title}>
            Окремий модуль для спільної Gmail-скриньки.
          </h2>
          <p className={styles.description}>
            Тут адміністратори бачать один спільний mailbox, вручну
            синхронізують треди, відкривають листи та відповідають з єдиної
            системної адреси без переходу в Gmail.
          </p>
          <div className={styles.heroActions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleConnect}
              disabled={!status?.configured || connectMutation.isPending}
            >
              {status?.connected ? "Reconnect Gmail" : "Connect Gmail"}
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleSync}
              disabled={!status?.connected || syncMutation.isPending}
            >
              Sync now
            </button>
            <button
              type="button"
              className={styles.ghostButton}
              onClick={handleDisconnect}
              disabled={!status?.connected || disconnectMutation.isPending}
            >
              Disconnect
            </button>
          </div>
        </div>

        <aside className={styles.heroAside}>
          <span className={styles.tag}>Статус підключення</span>
          <div className={styles.heroValue}>
            {status?.connected
              ? "Connected"
              : status?.configured
                ? "Not connected"
                : "Not configured"}
          </div>
          <div className={styles.heroMeta}>{connectionSummary}</div>
          <div className={styles.heroNote}>
            Scopes: {status?.scopes?.length ? status.scopes.join(", ") : "—"}
          </div>
          {status?.lastError && (
            <div
              className={`${styles.statusAlert} ${styles.statusAlertWarning}`}
            >
              Остання помилка: {status.lastError}
            </div>
          )}
        </aside>
      </section>

      <section className={styles.statusGrid}>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Mailbox</span>
          <strong className={styles.metricValue}>
            {status?.mailboxEmail ?? "—"}
          </strong>
          <div className={styles.metricNote}>
            Підключена спільна адреса для всієї адмінки.
          </div>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Unread threads</span>
          <strong className={styles.metricValue}>
            {status?.unreadThreads ?? 0}
          </strong>
          <div className={styles.metricNote}>
            Треди, які все ще вимагають уваги.
          </div>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Stored threads</span>
          <strong className={styles.metricValue}>
            {status?.totalThreads ?? 0}
          </strong>
          <div className={styles.metricNote}>
            Треди, синхронізовані у Mongo для адмінки.
          </div>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Last sync</span>
          <strong className={styles.metricValue}>
            {compactDate(status?.lastSyncAt ?? null)}
          </strong>
          <div className={styles.metricNote}>
            Останній успішний ручний синк inbox.
          </div>
        </article>
      </section>

      <section className={styles.workspace}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Список тредів</span>
              <h3 className={styles.panelTitle}>Вхідні звернення</h3>
            </div>
          </div>
          <div className={styles.toolbar}>
            <input
              className={styles.searchInput}
              placeholder="Пошук за темою, адресою або фрагментом листа"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button
              type="button"
              className={`${styles.toggleButton} ${unreadOnly ? styles.toggleButtonActive : ""}`}
              onClick={() => setUnreadOnly((value) => !value)}
            >
              {unreadOnly ? "Unread only" : "All threads"}
            </button>
          </div>
          <div className={styles.threadList}>
            {!status?.configured ? (
              <div className={styles.emptyState}>
                Додай `GOOGLE_GMAIL_CLIENT_ID`, `GOOGLE_GMAIL_CLIENT_SECRET` і
                `GOOGLE_GMAIL_REDIRECT_URI` на backend, щоб активувати модуль.
              </div>
            ) : !status?.connected ? (
              <div className={styles.emptyState}>
                Gmail ще не підключено. Після `Connect Gmail` тут з’явиться
                список синхронізованих тредів.
              </div>
            ) : threadsQuery.isLoading ? (
              <div className={styles.loadingState}>
                Оновлення списку тредів…
              </div>
            ) : threads.length === 0 ? (
              <div className={styles.emptyState}>
                За поточним фільтром немає жодного треду. Спробуй `Sync now` або
                вимкни unread-фільтр.
              </div>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  className={`${styles.threadCard} ${selectedThreadId === thread.id ? styles.threadCardActive : ""}`}
                  onClick={() => setSelectedThreadId(thread.id)}
                >
                  <div className={styles.threadTopRow}>
                    <h4 className={styles.threadSubject}>
                      {thread.subject || "(Без теми)"}
                    </h4>
                    <span className={styles.threadDate}>
                      {compactDate(thread.lastMessageAt)}
                    </span>
                  </div>
                  <div className={styles.threadMeta}>
                    {thread.unreadCount > 0 && (
                      <span
                        className={`${styles.chip} ${styles.chipHighlight}`}
                      >
                        Unread {thread.unreadCount}
                      </span>
                    )}
                    <span className={styles.chip}>
                      {thread.messageCount} msg
                    </span>
                  </div>
                  <div className={styles.threadParticipants}>
                    {(thread.participants ?? []).join(", ") || "Без учасників"}
                  </div>
                  <div className={styles.threadSnippet}>
                    {thread.snippet || "Без фрагмента листа."}
                  </div>
                </button>
              ))
            )}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Тред</span>
              <h3 className={styles.panelTitle}>Деталі листування</h3>
            </div>
          </div>
          <div className={styles.threadBody}>
            {!selectedThreadId ? (
              <div className={styles.emptyState}>
                Обери тред зліва, щоб побачити історію повідомлень і форму
                відповіді.
              </div>
            ) : threadQuery.isLoading ? (
              <div className={styles.loadingState}>
                Завантаження листування…
              </div>
            ) : !detail ? (
              <div className={styles.emptyState}>
                Не вдалося завантажити тред. Спробуй ще раз після синхронізації.
              </div>
            ) : (
              <>
                <section className={styles.detailHero}>
                  <div className={styles.threadTopRow}>
                    <h4 className={styles.threadSubject}>
                      {selectedThread?.subject || "(Без теми)"}
                    </h4>
                    <span className={styles.threadDate}>
                      {compactDate(selectedThread?.lastMessageAt ?? null)}
                    </span>
                  </div>
                  <div className={styles.threadMeta}>
                    <span className={styles.chip}>
                      {(selectedThread?.participants ?? []).length} participants
                    </span>
                    <span className={styles.chip}>
                      {selectedThread?.messageCount ?? 0} messages
                    </span>
                    {selectedThread && selectedThread.unreadCount > 0 && (
                      <span
                        className={`${styles.chip} ${styles.chipHighlight}`}
                      >
                        Unread {selectedThread.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className={styles.detailActions}>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={handleMarkRead}
                      disabled={
                        !selectedThread ||
                        selectedThread.unreadCount === 0 ||
                        markReadMutation.isPending
                      }
                    >
                      Mark as read
                    </button>
                    <button
                      type="button"
                      className={styles.ghostButton}
                      onClick={handleSync}
                      disabled={!status?.connected || syncMutation.isPending}
                    >
                      Refresh thread
                    </button>
                  </div>
                </section>

                <section className={styles.messages}>
                  {detail.messages.map((message) => (
                    <article
                      key={message.id}
                      className={`${styles.messageCard} ${message.isInbound ? styles.messageInbound : styles.messageOutbound}`}
                    >
                      <div className={styles.messageTop}>
                        <div className={styles.messageTitle}>
                          <span className={styles.messageSender}>
                            {message.from}
                          </span>
                          <span className={styles.messageRecipients}>
                            To: {message.to.join(", ") || "—"}
                            {message.cc.length > 0
                              ? ` • Cc: ${message.cc.join(", ")}`
                              : ""}
                          </span>
                        </div>
                        <span className={styles.messageDate}>
                          {formatWhen(message.internalDate)}
                        </span>
                      </div>
                      <pre className={styles.messageBody}>
                        {message.plainTextBody ||
                          message.snippet ||
                          "(Порожній лист)"}
                      </pre>
                    </article>
                  ))}
                </section>

                <section className={styles.replyPanel}>
                  <span className={styles.panelEyebrow}>Відповідь</span>
                  <textarea
                    className={styles.textarea}
                    value={replyBody}
                    onChange={(event) => setReplyBody(event.target.value)}
                    placeholder="Напиши відповідь зі спільної Gmail-скриньки…"
                  />
                  <div className={styles.detailActions}>
                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={handleReply}
                      disabled={!replyBody.trim() || replyMutation.isPending}
                    >
                      Send reply
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
