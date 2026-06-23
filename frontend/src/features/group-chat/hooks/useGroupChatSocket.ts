"use client";

import { useEffect, useRef } from "react";
import { initChatSocket, addWsHandler } from "../lib/chatSocket";
import type { WsEvent } from "../types";

export function useGroupChatSocket(onEvent: (e: WsEvent) => void) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    initChatSocket();
    const remove = addWsHandler((e) => handlerRef.current(e));
    return remove;
  }, []); // init once, handler always up-to-date via ref
}
