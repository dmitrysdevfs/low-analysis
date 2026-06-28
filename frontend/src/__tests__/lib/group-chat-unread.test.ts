import { describe, it, expect } from "vitest";
import {
  formatUnreadCount,
  applyIncomingMessage,
  markRoomRead,
  hasRoom,
} from "@/features/group-chat/lib/unread";
import type { ChatRoom } from "@/features/group-chat/types";

function room(overrides: Partial<ChatRoom> = {}): ChatRoom {
  return {
    groupId: "g1",
    name: "Group 1",
    course: "",
    lastMessage: null,
    unreadCount: 0,
    ...overrides,
  };
}

const msg = {
  text: "hello",
  senderName: "Bob",
  createdAt: "2026-06-27T10:00:00.000Z",
};

describe("formatUnreadCount", () => {
  it("hides the badge for non-positive / invalid counts", () => {
    expect(formatUnreadCount(0)).toBe("");
    expect(formatUnreadCount(-3)).toBe("");
    expect(formatUnreadCount(NaN)).toBe("");
  });

  it("shows the exact value up to 99", () => {
    expect(formatUnreadCount(1)).toBe("1");
    expect(formatUnreadCount(99)).toBe("99");
  });

  it("caps values above 99 as 99+", () => {
    expect(formatUnreadCount(100)).toBe("99+");
    expect(formatUnreadCount(152)).toBe("99+");
  });
});

describe("applyIncomingMessage", () => {
  it("bumps unread and updates last message for an inactive room", () => {
    const rooms = [room({ unreadCount: 2 }), room({ groupId: "g2" })];
    const next = applyIncomingMessage(rooms, "g1", msg, {
      isActiveRoom: false,
    });

    expect(next[0].unreadCount).toBe(3);
    expect(next[0].lastMessage).toEqual(msg);
    expect(next[1]).toBe(rooms[1]); // untouched room keeps its reference
  });

  it("keeps unread at 0 when the room is active", () => {
    const rooms = [room({ unreadCount: 5 })];
    const next = applyIncomingMessage(rooms, "g1", msg, { isActiveRoom: true });

    expect(next[0].unreadCount).toBe(0);
    expect(next[0].lastMessage).toEqual(msg);
  });

  it("leaves the list unchanged for an unknown group", () => {
    const rooms = [room({ unreadCount: 1 })];
    const next = applyIncomingMessage(rooms, "missing", msg, {
      isActiveRoom: false,
    });

    expect(next).toEqual(rooms);
  });
});

describe("markRoomRead", () => {
  it("resets unread to 0 for the matching room only", () => {
    const rooms = [
      room({ unreadCount: 7 }),
      room({ groupId: "g2", unreadCount: 4 }),
    ];
    const next = markRoomRead(rooms, "g1");

    expect(next[0].unreadCount).toBe(0);
    expect(next[1].unreadCount).toBe(4);
  });

  it("returns the same room reference when already read (no churn)", () => {
    const rooms = [room({ unreadCount: 0 })];
    const next = markRoomRead(rooms, "g1");

    expect(next[0]).toBe(rooms[0]);
  });
});

describe("hasRoom", () => {
  it("detects presence by groupId", () => {
    const rooms = [room({ groupId: "g1" })];
    expect(hasRoom(rooms, "g1")).toBe(true);
    expect(hasRoom(rooms, "g2")).toBe(false);
  });
});
