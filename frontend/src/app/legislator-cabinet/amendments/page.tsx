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
import { DiffViewer } from "@/components/ui";
import { getLaws, getLawArticles, getLawElement } from "@/lib/api/laws";
import type { LawStructure } from "@/lib/api/laws";
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
        {typeof a.law_id === "object" && a.law_id !== null && (
          <span className={styles.amendmentLaw}>{a.law_id.title}</span>
        )}
        <ChangeBadge type={a.change_type} />
        {a.status === "approved" && (
          <span className={styles.statusApproved}>Затверджено</span>
        )}
        {a.status === "rejected" && (
          <span className={styles.statusRejected}>Відхилено</span>
        )}
        <span className={styles.amendmentDate}>{date}</span>
      </div>

      {isOpen && (
        <div className={styles.amendmentBody}>
          <DiffViewer original={a.original_text} proposed={a.proposed_text} />
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

  const [lawSearch, setLawSearch] = useState("");
  const [lawOptions, setLawOptions] = useState<{ _id: string; title: string }[]>([]);
  const [lawsLoading, setLawsLoading] = useState(false);
  const [selectedLawId, setSelectedLawId] = useState("");
  const [selectedLawTitle, setSelectedLawTitle] = useState("");
  const [showLawDropdown, setShowLawDropdown] = useState(false);

  const [articleOptions, setArticleOptions] = useState<LawStructure["articles"]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState("");
  const [selectedArticleNum, setSelectedArticleNum] = useState("");

  const [changeType, setChangeType] = useState<AmendmentChangeType>("edit");
  const [originalText, setOriginalText] = useState("");
  const [proposedText, setProposedText] = useState("");
  const [reason, setReason] = useState("");

  const handleLawSearch = async (q: string) => {
    setLawSearch(q);
    setSelectedLawId("");
    setSelectedLawTitle("");
    setSelectedElementId("");
    setArticleOptions([]);
    if (q.trim().length < 2) {
      setLawOptions([]);
      setShowLawDropdown(false);
      return;
    }
    setLawsLoading(true);
    try {
      const laws = await getLaws(q);
      setLawOptions(laws.slice(0, 10).map((l) => ({ _id: l._id, title: l.title })));
      setShowLawDropdown(true);
    } finally {
      setLawsLoading(false);
    }
  };

  const handleSelectLaw = async (id: string, title: string) => {
    setSelectedLawId(id);
    setSelectedLawTitle(title);
    setLawSearch(title);
    setShowLawDropdown(false);
    setSelectedElementId("");
    setArticleOptions([]);
    setArticlesLoading(true);
    try {
      const structure = await getLawArticles(id);
      setArticleOptions(structure.articles);
    } finally {
      setArticlesLoading(false);
    }
  };

  const handleSelectArticle = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const article = articleOptions.find((a) => a._id === e.target.value);
    if (article) {
      setSelectedElementId(article._id);
      setSelectedArticleNum(article.number ?? "");
      try {
        const el = await getLawElement(article._id);
        setOriginalText(el.text ?? "");
      } catch {
        setOriginalText("");
      }
    } else {
      setSelectedElementId("");
      setSelectedArticleNum("");
      setOriginalText("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposedText.trim()) return;
    if (!selectedLawId || !selectedElementId) {
      notify.error("Оберіть закон та статтю");
      return;
    }
    try {
      await createAmendment.mutateAsync({
        law_id: selectedLawId,
        element_id: selectedElementId,
        change_type: changeType,
        original_text: originalText || undefined,
        proposed_text: proposedText,
        reason: reason || undefined,
        context: {
          article_num: selectedArticleNum || undefined,
          element_code: selectedElementId,
          section_title: selectedLawTitle || undefined,
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

          <div className={styles.field}>
            <span className={styles.label}>Закон *</span>
            <div style={{ position: "relative" }}>
              <input
                className={styles.input}
                type="text"
                value={lawSearch}
                onChange={(e) => handleLawSearch(e.target.value)}
                placeholder="Почніть вводити назву закону..."
                autoComplete="off"
              />
              {lawsLoading && (
                <span style={{ position: "absolute", right: 10, top: 8, fontSize: "0.75rem", opacity: 0.5 }}>
                  ...
                </span>
              )}
              {showLawDropdown && lawOptions.length > 0 && (
                <ul className={styles.lawDropdown}>
                  {lawOptions.map((l) => (
                    <li
                      key={l._id}
                      className={styles.lawDropdownItem}
                      onClick={() => handleSelectLaw(l._id, l.title)}
                    >
                      {l.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Стаття *</span>
            <select
              className={styles.select}
              value={selectedElementId}
              onChange={handleSelectArticle}
              disabled={!selectedLawId || articlesLoading}
            >
              <option value="">
                {!selectedLawId
                  ? "Спочатку оберіть закон"
                  : articlesLoading
                    ? "Завантаження..."
                    : "Оберіть статтю"}
              </option>
              {articleOptions.map((a) => (
                <option key={a._id} value={a._id}>
                  Стаття {a.number}{a.title ? ` — ${a.title}` : ""}
                </option>
              ))}
            </select>
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
              <em style={{ fontWeight: 400, fontStyle: "normal", opacity: 0.7 }}>
                (підтягується автоматично після вибору статті)
              </em>
            </span>
            <textarea
              className={`${styles.textarea} ${selectedElementId ? styles.textareaReadonly : ""}`}
              value={originalText}
              readOnly={!!selectedElementId}
              onChange={!selectedElementId ? (e) => setOriginalText(e.target.value) : undefined}
              placeholder="Оберіть статтю — текст підтягнеться автоматично"
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
              disabled={createAmendment.isPending || !selectedLawId || !selectedElementId}
            >
              {createAmendment.isPending ? "Збереження..." : "Створити поправку"}
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

  const list = [...(amendments ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const filtered =
    filterTab === "all"
      ? list
      : list.filter((a) => a.change_type === filterTab);

  const approvedCount = list.filter((a) => a.status === "approved").length;
  const draftCount = list.filter((a) => a.status === "pending").length;

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
