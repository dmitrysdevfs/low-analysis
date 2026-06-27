"use client";

const CHANNEL_NAME = "group-chat-read";

type ReadMessage = { type: "read"; groupId: string };

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (
    typeof window === "undefined" ||
    typeof BroadcastChannel === "undefined"
  ) {
    return null;
  }
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

export function broadcastRoomRead(groupId: string): void {
  getChannel()?.postMessage({ type: "read", groupId } satisfies ReadMessage);
}

export function onRoomRead(cb: (groupId: string) => void): () => void {
  const ch = getChannel();
  if (!ch) return () => {};
  const handler = (event: MessageEvent<ReadMessage>) => {
    if (event.data?.type === "read" && event.data.groupId) {
      cb(event.data.groupId);
    }
  };
  ch.addEventListener("message", handler);
  return () => ch.removeEventListener("message", handler);
}
