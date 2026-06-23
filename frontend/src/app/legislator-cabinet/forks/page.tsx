"use client";

import { useState } from "react";
import Link from "next/link";
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
import { useMyForks, useCreateFork, useSubmitFork, useAddChange } from "@/hooks/useForks";
import { useMyGraphForks, useDeleteGraphFork } from "@/hooks/useGraphForks";
import type { LawFork } from "@/lib/api/forks";
import type { GraphFork } from "@/lib/api/graphForks";
import { ROUTES } from "@/constants/routes";
import styles from "./page.module.scss";

const SIDEBAR_NAV = [
  { icon: <Eye size={20} />, label: "Нагляд", href: ROUTES.legislatorCabinet },
  { icon: <Users size={20} />, label: "Групи", href: ROUTES.legislatorCabinetGroups },
  { icon: <FileText size={20} />, label: "Пропозиції", href: ROUTES.legislatorCabinetProposals },
  { icon: <PenLine size={20} />, label: "Поправки", href: ROUTES.legislatorCabinetAmendments },
  { icon: <Zap size={20} />, label: "Форки", href: ROUTES.legislatorCabinetForks },
  { icon: <Scale size={20} />, label: "Закони", href: ROUTES.laws },
  { icon: <Network size={20} />, label: "Граф", href: ROUTES.graph },
  { icon: <GitGraph size={20} />, label: "Пропоз. Граф", href: ROUTES.graphProposals },
  { icon: <Radar size={20} />, label: "Пропоз. Радіант", href: ROUTES.radiantProposals },
  { icon: <RefreshCcw size={20} />, label: "Зміни", href: ROUTES.legislatorCabinetChanges },
  { icon: <MessagesSquare size={20} />, label: "Коментарі", href: ROUTES.legislatorCabinetComments },
  { icon: <Shield size={20} />, label: "Правила", href: ROUTES.legislatorCabinetRules },
  { icon: <BarChart3 size={20} />, label: "Аналітика", href: ROUTES.legislatorCabinetAnalytics },
  { icon: <History size={20} />, label: "Історія", href: ROUTES.legislatorCabinetHistory },
  { icon: <MessageCircle size={20} />, label: "Чат", href: ROUTES.legislatorCabinetChat },
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

function getStatusBadgeClass(status: LawFork["status"]): string {
  switch (status) {
    case "draft":
      return styles.badgeDraft;
    case "review":
      return styles.badgeReview;
    case "approved":
      return styles.badgeApproved;
    case "rejected":
      return styles.badgeRejected;
    default:
      return styles.badge;
  }
}

function getStatusLabel(status: LawFork["status"]): string {
  switch (status) {
    case "draft":
      return "Чернетка";
    case "review":
      return "На розгляді";
    case "approved":
      return "Схвалено";
    case "rejected":
      return "Відхилено";
    default:
      return status;
  }
}

function getLawTitle(lawId: LawFork["lawId"]): string {
  if (typeof lawId === "object" && lawId !== null) {
    return lawId.title;
  }
  return typeof lawId === "string" ? lawId : "";
}

type StatusTab = "all" | LawFork["status"];

const STATUS_TABS: { label: string; value: StatusTab }[] = [
  { label: "Всі", value: "all" },
  { label: "Чернетки", value: "draft" },
  { label: "На розгляді", value: "review" },
  { label: "Схвалені", value: "approved" },
  { label: "Відхилені", value: "rejected" },
];

interface CreateForkForm {
  lawId: string;
  title: string;
  description: string;
}

interface AddChangeForm {
  elementId: string;
  elementCode: string;
  operation: "edit" | "add" | "delete";
  originalText: string;
  proposedText: string;
  rationale: string;
}

const EMPTY_CREATE_FORM: CreateForkForm = {
  lawId: "",
  title: "",
  description: "",
};

const EMPTY_CHANGE_FORM: AddChangeForm = {
  elementId: "",
  elementCode: "",
  operation: "edit",
  originalText: "",
  proposedText: "",
  rationale: "",
};

function ForksPageContent() {
  const { data: forks, isLoading, error } = useMyForks();
  const createFork = useCreateFork();
  const submitFork = useSubmitFork();
  const addChange = useAddChange();

  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddChangeModal, setShowAddChangeModal] = useState(false);
  const [currentForkId, setCurrentForkId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreateForkForm>(EMPTY_CREATE_FORM);
  const [changeForm, setChangeForm] = useState<AddChangeForm>(EMPTY_CHANGE_FORM);

  const allForks = forks ?? [];
  const draftCount = allForks.filter((f) => f.status === "draft").length;
  const reviewCount = allForks.filter((f) => f.status === "review").length;
  const approvedCount = allForks.filter((f) => f.status === "approved").length;

  const filtered =
    activeTab === "all" ? allForks : allForks.filter((f) => f.status === activeTab);

  const handleCreateFork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.lawId.trim() || !createForm.title.trim()) return;
    try {
      await createFork.mutateAsync({
        lawId: createForm.lawId.trim(),
        title: createForm.title.trim(),
        description: createForm.description.trim() || undefined,
      });
      notify.success("Форк створено");
      setCreateForm(EMPTY_CREATE_FORM);
      setShowCreateModal(false);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Не вдалося створити форк");
    }
  };

  const handleSubmitFork = async (forkId: string) => {
    try {
      await submitFork.mutateAsync(forkId);
      notify.success("Форк подано на розгляд");
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Не вдалося подати форк");
    }
  };

  const handleAddChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentForkId) return;
    try {
      await addChange.mutateAsync({
        forkId: currentForkId,
        change: {
          elementId: changeForm.elementId.trim(),
          elementCode: changeForm.elementCode.trim(),
          operation: changeForm.operation,
          originalText: changeForm.originalText.trim(),
          proposedText: changeForm.proposedText.trim(),
          rationale: changeForm.rationale.trim(),
        },
      });
      notify.success("Зміну додано");
      setChangeForm(EMPTY_CHANGE_FORM);
      setShowAddChangeModal(false);
      setCurrentForkId(null);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Не вдалося додати зміну");
    }
  };

  const openAddChangeModal = (forkId: string) => {
    setCurrentForkId(forkId);
    setChangeForm(EMPTY_CHANGE_FORM);
    setShowAddChangeModal(true);
  };

  return (
    <div className={styles.mainContent}>
      {/* HERO */}
      <span className={styles.eyebrow}>ЗАКОНОТВОРЕЦЬ · ФОРКИ</span>
      <div className={styles.heroRow}>
        <h1 className={styles.pageTitle}>Мої форки законів</h1>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={14} />
          Новий форк
        </button>
      </div>

      {/* KPI */}
      <div className={styles.kpiStrip}>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Чернетки</p>
          <strong className={styles.kpiValue}>{draftCount}</strong>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>На розгляді</p>
          <strong className={styles.kpiValue}>{reviewCount}</strong>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Схвалено</p>
          <strong className={styles.kpiValue}>{approvedCount}</strong>
        </div>
      </div>

      {/* TABS */}
      <div className={styles.tabsRow}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`${styles.tab} ${activeTab === tab.value ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      {isLoading && (
        <p className={styles.loadingState}>Завантаження...</p>
      )}
      {error && (
        <p className={styles.errorState}>Помилка завантаження</p>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>Форків поки немає</p>
        </div>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className={styles.forkList}>
          {filtered.map((fork) => {
            const lawTitle = getLawTitle(fork.lawId);
            const changesCount = fork.changes?.length ?? 0;

            return (
              <article key={fork._id} className={styles.forkCard}>
                <div className={styles.forkCardTop}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className={styles.forkTitleRow}>
                      <p className={styles.forkTitle}>{fork.title}</p>
                      <span className={`${styles.badge} ${getStatusBadgeClass(fork.status)}`}>
                        {getStatusLabel(fork.status)}
                      </span>
                    </div>
                    {lawTitle && (
                      <p className={styles.forkLaw}>{lawTitle}</p>
                    )}
                    {fork.description && (
                      <p className={styles.forkDesc}>{fork.description}</p>
                    )}
                    <div className={styles.forkMeta}>
                      <span>
                        {new Date(fork.createdAt).toLocaleDateString("uk-UA")}
                      </span>
                      {fork.submittedAt && (
                        <>
                          <span>·</span>
                          <span>
                            Подано: {new Date(fork.submittedAt).toLocaleDateString("uk-UA")}
                          </span>
                        </>
                      )}
                      <span>·</span>
                      <span className={styles.changesCount}>
                        {changesCount} змін
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.forkActionsBar}>
                  <Link
                    href={`/legislator-cabinet/forks/${fork._id}`}
                    className={styles.btnSecondary}
                  >
                    Переглянути diff
                  </Link>
                  {fork.status === "draft" && (
                    <>
                      <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={() => handleSubmitFork(fork._id)}
                        disabled={submitFork.isPending}
                      >
                        {submitFork.isPending ? "Подаємо..." : "Подати на розгляд"}
                      </button>
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={() => openAddChangeModal(fork._id)}
                      >
                        + Додати зміну
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* CREATE FORK MODAL */}
      {showCreateModal && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className={styles.modalBox}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={styles.modalTitle}>Новий форк</h2>
            <form
              onSubmit={handleCreateFork}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <label className={styles.field}>
                <span>Закон (ID або назва) *</span>
                <input
                  className="form-control"
                  type="text"
                  value={createForm.lawId}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, lawId: e.target.value }))
                  }
                  placeholder="ID або назва закону"
                  required
                  autoFocus
                />
              </label>
              <label className={styles.field}>
                <span>Назва форку *</span>
                <input
                  className="form-control"
                  type="text"
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Назва вашого форку"
                  required
                />
              </label>
              <label className={styles.field}>
                <span>Опис</span>
                <textarea
                  className={styles.textarea}
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Необов'язковий опис"
                  rows={3}
                />
              </label>
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setShowCreateModal(false)}
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={createFork.isPending}
                >
                  {createFork.isPending ? "Створення..." : "Створити форк"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CHANGE MODAL */}
      {showAddChangeModal && (
        <div
          className={styles.modalBackdrop}
          onClick={() => {
            setShowAddChangeModal(false);
            setCurrentForkId(null);
          }}
        >
          <div
            className={styles.modalBox}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={styles.modalTitle}>Додати зміну</h2>
            <form
              onSubmit={handleAddChange}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <label className={styles.field}>
                <span>ID елементу</span>
                <input
                  className="form-control"
                  type="text"
                  value={changeForm.elementId}
                  onChange={(e) =>
                    setChangeForm((prev) => ({ ...prev, elementId: e.target.value }))
                  }
                  placeholder="element-id"
                  autoFocus
                />
              </label>
              <label className={styles.field}>
                <span>Код елементу</span>
                <input
                  className="form-control"
                  type="text"
                  value={changeForm.elementCode}
                  onChange={(e) =>
                    setChangeForm((prev) => ({ ...prev, elementCode: e.target.value }))
                  }
                  placeholder="art.1.p.2"
                />
              </label>
              <label className={styles.field}>
                <span>Операція</span>
                <select
                  className="form-control form-select"
                  value={changeForm.operation}
                  onChange={(e) =>
                    setChangeForm((prev) => ({
                      ...prev,
                      operation: e.target.value as "edit" | "add" | "delete",
                    }))
                  }
                >
                  <option value="edit">Редагування</option>
                  <option value="add">Додавання</option>
                  <option value="delete">Видалення</option>
                </select>
              </label>
              <label className={styles.field}>
                <span>Оригінальний текст</span>
                <textarea
                  className={styles.textarea}
                  value={changeForm.originalText}
                  onChange={(e) =>
                    setChangeForm((prev) => ({ ...prev, originalText: e.target.value }))
                  }
                  placeholder="Поточний текст елементу"
                  rows={3}
                />
              </label>
              <label className={styles.field}>
                <span>Запропонований текст</span>
                <textarea
                  className={styles.textarea}
                  value={changeForm.proposedText}
                  onChange={(e) =>
                    setChangeForm((prev) => ({ ...prev, proposedText: e.target.value }))
                  }
                  placeholder="Новий текст елементу"
                  rows={3}
                />
              </label>
              <label className={styles.field}>
                <span>Обґрунтування</span>
                <textarea
                  className={styles.textarea}
                  value={changeForm.rationale}
                  onChange={(e) =>
                    setChangeForm((prev) => ({ ...prev, rationale: e.target.value }))
                  }
                  placeholder="Чому потрібна ця зміна"
                  rows={2}
                />
              </label>
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => {
                    setShowAddChangeModal(false);
                    setCurrentForkId(null);
                  }}
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={addChange.isPending}
                >
                  {addChange.isPending ? "Збереження..." : "Додати зміну"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function GraphForksSection() {
  const { data: graphForks, isLoading, error } = useMyGraphForks();
  const deleteGraphFork = useDeleteGraphFork();

  if (isLoading) return <p className={styles.loadingState}>Завантаження...</p>;
  if (error) return <p className={styles.errorState}>Помилка завантаження</p>;

  const list = graphForks ?? [];

  const handleDelete = async (id: string) => {
    try {
      await deleteGraphFork.mutateAsync(id);
    } catch {
      // silent
    }
  };

  return (
    <div className={styles.mainContent}>
      <span className={styles.eyebrow}>ЗАКОНОТВОРЕЦЬ · ЗБЕРЕЖЕНІ ГРАФИ</span>
      <h1 className={styles.pageTitle}>Мої збережені графи</h1>

      {list.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>Збережених графів поки немає</p>
          <span className={styles.emptyDesc}>
            Збережіть стан графу на сторінці{" "}
            <Link href={ROUTES.graph} style={{ color: "var(--color-accent)" }}>Граф</Link>
          </span>
        </div>
      ) : (
        <div className={styles.forkList}>
          {list.map((gf: GraphFork) => {
            const notesCount = gf.viewState?.notes?.length ?? 0;
            const nodesCount = gf.viewState?.nodePositions?.length ?? 0;

            return (
              <article key={gf._id} className={styles.forkCard}>
                <div className={styles.forkCardTop}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className={styles.forkTitleRow}>
                      <p className={styles.forkTitle}>{gf.name}</p>
                    </div>
                    {gf.description && (
                      <p className={styles.forkDesc}>{gf.description}</p>
                    )}
                    <div className={styles.forkMeta}>
                      <span>{nodesCount} вузлів</span>
                      {notesCount > 0 && <><span>·</span><span>{notesCount} нотаток</span></>}
                      <span>·</span>
                      <span>{new Date(gf.updatedAt).toLocaleDateString("uk-UA")}</span>
                    </div>
                  </div>
                </div>
                <div className={styles.forkActionsBar}>
                  <Link
                    href={`${ROUTES.graph}?forkId=${gf._id}`}
                    className={styles.btnPrimary}
                  >
                    Відкрити в графі →
                  </Link>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => handleDelete(gf._id)}
                    disabled={deleteGraphFork.isPending}
                  >
                    Видалити
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

type SectionTab = "law-forks" | "graph-forks";

function ForksTabsWrapper() {
  const [activeSection, setActiveSection] = useState<SectionTab>("law-forks");

  const tabStyle = (active: boolean) => ({
    padding: "6px 20px",
    borderRadius: 6,
    border: "1px solid var(--color-border)",
    background: active ? "var(--color-accent)" : "transparent",
    color: active ? "#fff" : "var(--color-text)",
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    fontSize: "0.9rem",
  });

  return (
    <div>
      <div style={{ display: "flex", gap: 8, padding: "24px 32px 0" }}>
        <button type="button" style={tabStyle(activeSection === "law-forks")} onClick={() => setActiveSection("law-forks")}>
          Форки законів
        </button>
        <button type="button" style={tabStyle(activeSection === "graph-forks")} onClick={() => setActiveSection("graph-forks")}>
          Збережені графи
        </button>
      </div>
      {activeSection === "law-forks" ? <ForksPageContent /> : <GraphForksSection />}
    </div>
  );
}

export default function LegislatorForksPage() {
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
        <ForksTabsWrapper />
      </main>
    </div>
  );
}
