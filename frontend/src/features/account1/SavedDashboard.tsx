"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  User,
  Search,
  Bookmark,
  Bell,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  BookOpen,
  Trash2,
  ExternalLink,
  Plus,
  FileText,
  Star,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLaws } from "@/hooks/useLaws";
import { savedApi } from "@/lib/api/me";
import {
  type SavedArticleItem,
  readLegacyWorkspace,
  clearLegacyWorkspace,
  isWorkspaceMigrationDone,
  markWorkspaceMigrationDone,
} from "@/lib/auth/clientWorkspace";
import { notify } from "@/lib/toast";
import { formatDateMedium } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import styles from "./SavedDashboard.module.scss";

const SAVED_MIGRATION_FLAG = (userId: string) =>
  `low-analysis.saved.migrated.${userId}`;

function isSavedMigrated(userId: string) {
  try {
    return (
      isWorkspaceMigrationDone(userId) ||
      localStorage.getItem(SAVED_MIGRATION_FLAG(userId)) === "1"
    );
  } catch {
    return true;
  }
}

function markSavedMigrated(userId: string) {
  try {
    localStorage.setItem(SAVED_MIGRATION_FLAG(userId), "1");
    markWorkspaceMigrationDone(userId);
  } catch {
    // ignore
  }
}

const NAV_ITEMS = [
  { href: ROUTES.account, label: "Особистий кабінет", Icon: User },
  { href: ROUTES.search, label: "Пошук документів", Icon: Search },
  { href: ROUTES.accountSaved, label: "Збережені документи", Icon: Bookmark },
  { href: ROUTES.accountNotes, label: "Нотатки", Icon: Bell },
  {
    href: ROUTES.accountBilling,
    label: "Підписка та billing",
    Icon: CreditCard,
  },
  { href: ROUTES.account, label: "Налаштування", Icon: Settings },
  { href: ROUTES.support, label: "Підтримка", Icon: HelpCircle },
];

