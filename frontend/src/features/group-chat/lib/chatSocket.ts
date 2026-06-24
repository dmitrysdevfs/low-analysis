"use client";

import type { WsEvent } from "../types";

type EventHandler = (event: WsEvent) => void;

const WS_URL: string =
  process.env.NEXT_PUBLIC_CHAT_WS_URL ??
  (typeof window !== "undefined"
    ? `ws://${window.location.hostname}:3000/ws/chat`
    : "ws://localhost:3000/ws/chat");

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempt = 0;
let initialized = false;
const handlers = new Set<EventHandler>();

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      sessionStorage.getItem("low-analysis.auth.session") ??
      localStorage.getItem("low-analysis.auth.token");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token ?? parsed ?? null;
  } catch {
    return null;
  }
}

function connect() {
  if (socket && socket.readyState < 2) return;

  try {
    socket = new WebSocket(WS_URL);
  } catch {
    scheduleReconnect();
    return;
  }

  socket.onopen = () => {
    reconnectAttempt = 0;
    const token = getToken();
    if (token) {
      socket!.send(JSON.stringify({ type: "auth", token }));
    }
  };

  socket.onmessage = (event) => {
    try {
      const data: WsEvent = JSON.parse(event.data as string);
      handlers.forEach((h) => h(data));
    } catch {
      // ignore malformed
    }
  };

  socket.onclose = () => {
    socket = null;
    scheduleReconnect();
  };

  socket.onerror = () => {
    socket?.close();
  };
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), 30_000);
  reconnectAttempt += 1;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, delay);
}

export function initChatSocket() {
  if (typeof window === "undefined") return;
  if (!initialized) {
    initialized = true;
    connect();
  }
}

export function disconnectChatSocket() {
  initialized = false;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  socket?.close();
  socket = null;
}

export function sendWsMessage(payload: object) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

export function addWsHandler(handler: EventHandler): () => void {
  handlers.add(handler);
  return () => handlers.delete(handler);
}
