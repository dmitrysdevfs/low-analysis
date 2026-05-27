"use client";

import { useEffect, useRef } from "react";
import { AssistantFeedback } from "./AssistantFeedback";
import styles from "./AssistantMessageList.module.scss";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  feedback: 1 | -1 | null;
  isStreaming?: boolean;
}

interface Props {
  messages: Message[];
  onFeedback?: (messageId: string, value: 1 | -1) => void;
  fontSize?: number;
}

export function AssistantMessageList({
  messages,
  onFeedback,
  fontSize = 14,
}: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Задайте запитання про закони або скористайтесь підказками.</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`${styles.row} ${msg.role === "user" ? styles.userRow : styles.aiRow}`}
        >
          <div
            className={`${styles.bubble} ${msg.role === "user" ? styles.userBubble : styles.aiBubble}`}
            style={{ fontSize }}
          >
            <div className={styles.text}>{msg.content}</div>
            {msg.isStreaming && <span className={styles.cursor} />}
            {msg.role === "assistant" && !msg.isStreaming && onFeedback && (
              <AssistantFeedback
                messageId={msg.id}
                feedback={msg.feedback}
                onFeedback={onFeedback}
              />
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
