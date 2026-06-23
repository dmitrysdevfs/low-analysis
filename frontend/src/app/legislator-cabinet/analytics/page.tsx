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
import { useLegislatorAnalytics } from "@/hooks/useAnalytics";
import type { LegislatorPeriod } from "@/lib/api/analytics";
import styles from "./page.module.scss";

// ─── Sidebar nav ──────────────────────────────────────────────────────────────

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

// ─── Sidebar component ────────────────────────────────────────────────────────

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

// ─── Analytics content ────────────────────────────────────────────────────────

function AnalyticsContent() {
  const [period, setPeriod] = useState<LegislatorPeriod>("month");
  const { data, isLoading, error } = useLegislatorAnalytics(period);
  const handleExportPDF = async () => {
    if (!data) return;
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");

      const periodLabels: Record<LegislatorPeriod, string> = {
        month: "Цей місяць",
        "3m": "3 місяці",
        "6m": "6 місяців",
      };
      const dateStr = new Date().toLocaleDateString("uk-UA");
      const esc = (s: string) =>
        String(s)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

      const maxWeekly = Math.max(
        ...data.weeklyActivity.map((w) => w.actions),
        1,
      );
      const totalDist =
        data.stats.forks + data.stats.proposals + data.stats.amendments || 1;
      const maxCompare = Math.max(
        data.comparison.myScore,
        data.comparison.groupAvg,
        data.comparison.platformAvg,
        1,
      );

      const html = `
        <div style="background:#ffffff;color:#111111;font-family:Georgia,serif;padding:40px 48px;width:730px;box-sizing:border-box;">

          <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #9b5de5;padding-bottom:18px;margin-bottom:24px;">
            <div>
              <div style="font-size:9px;letter-spacing:3px;color:#6b7280;text-transform:uppercase;font-family:Arial,sans-serif;margin-bottom:4px;">LEGAL HUB · ЗАКОНОТВОРЕЦЬ</div>
              <div style="font-size:24px;font-weight:700;color:#1a1a2e;">Моя аналітика</div>
            </div>
            <div style="text-align:right;font-family:Arial,sans-serif;">
              <div style="font-size:10px;color:#6b7280;margin-bottom:2px;">Період: ${periodLabels[period]}</div>
              <div style="font-size:10px;color:#6b7280;">Сформовано: ${dateStr}</div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;">
            ${[
              { label: "Форків", val: data.stats.forks, color: "#9b5de5" },
              {
                label: "Пропозицій",
                val: data.stats.proposals,
                color: "#4a80d4",
              },
              { label: "Схвалень", val: data.stats.approved, color: "#52b788" },
            ]
              .map(
                (k) => `
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;border-top:3px solid ${k.color};">
                <div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;margin-bottom:6px;">${k.label}</div>
                <div style="font-size:26px;font-weight:700;color:#1a1a2e;line-height:1;">${k.val}</div>
              </div>`,
              )
              .join("")}
          </div>

          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:24px;">
            ${[
              { label: "Всього дій", val: String(data.total), small: false },
              {
                label: "% схвалення",
                val: `${data.approvalRate}%`,
                small: false,
              },
              {
                label: "Найактивніший",
                val: data.mostActive
                  ? `${esc(data.mostActive.label)} (${data.mostActive.count})`
                  : "—",
                small: true,
              },
            ]
              .map(
                (k) => `
              <div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px;border-left:3px solid #9b5de5;">
                <div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;margin-bottom:4px;">${k.label}</div>
                <div style="font-size:${k.small ? "14px" : "20px"};font-weight:700;color:#1a1a2e;line-height:1.2;">${k.val}</div>
              </div>`,
              )
              .join("")}
          </div>

          <div style="font-size:12px;font-weight:700;color:#1a1a2e;margin-bottom:10px;border-bottom:1px solid #e2e8f0;padding-bottom:5px;font-family:Arial,sans-serif;">Моя активність</div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:18px;margin-bottom:20px;">
            <div style="display:flex;align-items:flex-end;gap:20px;height:110px;margin-bottom:6px;">
              ${data.weeklyActivity
                .map(
                  (w) => `
                <div style="display:flex;flex-direction:column;align-items:center;flex:1;">
                  <div style="display:flex;align-items:flex-end;height:100px;">
                    <div style="background:#c8a843;width:24px;border-radius:3px 3px 0 0;height:${Math.max((w.actions / maxWeekly) * 90, w.actions > 0 ? 4 : 0)}px;"></div>
                  </div>
                  <div style="font-size:9px;color:#6b7280;margin-top:4px;font-family:Arial,sans-serif;">${esc(w.week)}</div>
                </div>`,
                )
                .join("")}
            </div>
          </div>

          <div style="font-size:12px;font-weight:700;color:#1a1a2e;margin-bottom:10px;border-bottom:1px solid #e2e8f0;padding-bottom:5px;font-family:Arial,sans-serif;">Розподіл за типами</div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:20px;display:flex;flex-direction:column;gap:9px;">
            ${[
              { label: "Форки", count: data.stats.forks, color: "#9b5de5" },
              {
                label: "Пропозиції",
                count: data.stats.proposals,
                color: "#4a80d4",
              },
              {
                label: "Поправки",
                count: data.stats.amendments,
                color: "#52b788",
              },
            ]
              .map(
                (item) => `
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:11px;color:#374151;width:100px;flex-shrink:0;font-family:Arial,sans-serif;">${item.label}</span>
                <div style="flex:1;height:7px;background:#e5e7eb;border-radius:4px;overflow:hidden;">
                  <div style="background:${item.color};height:100%;width:${(item.count / totalDist) * 100}%;border-radius:4px;"></div>
                </div>
                <span style="font-size:10px;color:#6b7280;width:26px;text-align:right;font-family:Arial,sans-serif;">${item.count}</span>
              </div>`,
              )
              .join("")}
          </div>

          <div style="font-size:12px;font-weight:700;color:#1a1a2e;margin-bottom:10px;border-bottom:1px solid #e2e8f0;padding-bottom:5px;font-family:Arial,sans-serif;">Порівняння з групою (анонімно)</div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:20px;display:flex;flex-direction:column;gap:10px;">
            ${[
              {
                label: "Мій показник",
                value: data.comparison.myScore,
                color: "#c8a843",
              },
              {
                label: "Середнє по групі",
                value: data.comparison.groupAvg,
                color: "#4a80d4",
              },
              {
                label: "Середнє по платформі",
                value: data.comparison.platformAvg,
                color: "#9b5de5",
              },
            ]
              .map(
                (row) => `
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:11px;color:#374151;width:175px;flex-shrink:0;font-family:Arial,sans-serif;">${row.label}</span>
                <div style="flex:1;height:8px;background:#e5e7eb;border-radius:5px;overflow:hidden;">
                  <div style="background:${row.color};height:100%;width:${(row.value / maxCompare) * 100}%;border-radius:5px;"></div>
                </div>
                <span style="font-size:10px;color:#6b7280;width:26px;text-align:right;font-family:Arial,sans-serif;">${row.value}</span>
              </div>`,
              )
              .join("")}
            <div style="font-size:9px;color:#9ca3af;font-style:italic;font-family:Arial,sans-serif;">* Порівняння анонімне</div>
          </div>

          <div style="font-size:12px;font-weight:700;color:#1a1a2e;margin-bottom:10px;border-bottom:1px solid #e2e8f0;padding-bottom:5px;font-family:Arial,sans-serif;">Мій портфель</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:24px;">
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;text-align:center;">
              <div style="font-size:28px;font-weight:700;color:#15803d;line-height:1;margin-bottom:4px;">${data.portfolio.approved}</div>
              <div style="font-size:10px;color:#166534;font-family:Arial,sans-serif;">Схвалено</div>
            </div>
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px;text-align:center;">
              <div style="font-size:28px;font-weight:700;color:#dc2626;line-height:1;margin-bottom:4px;">${data.portfolio.rejected}</div>
              <div style="font-size:10px;color:#991b1b;font-family:Arial,sans-serif;">Відхилено</div>
            </div>
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px;text-align:center;">
              <div style="font-size:28px;font-weight:700;color:#d97706;line-height:1;margin-bottom:4px;">${data.portfolio.pending}</div>
              <div style="font-size:10px;color:#92400e;font-family:Arial,sans-serif;">На розгляді</div>
            </div>
          </div>

          <div style="border-top:1px solid #e2e8f0;padding-top:10px;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:8px;color:#9ca3af;font-family:Arial,sans-serif;">LegalHub · Аналітичний звіт</span>
            <span style="font-size:8px;color:#9ca3af;font-family:Arial,sans-serif;">Сформовано: ${dateStr}</span>
          </div>

        </div>
      `;

      const container = document.createElement("div");
      container.style.cssText = "position:absolute;top:-9999px;left:-9999px;";
      container.innerHTML = html;
      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      document.body.removeChild(container);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pdfW) / canvas.width;

      let heightLeft = imgH;
      let pos = 0;
      pdf.addImage(imgData, "PNG", 0, pos, pdfW, imgH);
      heightLeft -= pdfH;
      while (heightLeft > 0) {
        pos -= pdfH;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, pos, pdfW, imgH);
        heightLeft -= pdfH;
      }

      pdf.save(
        `my-analytics-${period}-${new Date().toISOString().slice(0, 10)}.pdf`,
      );
    } catch (e) {
      console.error("PDF export failed", e);
    }
  };

  if (isLoading)
    return (
      <div className={styles.mainContent}>
        <p className={styles.loadingState}>Завантаження...</p>
      </div>
    );
  if (error || !data)
    return (
      <div className={styles.mainContent}>
        <p className={styles.errorState}>Помилка завантаження</p>
      </div>
    );

  const {
    stats,
    approvalRate,
    total,
    mostActive,
    weeklyActivity,
    comparison,
    portfolio,
  } = data;
  const maxWeekly = Math.max(...weeklyActivity.map((w) => w.actions), 1);
  const totalDist = stats.forks + stats.proposals + stats.amendments || 1;
  const maxCompare = Math.max(
    comparison.myScore,
    comparison.groupAvg,
    comparison.platformAvg,
    1,
  );

  return (
    <div className={styles.mainContent}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <span className={styles.eyebrow}>ЗАКОНОТВОРЕЦЬ · АНАЛІТИКА</span>
          <h1 className={styles.pageTitle}>Моя аналітика</h1>
        </div>
        <button
          type="button"
          onClick={handleExportPDF}
          style={{
            marginTop: 8,
            padding: "6px 14px",
            cursor: "pointer",
            background: "transparent",
            border: "1px solid rgba(155,93,229,0.5)",
            borderRadius: 6,
            color: "#9b5de5",
            fontSize: "0.85rem",
          }}
        >
          ↓ PDF
        </button>
      </div>

      {/* Hero KPI */}
      <div className={styles.heroAside}>
        <div className={styles.heroAsideItem}>
          <span className={styles.heroAsideLabel}>Форків</span>
          <strong className={styles.heroAsideValue}>{stats.forks}</strong>
        </div>
        <div className={styles.heroAsideItem}>
          <span className={styles.heroAsideLabel}>Пропозицій</span>
          <strong className={styles.heroAsideValue}>{stats.proposals}</strong>
        </div>
        <div className={styles.heroAsideItem}>
          <span className={styles.heroAsideLabel}>Схвалень</span>
          <strong className={styles.heroAsideValue}>{stats.approved}</strong>
        </div>
      </div>

      {/* Period selector */}
      <select
        className={styles.periodSelect}
        value={period}
        onChange={(e) => setPeriod(e.target.value as LegislatorPeriod)}
      >
        <option value="month">Цей місяць</option>
        <option value="3m">3 місяці</option>
        <option value="6m">6 місяців</option>
      </select>

      {/* KPI row */}
      <div className={styles.kpiRow3}>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Всього дій</p>
          <p className={styles.kpiValue}>{total}</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>% схвалення</p>
          <p className={styles.kpiValue}>{approvalRate}%</p>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Найактивніший</p>
          <p className={styles.kpiValue} style={{ fontSize: "1.1rem" }}>
            {mostActive ? `${mostActive.label} (${mostActive.count})` : "—"}
          </p>
        </div>
      </div>

      {/* Weekly activity */}
      <section className={styles.section}>
        <p className={styles.sectionTitle}>Моя активність</p>
        {weeklyActivity.every((w) => w.actions === 0) ? (
          <p style={{ opacity: 0.5 }}>Немає дій за цей період</p>
        ) : (
          <div className={styles.chartArea}>
            <div className={styles.barChart}>
              {weeklyActivity.map((week) => (
                <div key={week.week} className={styles.barGroup}>
                  <div className={styles.barGroupInner}>
                    <div
                      className={`${styles.bar} ${styles.barSingle}`}
                      style={{
                        height: `${(week.actions / maxWeekly) * 120}px`,
                      }}
                    />
                  </div>
                  <p className={styles.barLabel}>{week.week}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Distribution */}
      <section className={styles.section}>
        <p className={styles.sectionTitle}>Розподіл за типами</p>
        <div className={styles.chartArea}>
          <div className={styles.hBarList}>
            {[
              { label: "Форки", count: stats.forks, color: "#9b5de5" },
              { label: "Пропозиції", count: stats.proposals, color: "#4a80d4" },
              { label: "Поправки", count: stats.amendments, color: "#52b788" },
            ].map((item) => (
              <div key={item.label} className={styles.hBarRow}>
                <span className={styles.hBarName}>{item.label}</span>
                <div className={styles.hBarTrack}>
                  <div
                    style={{
                      width: `${(item.count / totalDist) * 100}%`,
                      height: "100%",
                      background: item.color,
                      borderRadius: 4,
                      transition: "width 0.4s",
                    }}
                  />
                </div>
                <span className={styles.hBarValue}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className={styles.section}>
        <p className={styles.sectionTitle}>Порівняння з групою (анонімно)</p>
        <div className={styles.chartArea}>
          <div className={styles.compareList}>
            {[
              {
                label: "Мій показник",
                value: comparison.myScore,
                cls: styles.compareFillMy,
              },
              {
                label: "Середнє по групі",
                value: comparison.groupAvg,
                cls: styles.compareFillGroup,
              },
              {
                label: "Середнє по платформі",
                value: comparison.platformAvg,
                cls: styles.compareFillPlatform,
              },
            ].map((row) => (
              <div key={row.label} className={styles.compareRow}>
                <span className={styles.compareLabel}>{row.label}</span>
                <div className={styles.compareTrack}>
                  <div
                    className={row.cls}
                    style={{ width: `${(row.value / maxCompare) * 100}%` }}
                  />
                </div>
                <span className={styles.hBarValue}>{row.value}</span>
              </div>
            ))}
          </div>
          <p className={styles.compareNote}>(порівняння анонімне)</p>
        </div>
      </section>

      {/* Portfolio */}
      <section className={styles.section}>
        <p className={styles.sectionTitle}>Мій portfolio</p>
        <div className={styles.portfolioRow}>
          <div
            className={`${styles.portfolioCard} ${styles.portfolioApproved}`}
          >
            <p className={styles.portfolioNum}>{portfolio.approved}</p>
            <p className={styles.portfolioLabel}>Схвалено ✓</p>
          </div>
          <div
            className={`${styles.portfolioCard} ${styles.portfolioRejected}`}
          >
            <p className={styles.portfolioNum}>{portfolio.rejected}</p>
            <p className={styles.portfolioLabel}>Відхилено ✗</p>
          </div>
          <div className={`${styles.portfolioCard} ${styles.portfolioPending}`}>
            <p className={styles.portfolioNum}>{portfolio.pending}</p>
            <p className={styles.portfolioLabel}>На розгляді ⏳</p>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LegislatorAnalyticsPage() {
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
        <AnalyticsContent />
      </main>
    </div>
  );
}
