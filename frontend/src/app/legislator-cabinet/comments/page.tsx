"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Eye,
  FileText,
  History,
  MessageCircle,
  MessagesSquare,
  GitGraph,
  Network,
  PenLine,
  Radar,
  RefreshCcw,
  Scale,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROUTES } from "@/constants/routes";
import { useAddComment, useDeleteComment } from "@/hooks/useComments";
import styles from "./page.module.scss";

// ─── Types ────────────────────────────────────────────────────────────────────

type TargetType = "amendment" | "proposal";

type MockOwnComment = {
  _id: string;
  target_type: TargetType;
  target_title: string;
  text: string;
  createdAt: string;
  repliesCount: number;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_MOCK_COMMENTS: MockOwnComment[] = [
  {
    _id: "my-c1",
    target_type: "proposal",
    target_title: "Пропозиція до Закону про електронне урядування",
    text: "Стаття 12 потребує уточнення щодо повноважень місцевих органів. Пропоную доповнити пункт 3 визначенням меж компетенції.",
    createdAt: "2026-06-20T10:15:00Z",
    repliesCount: 2,
  },
  {
    _id: "my-c2",
    target_type: "amendment",
    target_title: "Поправка №7 до Закону про охорону праці",
    text: "Ця поправка суперечить статті 43 Конституції. Необхідно узгодити з конституційними нормами.",
    createdAt: "2026-06-19T14:00:00Z",
    repliesCount: 0,
  },
  {
    _id: "my-c3",
    target_type: "proposal",
    target_title: "Пропозиція щодо змін до Бюджетного кодексу",
    text: "Розділ про видатки виглядає недостатньо обґрунтованим. Потрібні додаткові розрахунки та обґрунтування.",
    createdAt: "2026-06-18T11:30:00Z",
    repliesCount: 1,
  },
  {
    _id: "my-c4",
    target_type: "amendment",
    target_title: "Поправка №2 до Закону про публічні закупівлі",
    text: "Порогові значення для тендерів потребують перегляду з урахуванням інфляції та євроінтеграції.",
    createdAt: "2026-06-17T09:45:00Z",
    repliesCount: 0,
  },
  {
    _id: "my-c5",
    target_type: "proposal",
    target_title: "Пропозиція до Закону про судоустрій",
    text: "Розділ про апеляційні суди написаний чітко і зрозуміло. Повністю підтримую запропоновані зміни.",
    createdAt: "2026-06-15T16:20:00Z",
    repliesCount: 0,
  },
];

// ─── Sidebar nav ───────────────────────────────────────────────────────────────

const SIDEBAR_NAV = [
  { icon: <Eye size={20} />, label: "Нагляд", href: ROUTES.legislatorCabinet },
  {
    icon: <Users size={20} />,
    label: "Групи",
    href: ROUTES.legislatorCabinetGroups,
  },
  {
    icon: <FileText size={20} />,
    label: "Пропозиції",
    href: ROUTES.legislatorCabinetProposals,
  },
  {
    icon: <PenLine size={20} />,
    label: "Поправки",
    href: ROUTES.legislatorCabinetAmendments,
  },
  {
    icon: <Zap size={20} />,
    label: "Форки",
    href: ROUTES.legislatorCabinetForks,
  },
  { icon: <Scale size={20} />, label: "Закони", href: ROUTES.laws },
  { icon: <Network size={20} />, label: "Граф", href: ROUTES.graph },
  {
    icon: <GitGraph size={20} />,
    label: "Пропоз. Граф",
    href: ROUTES.graphProposals,
  },
  {
    icon: <Radar size={20} />,
    label: "Пропоз. Радіант",
    href: ROUTES.radiantProposals,
  },
  {
    icon: <RefreshCcw size={20} />,
    label: "Зміни",
    href: ROUTES.legislatorCabinetChanges,
  },
  {
    icon: <MessagesSquare size={20} />,
    label: "Коментарі",
    href: ROUTES.legislatorCabinetComments,
  },
  {
    icon: <Shield size={20} />,
    label: "Правила",
    href: ROUTES.legislatorCabinetRules,
  },
  {
    icon: <BarChart3 size={20} />,
    label: "Аналітика",
    href: ROUTES.legislatorCabinetAnalytics,
  },
  {
    icon: <History size={20} />,
    label: "Історія",
    href: ROUTES.legislatorCabinetHistory,
  },
  {
    icon: <MessageCircle size={20} />,
    label: "Чат",
    href: ROUTES.legislatorCabinetChat,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TARGET_TYPE_LABELS: Record<TargetType, string> = {
  amendment: "Поправка",
  proposal: "Пропозиція",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function LegislatorSidebar({
  initials,
  name,
  role,
}: {
  initials: string;
  name: string;
  role: string;
}) {
  const pathname = usePathname();

  return (
    <nav className={styles.sidebar}>
      <div className={styles.sidebarTop}>
        <Link href={ROUTES.home} className={styles.logoBlock}>
          <span className={styles.logoIcon}>L</span>
          <div className={styles.logoMeta}>
            <span>LEGAL</span>
            <span>HUB</span>
          </div>
        </Link>
        <ul className={styles.navList}>
          {SIDEBAR_NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                  title={item.label}
                >
                  {item.icon}
                  <span className={styles.navLabel}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <div className={styles.sidebarBottom}>
        <div className={styles.userAvatar}>{initials}</div>
        <div className={styles.userMeta}>
          <span className={styles.userName}>{name}</span>
          <span className={styles.userRole}>{role}</span>
        </div>
      </div>
    </nav>
  );
}

// ─── Comments content ─────────────────────────────────────────────────────────

function CommentsContent() {
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();

  const [comments, setComments] = useState<MockOwnComment[]>(
    INITIAL_MOCK_COMMENTS,
  );

  // Add form state
  const [formType, setFormType] = useState<TargetType>("proposal");
  const [formTargetId, setFormTargetId] = useState("");
  const [formText, setFormText] = useState("");
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const totalReplies = comments.reduce((sum, c) => sum + c.repliesCount, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formText.trim() || !formTargetId.trim()) return;
    setSubmitStatus("idle");

    try {
      await addComment.mutateAsync({
        target_type: formType,
        target_id: formTargetId.trim(),
        text: formText.trim(),
      });
      setFormText("");
      setFormTargetId("");
      setSubmitStatus("success");
      setTimeout(() => setSubmitStatus("idle"), 3000);
    } catch {
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus("idle"), 3000);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Видалити цей коментар?")) return;
    try {
      await deleteComment.mutateAsync(id);
      setComments((prev) => prev.filter((c) => c._id !== id));
    } catch {
      // deletion error — keep in list
    }
  }

  return (
    <div className={styles.mainContent}>
      <span className={styles.eyebrow}>ЗАКОНОТВОРЕЦЬ · КОМЕНТАРІ</span>
      <h1 className={styles.pageTitle}>Мої коментарі</h1>

      {/* KPI */}
      <div className={styles.kpiStrip}>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Всього</p>
          <strong className={styles.kpiValue}>{comments.length}</strong>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Відповідей</p>
          <strong className={styles.kpiValue}>{totalReplies}</strong>
        </div>
      </div>

      <div className={styles.twoSection}>
        {/* ── Section 1: Add comment ─────────────────────────────────────── */}
        <section>
          <h2 className={styles.sectionTitle}>Залишити коментар</h2>
          <form className={styles.addCommentForm} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="comment-type">
                Тип об&apos;єкту
              </label>
              <select
                id="comment-type"
                className={styles.select}
                value={formType}
                onChange={(e) => setFormType(e.target.value as TargetType)}
              >
                <option value="proposal">Пропозиція</option>
                <option value="amendment">Поправка</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="comment-target">
                ID або назва об&apos;єкту
              </label>
              <input
                id="comment-target"
                className={styles.input}
                type="text"
                placeholder="Введіть ID або назву..."
                value={formTargetId}
                onChange={(e) => setFormTargetId(e.target.value)}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="comment-text">
                Текст коментаря
              </label>
              <textarea
                id="comment-text"
                className={styles.textarea}
                placeholder="Введіть текст коментаря..."
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
                required
              />
            </div>

            {submitStatus === "success" && (
              <p className={styles.successMsg}>
                Коментар успішно опубліковано.
              </p>
            )}
            {submitStatus === "error" && (
              <p className={styles.errorMsg}>
                Помилка публікації. Спробуйте ще раз.
              </p>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={
                addComment.isPending || !formText.trim() || !formTargetId.trim()
              }
            >
              {addComment.isPending ? "Публікуємо..." : "Опублікувати коментар"}
            </button>
          </form>
        </section>

        {/* ── Section 2: My comments list ───────────────────────────────── */}
        <section>
          <h2 className={styles.sectionTitle}>Мої коментарі</h2>

          {comments.length === 0 ? (
            <div className={styles.emptyState}>
              <MessagesSquare
                size={32}
                style={{ color: "rgba(74,128,212,0.44)" }}
              />
              <p style={{ color: "var(--color-smoke)", fontSize: "0.9rem" }}>
                У вас ще немає коментарів
              </p>
            </div>
          ) : (
            <div className={styles.commentList}>
              {comments.map((c) => (
                <article key={c._id} className={styles.commentCard}>
                  <div className={styles.commentTarget}>
                    <span
                      className={`${styles.badge} ${
                        c.target_type === "proposal"
                          ? styles.badgeProposal
                          : styles.badgeAmendment
                      }`}
                    >
                      {TARGET_TYPE_LABELS[c.target_type]}
                    </span>
                    <span>до: {c.target_title}</span>
                  </div>

                  <p className={styles.commentText}>{c.text}</p>

                  <div className={styles.commentFooter}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <span className={styles.commentDate}>
                        {formatDate(c.createdAt)}
                      </span>
                      {c.repliesCount > 0 && (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--color-smoke)",
                          }}
                        >
                          {c.repliesCount}{" "}
                          {c.repliesCount === 1 ? "відповідь" : "відповіді"}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className={styles.btnDelete}
                      onClick={() => handleDelete(c._id)}
                      disabled={deleteComment.isPending}
                    >
                      Видалити
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LegislatorCommentsPage() {
  const { user, isLegislator, isSupervisor, isAdmin, isHydrated } = useAuth();

  if (!isHydrated) {
    return (
      <div className={styles.workspace}>
        <div className={styles.sidebar} />
        <main className={styles.mainScroll}>
          <div className={styles.mainContent}>
            <p className={styles.loadingState}>Завантаження...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isLegislator && !isSupervisor && !isAdmin) {
    return (
      <div className={styles.workspace}>
        <main className={styles.mainScroll}>
          <div className={styles.mainContent}>
            <p className={styles.errorState}>Доступ заборонено</p>
          </div>
        </main>
      </div>
    );
  }

  const initials = (user?.displayName ?? "ЗТ").slice(0, 2).toUpperCase();
  const roleLabel = isAdmin
    ? "Адміністратор"
    : isSupervisor
      ? "Супервізер"
      : "Законотворець";

  return (
    <div className={styles.workspace}>
      <LegislatorSidebar
        initials={initials}
        name={user?.displayName ?? "Законотворець"}
        role={roleLabel}
      />
      <main className={styles.mainScroll}>
        <CommentsContent />
      </main>
    </div>
  );
}
