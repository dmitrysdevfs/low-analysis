"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { MessageCircle, SendHorizontal, Users } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROUTES } from "@/constants/routes";
import {
  RoleAccessGate,
  RoleHydrationShell,
  RoleWorkspace,
  formatUkDate,
  formatUkTime,
} from "@/features/role-workspace/roleWorkspace";
import {
  useGroupChatRooms,
  useInvalidateRooms,
} from "@/features/group-chat/hooks/useGroupChatRooms";
import { useGroupChatMessages } from "@/features/group-chat/hooks/useGroupChatMessages";
import { useGroupChatSocket } from "@/features/group-chat/hooks/useGroupChatSocket";
import { sendWsMessage } from "@/features/group-chat/lib/chatSocket";
import { markRead } from "@/features/group-chat/api/groupChatApi";
import type {
  ChatRoom,
  ChatMessage,
  WsEvent,
} from "@/features/group-chat/types";
import shellStyles from "@/features/role-workspace/roleWorkspace.module.scss";
import styles from "./page.module.scss";

function buildPreview(room: ChatRoom): string {
  if (!room.lastMessage) return "Ще немає повідомлень";
  return room.lastMessage.text.slice(0, 60);
}

export default function LegislatorChatPage() {
  const { user, isLegislator, isSupervisor, isAdmin, isHydrated } = useAuth();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const viewportRef = useRef<HTMLDivElement>(null);

  const { data: rooms = [], isLoading: roomsLoading } = useGroupChatRooms();
  const invalidateRooms = useInvalidateRooms();

  const {
    messages,
    isLoading: msgsLoading,
    appendMessage,
    confirmOptimistic,
    addOptimistic,
    hasMore,
    loadMore,
  } = useGroupChatMessages(selectedGroupId);

  // Auto-select first room
  useEffect(() => {
    if (rooms.length > 0 && !selectedGroupId) {
      setSelectedGroupId(rooms[0].groupId);
    }
  }, [rooms, selectedGroupId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = viewportRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleWsEvent = useCallback(
    (event: WsEvent) => {
      if (event.type === "message.new" && event.groupId && event.message) {
        if (event.groupId === selectedGroupId) {
          appendMessage(event.message);
          markRead(event.groupId).catch(() => {});
        }
        invalidateRooms();
      }
      if (event.type === "message.ack" && event.groupId && event.message) {
        const optimisticId = event.optimisticId;
        if (optimisticId) {
          confirmOptimistic(optimisticId, event.message);
        } else if (event.groupId === selectedGroupId) {
          appendMessage(event.message);
        }
        invalidateRooms();
      }
    },
    [selectedGroupId, appendMessage, confirmOptimistic, invalidateRooms],
  );

  useGroupChatSocket(handleWsEvent);

  function selectGroup(groupId: string) {
    setSelectedGroupId(groupId);
    markRead(groupId).catch(() => {});
    invalidateRooms();
  }

  function handleSendMessage() {
    const text = inputValue.trim();
    if (!text || !selectedGroupId) return;

    const optimisticId = `opt-${Date.now()}`;
    const optimistic: ChatMessage = {
      _id: optimisticId,
      senderId: user?.id ?? "",
      senderName: user?.displayName ?? "Законотворець",
      text,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    addOptimistic(optimistic);
    setInputValue("");

    sendWsMessage({
      type: "message.send",
      groupId: selectedGroupId,
      text,
      optimisticId,
    });
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }

  if (!isHydrated) return <RoleHydrationShell />;

  if (!isLegislator && !isSupervisor && !isAdmin) {
    return (
      <RoleAccessGate
        eyebrow="LAWMAKER ACCESS"
        title="Чат доступний лише для ролі Lawmaker"
        text="Це місце для комунікації із супервайзером та своєю групою під час роботи над форками, поправками й пропозиціями."
        primaryHref={ROUTES.rolesLawmaker}
        primaryLabel="Про роль Lawmaker"
        secondaryHref={ROUTES.help}
        secondaryLabel="Як отримати доступ"
      />
    );
  }

  const initials = (user?.displayName ?? "LM").slice(0, 2).toUpperCase();
  const roleLabel = isAdmin
    ? "Адміністратор"
    : isSupervisor && !isLegislator
      ? "Супервайзер"
      : "Законотворець";

  const activeRoom = rooms.find((r) => r.groupId === selectedGroupId) ?? null;

  return (
    <RoleWorkspace
      role="legislator"
      initials={initials}
      name={user?.displayName ?? "Законотворець"}
      roleLabel={roleLabel}
    >
      <div className={shellStyles.page}>
        <section className={`${shellStyles.panel} ${styles.heroPanel}`}>
          <div className={shellStyles.pageHeaderLeft}>
            <span className={shellStyles.eyebrow}>ЗАКОНОТВОРЕЦЬ · ЧАТ</span>
            <h1 className={shellStyles.pageTitle}>Чат моєї групи</h1>
            <p className={shellStyles.pageSubtitle}>
              Оперативний канал для синхронізації по поправках, задачах та
              підготовці форків у вашій поточній групі.
            </p>
          </div>
        </section>

        <section className={`${shellStyles.panel} ${styles.chatShell}`}>
          <aside className={styles.threadColumn}>
            <div className={styles.columnHeader}>
              <h2>Моя група</h2>
              <span>{rooms.length}</span>
            </div>

            <div className={styles.threadList}>
              {roomsLoading && (
                <div className={styles.inlineEmpty}>Завантаження...</div>
              )}
              {!roomsLoading && rooms.length === 0 && (
                <div className={styles.inlineEmpty}>
                  Ви ще не в жодній групі. Подайте заявку на сторінці Груп.
                </div>
              )}
              {rooms.map((room) => (
                <button
                  key={room.groupId}
                  type="button"
                  className={`${styles.threadItem} ${room.groupId === selectedGroupId ? styles.threadItemActive : ""}`}
                  onClick={() => selectGroup(room.groupId)}
                >
                  <span className={styles.avatar}>
                    {room.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className={styles.threadMeta}>
                    <strong>{room.name}</strong>
                    <span className={styles.threadPreview}>
                      {buildPreview(room)}
                    </span>
                  </span>
                  {room.unreadCount > 0 && (
                    <span className={styles.unreadBadge}>
                      {room.unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </aside>

          <div className={styles.messagesColumn}>
            {rooms.length === 0 && !roomsLoading ? (
              <div className={shellStyles.emptyState}>
                <MessageCircle size={34} className={styles.emptyIcon} />
                <p className={shellStyles.emptyTitle}>
                  Ви ще не в жодній групі.
                </p>
                <p className={shellStyles.emptyText}>
                  Подайте заявку на сторінці Груп, щоб отримати доступ до
                  командного чату й координації з супервайзером.
                </p>
              </div>
            ) : !activeRoom ? (
              <div className={shellStyles.emptyState}>
                <MessageCircle size={34} className={styles.emptyIcon} />
                <p className={shellStyles.emptyTitle}>Оберіть групу</p>
              </div>
            ) : (
              <>
                <header className={styles.chatHeader}>
                  <div>
                    <h2>{activeRoom.name}</h2>
                    <p>
                      <Users size={14} />
                      {activeRoom.course}
                    </p>
                  </div>
                </header>

                <div className={styles.messagesViewport} ref={viewportRef}>
                  {hasMore && (
                    <button
                      type="button"
                      style={{
                        display: "block",
                        margin: "8px auto",
                        fontSize: "0.8rem",
                        background: "none",
                        border: "none",
                        color: "var(--color-smoke)",
                        cursor: "pointer",
                      }}
                      onClick={loadMore}
                    >
                      Завантажити раніші
                    </button>
                  )}
                  {msgsLoading && (
                    <p
                      style={{
                        textAlign: "center",
                        color: "var(--color-smoke)",
                        fontSize: "0.85rem",
                        padding: 16,
                      }}
                    >
                      Завантаження...
                    </p>
                  )}
                  {messages.map((message) => {
                    const isMine = message.senderId === user?.id;
                    return (
                      <div
                        key={message._id}
                        className={`${styles.messageRow} ${isMine ? styles.messageRowMine : ""}`}
                        style={{ opacity: message.pending ? 0.6 : 1 }}
                      >
                        <div className={styles.messageBubble}>
                          <div className={styles.messageMeta}>
                            <strong>{message.senderName}</strong>
                            <span>
                              {formatUkDate(message.createdAt)} ·{" "}
                              {formatUkTime(message.createdAt)}
                            </span>
                          </div>
                          <p>{message.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={styles.composer}>
                  <textarea
                    className={styles.composerInput}
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    placeholder="Напишіть повідомлення для своєї групи. Enter — надіслати, Shift+Enter — новий рядок."
                    rows={3}
                  />
                  <div className={styles.composerFooter}>
                    <span className={styles.composerHint}>
                      Enter для відправки, Shift+Enter для нового рядка
                    </span>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSendMessage}
                    >
                      Надіслати
                      <SendHorizontal size={14} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </RoleWorkspace>
  );
}
