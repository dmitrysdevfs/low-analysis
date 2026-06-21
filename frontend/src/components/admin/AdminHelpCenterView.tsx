"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  BarChart2,
  ShieldCheck,
  Search,
  ArrowRight,
  MessageSquare,
  Map,
  FileJson,
  TrendingUp,
  BookMarked,
  Zap,
  LayoutGrid,
  FileText,
  RefreshCw,
  Target,
} from "lucide-react";
import type { FaqItem } from "@/content/help/types";
import { ALL_ARTICLES } from "@/content/help/articles";
import { ROUTES } from "@/constants/routes";
import styles from "./AdminHelpCenter.module.scss";

interface Props {
  items: FaqItem[];
}

const QUICK_START = [
  {
    key: "users",
    icon: Users,
    color: "#4a80d4",
    colorBg: "rgba(74,128,212,0.15)",
    title: "Користувачі",
    desc: "Керування акаунтами, ролями та доступом",
    category: "Користувачі",
    href: ROUTES.adminUsers,
  },
  {
    key: "analytics",
    icon: BarChart2,
    color: "#c8a843",
    colorBg: "rgba(200,168,67,0.15)",
    title: "Аналітика",
    desc: "Аналіз даних, метрики, зрізи даних та дашборди",
    category: "Аналітика",
    href: ROUTES.adminAnalytics,
  },
  {
    key: "security",
    icon: ShieldCheck,
    color: "#52b788",
    colorBg: "rgba(82,183,136,0.15)",
    title: "Безпека та коди",
    desc: "Супер-коди, ротація, доступ та політики",
    category: "Коди",
    href: ROUTES.adminCodes,
  },
];

const USEFUL_LINKS = [
  {
    label: "API документація",
    sub: "Swagger UI",
    icon: FileJson,
    href: "/api-docs",
  },
  {
    label: "Статус системи",
    sub: "Операційний статус",
    icon: TrendingUp,
    href: ROUTES.adminAnalytics,
  },
  {
    label: "Roadmap",
    sub: "Плани та оновлення",
    icon: Map,
    href: ROUTES.adminArchitecture,
  },
];

const CATEGORY_ORDER = [
  "Всі",
  "Користувачі",
  "Аналітика",
  "Аудит",
  "Коди",
  "API",
  "Білінг",
];

const adminArticles = ALL_ARTICLES.filter(
  (a) => a.audience === "admin" || a.audience === "both",
);

const lastUpdated = adminArticles
  .map((a) => a.updatedAt)
  .sort()
  .reverse()[0];

function countByCategory(category: string) {
  return adminArticles.filter((a) => a.category === category).length;
}

function articleWord(n: number) {
  if (n === 1) return "стаття";
  if (n >= 2 && n <= 4) return "статті";
  return "статей";
}