export function SavedDashboard() {
  const { user, logout } = useAuth();
  const userId = user?.id;
  const { laws, loading: lawsLoading } = useLaws();
  const [savedArticles, setSavedArticles] = useState<SavedArticleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      try {
        if (!isSavedMigrated(userId)) {
          const legacy = readLegacyWorkspace(userId);
          if (legacy?.savedArticles?.length) {
            await savedApi.migrate(
              legacy.savedArticles.map(
                ({ lawId, title, code, note, tags }) => ({
                  lawId,
                  title,
                  code,
                  note: note ?? "",
                  tags: tags ?? [],
                }),
              ),
            );
            clearLegacyWorkspace(userId);
          }
          markSavedMigrated(userId);
        }
        const items = await savedApi.getAll();
        setSavedArticles(items);
      } catch {
        // API unavailable
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const suggestions = useMemo(
    () =>
      laws
        .filter((l) => !savedArticles.some((s) => s.lawId === l._id))
        .slice(0, 5),
    [laws, savedArticles],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return savedArticles;
    const q = query.toLowerCase();
    return savedArticles.filter(
      (item) =>
        item.title?.toLowerCase().includes(q) ||
        item.code?.toLowerCase().includes(q),
    );
  }, [savedArticles, query]);

  if (!user) return null;

  async function handleSaveLaw(lawId: string) {
    const law = laws.find((l) => l._id === lawId);
    if (!law) return;
    try {
      const item = await savedApi.create({
        lawId: law._id,
        title: law.title,
        code: law.code,
        note: "Pinned from saved workspace for quick access.",
      });
      setSavedArticles((prev) => [item, ...prev]);
      notify.success("Закон додано до збережених.");
    } catch {
      notify.warning("Не вдалося зберегти закон.");
    }
  }

  async function handleRemove(itemId: string) {
    try {
      await savedApi.delete(itemId);
      setSavedArticles((prev) => prev.filter((i) => i.id !== itemId));
      notify.info("Закон видалено зі збережених.");
    } catch {
      notify.warning("Не вдалося видалити.");
    }
  }

  return (
    <div className={styles.wrapper}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <div className={styles.logoMark}>⚖</div>
          <div className={styles.logoGroup}>
            <span className={styles.logoText}>LAW ANALYSIS</span>
            <span className={styles.logoSub}>Кабінет</span>
          </div>
        </div>
        <nav className={styles.sidebarNav}>
          {NAV_ITEMS.map(({ href, label, Icon }) => (
            <Link
              key={label}
              href={href}
              className={`${styles.navItem} ${label === "Збережені документи" ? styles.navItemActive : ""}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <button type="button" className={styles.navLogout} onClick={logout}>
          <LogOut size={18} />
          <span>Вийти</span>
        </button>
      </aside>

      {/* Main */}
      <main className={styles.content}>
        <div className={styles.contentInner}>
          {/* Header */}
          <div className={styles.pageHeader}>
            <div>
              <span className={styles.eyebrow}>Збережені матеріали</span>
              <h1 className={styles.pageTitle}>Ваша правова полиця</h1>
              <p className={styles.pageSub}>
                Швидкий доступ до законів, які ви зберегли для подальшого
                вивчення.
              </p>
            </div>
            <div className={styles.headerMeta}>
              <div className={styles.metaCount}>
                <Bookmark size={16} />
                <span>{savedArticles.length} збережено</span>
              </div>
              <Link href={ROUTES.search} className={styles.addBtn}>
                <Plus size={15} />
                Знайти закони
              </Link>
            </div>
          </div>

          {/* Main grid */}
          <div className={styles.grid}>
            {/* Saved list panel */}
            <section className={styles.mainPanel}>
              <div className={styles.panelHead}>
                <div className={styles.panelHeadLeft}>
                  <BookOpen size={18} className={styles.panelIcon} />
                  <div>
                    <div className={styles.panelEyebrow}>Список</div>
                    <h2 className={styles.panelTitle}>Збережені закони</h2>
                  </div>
                </div>
                <div className={styles.searchWrap}>
                  <Search size={14} className={styles.searchIcon} />
                  <input
                    className={styles.searchInput}
                    placeholder="Пошук по назві або коду…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>

              {loading ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>⏳</div>
                  <p>Завантаження…</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>
                    <Bookmark size={36} />
                  </div>
                  <p>
                    {query
                      ? "Нічого не знайдено за запитом."
                      : "Ще немає збережених законів."}
                  </p>
                  {!query && (
                    <Link href={ROUTES.search} className={styles.emptyAction}>
                      Перейти до пошуку →
                    </Link>
                  )}
                </div>
              ) : (
                <ul className={styles.savedList}>
                  {filtered.map((item) => (
                    <li key={item.id} className={styles.savedCard}>
                      <div className={styles.savedCardLeft}>
                        <div className={styles.codeBadge}>{item.code}</div>
                        <div className={styles.savedTitle}>{item.title}</div>
                        {item.note && (
                          <div className={styles.savedNote}>{item.note}</div>
                        )}
                        <div className={styles.savedDate}>
                          Збережено {formatDateMedium(item.savedAt)}
                        </div>
                      </div>
                      <div className={styles.savedCardActions}>
                        <Link
                          href={ROUTES.law(item.lawId)}
                          className={styles.actionBtn}
                          title="Відкрити закон"
                        >
                          <ExternalLink size={15} />
                        </Link>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                          title="Видалити"
                          onClick={() => handleRemove(item.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Suggestions panel */}
            <aside className={styles.sidePanel}>
              <div className={styles.panelHead}>
                <div className={styles.panelHeadLeft}>
                  <Star size={18} className={styles.panelIcon} />
                  <div>
                    <div className={styles.panelEyebrow}>Пропозиції</div>
                    <h2 className={styles.panelTitle}>Рекомендовано</h2>
                  </div>
                </div>
              </div>

              {lawsLoading ? (
                <div className={styles.empty}>
                  <p>Завантаження…</p>
                </div>
              ) : suggestions.length === 0 ? (
                <div className={styles.empty}>
                  <p>Ви вже зберегли всі запропоновані закони.</p>
                </div>
              ) : (
                <ul className={styles.suggestionList}>
                  {suggestions.map((law) => (
                    <li key={law._id} className={styles.suggestionCard}>
                      <div className={styles.suggestionInfo}>
                        <div className={styles.codeBadge}>{law.code}</div>
                        <div className={styles.suggestionTitle}>
                          {law.title}
                        </div>
                        <div className={styles.suggestionMeta}>
                          <FileText size={12} />
                          {law.totalArticles} ст. · {law.totalSections} розд.
                        </div>
                      </div>
                      <button
                        type="button"
                        className={styles.saveBtn}
                        onClick={() => handleSaveLaw(law._id)}
                      >
                        <Plus size={14} />
                        Зберегти
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Stats strip */}
              <div className={styles.statsStrip}>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>{savedArticles.length}</div>
                  <div className={styles.statLabel}>Збережено</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>{laws.length}</div>
                  <div className={styles.statLabel}>Всього законів</div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
