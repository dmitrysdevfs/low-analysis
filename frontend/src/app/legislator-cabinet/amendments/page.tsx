"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronDown,
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
import { ROUTES } from "@/constants/routes";
import {
  useAmendments,
  useCreateAmendment,
  useDeleteAmendment,
} from "@/hooks/useAmendments";
import type { Amendment, AmendmentChangeType } from "@/types/legislator";
import { notify } from "@/lib/toast";
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

function getChangeTypeLabel(type: AmendmentChangeType): string {
  if (type === "edit") return "Редагування";
  if (type === "add") return "Додавання";
  return "Видалення";
}

function ChangeBadge({ type }: { type: AmendmentChangeType }) {
  const cls =
    type === "edit"
      ? styles.badgeEdit
      : type === "add"
        ? styles.badgeAdd
        : styles.badgeDelete;
  return (
    <span className={`${styles.badge} ${cls}`}>{getChangeTypeLabel(type)}</span>
  );
}

type FilterTab = "all" | AmendmentChangeType;

interface AmendmentCardProps {
  amendment: Amendment;
  isOpen: boolean;
  onToggle: () => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function AmendmentCard({
  amendment: a,
  isOpen,
  onToggle,
  onDelete,
  isDeleting,
}: AmendmentCardProps) {
  const articleNum = a.context.article_num ?? "—";
  const articleTitle = a.context.article_title ?? "";
  const date = new Date(a.createdAt).toLocaleDateString("uk-UA");

  return (
    <div className={styles.amendmentCard}>
      <div
        className={`${styles.amendmentHeader} ${isOpen ? styles.amendmentHeaderOpen : ""}`}
        onClick={onToggle}
      >
        <ChevronDown
          size={16}
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
        />
        <span className={styles.amendmentMeta}>
          Стаття {articleNum}
          {articleTitle ? ` · ${articleTitle}` : ""}
        </span>
        <ChangeBadge type={a.change_type} />
        <span className={styles.amendmentDate}>{date}</span>
      </div>

      {isOpen && (
        <div className={styles.amendmentBody}>
          <div className={styles.diffGrid}>
            <div className={styles.diffOriginal}>
              <div className={styles.diffLabel}>Оригінальний текст</div>
              <div className={styles.diffText}>{a.original_text || "—"}</div>
            </div>
            <div className={styles.diffProposed}>
              <div className={styles.diffLabel}>Запропонований текст</div>
              <div className={styles.diffText}>{a.proposed_text || "—"}</div>
            </div>
          </div>
          {a.reason && (
            <p className={styles.reason}>
              <strong>Причина:</strong> {a.reason}
            </p>
          )}
          <div className={styles.amendActions}>
            <button
              type="button"
              className={styles.btnDelete}
              onClick={() => onDelete(a._id)}
              disabled={isDeleting}
            >
              {isDeleting ? "Видалення..." : "Видалити"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface CreateModalProps {
  onClose: () => void;
}

function CreateModal({ onClose }: CreateModalProps) {
  const createAmendment = useCreateAmendment();

  const [lawTitle, setLawTitle] = useState("");
  const [articleNum, setArticleNum] = useState("");
  const [changeType, setChangeType] = useState<AmendmentChangeType>("edit");
  const [originalText, setOriginalText] = useState("");
  const [proposedText, setProposedText] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposedText.trim()) return;
    try {
      await createAmendment.mutateAsync({
        change_type: changeType,
        original_text: originalText || undefined,
        proposed_text: proposedText,
        reason: reason || undefined,
        context: {
          article_num: articleNum || undefined,
          element_code: articleNum || "",
          section_title: lawTitle || undefined,
        },
      });
      notify.success("Поправку створено");
      onClose();
    } catch (err) {
      notify.error(
        err instanceof Error ? err.message : "Не вдалося створити поправку",
      );
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>Нова поправка</h2>
        <form onSubmit={handleSubmit} className={styles.createForm}>
          <div className={styles.formRow}>
            <div className={styles.field}>
              <span className={styles.label}>Закон</span>
              <input
                className={styles.input}
                type="text"
                value={lawTitle}
                onChange={(e) => setLawTitle(e.target.value)}
                placeholder="Назва або номер закону"
              />
            </div>
            <div className={styles.field}>
              <span className={styles.label}>Номер статті</span>
              <input
                className={styles.input}
                type="text"
                value={articleNum}
                onChange={(e) => setArticleNum(e.target.value)}
                placeholder="Наприклад: 25"
              />
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Тип зміни</span>
            <select
              className={styles.select}
              value={changeType}
              onChange={(e) =>
                setChangeType(e.target.value as AmendmentChangeType)
              }
            >
              <option value="edit">Редагування</option>
              <option value="add">Додавання</option>
              <option value="delete">Видалення</option>
            </select>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>
              Оригінальний текст{" "}
              <em
                style={{ fontWeight: 400, fontStyle: "normal", opacity: 0.7 }}
              >
                (скопіюйте з тексту закону)
              </em>
            </span>
            <textarea
              className={styles.textarea}
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              placeholder="Вставте оригінальний текст статті..."
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Запропонований текст *</span>
            <textarea
              className={styles.textarea}
              value={proposedText}
              onChange={(e) => setProposedText(e.target.value)}
              placeholder="Ваша редакція тексту..."
              required
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Причина / обґрунтування</span>
            <textarea
              className={styles.textarea}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Чому ця зміна необхідна..."
            />
          </div>

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
              disabled={createAmendment.isPending}
            >
              {createAmendment.isPending
                ? "Збереження..."
                : "Створити поправку"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AmendmentsContent({ userId }: { userId: string | undefined }) {
  const { data: amendments, isLoading, error } = useAmendments({ userId });
  const deleteAmendment = useDeleteAmendment();

  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const list = amendments ?? [];

  const filtered =
    filterTab === "all"
      ? list
      : list.filter((a) => a.change_type === filterTab);

  const approvedCount = list.filter(
    (a) => a.votes_summary.positive > a.votes_summary.negative,
  ).length;
  const draftCount = list.filter(
    (a) => a.votes_summary.positive === 0 && a.votes_summary.negative === 0,
  ).length;

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteAmendment.mutateAsync(id);
      notify.success("Поправку видалено");
      if (openId === id) setOpenId(null);
    } catch (err) {
      notify.error(
        err instanceof Error ? err.message : "Не вдалося видалити поправку",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const TABS: { value: FilterTab; label: string }[] = [
    { value: "all", label: "Всі" },
    { value: "edit", label: "Edit" },
    { value: "add", label: "Add" },
    { value: "delete", label: "Delete" },
  ];

  return (
    <div className={styles.mainContent}>
      <span className={styles.eyebrow}>ЗАКОНОТВОРЕЦЬ · ПОПРАВКИ</span>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Мої поправки</h1>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={() => setShowModal(true)}
        >
          <Plus size={14} />
          Нова поправка
        </button>
      </div>

      {/* KPI */}
      <div className={styles.kpiStrip}>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Всього</p>
          <strong className={styles.kpiValue}>{list.length}</strong>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Затверджено</p>
          <strong className={styles.kpiValue}>{approvedCount}</strong>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>На розгляді</p>
          <strong className={styles.kpiValue}>{draftCount}</strong>
        </div>
      </div>

      {/* Filter tabs */}
      <div className={styles.tabRow}>
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`${styles.tab} ${filterTab === tab.value ? styles.tabActive : ""}`}
            onClick={() => setFilterTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <p className={styles.loadingState}>Завантаження...</p>
      ) : error ? (
        <p className={styles.errorState}>Помилка завантаження</p>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>Поправок поки немає</p>
          <span className={styles.emptyDesc}>
            Створіть першу поправку до законопроекту
          </span>
        </div>
      ) : (
        <div className={styles.amendmentList}>
          {filtered.map((a) => (
            <AmendmentCard
              key={a._id}
              amendment={a}
              isOpen={openId === a._id}
              onToggle={() => setOpenId(openId === a._id ? null : a._id)}
              onDelete={handleDelete}
              isDeleting={deletingId === a._id}
            />
          ))}
        </div>
      )}

      {showModal && <CreateModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

export default function LegislatorAmendmentsPage() {
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
        <AmendmentsContent userId={user?.id} />
      </main>
    </div>
  );
}
