"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Key,
  History,
  Users,
  ShieldAlert,
  CalendarCheck,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Lock,
  Info,
  ChevronRight,
  Activity,
  Shield,
  Clock,
  Database,
} from "lucide-react";
import { formatDateShort } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { formatCodeStatusLabel as _formatCodeStatusLabel } from "./adminLabels";
import { useAdminWorkspace } from "./useAdminWorkspace";
import type { AdminAuditLogEntry } from "@/lib/auth/mockAuth";
import styles from "./AdminCodes.module.scss";

function formatTimeOnly(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleTimeString("uk", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
}

type JournalKind = "success" | "danger" | "rotate" | "view" | "info";

type JournalRow = {
  id: string;
  event: string;
  initiator: string;
  time: string;
  status: "success" | "danger";
  kind: JournalKind;
  ipAddress?: string | null;
};

function classifyEntry(entry: AdminAuditLogEntry): JournalRow {
  const a = entry.action.toLowerCase();
  const isDanger =
    a.includes("спроб") ||
    a.includes("невалід") ||
    a.includes("відхилен") ||
    a.includes("невдал");
  const isRotate =
    a.includes("ротац") || a.includes("оновлен") || a.includes("перегенер");
  const isView = a.includes("перегляд");
  const kind: JournalKind = isDanger
    ? "danger"
    : isRotate
      ? "rotate"
      : isView
        ? "view"
        : "success";
  return {
    id: entry.id,
    event: entry.action,
    initiator: entry.actor,
    time: entry.createdAt,
    status: isDanger ? "danger" : "success",
    kind,
    ipAddress: entry.ipAddress,
  };
}

function buildJournal(auditLog: AdminAuditLogEntry[]): JournalRow[] {
  return auditLog
    .filter((e) => {
      const a = e.action.toLowerCase();
      return (
        e.severity === "security" ||
        a.includes("код") ||
        a.includes("адміністратор") ||
        a.includes("підключення") ||
        a.includes("перегляд")
      );
    })
    .map(classifyEntry)
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

function JournalEventIcon({ kind }: { kind: JournalKind }) {
  const map: Record<JournalKind, { icon: React.ReactNode; bg: string }> = {
    success: {
      icon: <CheckCircle2 size={13} className={styles.evtIconSuccess} />,
      bg: "rgba(82,183,136,0.1)",
    },
    danger: {
      icon: <XCircle size={13} className={styles.evtIconDanger} />,
      bg: "rgba(233,119,75,0.1)",
    },
    rotate: {
      icon: <RefreshCw size={12} className={styles.evtIconRotate} />,
      bg: "rgba(200,168,67,0.1)",
    },
    view: {
      icon: <Eye size={12} className={styles.evtIconInfo} />,
      bg: "rgba(74,128,212,0.1)",
    },
    info: {
      icon: <Info size={12} className={styles.evtIconInfo} />,
      bg: "rgba(74,128,212,0.1)",
    },
  };
  const { icon, bg } = map[kind];
  return (
    <span className={styles.journalEventIconWrap} style={{ background: bg }}>
      {icon}
    </span>
  );
}

function RegenConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "rgba(9,18,38,0.98)",
          border: "1px solid rgba(233,119,75,0.3)",
          borderRadius: 20,
          padding: "28px 32px",
          maxWidth: 360,
          width: "100%",
          boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            color: "#e9774b",
            fontFamily: "monospace",
            fontSize: "0.65rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          Попередження
        </div>
        <div
          style={{
            color: "#ffffff",
            fontSize: "1.1rem",
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Перегенерувати супер-код?
        </div>
        <div
          style={{ color: "#9eb5d9", fontSize: "0.84rem", marginBottom: 20 }}
        >
          Поточний код стане неактивним. Усі адміни, що не ввійшли, втратять
          можливість підключення через старий код.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1,
              minHeight: 38,
              borderRadius: 999,
              border: 0,
              background: "linear-gradient(135deg, #e9774b 0%, #c8612a 100%)",
              color: "#ffffff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Перегенерувати
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              minHeight: 38,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              color: "#eef3fb",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Скасувати
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminCodesView() {
  const router = useRouter();
  const { snapshot, handleCopyCode, handleRegenerateCode } =
    useAdminWorkspace();
  const [codeRevealed, setCodeRevealed] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [journalLimit, setJournalLimit] = useState(10);
  const [openNote, setOpenNote] = useState<number | null>(null);

  if (!snapshot) return null;

  const securityEvents = snapshot.auditLog.filter(
    (e) => e.severity === "security",
  ).length;

  const lastRotation = snapshot.superCodeHistory[0];
  const lastRotationLabel = lastRotation?.rotatedAt
    ? formatDateShort(lastRotation.rotatedAt)
    : "Початковий";

  const journal = buildJournal(snapshot.auditLog);
  const visibleJournal = journal.slice(0, journalLimit);

  const recentEvents = snapshot.auditLog
    .filter((e) => e.severity === "security" || e.severity === "warning")
    .slice(0, 5);

  const nowStr = new Date().toLocaleTimeString("uk", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <section className={styles.page}>
      {/* ── HERO ───────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Коди</span>
          <h2 className={styles.title}>
            Життєвий цикл супер-коду в одному місці.
          </h2>
          <p className={styles.description}>
            Модуль кодів зберігає поточну логіку підключення адміністраторів,
            але подає її як чіткіший безпековий екран з активним станом,
            історією ротацій і контекстом навколо захищених адмін-акаунтів.
          </p>
        </div>

        <div className={styles.heroSecurity}>
          <ShieldCheck size={32} className={styles.heroSecurityIcon} />
          <span className={styles.heroSecurityLabel}>Стан безпеки системи</span>
          <div className={styles.heroSecurityBadge}>
            <span className={styles.heroSecurityDot} />
            <span className={styles.heroSecurityStatus}>Захищено</span>
          </div>
          <p className={styles.heroSecurityMeta}>
            Супер-код активний. Ротація відбувається відповідно до політики.
            Аудит та журнал подій увімкнено.
          </p>
        </div>
      </section>

      {/* ── 5 METRICS ──────────────────────────────────────── */}
      <section className={styles.metricsGrid}>
        <article className={styles.metricCard}>
          <div
            className={styles.metricIconBadge}
            style={{ background: "rgba(200,168,67,0.12)" }}
          >
            <Key size={15} style={{ color: "#c8a843" }} />
          </div>
          <span className={styles.metricLabel}>Активний код</span>
          <strong className={styles.metricValue}>1</strong>
          <p className={styles.metricNote}>
            Одиничний активний код для підключення адміністраторів
          </p>
        </article>

        <article className={styles.metricCard}>
          <div
            className={styles.metricIconBadge}
            style={{ background: "rgba(74,128,212,0.12)" }}
          >
            <History size={15} style={{ color: "#4a80d4" }} />
          </div>
          <span className={styles.metricLabel}>Записи історії</span>
          <strong className={styles.metricValue}>
            {snapshot.superCodeHistory.length}
          </strong>
          <p className={styles.metricNote}>
            Історія ротацій збережена у фронтенд-сховищі
          </p>
        </article>

        <article className={styles.metricCard}>
          <div
            className={styles.metricIconBadge}
            style={{ background: "rgba(82,183,136,0.12)" }}
          >
            <Users size={15} style={{ color: "#52b788" }} />
          </div>
          <span className={styles.metricLabel}>Захищені адміни</span>
          <strong className={styles.metricValue}>
            {snapshot.adminAccounts}
          </strong>
          <p className={styles.metricNote}>
            Адміністраторів під захистом супер-коду
          </p>
        </article>

        <article className={styles.metricCard}>
          <div
            className={styles.metricIconBadge}
            style={{ background: "rgba(233,119,75,0.12)" }}
          >
            <ShieldAlert size={15} style={{ color: "#e9774b" }} />
          </div>
          <span className={styles.metricLabel}>Події безпеки</span>
          <strong className={styles.metricValue}>{securityEvents}</strong>
          <p className={styles.metricNote}>
            Записи аудиту включно з підключеннями та ротаціями
          </p>
        </article>

        <article className={styles.metricCard}>
          <div
            className={styles.metricIconBadge}
            style={{ background: "rgba(155,93,229,0.12)" }}
          >
            <CalendarCheck size={15} style={{ color: "#9b5de5" }} />
          </div>
          <span className={styles.metricLabel}>Остання ротація</span>
          <strong className={styles.metricValue} style={{ fontSize: "1rem" }}>
            {lastRotationLabel}
          </strong>
          <p className={styles.metricNote}>
            {lastRotation?.rotatedAt
              ? formatTimeOnly(lastRotation.rotatedAt)
              : "Початковий код ще активний"}
          </p>
        </article>
      </section>

      {/* ── WORKSPACE ──────────────────────────────────────── */}
      <div className={styles.workspace}>
        {/* LEFT COLUMN */}
        <div className={styles.workspaceLeft}>
          {/* Action panel */}
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelEyebrow}>Дії з кодом</span>
              <h3 className={styles.panelTitle}>Поточний супер-код</h3>
            </div>

            <div className={styles.codeSection}>
              <span className={styles.codeValue}>
                {codeRevealed
                  ? snapshot.activeSuperCode
                  : "•".repeat(Math.max(8, snapshot.activeSuperCode.length))}
              </span>
              <button
                type="button"
                className={styles.revealBtn}
                onClick={() => setCodeRevealed((r) => !r)}
              >
                {codeRevealed ? <EyeOff size={12} /> : <Eye size={12} />}
                {codeRevealed ? "Сховати" : "Показати"}
              </button>
            </div>

            <p className={styles.codeMeta}>
              <Lock size={11} className={styles.codeMetaIcon} />
              Код відображається лише в межах сценарію підключення
              адміністратора.
            </p>

            <div className={styles.actionRow}>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handleCopyCode}
              >
                <Copy size={14} />
                Скопіювати активний код
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setConfirmRegen(true)}
              >
                <RefreshCw size={14} />
                Перегенерувати код
              </button>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoCard}>
                <span className={styles.infoCardEyebrow}>Безпечна модель</span>
                <div className={styles.infoCardValue}>Один активний код</div>
                <div className={styles.infoCardMeta}>
                  Після перегенерації попередні коди лишаються в історії, але
                  вже не є активними.
                </div>
              </div>
              <div className={styles.infoCard}>
                <span className={styles.infoCardEyebrow}>Остання ротація</span>
                <div className={styles.infoCardValue}>{lastRotationLabel}</div>
                <div className={styles.infoCardMeta}>
                  Свіжі ротації автоматично потрапляють в історію аудиту.
                </div>
              </div>
            </div>
          </article>

          {/* Journal */}
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelEyebrow}>Журнал ротацій</span>
            </div>

            <div className={styles.journalHead}>
              <span className={styles.journalHeadCell}>Подія</span>
              <span className={styles.journalHeadCell}>Ініціатор</span>
              <span className={styles.journalHeadCell}>Час</span>
              <span className={styles.journalHeadCell}>Статус</span>
            </div>

            <div className={styles.journalScrollable}>
              {visibleJournal.length === 0 ? (
                <div
                  style={{
                    padding: "20px 16px",
                    textAlign: "center",
                    fontSize: "0.78rem",
                    color: "rgba(158,181,217,0.35)",
                  }}
                >
                  Записів немає
                </div>
              ) : (
                visibleJournal.map((row) => (
                  <div
                    key={row.id}
                    className={styles.journalRow}
                    onClick={() => router.push(ROUTES.adminAudit)}
                  >
                    <div className={styles.journalEventCell}>
                      <JournalEventIcon kind={row.kind} />
                      <span className={styles.journalEventName}>
                        {row.event}
                      </span>
                    </div>
                    <span className={styles.journalActor}>{row.initiator}</span>
                    <span className={styles.journalTime}>
                      {formatDateShort(row.time)}
                    </span>
                    <span
                      className={`${styles.badge} ${
                        row.status === "danger"
                          ? styles.badgeDanger
                          : styles.badgeSuccess
                      }`}
                    >
                      {row.status === "danger" ? "Відхилено" : "Успішно"}
                    </span>
                  </div>
                ))
              )}
            </div>

            {journalLimit < journal.length && (
              <button
                type="button"
                className={styles.showMoreBtn}
                onClick={() => setJournalLimit((prev) => prev + 5)}
              >
                Показати ще ({Math.min(5, journal.length - journalLimit)})
              </button>
            )}
          </article>
        </div>

        {/* RIGHT RAIL */}
        <div className={styles.workspaceRight}>
          {/* Security status */}
          <article className={styles.railCard}>
            <div className={styles.railCardTitle}>
              <span className={styles.railCardEyebrow}>Стан безпеки</span>
            </div>

            <div className={styles.statusRow}>
              <div className={styles.statusRowLeft}>
                <Activity size={13} className={styles.statusIcon} />
                <span className={styles.statusLabel}>
                  Відстеження підключень
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span className={styles.dotGreen} />
                <span className={styles.statusValue}>Увімкнено</span>
              </div>
            </div>
            <div className={styles.statusRow}>
              <div className={styles.statusRowLeft}>
                <Shield size={13} className={styles.statusIcon} />
                <span className={styles.statusLabel}>
                  Аудит та журнал подій
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span className={styles.dotGreen} />
                <span className={styles.statusValue}>Активно</span>
              </div>
            </div>
            <div className={styles.statusRow}>
              <div className={styles.statusRowLeft}>
                <Database size={13} className={styles.statusIcon} />
                <span className={styles.statusLabel}>Зберігання подій</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span className={styles.dotNeutral} />
                <span className={styles.statusValue}>180 днів</span>
              </div>
            </div>
            <div className={styles.statusRow}>
              <div className={styles.statusRowLeft}>
                <Clock size={13} className={styles.statusIcon} />
                <span className={styles.statusLabel}>
                  Останнє оновлення стану
                </span>
              </div>
              <span className={styles.statusValue}>{nowStr}</span>
            </div>
          </article>

          {/* Recent events */}
          <article className={styles.railCard}>
            <div className={styles.railCardTitle}>
              <span className={styles.railCardEyebrow}>Останні події</span>
              <button
                type="button"
                className={styles.railCardLink}
                onClick={() => router.push(ROUTES.adminAudit)}
              >
                Дивитись усі &rsaquo;
              </button>
            </div>

            {recentEvents.length === 0 ? (
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "rgba(158,181,217,0.35)",
                  textAlign: "center",
                  padding: "12px 0",
                }}
              >
                Подій немає
              </div>
            ) : (
              recentEvents.map((entry) => {
                const row = classifyEntry(entry);
                return (
                  <div key={entry.id} className={styles.evtRow}>
                    <span
                      className={styles.evtIconWrap}
                      style={{
                        background:
                          row.kind === "danger"
                            ? "rgba(233,119,75,0.1)"
                            : row.kind === "rotate"
                              ? "rgba(200,168,67,0.1)"
                              : row.kind === "view"
                                ? "rgba(74,128,212,0.1)"
                                : "rgba(82,183,136,0.1)",
                      }}
                    >
                      {row.kind === "danger" ? (
                        <XCircle size={12} className={styles.evtIconDanger} />
                      ) : row.kind === "rotate" ? (
                        <RefreshCw size={11} className={styles.evtIconRotate} />
                      ) : row.kind === "view" ? (
                        <Eye size={11} className={styles.evtIconInfo} />
                      ) : (
                        <CheckCircle2
                          size={12}
                          className={styles.evtIconSuccess}
                        />
                      )}
                    </span>
                    <div className={styles.evtBody}>
                      <div className={styles.evtTitle}>{entry.action}</div>
                      <div className={styles.evtMeta}>
                        {entry.actor}
                        {entry.ipAddress ? ` · IP ${entry.ipAddress}` : ""}
                      </div>
                    </div>
                    <span className={styles.evtTime}>
                      {formatTimeOnly(entry.createdAt)}
                    </span>
                  </div>
                );
              })
            )}
          </article>

          {/* Access context */}
          <article className={styles.railCard}>
            <div className={styles.railCardTitle}>
              <span className={styles.railCardEyebrow}>Контекст доступу</span>
            </div>
            <div
              className={styles.contextBlock}
              onClick={() => router.push(ROUTES.adminUsers)}
            >
              <Users size={18} className={styles.contextIcon} />
              <div className={styles.contextBody}>
                <div className={styles.contextTitle}>
                  {snapshot.adminAccounts} захищен
                  {snapshot.adminAccounts === 1 ? "ий" : "і"} адміністратор
                  {snapshot.adminAccounts === 1 ? "" : "и"}
                </div>
                <div className={styles.contextDesc}>
                  Підключення до адмін-панелі можливе лише через активний
                  супер-код.
                </div>
              </div>
              <ChevronRight size={14} className={styles.contextChev} />
            </div>
          </article>

          {/* Operational notes */}
          <article className={styles.railCard}>
            <div className={styles.railCardTitle}>
              <span className={styles.railCardEyebrow}>
                Операційні примітки
              </span>
            </div>

            {[
              {
                icon: Lock,
                text: "Для підключення адміністратора, як і раніше, потрібен саме поточний активний супер-код.",
                detail:
                  "Старі коди зберігаються в журналі але не є дійсними для реєстрації.",
              },
              {
                icon: History,
                text: "Історія лишається локальною для демо-адмінки й доступна для перегляду.",
                detail:
                  "Записи журналу зберігаються в MongoDB і не залежать від стану браузера.",
              },
              {
                icon: ShieldCheck,
                text: "Кожна перегенерація лишає старий код видимим, але більше не активним.",
                detail: "Тільки один код є активним у будь-який момент часу.",
              },
            ].map(({ icon: Icon, text, detail }, idx) => (
              <div key={text}>
                <div
                  className={styles.noteRow}
                  onClick={() => setOpenNote(openNote === idx ? null : idx)}
                >
                  <Icon size={13} className={styles.noteIcon} />
                  <span className={styles.noteText}>{text}</span>
                  <ChevronRight
                    size={12}
                    className={styles.noteChev}
                    style={{
                      transform:
                        openNote === idx ? "rotate(90deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </div>
                {openNote === idx && (
                  <div className={styles.noteBody}>{detail}</div>
                )}
              </div>
            ))}
          </article>
        </div>
      </div>

      {confirmRegen && (
        <RegenConfirmModal
          onConfirm={() => {
            handleRegenerateCode();
            setConfirmRegen(false);
            setCodeRevealed(false);
          }}
          onCancel={() => setConfirmRegen(false)}
        />
      )}
    </section>
  );
}
