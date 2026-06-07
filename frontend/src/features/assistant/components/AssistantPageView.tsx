"use client";

import { useEffect, useState } from "react";
import { useAssistant } from "../store/AssistantProvider";
import { useAssistantContext } from "../hooks/useAssistantContext";
import { useAuth } from "@/components/auth/AuthProvider";
import { readStoredToken } from "@/lib/auth/authClient";
import { fetchSuggestions } from "../api/assistantApi";
import { AssistantSessionsPanel } from "./AssistantSessionsPanel";
import { AssistantMessageList } from "./AssistantMessageList";
import { AssistantComposer } from "./AssistantComposer";
import { AssistantSourcesPanel } from "./AssistantSourcesPanel";
import { AssistantLimitBanner } from "./AssistantLimitBanner";
import {
  AssistantRolePicker,
  ROLE_LABELS,
} from "./AssistantRolePicker";
import type { AssistantRole } from "../types";
import styles from "./AssistantPageView.module.scss";

export function AssistantPageView() {
  const {
    sessions,
    activeSessionId,
    messages,
    isStreaming,
    limitHit,
    sources,
    loadSessions,
    selectSession,
    deleteSession,
    sendMessage,
    submitFeedback,
    clearSession,
  } = useAssistant();

  const context = useAssistantContext();
  const { isAuthenticated } = useAuth();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [token] = useState<string | null>(() => readStoredToken());
  const [mobileTab, setMobileTab] = useState<"chat" | "sessions" | "sources">(
    "chat",
  );
  const [selectedRole, setSelectedRole] = useState<AssistantRole | null>(null);

  useEffect(() => {
    fetchSuggestions()
      .then(setSuggestions)
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      loadSessions(token).catch(() => null);
    }
  }, [isAuthenticated, token, loadSessions]);

  function handleSend(text: string) {
    sendMessage(
      text,
      { ...context, role: selectedRole ?? "general" },
      token || undefined,
    );
  }

  function handleSelectSession(id: string) {
    if (token) selectSession(id, token);
  }

  function handleDeleteSession(id: string) {
    if (token) deleteSession(id, token);
  }

  function handleNewSession() {
    clearSession();
    setSelectedRole(null);
  }

  function handleFeedback(messageId: string, value: 1 | -1) {
    submitFeedback(messageId, value, token || undefined);
  }

  return (
    <div className={styles.page}>
      {/* Mobile tab bar */}
      <div className={styles.mobileTabs}>
        <button
          type="button"
          className={`${styles.mobileTab} ${mobileTab === "sessions" ? styles.mobileTabActive : ""}`}
          onClick={() => setMobileTab("sessions")}
        >
          Сесії
        </button>
        <button
          type="button"
          className={`${styles.mobileTab} ${mobileTab === "chat" ? styles.mobileTabActive : ""}`}
          onClick={() => setMobileTab("chat")}
        >
          Чат
        </button>
        <button
          type="button"
          className={`${styles.mobileTab} ${mobileTab === "sources" ? styles.mobileTabActive : ""}`}
          onClick={() => setMobileTab("sources")}
        >
          Джерела
        </button>
      </div>

      <div className={styles.layout}>
        {/* Left: Sessions */}
        <div
          className={`${styles.col} ${styles.colSessions} ${mobileTab === "sessions" ? styles.mobileVisible : styles.mobileHidden}`}
        >
          {isAuthenticated ? (
            <AssistantSessionsPanel
              sessions={sessions}
              activeId={activeSessionId}
              onSelect={handleSelectSession}
              onDelete={handleDeleteSession}
              onNew={handleNewSession}
            />
          ) : (
            <div className={styles.authHint}>
              <p>Увійдіть, щоб зберігати історію розмов.</p>
            </div>
          )}
        </div>

        {/* Center: Chat */}
        <div
          className={`${styles.col} ${styles.colChat} ${mobileTab === "chat" ? styles.mobileVisible : styles.mobileHidden}`}
        >
          <div className={styles.chatHeader}>
            <h1 className={styles.chatTitle}>Lex — AI Помічник</h1>
            {selectedRole && (
              <span className={styles.roleChip}>
                {ROLE_LABELS[selectedRole]}
              </span>
            )}
            {context.contextLawId && (
              <span className={styles.contextChip}>
                {context.mode === "article"
                  ? `Стаття ${context.contextArticleNum} · ${context.contextLawId}`
                  : context.contextLawId}
              </span>
            )}
            {selectedRole && messages.length === 0 && (
              <button
                type="button"
                className={styles.changeRoleBtn}
                onClick={() => setSelectedRole(null)}
              >
                Змінити роль
              </button>
            )}
          </div>

          {limitHit && (
            <div className={styles.bannerWrap}>
              <AssistantLimitBanner
                used={limitHit.used}
                limit={limitHit.limit}
                resetAt={limitHit.resetAt}
              />
            </div>
          )}

          {!selectedRole && messages.length === 0 ? (
            <AssistantRolePicker onSelect={setSelectedRole} />
          ) : (
            <>
              <AssistantMessageList
                messages={messages}
                onFeedback={handleFeedback}
              />
              <AssistantComposer
                onSend={handleSend}
                disabled={isStreaming || !!limitHit}
                suggestions={messages.length === 0 ? suggestions : []}
              />
            </>
          )}
        </div>

        {/* Right: Sources */}
        <div
          className={`${styles.col} ${styles.colSources} ${mobileTab === "sources" ? styles.mobileVisible : styles.mobileHidden}`}
        >
          <AssistantSourcesPanel sources={sources} />
        </div>
      </div>
    </div>
  );
}
