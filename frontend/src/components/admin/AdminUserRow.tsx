"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info, MoreVertical } from "lucide-react";
import { formatDateShort } from "@/lib/utils";
import {
  formatAccountSourceLabel,
  formatAccountTypeLabel,
} from "./adminLabels";
import type { AdminAccountSummary } from "@/lib/auth/mockAuth";
import styles from "./AdminWorkspace.module.scss";

type AccountAction =
  | "deactivate"
  | "promote"
  | "setLegislator"
  | "setSupervisor"
  | "forceLogout";

export interface AdminUserRowProps {
  account: AdminAccountSummary;
  onAction: (action: AccountAction, id: string, name: string) => void;
}

const AVATAR_COLORS = [
  { bg: "rgba(200,168,67,0.2)", text: "#c8a843" },
  { bg: "rgba(74,128,212,0.2)", text: "#4a80d4" },
  { bg: "rgba(82,183,136,0.2)", text: "#52b788" },
  { bg: "rgba(233,119,75,0.2)", text: "#e9774b" },
  { bg: "rgba(233,30,154,0.2)", text: "#e91e9a" },
  { bg: "rgba(139,195,74,0.2)", text: "#8bc34a" },
];

function hashColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

interface PortalMenuProps {
  open: boolean;
  pos: { top: number; left: number };
  width: number;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  children: React.ReactNode;
}

function PortalMenu({
  open,
  pos,
  width,
  onClose,
  triggerRef,
  children,
}: PortalMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    function onScroll() {
      onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handle);
    window.addEventListener("scroll", onScroll, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handle);
      window.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, triggerRef]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={ref}
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
        width,
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

