export interface ChatRoom {
  groupId: string;
  name: string;
  course: string;
  lastMessage: {
    text: string;
    senderName: string;
    createdAt: string;
  } | null;
  unreadCount: number;
}

export interface ChatMessage {
  _id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
  pending?: boolean;
}

export type WsEventType =
  | "auth.ok"
  | "auth.error"
  | "message.new"
  | "message.ack"
  | "typing.start"
  | "typing.stop"
  | "error";

export interface WsEvent {
  type: WsEventType;
  groupId?: string;
  message?: ChatMessage;
  optimisticId?: string;
  userId?: string;
  rooms?: string[];
  reason?: string;
}
