"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  FolderKanban,
  GitBranch,
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
  Settings,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import { useLaws } from "@/hooks/useLaws";
import { useLawArticles, useLawArticleDetail } from "@/hooks/useLawElements";
import { useAuth } from "@/components/auth/AuthProvider";
import { notify } from "@/lib/toast";
import { LegislatorAccessRequestForm } from "@/features/law-change/components/LegislatorAccessRequestForm/LegislatorAccessRequestForm";
import { MyProposalsList } from "@/features/law-change/components/MyProposalsList/MyProposalsList";
import {
  useMyForks,
  useCreateFork,
  useSubmitFork,
  useAddChange,
} from "@/hooks/useForks";
import { ForkDiffModal } from "@/components/fork/ForkDiffModal";
import { useMyProposals } from "@/features/law-change";
import { fetchMyForks } from "@/lib/api/graph1";
import { ROUTES } from "@/constants/routes";
import type { GraphFork } from "@/features/graph1/types/graph1.types";
import styles from "./page.module.scss";

const SIDEBAR_NAV = [
  {
    icon: <Eye size={20} />,
    label: "Нагляд",
    href: ROUTES.legislatorCabinet,
    active: true,
  },
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
          {SIDEBAR_NAV.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className={`${styles.navItem} ${item.active ? styles.navItemActive : ""}`}
                title={item.label}
              >
                {item.icon}
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            </li>
          ))}
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

function AccessGate() {
  return (
    <div className={styles.accessPage}>
      <div className={`${styles.gate} panel`}>
        <span className="eyebrow">Legislator Access</span>
        <h1 className={styles.gateTitle}>Кабінет законотворця</h1>
        <p className={styles.gateText}>
          Цей workspace призначений для законотворців. Тут ви можете керувати
          пропозиціями, поправками та форками законопроектів.
        </p>
        <LegislatorAccessRequestForm defaultRole="legislator" lockRole />
      </div>
    </div>
  );
}