export function AdminUserRow({ account, onAction }: AdminUserRowProps) {
  const isInactive = account.status === "inactive";
  const isDev = account.source === "dev";
  const isLegislator = account.roles?.includes("legislator") ?? false;
  const isSupervisor = account.roles?.includes("supervisor") ?? false;
  const avatarColor = hashColor(account.displayName);

  const [activePanel, setActivePanel] = useState<null | "info" | "actions">(
    null,
  );
  const [infoPos, setInfoPos] = useState({ top: 0, left: 0 });
  const [actionsPos, setActionsPos] = useState({ top: 0, left: 0 });

  const infoTriggerRef = useRef<HTMLButtonElement>(null);
  const actionsTriggerRef = useRef<HTMLButtonElement>(null);

  const openInfo = useCallback(() => {
    if (!infoTriggerRef.current) return;
    const r = infoTriggerRef.current.getBoundingClientRect();
    setInfoPos({
      top: r.bottom + 6,
      left: Math.max(
        8,
        Math.min(
          r.left,
          (typeof window !== "undefined" ? window.innerWidth : 1200) - 292,
        ),
      ),
    });
    setActivePanel("info");
  }, []);

  const openActions = useCallback(() => {
    if (!actionsTriggerRef.current) return;
    const r = actionsTriggerRef.current.getBoundingClientRect();
    setActionsPos({
      top: r.bottom + 6,
      left: Math.max(8, r.right - 224),
    });
    setActivePanel("actions");
  }, []);

  const toggleInfo = useCallback(
    () => (activePanel === "info" ? setActivePanel(null) : openInfo()),
    [activePanel, openInfo],
  );
  const toggleActions = useCallback(
    () => (activePanel === "actions" ? setActivePanel(null) : openActions()),
    [activePanel, openActions],
  );
  const close = useCallback(() => setActivePanel(null), []);

  const handleAction = useCallback(
    (action: AccountAction) => {
      setActivePanel(null);
      onAction(action, account.id, account.displayName);
    },
    [onAction, account.id, account.displayName],
  );

  return (
    <>
      <div className={styles.accountRow}>
        {/* Identity */}
        <div className={styles.accountIdentity}>
          <div
            className={styles.accountAvatar}
            style={{ background: avatarColor.bg, color: avatarColor.text }}
          >
            {account.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className={styles.accountName}>{account.displayName}</div>
            <div className={styles.accountEmail}>{account.email}</div>
          </div>
        </div>

        {/* 2 core badges */}
        <div className={styles.accountCoreBadges}>
          <span className={styles.accountBadge}>
            {formatAccountTypeLabel(account.accountType)}
          </span>
          <span
            className={
              isInactive ? styles.accountBadgeDanger : styles.accountBadgeAccent
            }
          >
            {isInactive ? "✕ Неактивний" : "✓ Активний"}
          </span>
        </div>

        {/* Info trigger */}
        <button
          ref={infoTriggerRef}
          type="button"
          className={`${styles.rowIconBtn} ${activePanel === "info" ? styles.rowIconBtnActive : ""}`}
          onClick={toggleInfo}
          title="Дані акаунта"
        >
          <Info size={14} />
        </button>

        {/* Actions trigger */}
        <button
          ref={actionsTriggerRef}
          type="button"
          className={`${styles.rowIconBtn} ${activePanel === "actions" ? styles.rowIconBtnActive : ""}`}
          onClick={toggleActions}
          title="Дії"
        >
          <MoreVertical size={14} />
        </button>
      </div>

      {/* Info popover — portal */}
      <PortalMenu
        open={activePanel === "info"}
        pos={infoPos}
        width={280}
        onClose={close}
        triggerRef={infoTriggerRef}
      >
        <div className={styles.rowPopover}>
          <div className={styles.rowPopoverTitle}>Дані акаунта</div>
          <dl className={styles.rowPopoverGrid}>
            <dt>Тип</dt>
            <dd>{formatAccountTypeLabel(account.accountType)}</dd>

            <dt>Роль</dt>
            <dd className={styles.rowPopoverAccent}>
              {isLegislator
                ? "Законотворець"
                : isSupervisor
                  ? "Супервізер"
                  : account.accountType === "admin"
                    ? "Адміністратор"
                    : "Клієнт"}
            </dd>

            <dt>Джерело</dt>
            <dd>{formatAccountSourceLabel(account.source)}</dd>

            <dt>Статус</dt>
            <dd
              className={
                isInactive ? styles.rowPopoverDanger : styles.rowPopoverAccent
              }
            >
              {isInactive ? "Неактивний" : "Активний"}
            </dd>

            {account.superCodeProtected && (
              <>
                <dt>Супер-код</dt>
                <dd className={styles.rowPopoverAccent}>Захищений</dd>
              </>
            )}

            <dt>Створено</dt>
            <dd>{formatDateShort(account.createdAt)}</dd>

            <dt>Вхід</dt>
            <dd>
              {account.lastLoginAt
                ? formatDateShort(account.lastLoginAt)
                : "ніколи"}
            </dd>

            <dt>ID</dt>
            <dd className={styles.rowPopoverMono}>…{account.id.slice(-8)}</dd>
          </dl>
        </div>
      </PortalMenu>

      {/* Actions menu — portal */}
      <PortalMenu
        open={activePanel === "actions"}
        pos={actionsPos}
        width={224}
        onClose={close}
        triggerRef={actionsTriggerRef}
      >
        <div className={styles.rowActionsMenu}>
          <button
            type="button"
            className={styles.rowActionItem}
            onClick={() => {
              setActivePanel(null);
              window.open(`/admin/users/${account.id}`, "_blank");
            }}
          >
            Відкрити профіль →
          </button>
          <div className={styles.rowActionsMenuDivider} />
          <button
            type="button"
            className={styles.rowActionItem}
            disabled={isDev}
            onClick={() => handleAction("deactivate")}
          >
            {isInactive ? "Активувати" : "Деактивувати"}
          </button>

          <button
            type="button"
            className={styles.rowActionItem}
            disabled={isDev}
            onClick={() => handleAction("promote")}
          >
            {account.accountType === "admin"
              ? "Знизити роль"
              : "Підвищити до адміна"}
          </button>

          {account.accountType !== "admin" && (
            <button
              type="button"
              className={styles.rowActionItem}
              disabled={isDev}
              onClick={() => handleAction("setLegislator")}
            >
              {isLegislator ? "Зняти законотворця" : "Призначити законотворця"}
            </button>
          )}

          {account.accountType !== "admin" && (
            <button
              type="button"
              className={styles.rowActionItem}
              disabled={isDev}
              onClick={() => handleAction("setSupervisor")}
            >
              {isSupervisor ? "Зняти супервізера" : "Призначити супервізером"}
            </button>
          )}

          <div className={styles.rowActionsMenuDivider} />

          <button
            type="button"
            className={`${styles.rowActionItem} ${styles.rowActionItemDanger}`}
            onClick={() => handleAction("forceLogout")}
          >
            Вийти примусово
          </button>
        </div>
      </PortalMenu>
    </>
  );
}
