import type { ChatRoom, ChatMessage } from "../types";

export function formatUnreadCount(count: number): string {
  if (!Number.isFinite(count) || count <= 0) return "";
  return count > 99 ? "99+" : String(count);
}

export function applyIncomingMessage(
  rooms: ChatRoom[],
  groupId: string,
  message: Pick<ChatMessage, "text" | "senderName" | "createdAt">,
  { isActiveRoom }: { isActiveRoom: boolean },
): ChatRoom[] {
  return rooms.map((room) =>
    room.groupId === groupId
      ? {
          ...room,
          lastMessage: {
            text: message.text,
            senderName: message.senderName,
            createdAt: message.createdAt,
          },
          unreadCount: isActiveRoom ? 0 : room.unreadCount + 1,
        }
      : room,
  );
}

export function markRoomRead(rooms: ChatRoom[], groupId: string): ChatRoom[] {
  return rooms.map((room) =>
    room.groupId === groupId && room.unreadCount !== 0
      ? { ...room, unreadCount: 0 }
      : room,
  );
}

export function hasRoom(rooms: ChatRoom[], groupId: string): boolean {
  return rooms.some((room) => room.groupId === groupId);
}
