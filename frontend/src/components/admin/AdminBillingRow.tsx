"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info, MoreVertical } from "lucide-react";
import { formatDateShort } from "@/lib/utils";
import { formatAccountTypeLabel, formatPlanLabel } from "./adminLabels";
import styles from "./AdminWorkspace.module.scss";

type BillingEntry = {
  id: string;
  displayName: string;
  email: string;
  accountType: "admin" | "client";
  status: "active" | "inactive";
  createdAt: string;
  subscription: {
    planId: string | null;
    status: string;
    searchLimit: number | null;
    viewLimit: number | null;
    searchRemaining: number | null;
    viewRemaining: number | null;
    endsAt: string | null;
  };
};

export interface AdminBillingRowProps {
  account: BillingEntry;
  clientPlanIds: readonly string[];
  onRequestPlan: (
    accountId: string,
    accountName: string,
    planId: string,
  ) => void;
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

export function AdminBillingRow({
  account,
  clientPlanIds,
  onRequestPlan,
}: AdminBillingRowProps) {
  const avatarColor = hashColor(account.displayName);
  const isAdmin = account.accountType === "admin";
  const sub = account.subscription;

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
    setActionsPos({ top: r.bottom + 6, left: Math.max(8, r.right - 224) });
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

  return (
    <>
      <div className={styles.accountRow}>
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

        <div className={styles.accountCoreBadges}>
          <span className={styles.accountBadge}>
            {formatAccountTypeLabel(account.accountType)}
          </span>
          <span className={styles.accountBadge}>
            {formatPlanLabel(sub.planId)}
          </span>
        </div>

        <button
          ref={infoTriggerRef}
          type="button"
          className={`${styles.rowIconBtn} ${activePanel === "info" ? styles.rowIconBtnActive : ""}`}
          onClick={toggleInfo}
          title="Білінг-дані"
        >
          <Info size={14} />
        </button>

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

      <PortalMenu
        open={activePanel === "info"}
        pos={infoPos}
        width={280}
        onClose={close}
        triggerRef={infoTriggerRef}
      >
        <div className={styles.rowPopover}>
          <div className={styles.rowPopoverTitle}>Білінг-дані</div>
          <dl className={styles.rowPopoverGrid}>
            <dt>Тип</dt>
            <dd>{formatAccountTypeLabel(account.accountType)}</dd>

            <dt>План</dt>
            <dd>{formatPlanLabel(sub.planId)}</dd>

            <dt>Статус</dt>
            <dd
              className={
                sub.status === "active"
                  ? styles.rowPopoverAccent
                  : styles.rowPopoverDanger
              }
            >
              {sub.status === "active"
                ? "Активний"
                : sub.status === "trialing"
                  ? "Тріал"
                  : sub.status === "expired"
                    ? "Прострочений"
                    : "Неактивний"}
            </dd>

            <dt>Пошук</dt>
            <dd>
              {sub.searchRemaining === null
                ? "безліміт"
                : `${sub.searchRemaining} / ${sub.searchLimit}`}
            </dd>

            <dt>Перегляди</dt>
            <dd>
              {sub.viewRemaining === null
                ? "безліміт"
                : `${sub.viewRemaining} / ${sub.viewLimit}`}
            </dd>

            <dt>Платіжний цикл</dt>
            <dd>
              {sub.endsAt ? `до ${formatDateShort(sub.endsAt)}` : "Немає"}
            </dd>

            <dt>Створено</dt>
            <dd>
              {account.createdAt ? formatDateShort(account.createdAt) : "—"}
            </dd>
          </dl>
        </div>
      </PortalMenu>

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
          {!isAdmin && (
            <>
              <div className={styles.rowActionsMenuDivider} />
              {clientPlanIds.map((planId) => (
                <button
                  key={planId}
                  type="button"
                  className={styles.rowActionItem}
                  onClick={() => {
                    setActivePanel(null);
                    onRequestPlan(account.id, account.displayName, planId);
                  }}
                >
                  Призначити: {formatPlanLabel(planId)}
                </button>
              ))}
            </>
          )}
        </div>
      </PortalMenu>
    </>
  );
}