export function AdminHelpCenterView({ items }: Props) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Всі");

  const categories = useMemo(() => {
    const inItems = new Set(items.map((i) => i.category));
    return CATEGORY_ORDER.filter((c) => c === "Всі" || inItems.has(c));
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchCat =
        activeCategory === "Всі" || item.category === activeCategory;
      const matchQ =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [items, query, activeCategory]);

  const displayFaq = query || activeCategory !== "Всі" ? filtered : items;

  return (
    <div className={styles.page}>
      {/* ── LEFT main ── */}
      <div className={styles.main}>
        {/* header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Часті питання</h1>
          <p className={styles.subtitle}>
            База знань для адміністраторів платформи
          </p>
        </div>

        {/* search */}
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="search"
            placeholder="Пошук по питаннях і статтях..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.searchInput}
          />
          <span className={styles.searchHint}>⌘ K</span>
        </div>

        {/* tabs */}
        <div className={styles.tabs}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`${styles.tab} ${activeCategory === cat ? styles.tabActive : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* quick start */}
        <div className={styles.quickSection}>
          <div className={styles.sectionLabel}>
            <Zap size={13} className={styles.zapIcon} />
            <span>Швидкий старт</span>
          </div>
          <div className={styles.quickGrid}>
            {QUICK_START.map((qs) => {
              const count = countByCategory(qs.category);
              return (
                <Link key={qs.key} href={qs.href} className={styles.quickCard}>
                  <div
                    className={styles.quickIcon}
                    style={{ background: qs.colorBg, color: qs.color }}
                  >
                    <qs.icon size={20} />
                  </div>
                  <span className={styles.quickTitle}>{qs.title}</span>
                  <span className={styles.quickDesc}>{qs.desc}</span>
                  {count > 0 && (
                    <span
                      className={styles.quickCount}
                      style={{ color: qs.color }}
                    >
                      {count} {articleWord(count)} →
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* popular FAQ */}
        <div className={styles.faqSection}>
          <span className={styles.sectionLabel2}>Популярні питання</span>
          {displayFaq.length === 0 ? (
            <p className={styles.emptyHint}>Нічого не знайдено</p>
          ) : (
            <div className={styles.faqGrid}>
              {displayFaq.map((item, i) => (
                <Link
                  key={`${item.slug}-${i}`}
                  href={`/admin/help/${item.slug}`}
                  className={styles.faqCard}
                >
                  <span className={styles.faqCat}>{item.category}</span>
                  <span className={styles.faqQ}>{item.question}</span>
                  <span className={styles.faqSummary}>{item.summary}</span>
                  <ArrowRight size={11} className={styles.faqArrow} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* view all */}
        <div className={styles.viewAllRow}>
          <Link href="/admin/help/admin-users" className={styles.viewAllBtn}>
            <LayoutGrid size={13} />
            Переглянути всі статті
          </Link>
        </div>

        {/* KPI strip */}
        <div className={styles.kpiStrip}>
          <div className={styles.kpiItem}>
            <FileText size={16} className={styles.kpiIcon} />
            <div className={styles.kpiBody}>
              <div className={styles.kpiRow}>
                <span className={styles.kpiNum}>{adminArticles.length}</span>
                <span className={styles.kpiDelta}>+3 за тиждень</span>
              </div>
              <span className={styles.kpiLabel}>Статей у базі знань</span>
            </div>
          </div>
          <div className={styles.kpiItem}>
            <RefreshCw size={16} className={styles.kpiIcon} />
            <div className={styles.kpiBody}>
              <div className={styles.kpiRow}>
                <span className={styles.kpiNum}>12</span>
                <span className={styles.kpiDelta}>за останні 7 днів</span>
              </div>
              <span className={styles.kpiLabel}>Оновлених тем</span>
            </div>
          </div>
          <div className={styles.kpiItem}>
            <Target size={16} className={styles.kpiIcon} />
            <div className={styles.kpiBody}>
              <div className={styles.kpiRow}>
                <span className={styles.kpiNum}>94%</span>
                <span className={styles.kpiDelta}>знайдено відповідей</span>
              </div>
              <span className={styles.kpiLabel}>Успішність пошуку</span>
            </div>
          </div>
          <div className={styles.kpiItem}>
            <Users size={16} className={styles.kpiIcon} />
            <div className={styles.kpiBody}>
              <div className={styles.kpiRow}>
                <span className={styles.kpiNum}>2 765</span>
                <span className={styles.kpiDelta}>за травень</span>
              </div>
              <span className={styles.kpiLabel}>Відвідувань довідки</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT aside ── */}
      <aside className={styles.aside}>
        {/* Потрібна допомога */}
        <div className={styles.asideCard}>
          <span className={styles.asideTitle}>Потрібна допомога?</span>
          <p className={styles.asideDesc}>
            Не знайшли відповідь на своє питання? Ми готові допомогти.
          </p>
          <div className={styles.asideLinks}>
            <Link href={ROUTES.adminApiCenter} className={styles.asideLink}>
              <BookMarked size={13} className={styles.asideLinkIcon} />
              <span>
                <span className={styles.asideLinkLabel}>Документація</span>
                <span className={styles.asideLinkSub}>
                  Повна документація платформи
                </span>
              </span>
              <ArrowRight size={11} className={styles.asideArrow} />
            </Link>
            <Link href={ROUTES.adminSupport} className={styles.asideLink}>
              <MessageSquare size={13} className={styles.asideLinkIcon} />
              <span>
                <span className={styles.asideLinkLabel}>
                  Звернутись в Support
                </span>
                <span className={styles.asideLinkSub}>
                  Чат або Telegram-канал
                </span>
              </span>
              <ArrowRight size={11} className={styles.asideArrow} />
            </Link>
          </div>
        </div>

        {/* Корисні посилання */}
        <div className={styles.asideCard}>
          <span className={styles.asideTitle}>Корисні посилання</span>
          <div className={styles.usefulLinks}>
            {USEFUL_LINKS.map((l) => (
              <Link key={l.label} href={l.href} className={styles.usefulLink}>
                <l.icon size={13} className={styles.usefulIcon} />
                <span>
                  <span className={styles.usefulLabel}>{l.label}</span>
                  <span className={styles.usefulSub}>{l.sub}</span>
                </span>
                <ArrowRight size={11} className={styles.asideArrow} />
              </Link>
            ))}
          </div>
        </div>

        {/* Оновлення бази знань */}
        <div className={styles.asideCard}>
          <span className={styles.asideTitle}>Оновлення бази знань</span>
          <div className={styles.updateRow}>
            <span className={styles.updateKey}>Останнє оновлення</span>
            <span className={styles.updateVal}>
              {lastUpdated
                ? new Date(lastUpdated).toLocaleDateString("uk", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </span>
          </div>
          <div className={styles.updateRow}>
            <span className={styles.updateKey}>Нових статей за тиждень</span>
            <span className={styles.updateCount}>3</span>
          </div>
          <div className={styles.updateBadge}>
            <span className={styles.updateDot} />
            Актуально
          </div>
        </div>
      </aside>
    </div>
  );
}
