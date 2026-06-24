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
  Plus,
  Radar,
  RefreshCcw,
  Scale,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { notify } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import {
  useProposals,
  useCreateProposal,
  useSubmitProposal,
} from "@/hooks/useProposals";
import type { Proposal, ProposalStatus } from "@/types/legislator";
import styles from "./page.module.scss";

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

function getLawTitle(law_id: Proposal["law_id"]): string {
  if (typeof law_id === "object" && law_id !== null) return law_id.title;
  return law_id;
}

const STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: "Чернетка",
  review: "На розгляді",
  approved: "Схвалено",
  rejected: "Відхилено",
};

const STATUS_BADGE_CLASS: Record<ProposalStatus, string> = {
  draft: styles.badgeDraft,
  review: styles.badgeReview,
  approved: styles.badgeApproved,
  rejected: styles.badgeRejected,
};

type TabFilter = ProposalStatus | "all";

const TABS: { label: string; value: TabFilter }[] = [
  { label: "Всі", value: "all" },
  { label: "Чернетки", value: "draft" },
  { label: "На розгляді", value: "review" },
  { label: "Схвалені", value: "approved" },
  { label: "Відхилені", value: "rejected" },
];

function CreateProposalModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const createProposal = useCreateProposal();
  const [title, setTitle] = useState("");
  const [lawId, setLawId] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createProposal.mutateAsync({
        title: title.trim(),
        law_id: lawId.trim() || undefined,
        description: description.trim(),
      } as Partial<Proposal>);
      notify.success("Пропозицію створено");
      onCreated();
      onClose();
    } catch (err) {
      notify.error(
        err instanceof Error ? err.message : "Не вдалося створити пропозицію",
      );
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Нова пропозиція</h2>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <label className={styles.field}>
            <span>Назва *</span>
            <input
              className="form-control"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Назва пропозиції"
              required
              autoFocus
            />
          </label>
          <label className={styles.field}>
            <span>Закон</span>
            <input
              className="form-control"
              type="text"
              value={lawId}
              onChange={(e) => setLawId(e.target.value)}
              placeholder="ID або назва закону"
            />
          </label>
          <label className={styles.field}>
            <span>Опис</span>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Короткий опис пропозиції..."
              rows={4}
            />
          </label>
          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
            >
              Скасувати
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={createProposal.isPending}
            >
              {createProposal.isPending
                ? "Збереження..."
                : "Створити пропозицію"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProposalsContent({ userId }: { userId: string | undefined }) {
  const { data: proposals, isLoading } = useProposals(userId ? { userId } : {});
  const submitProposal = useSubmitProposal();

  const [tab, setTab] = useState<TabFilter>("all");
  const [showModal, setShowModal] = useState(false);

  const list = proposals ?? [];

  const draftCount = list.filter((p) => p.status === "draft").length;
  const reviewCount = list.filter((p) => p.status === "review").length;
  const approvedCount = list.filter((p) => p.status === "approved").length;

  const filtered = tab === "all" ? list : list.filter((p) => p.status === tab);

  const handleSubmit = async (id: string) => {
    try {
      await submitProposal.mutateAsync(id);
      notify.success("Пропозицію подано на розгляд");
    } catch (err) {
      notify.error(
        err instanceof Error ? err.message : "Не вдалося подати пропозицію",
      );
    }
  };

  return (
    <div className={styles.mainContent}>
      <span className={styles.eyebrow}>ЗАКОНОТВОРЕЦЬ · ПРОПОЗИЦІЇ</span>
      <div className={styles.heroRow}>
        <h1 className={styles.pageTitle}>Мої пропозиції</h1>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={() => setShowModal(true)}
        >
          <Plus size={14} />
          Нова пропозиція
        </button>
      </div>

      {/* KPI */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Чернетки</span>
          <strong className={styles.statValue}>{draftCount}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>На розгляді</span>
          <strong className={styles.statValue}>{reviewCount}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Схвалено</span>
          <strong className={styles.statValue}>{approvedCount}</strong>
        </div>
      </div>

      {/* TABS */}
      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            className={`${styles.tab} ${tab === t.value ? styles.tabActive : ""}`}
            onClick={() => setTab(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* LIST */}
      {isLoading ? (
        <p className={styles.emptyState}>Завантаження...</p>
      ) : filtered.length === 0 ? (
        <p className={styles.emptyState}>Пропозицій поки немає</p>
      ) : (
        <div className={styles.proposalsList}>
          {filtered.map((p) => (
            <article key={p._id} className={styles.proposalCard}>
              <div className={styles.proposalTitle}>{p.title}</div>
              <div className={styles.proposalLaw}>{getLawTitle(p.law_id)}</div>
              <div className={styles.proposalMeta}>
                <span
                  className={`${styles.badge} ${STATUS_BADGE_CLASS[p.status]}`}
                >
                  {STATUS_LABELS[p.status]}
                </span>
                <span className={styles.proposalDate}>
                  {new Date(p.createdAt).toLocaleDateString("uk-UA")}
                </span>
              </div>
              {p.description && (
                <p className={styles.proposalDesc}>{p.description}</p>
              )}
              <div className={styles.proposalActions}>
                {p.status === "draft" && (
                  <>
                    <button
                      type="button"
                      className={styles.btnSm}
                      onClick={() => handleSubmit(p._id)}
                      disabled={submitProposal.isPending}
                    >
                      Подати на розгляд
                    </button>
                  </>
                )}
                <Link
                  href={ROUTES.legislatorProposal(p._id)}
                  className={styles.btnSm}
                >
                  Переглянути
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {showModal && (
        <CreateProposalModal
          onClose={() => setShowModal(false)}
          onCreated={() => {}}
        />
      )}
    </div>
  );
}

export default function LegislatorProposalsPage() {
  const { user, isLegislator, isSupervisor, isAdmin, isHydrated } = useAuth();

  if (!isHydrated) {
    return (
      <div className={styles.workspace}>
        <div className={styles.sidebar} />
        <main className={styles.mainScroll}>
          <div className={styles.mainContent}>
            <p className={styles.emptyState}>Завантаження...</p>
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
            <p style={{ color: "#f39b9b", padding: "40px 0" }}>
              Доступ заборонено
            </p>
          </div>
        </main>
      </div>
    );
  }

  const initials = (user?.displayName ?? "ЗТ").slice(0, 2).toUpperCase();
  const roleLabel = isAdmin
    ? "Адміністратор"
    : isSupervisor
      ? "Супервайзер"
      : "Законотворець";

  return (
    <div className={styles.workspace}>
      <LegislatorSidebar
        initials={initials}
        name={user?.displayName ?? "Законотворець"}
        role={roleLabel}
      />
      <main className={styles.mainScroll}>
        <ProposalsContent userId={user?.id} />
      </main>
    </div>
  );
}
