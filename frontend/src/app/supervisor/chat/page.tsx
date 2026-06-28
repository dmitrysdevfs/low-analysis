"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { MessageCircle, Menu, SendHorizontal, Users, X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROUTES } from "@/constants/routes";
import {
  RoleAccessGate,
  RoleHydrationShell,
  RoleWorkspace,
  formatUkDate,
  formatUkTime,
} from "@/features/role-workspace/roleWorkspace";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGroupChatRooms,
  useInvalidateRooms,
  ROOMS_KEY,
} from "@/features/group-chat/hooks/useGroupChatRooms";
import { useGroupChatMessages } from "@/features/group-chat/hooks/useGroupChatMessages";
import { useGroupChatSocket } from "@/features/group-chat/hooks/useGroupChatSocket";
import { sendWsMessage } from "@/features/group-chat/lib/chatSocket";
import {
  applyIncomingMessage,
  markRoomRead,
  hasRoom,
  formatUnreadCount,
} from "@/features/group-chat/lib/unread";
import {
  broadcastRoomRead,
  onRoomRead,
} from "@/features/group-chat/lib/readBroadcast";
import { markRead } from "@/features/group-chat/api/groupChatApi";
import { useWindowWidth } from "@/hooks/useWindowWidth";
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

export default function SupervisorChatPage() {
  const { user, isSupervisor, isAdmin, isHydrated } = useAuth();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [roomsDrawerOpen, setRoomsDrawerOpen] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const isMobile = useWindowWidth() <= 980;

  const { data: rooms = [], isLoading: roomsLoading } = useGroupChatRooms();
  const invalidateRooms = useInvalidateRooms();
  const qc = useQueryClient();

  const patchRooms = useCallback(
    (updater: (rooms: ChatRoom[]) => ChatRoom[]) => {
      qc.setQueryData<ChatRoom[]>(ROOMS_KEY, (prev) =>
        prev ? updater(prev) : prev,
      );
    },
    [qc],
  );

  const markRoomReadEverywhere = useCallback(
    (groupId: string) => {
      patchRooms((prev) => markRoomRead(prev, groupId));
      markRead(groupId).catch(() => {});
      broadcastRoomRead(groupId);
    },
    [patchRooms],
  );

  // Another tab marked a group read — clear its badge here too.
  useEffect(
    () =>
      onRoomRead((groupId) =>
        patchRooms((prev) => markRoomRead(prev, groupId)),
      ),
    [patchRooms],
  );

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
        const { groupId, message } = event;
        const isActive = groupId === selectedGroupId;
        if (isActive) {
          appendMessage(message);
          markRoomReadEverywhere(groupId);
        }
        // Flicker-free optimistic update; refetch only for an unknown room.
        if (hasRoom(rooms, groupId)) {
          patchRooms((prev) =>
            applyIncomingMessage(prev, groupId, message, {
              isActiveRoom: isActive,
            }),
          );
        } else {
          invalidateRooms();
        }
      }
      if (event.type === "message.ack" && event.groupId && event.message) {
        const { groupId, message } = event;
        if (event.optimisticId) {
          confirmOptimistic(event.optimisticId, message);
        } else if (groupId === selectedGroupId) {
          appendMessage(message);
        }
        if (hasRoom(rooms, groupId)) {
          patchRooms((prev) =>
            applyIncomingMessage(prev, groupId, message, {
              isActiveRoom: true,
            }),
          );
        } else {
          invalidateRooms();
        }
      }
    },
    [
      selectedGroupId,
      rooms,
      appendMessage,
      confirmOptimistic,
      invalidateRooms,
      patchRooms,
      markRoomReadEverywhere,
    ],
  );

  useGroupChatSocket(handleWsEvent);

  function selectGroup(groupId: string) {
    setSelectedGroupId(groupId);
    markRoomReadEverywhere(groupId);
    setRoomsDrawerOpen(false);
  }

  function handleSendMessage() {
    const text = inputValue.trim();
    if (!text || !selectedGroupId) return;

    const optimisticId = `opt-${Date.now()}`;
    const optimistic: ChatMessage = {
      _id: optimisticId,
      senderId: user?.id ?? "",
      senderName: user?.displayName ?? "Supervisor",
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

  if (!isSupervisor && !isAdmin) {
    return (
      <RoleAccessGate
        eyebrow="SUPERVISOR ACCESS"
        title="Чати груп доступні лише для ролі Supervisor"
        text="Цей канал потрібен для координації груп, коментарів до правок і швидких рішень по поточних законопроєктах."
        primaryHref={ROUTES.rolesSupervisorRequest}
        primaryLabel="Подати запит на роль Супервізора"
        secondaryHref={ROUTES.rolesSupervisor}
        secondaryLabel="Про роль Supervisor"
      />
    );
  }

  const initials = (user?.displayName ?? "SV").slice(0, 2).toUpperCase();
  const roleLabel = isAdmin ? "Адміністратор" : "Супервізер";
  const activeRoom = rooms.find((r) => r.groupId === selectedGroupId) ?? null;

  return (
    <RoleWorkspace
      role="supervisor"
      initials={initials}
      name={user?.displayName ?? "Supervisor"}
      roleLabel={roleLabel}
    >
      <div className={`${shellStyles.page} ${styles.chatPage}`}>
        <section className={`${shellStyles.panel} ${styles.heroPanel}`}>
          <div className={shellStyles.pageHeaderLeft}>
            <span className={shellStyles.eyebrow}>SUPERVISOR · ЧАТ</span>
            <h1 className={shellStyles.pageTitle}>Чати груп</h1>
            <p className={shellStyles.pageSubtitle}>
              Окремий простір для координації студентів, постановки задач і
              швидкого фідбеку по форках, пропозиціях та дифах.
            </p>
          </div>
        </section>

        <section className={`${shellStyles.panel} ${styles.chatShell}`}>
          {roomsDrawerOpen && (
            <button
              type="button"
              aria-label="Закрити список чатів"
              className={styles.drawerBackdrop}
              onClick={() => setRoomsDrawerOpen(false)}
            />
          )}
          <aside
            className={`${styles.threadColumn} ${roomsDrawerOpen ? styles.threadColumnOpen : ""}`}
          >
            <div className={styles.columnHeader}>
              <h2>Чати груп</h2>
              <div className={styles.columnHeaderRight}>
                <span>{rooms.length}</span>
                <button
                  type="button"
                  className={styles.drawerClose}
                  aria-label="Закрити список чатів"
                  onClick={() => setRoomsDrawerOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className={styles.threadList}>
              {roomsLoading && (
                <div className={styles.inlineEmpty}>Завантаження...</div>
              )}
              {!roomsLoading && rooms.length === 0 && (
                <div className={styles.inlineEmpty}>Груп ще немає</div>
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
                      {formatUnreadCount(room.unreadCount)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </aside>

          <div className={styles.messagesColumn}>
            {!activeRoom ? (
              <>
                <header className={styles.chatHeader}>
                  <div />
                  <button
                    type="button"
                    className={styles.roomsToggle}
                    aria-label="Показати список чатів"
                    onClick={() => setRoomsDrawerOpen(true)}
                  >
                    <Menu size={20} />
                  </button>
                </header>
                <div className={shellStyles.emptyState}>
                  <MessageCircle size={34} className={styles.emptyIcon} />
                  <p className={shellStyles.emptyTitle}>
                    Ще немає активного чату
                  </p>
                  <p className={shellStyles.emptyText}>
                    Коли з&apos;являться групи або повідомлення, вони
                    відображатимуться тут.
                  </p>
                </div>
              </>
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
                  <button
                    type="button"
                    className={styles.roomsToggle}
                    aria-label="Показати список чатів"
                    onClick={() => setRoomsDrawerOpen(true)}
                  >
                    <Menu size={20} />
                  </button>
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
                    placeholder={
                      isMobile
                        ? "Повідомлення"
                        : "Напишіть повідомлення групі. Enter — надіслати, Shift+Enter — новий рядок."
                    }
                    rows={isMobile ? 1 : 3}
                  />
                  <div className={styles.composerFooter}>
                    <span className={styles.composerHint}>
                      Enter для відправки, Shift+Enter для нового рядка
                    </span>
                    <button
                      type="button"
                      className={`btn btn-primary ${styles.sendButton}`}
                      onClick={handleSendMessage}
                      aria-label="Надіслати"
                    >
                      <span className={styles.sendLabel}>Надіслати</span>
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