export default function LegislatorCabinetPage() {
  const { user, isLegislator, isSupervisor, isAdmin, isHydrated } = useAuth();

  if (!isHydrated) {
    return (
      <div className={styles.workspace}>
        <div className={styles.sidebar} />
        <main className={styles.mainScroll}>
          <div className={styles.page}>
            <div className={`${styles.hero} ${styles.skeletonBlock}`} />
            <div className={styles.kpiGrid}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={`${styles.kpiCard} ${styles.skeletonBlock}`}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!isLegislator && !isSupervisor && !isAdmin) {
    return <AccessGate />;
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
        <LegislatorDashboardView
          isSupervisor={isSupervisor && !isLegislator && !isAdmin}
        />
      </main>
    </div>
  );
}

function LegislatorDashboardView({ isSupervisor }: { isSupervisor: boolean }) {
  const { laws } = useLaws();
  const { data: proposals = [] } = useMyProposals();
  const { data: forks = [], isLoading: forksLoading } = useMyForks();
  const { data: graphForks = [], isLoading: graphForksLoading } = useQuery<
    GraphFork[]
  >({
    queryKey: ["graph1-forks", "my"],
    queryFn: fetchMyForks,
    staleTime: 60_000,
  });

  const createForkMutation = useCreateFork();
  const submitForkMutation = useSubmitFork();
  const addChangeMutation = useAddChange();

  const [showForkForm, setShowForkForm] = useState(false);
  const [forkTitle, setForkTitle] = useState("");
  const [forkLawId, setForkLawId] = useState("");
  const [forkDesc, setForkDesc] = useState("");
  const [diffForkId, setDiffForkId] = useState<string | null>(null);
  const [addChangeForkId, setAddChangeForkId] = useState<string | null>(null);
  const [changeOp, setChangeOp] = useState<"edit" | "add" | "delete">("edit");
  const [selectedArticleNum, setSelectedArticleNum] = useState("");
  const [selectedElementId, setSelectedElementId] = useState("");
  const [selectedElementCode, setSelectedElementCode] = useState("");
  const [selectedElementText, setSelectedElementText] = useState("");
  const [changeProposed, setChangeProposed] = useState("");
  const [changeRationale, setChangeRationale] = useState("");

  const forkLawIdForPicker = useMemo(() => {
    if (!addChangeForkId) return null;
    const fork = forks.find((f) => f._id === addChangeForkId);
    if (!fork) return null;
    const lawRef = fork.lawId;
    return typeof lawRef === "object" && lawRef !== null
      ? (lawRef as { _id: string })._id
      : null;
  }, [addChangeForkId, forks]);

  const { data: lawStructure } = useLawArticles(forkLawIdForPicker);
  const { data: articleDetail } = useLawArticleDetail(
    forkLawIdForPicker,
    selectedArticleNum || null,
  );

  const draftForks = forks.filter((f) => f.status === "draft");
  const submittedForks = forks.filter((f) => f.status === "review");

  const activityFeed = useMemo(() => {
    const items: {
      label: string;
      time: string;
      type: "fork" | "graph" | "proposal";
    }[] = [
      ...forks.map((f) => ({
        label: `Форк ${typeof f.lawId === "object" ? ((f.lawId as { code?: string }).code ?? "") : ""} · ${f.status}`,
        time: f.updatedAt ?? f.createdAt ?? "",
        type: "fork" as const,
      })),
      ...graphForks.map((gf) => ({
        label: gf.name,
        time: gf.updatedAt ?? "",
        type: "graph" as const,
      })),
    ]
      .filter((i) => i.time)
      .sort((a, b) => b.time.localeCompare(a.time))
      .slice(0, 8);
    return items;
  }, [forks, graphForks]);

  function formatRelativeDate(iso: string) {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const diffMins = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMins < 60) return `${diffMins} хв тому`;
    const diffH = Math.floor(diffMins / 60);
    if (diffH < 24) return `${diffH} год тому`;
    const diffDays = Math.floor(diffH / 24);
    if (diffDays < 7) return `${diffDays} дн. тому`;
    return d.toLocaleDateString("uk-UA", { day: "2-digit", month: "short" });
  }

  const handleCreateFork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forkTitle.trim() || !forkLawId) {
      notify.warning("Вкажіть назву та закон");
      return;
    }
    try {
      await createForkMutation.mutateAsync({
        lawId: forkLawId,
        title: forkTitle,
        description: forkDesc,
      });
      notify.success("Форк створено");
      setForkTitle("");
      setForkLawId("");
      setForkDesc("");
      setShowForkForm(false);
    } catch {
      notify.error("Не вдалося створити форк");
    }
  };

  const handleAddChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addChangeForkId || !selectedElementId) {
      notify.warning("Оберіть елемент закону");
      return;
    }
    try {
      await addChangeMutation.mutateAsync({
        forkId: addChangeForkId,
        change: {
          elementId: selectedElementId,
          elementCode: selectedElementCode,
          operation: changeOp,
          originalText: selectedElementText,
          proposedText: changeProposed,
          rationale: changeRationale,
        },
      });
      notify.success("Зміну додано");
      setSelectedArticleNum("");
      setSelectedElementId("");
      setSelectedElementCode("");
      setSelectedElementText("");
      setChangeProposed("");
      setChangeRationale("");
      setAddChangeForkId(null);
    } catch {
      notify.error("Не вдалося додати зміну");
    }
  };

  return (
    <div className={styles.page}>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className={`${styles.hero} panel`}>
        <div className={styles.heroCopy}>
          <span className="eyebrow">
            {isSupervisor ? "Supervisor Mode" : "Кабінет законотворця"}
          </span>
          <h1 className={styles.title}>
            {isSupervisor
              ? "Нагляд за пропозиціями та форками в одному workspace."
              : "Керуйте пропозиціями, поправками та форками законопроектів в одному workspace."}
          </h1>
          <p className={styles.description}>
            Контролюйте процес підготовки та подання від ідеї до розгляду.
            Відстежуйте статус змін та отримуйте сигнали про потрібні дії.
          </p>
          {!isSupervisor && (
            <div className={styles.heroActions}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowForkForm((v) => !v)}
              >
                <Plus size={14} />
                {showForkForm ? "Сховати форму" : "Новий форк"}
              </button>
              <Link href={ROUTES.laws} className="btn btn-outline">
                <FileText size={14} />
                Переглянути закони
              </Link>
            </div>
          )}
        </div>

        <aside className={styles.heroAside}>
          <div className={styles.asideHeader}>
            <div className={styles.asideHeaderLeft}>
              <Shield size={15} />
              <span>СТАТУС ЗМІН</span>
            </div>
            <div className={styles.asideUpdated}>
              Оновлено щойно
              <span className={styles.updatedDot} />
            </div>
          </div>
          <p className={styles.asideSubtitle}>Огляд у реальному часі</p>
          <div className={styles.asideStats}>
            {[
              {
                icon: <FileText size={22} />,
                value: proposals.length,
                label: "Пропозиції",
              },
              {
                icon: <GitBranch size={22} />,
                value: draftForks.length,
                label: "Чернетки",
              },
              {
                icon: <Activity size={22} />,
                value: submittedForks.length,
                label: "На розгляді",
              },
              {
                icon: <Network size={22} />,
                value: graphForks.length,
                label: "Форки графу",
              },
            ].map((stat) => (
              <div key={stat.label} className={styles.asideStat}>
                <span className={styles.asideStatIcon}>{stat.icon}</span>
                <strong className={styles.asideStatValue}>{stat.value}</strong>
                <span className={styles.asideStatLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {/* ── CREATE FORK FORM ─────────────────────────────────────────────── */}
      {showForkForm && (
        <section className={`${styles.formPanel} panel`}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionEyebrow}>Новий форк</span>
              <h2 className={styles.sectionTitle}>
                Створення форку законопроекту
              </h2>
            </div>
          </div>
          <form className={styles.formGrid} onSubmit={handleCreateFork}>
            <label className={styles.field}>
              <span>Закон</span>
              <select
                className="form-control form-select"
                value={forkLawId}
                onChange={(e) => setForkLawId(e.target.value)}
                required
              >
                <option value="">Оберіть закон</option>
                {laws?.map((law) => (
                  <option key={law._id} value={law._id}>
                    {law.code} — {law.title?.slice(0, 60)}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Назва форку</span>
              <input
                className="form-control"
                type="text"
                value={forkTitle}
                onChange={(e) => setForkTitle(e.target.value)}
                placeholder="Назва змін"
                required
              />
            </label>
            <label className={`${styles.field} ${styles.fieldFull}`}>
              <span>Опис (необов&apos;язково)</span>
              <textarea
                className="form-control"
                value={forkDesc}
                onChange={(e) => setForkDesc(e.target.value)}
                placeholder="Мета та обґрунтування змін"
                rows={2}
              />
            </label>
            <div className={styles.formActions}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowForkForm(false)}
              >
                Скасувати
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createForkMutation.isPending}
              >
                {createForkMutation.isPending
                  ? "Збереження..."
                  : "Створити форк"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ── KPI GRID ─────────────────────────────────────────────────────── */}
      <div className={styles.kpiGrid}>
        {[
          {
            label: "Пропозиції",
            value: proposals.length,
            note: "Активних пропозицій до законів",
            icon: <FileText size={20} />,
            tone: "blue",
          },
          {
            label: "Форки законів",
            value: forks.length,
            note: "Форків законопроектів у всіх статусах",
            icon: <GitBranch size={20} />,
            tone: "gold",
          },
          {
            label: "Поправки",
            value: 0,
            note: "Поправки до чинних законів",
            icon: <PenLine size={20} />,
            tone: "teal",
          },
          {
            label: "Форки графу",
            value: graphForks.length,
            note: "Збережені стани графу зв&apos;язків",
            icon: <Network size={20} />,
            tone: "violet",
          },
        ].map((card) => (
          <article key={card.label} className={`${styles.kpiCard} panel`}>
            <div className={styles.kpiCardTop}>
              <strong className={styles.kpiValue}>{card.value}</strong>
              <span
                className={`${styles.kpiIcon} ${styles[`kpiIcon_${card.tone}`]}`}
              >
                {card.icon}
              </span>
            </div>
            <h3 className={styles.kpiLabel}>{card.label}</h3>
            <p
              className={styles.kpiNote}
              dangerouslySetInnerHTML={{ __html: card.note }}
            />
          </article>
        ))}
      </div>

      {/* ── TWO COL: FORKS + PRIORITIES ──────────────────────────────────── */}
      <div className={styles.twoCol}>
        <section className={`${styles.sectionPanel} panel`}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionEyebrow}>МОЇ ФОРКИ</span>
              <h2 className={styles.sectionTitle}>Форки законопроектів</h2>
            </div>
            {!isSupervisor && (
              <button
                type="button"
                className={styles.sectionLink}
                onClick={() => setShowForkForm(true)}
              >
                <Plus size={14} /> Новий форк
              </button>
            )}
          </div>

          {forksLoading ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>Завантаження...</p>
            </div>
          ) : forks.length === 0 ? (
            <div className={styles.emptyState}>
              <GitBranch size={36} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>Поки що немає форків</p>
              <span className={styles.emptyDesc}>
                Створіть перший форк, щоб почати роботу над змінами до
                законопроекту.
              </span>
              {!isSupervisor && (
                <button
                  type="button"
                  className={styles.emptyBtn}
                  onClick={() => setShowForkForm(true)}
                >
                  <Plus size={14} /> Створити форк
                </button>
              )}
            </div>
          ) : (
            <div className={styles.forkList}>
              {forks.map((fork) => {
                const law = typeof fork.lawId === "object" ? fork.lawId : null;
                const isEditing = addChangeForkId === fork._id;
                return (
                  <div key={fork._id} className={styles.forkCard}>
                    <div className={styles.forkHead}>
                      <div>
                        <span className={styles.forkCode}>
                          {(law as { code?: string })?.code ?? "—"}
                        </span>
                        <h3 className={styles.forkTitle}>
                          {fork.title ?? "Без назви"}
                        </h3>
                      </div>
                      <span
                        className={`${styles.statusBadge} ${styles[`statusBadge_${fork.status === "draft" ? "draft" : fork.status === "approved" ? "good" : fork.status === "rejected" ? "danger" : "warning"}`]}`}
                      >
                        {fork.status}
                      </span>
                    </div>
                    {fork.updatedAt && (
                      <div className={styles.forkDate}>
                        <Clock3 size={13} />
                        {formatRelativeDate(fork.updatedAt)}
                      </div>
                    )}
                    <div className={styles.forkActions}>
                      <button
                        type="button"
                        className={styles.inlineLink}
                        onClick={() => setDiffForkId(fork._id)}
                      >
                        <Eye size={14} /> Переглянути зміни
                      </button>
                      {fork.status === "draft" && !isSupervisor && (
                        <>
                          <button
                            type="button"
                            className={styles.inlineLink}
                            onClick={() =>
                              setAddChangeForkId(isEditing ? null : fork._id)
                            }
                          >
                            <PenLine size={14} />{" "}
                            {isEditing ? "Закрити" : "+ Зміна"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ fontSize: "0.8rem", padding: "6px 14px" }}
                            onClick={() =>
                              submitForkMutation.mutate(fork._id, {
                                onSuccess: () =>
                                  notify.success("Форк подано на розгляд"),
                                onError: () => notify.error("Помилка"),
                              })
                            }
                          >
                            Подати на розгляд
                          </button>
                        </>
                      )}
                    </div>
                    {isEditing && (
                      <form
                        onSubmit={handleAddChange}
                        className={styles.changeForm}
                      >
                        <div className={styles.changeFormRow}>
                          <select
                            className="form-control form-select"
                            value={changeOp}
                            onChange={(e) =>
                              setChangeOp(
                                e.target.value as "edit" | "add" | "delete",
                              )
                            }
                          >
                            <option value="edit">Редагувати</option>
                            <option value="add">Додати</option>
                            <option value="delete">Видалити</option>
                          </select>
                          <select
                            className="form-control form-select"
                            value={selectedArticleNum}
                            onChange={(e) => {
                              setSelectedArticleNum(e.target.value);
                              setSelectedElementId("");
                              setSelectedElementCode("");
                              setSelectedElementText("");
                              setChangeProposed("");
                            }}
                          >
                            <option value="">Оберіть статтю</option>
                            {lawStructure?.articles.map((a) => (
                              <option key={a.number} value={a.number}>
                                Ст. {a.number}
                                {a.title ? ` — ${a.title.slice(0, 50)}` : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                        {selectedArticleNum && (
                          <label className={styles.field}>
                            <span>Елемент (частина / пункт / абзац)</span>
                            <select
                              className="form-control form-select"
                              value={selectedElementId}
                              onChange={(e) => {
                                const elId = e.target.value;
                                let found: import("@/types").TreeNode | null =
                                  null;
                                if (articleDetail) {
                                  if (
                                    String(articleDetail.article._id) === elId
                                  ) {
                                    found = articleDetail.article;
                                  } else {
                                    found =
                                      articleDetail.children.find(
                                        (c) => String(c._id) === elId,
                                      ) ?? null;
                                  }
                                }
                                if (found) {
                                  setSelectedElementId(elId);
                                  setSelectedElementCode(
                                    found.code ?? found.number ?? "",
                                  );
                                  setSelectedElementText(found.text ?? "");
                                  if (changeOp !== "delete")
                                    setChangeProposed(found.text ?? "");
                                }
                              }}
                            >
                              <option value="">Оберіть елемент</option>
                              {articleDetail && (
                                <option
                                  value={String(articleDetail.article._id)}
                                >
                                  Стаття цілком (ст.{" "}
                                  {articleDetail.article.number ?? ""})
                                </option>
                              )}
                              {articleDetail?.children.map((child) => {
                                const label =
                                  child.type === "part"
                                    ? "ч."
                                    : child.type === "point"
                                      ? "п."
                                      : child.type === "paragraph"
                                        ? "абз."
                                        : (child.type ?? "");
                                return (
                                  <option
                                    key={String(child._id)}
                                    value={String(child._id)}
                                  >
                                    {label} {child.number ?? ""}
                                    {child.title
                                      ? ` — ${child.title.slice(0, 40)}`
                                      : ""}
                                  </option>
                                );
                              })}
                            </select>
                          </label>
                        )}
                        {selectedElementId &&
                          selectedElementText &&
                          changeOp !== "add" && (
                            <label className={styles.field}>
                              <span>Оригінальний текст (авто)</span>
                              <textarea
                                className="form-control"
                                value={selectedElementText}
                                readOnly
                                rows={3}
                                style={{ opacity: 0.65 }}
                              />
                            </label>
                          )}
                        {changeOp !== "delete" && (
                          <label className={styles.field}>
                            <span>Пропонований текст</span>
                            <textarea
                              className="form-control"
                              value={changeProposed}
                              onChange={(e) =>
                                setChangeProposed(e.target.value)
                              }
                              rows={3}
                            />
                          </label>
                        )}
                        <label className={styles.field}>
                          <span>Обґрунтування</span>
                          <textarea
                            className="form-control"
                            value={changeRationale}
                            onChange={(e) => setChangeRationale(e.target.value)}
                            rows={2}
                          />
                        </label>
                        <div className={styles.formActions}>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => setAddChangeForkId(null)}
                          >
                            Скасувати
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={
                              addChangeMutation.isPending || !selectedElementId
                            }
                          >
                            {addChangeMutation.isPending
                              ? "Збереження..."
                              : "Зберегти зміну"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className={`${styles.sectionPanel} panel`}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionEyebrow}>ПРІОРИТЕТИ</span>
              <h2 className={styles.sectionTitle}>Що потребує вашої уваги</h2>
            </div>
          </div>
          <div className={styles.priorityList}>
            {[
              {
                color: "orange",
                title: "Чернетки форків",
                desc: "Форки зі статусом draft очікують на доопрацювання або подання",
              },
              {
                color: "purple",
                title: "На розгляді",
                desc: "Подані форки та пропозиції чекають рішення модератора",
              },
              {
                color: "teal",
                title: "Погоджені зміни",
                desc: "Зміни, що вже отримали схвалення і вступили в дію",
              },
              {
                color: "blue",
                title: "Форки графу",
                desc: "Збережені стани графу зв&apos;язків між нормами",
              },
            ].map((item) => (
              <div key={item.title} className={styles.priorityItem}>
                <span
                  className={`${styles.priorityDot} ${styles[`priorityDot_${item.color}`]}`}
                />
                <div className={styles.priorityBody}>
                  <strong>{item.title}</strong>
                  <p dangerouslySetInnerHTML={{ __html: item.desc }} />
                </div>
                <ChevronRight size={16} className={styles.priorityChevron} />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── PROPOSALS SECTION ────────────────────────────────────────────── */}
      <section className={`${styles.sectionPanel} panel`}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionEyebrow}>МОЇ ПРОПОЗИЦІЇ</span>
            <h2 className={styles.sectionTitle}>
              Пропозиції до законопроектів
            </h2>
          </div>
        </div>
        {proposals.length === 0 ? (
          <div className={styles.emptyState}>
            <FileText size={32} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>Поки що немає пропозицій</p>
            <span className={styles.emptyDesc}>
              Коли ви створите пропозиції до законопроектів, вони
              з&apos;являться тут.
            </span>
          </div>
        ) : (
          <MyProposalsList />
        )}
      </section>

      {/* ── BOTTOM 2 COLUMNS: GRAPH FORKS + ACTIVITY ─────────────────────── */}
      <div className={styles.twoCol}>
        <section className={`${styles.sectionPanel} panel`}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionEyebrow}>ФОРКИ ГРАФУ</span>
              <h2 className={styles.sectionTitle}>Форки графу зв&apos;язків</h2>
            </div>
            <Link href={ROUTES.graph} className={styles.sectionLink}>
              Відкрити граф <ChevronRight size={14} />
            </Link>
          </div>
          {graphForksLoading ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>Завантаження...</p>
            </div>
          ) : graphForks.length === 0 ? (
            <div className={styles.emptyState}>
              <Network size={32} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>Немає форків графу</p>
              <span className={styles.emptyDesc}>
                Перейдіть до графу зв&apos;язків та збережіть стан.
              </span>
            </div>
          ) : (
            <div className={styles.feedList}>
              {graphForks.map((gf) => (
                <article key={gf._id} className={styles.feedItem}>
                  <span className={`${styles.feedIcon} ${styles.feedIconFork}`}>
                    <FolderKanban size={14} />
                  </span>
                  <div className={styles.feedBody}>
                    <div className={styles.feedTop}>
                      <strong>{gf.name}</strong>
                      <span className={styles.feedDate}>
                        {formatRelativeDate(gf.updatedAt)}
                      </span>
                    </div>
                    <div className={styles.feedBottom}>
                      <span className={styles.feedStatus}>граф</span>
                      <button
                        type="button"
                        className={styles.inlineLink}
                        onClick={() =>
                          window.open(`/graph?fork=${gf._id}`, "_blank")
                        }
                      >
                        Відкрити граф <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={`${styles.sectionPanel} ${styles.infoPanel} panel`}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionEyebrow}>ЖИВА СТРІЧКА</span>
              <h2 className={styles.sectionTitle}>Остання активність</h2>
            </div>
          </div>
          {activityFeed.length === 0 ? (
            <div className={styles.emptyState}>
              <Activity size={28} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>Стрічка подій порожня</p>
              <span className={styles.emptyDesc}>
                Активність з&apos;явиться після перших дій у кабінеті.
              </span>
            </div>
          ) : (
            <div className={styles.feedList}>
              {activityFeed.map((item, i) => (
                <article key={i} className={styles.feedItem}>
                  <span
                    className={`${styles.feedIcon} ${item.type === "graph" ? styles.feedIconFork : styles.feedIconProposal}`}
                  >
                    {item.type === "graph" ? (
                      <Network size={14} />
                    ) : (
                      <GitBranch size={14} />
                    )}
                  </span>
                  <div className={styles.feedBody}>
                    <div className={styles.feedTop}>
                      <strong>{item.label}</strong>
                      <span className={styles.feedDate}>
                        {formatRelativeDate(item.time)}
                      </span>
                    </div>
                    <div className={styles.feedBottom}>
                      <span className={styles.feedStatus}>
                        {item.type === "graph" ? "граф" : "форк"}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          <div className={styles.infoPanelLinks}>
            <Link href={ROUTES.account} className={styles.supervisorLink}>
              <Settings size={14} />
              <span>Налаштування кабінету</span>
              <ChevronRight size={14} />
            </Link>
            <Link href={ROUTES.laws} className={styles.supervisorLink}>
              <Scale size={14} />
              <span>Переглянути всі закони</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </section>
      </div>

      {diffForkId && (
        <ForkDiffModal
          forkId={diffForkId}
          onClose={() => setDiffForkId(null)}
        />
      )}
    </div>
  );
}
