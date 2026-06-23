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
import { useSupervisorAnalytics } from "@/hooks/useAnalytics";
import type { Period } from "@/lib/api/analytics";
import styles from "./page.module.scss";

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const SIDEBAR_NAV = [
  { icon: <Eye size={20} />, label: "Нагляд", href: ROUTES.supervisorDashboard },
  { icon: <Users size={20} />, label: "Групи", href: ROUTES.supervisorGroups },
  { icon: <FileText size={20} />, label: "Пропозиції", href: ROUTES.supervisorProposals },
  { icon: <PenLine size={20} />, label: "Поправки", href: ROUTES.supervisorAmendments },
  { icon: <Zap size={20} />, label: "Форки", href: ROUTES.supervisorForks },
  { icon: <Scale size={20} />, label: "Закони", href: ROUTES.laws },
  { icon: <Network size={20} />, label: "Граф", href: ROUTES.graph },
  { icon: <GitGraph size={20} />, label: "Пропоз. Граф", href: ROUTES.graphProposals },
  { icon: <Radar size={20} />, label: "Пропоз. Радіант", href: ROUTES.radiantProposals },
  { icon: <RefreshCcw size={20} />, label: "Зміни", href: ROUTES.supervisorChanges },
  { icon: <MessagesSquare size={20} />, label: "Коментарі", href: ROUTES.supervisorComments },
  { icon: <Shield size={20} />, label: "Правила", href: ROUTES.supervisorRules },
  { icon: <BarChart3 size={20} />, label: "Аналітика", href: ROUTES.supervisorAnalytics },
  { icon: <History size={20} />, label: "Історія", href: ROUTES.supervisorHistory },
  { icon: <MessageCircle size={20} />, label: "Чат", href: ROUTES.supervisorChat },
];

function SupervisorSidebar({
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
            const isActive =
              pathname.startsWith(item.href) &&
              (item.href !== ROUTES.laws || pathname === ROUTES.laws);
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
  const [period, setPeriod] = useState<Period>("month");
  const { data, isLoading, error } = useSupervisorAnalytics(period);
  const handleExportPDF = async () => {
    if (!data) return;
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");

      const periodLabels: Record<Period, string> = {
        month: "Цей місяць",
        "3m": "3 місяці",
        "6m": "6 місяців",
        year: "Рік",
      };
      const dateStr = new Date().toLocaleDateString("uk-UA");
      const esc = (s: string) =>
        String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      const maxBar = Math.max(
        ...data.weeklyActivity.flatMap((w) => [w.forks, w.proposals, w.amendments]),
        1,
      );
      const maxApproved = Math.max(...data.topLegislators.map((l) => l.approved), 1);
      const lawMaxForks = Math.max(...data.lawCoverage.map((l) => l.forks), 1);
      const lawMaxProposals = Math.max(...data.lawCoverage.map((l) => l.proposals), 1);

      const html = `
        <div style="background:#ffffff;color:#111111;font-family:Georgia,serif;padding:40px 48px;width:730px;box-sizing:border-box;">

          <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1a3a6c;padding-bottom:18px;margin-bottom:24px;">
            <div>
              <div style="font-size:9px;letter-spacing:3px;color:#6b7280;text-transform:uppercase;font-family:Arial,sans-serif;margin-bottom:4px;">LEGAL HUB · SUPERVISOR</div>
              <div style="font-size:24px;font-weight:700;color:#1a1a2e;">Аналітика груп</div>
            </div>
            <div style="text-align:right;font-family:Arial,sans-serif;">
              <div style="font-size:10px;color:#6b7280;margin-bottom:2px;">Період: ${periodLabels[period]}</div>
              <div style="font-size:10px;color:#6b7280;">Сформовано: ${dateStr}</div>
            </div>
          </div>

          <div style="font-size:9px;letter-spacing:2px;color:#6b7280;text-transform:uppercase;font-family:Arial,sans-serif;margin-bottom:8px;">Ключові показники</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;">
            ${[
              { label: "Активних законодавців", val: data.kpi.activeLegislators },
              { label: "Схвалень за період", val: data.kpi.approvalsThisPeriod },
              { label: "Груп (акт./всього)", val: `${data.kpi.groups.active}/${data.kpi.groups.total}` },
            ]
              .map(
                (k) => `
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;">
                <div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;margin-bottom:6px;">${k.label}</div>
                <div style="font-size:26px;font-weight:700;color:#1a1a2e;line-height:1;">${k.val}</div>
              </div>`,
              )
              .join("")}
          </div>

          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:24px;">
            ${[
              { label: "Форків", val: data.kpi.totalForks },
              { label: "Пропозицій", val: data.kpi.totalProposals },
              { label: "% схвалення", val: `${data.kpi.approvalRate}%` },
              { label: "Активних", val: data.kpi.activeCount },
            ]
              .map(
                (k) => `
              <div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px;border-left:3px solid #1a3a6c;">
                <div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-family:Arial,sans-serif;margin-bottom:4px;">${k.label}</div>
                <div style="font-size:20px;font-weight:700;color:#1a1a2e;line-height:1;">${k.val}</div>
              </div>`,
              )
              .join("")}
          </div>

          <div style="font-size:12px;font-weight:700;color:#1a1a2e;margin-bottom:10px;border-bottom:1px solid #e2e8f0;padding-bottom:5px;font-family:Arial,sans-serif;">Активність по тижнях</div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:18px;margin-bottom:20px;">
            <div style="display:flex;align-items:flex-end;gap:20px;height:120px;margin-bottom:8px;">
              ${data.weeklyActivity
                .map(
                  (w) => `
                <div style="display:flex;flex-direction:column;align-items:center;flex:1;">
                  <div style="display:flex;gap:3px;align-items:flex-end;height:110px;">
                    <div style="background:#9b5de5;width:14px;border-radius:2px 2px 0 0;height:${Math.max((w.forks / maxBar) * 100, w.forks > 0 ? 3 : 0)}px;"></div>
                    <div style="background:#4a80d4;width:14px;border-radius:2px 2px 0 0;height:${Math.max((w.proposals / maxBar) * 100, w.proposals > 0 ? 3 : 0)}px;"></div>
                    <div style="background:#52b788;width:14px;border-radius:2px 2px 0 0;height:${Math.max((w.amendments / maxBar) * 100, w.amendments > 0 ? 3 : 0)}px;"></div>
                  </div>
                  <div style="font-size:9px;color:#6b7280;margin-top:4px;font-family:Arial,sans-serif;">${esc(w.week)}</div>
                </div>`,
                )
                .join("")}
            </div>
            <div style="display:flex;gap:14px;font-family:Arial,sans-serif;">
              <span style="display:flex;align-items:center;gap:4px;font-size:9px;color:#555;"><span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:#9b5de5;"></span>Форки</span>
              <span style="display:flex;align-items:center;gap:4px;font-size:9px;color:#555;"><span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:#4a80d4;"></span>Пропозиції</span>
              <span style="display:flex;align-items:center;gap:4px;font-size:9px;color:#555;"><span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:#52b788;"></span>Поправки</span>
            </div>
          </div>

          ${
            data.topLegislators.length > 0
              ? `
          <div style="font-size:12px;font-weight:700;color:#1a1a2e;margin-bottom:10px;border-bottom:1px solid #e2e8f0;padding-bottom:5px;font-family:Arial,sans-serif;">Топ-5 активних законодавців</div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:20px;display:flex;flex-direction:column;gap:9px;">
            ${[...data.topLegislators]
              .sort((a, b) => b.approved - a.approved)
              .map(
                (leg, i) => `
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:10px;color:#9ca3af;width:16px;text-align:right;font-family:Arial,sans-serif;">${i + 1}</span>
                <span style="font-size:11px;color:#374151;width:180px;flex-shrink:0;font-family:Arial,sans-serif;">${esc(leg.name)}</span>
                <div style="flex:1;height:7px;background:#e5e7eb;border-radius:4px;overflow:hidden;">
                  <div style="background:#c8a843;height:100%;width:${(leg.approved / maxApproved) * 100}%;border-radius:4px;"></div>
                </div>
                <span style="font-size:10px;color:#6b7280;width:26px;text-align:right;font-family:Arial,sans-serif;">${leg.approved}</span>
              </div>`,
              )
              .join("")}
          </div>`
              : ""
          }

          ${
            data.lawCoverage.length > 0
              ? `
          <div style="font-size:12px;font-weight:700;color:#1a1a2e;margin-bottom:10px;border-bottom:1px solid #e2e8f0;padding-bottom:5px;font-family:Arial,sans-serif;">Покриття по законах</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:20px;">
            ${data.lawCoverage
              .map(
                (law) => `
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;">
                <div style="font-size:10px;font-weight:600;color:#1a1a2e;margin-bottom:8px;font-family:Arial,sans-serif;">${esc(law.law)}</div>
                <div style="display:flex;flex-direction:column;gap:5px;">
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-size:8px;color:#6b7280;width:58px;flex-shrink:0;font-family:Arial,sans-serif;">Форки</span>
                    <div style="flex:1;height:5px;background:#e5e7eb;border-radius:3px;overflow:hidden;"><div style="background:#9b5de5;height:100%;width:${(law.forks / lawMaxForks) * 100}%;"></div></div>
                    <span style="font-size:8px;color:#6b7280;font-family:Arial,sans-serif;">${law.forks}</span>
                  </div>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-size:8px;color:#6b7280;width:58px;flex-shrink:0;font-family:Arial,sans-serif;">Пропозиції</span>
                    <div style="flex:1;height:5px;background:#e5e7eb;border-radius:3px;overflow:hidden;"><div style="background:#4a80d4;height:100%;width:${(law.proposals / lawMaxProposals) * 100}%;"></div></div>
                    <span style="font-size:8px;color:#6b7280;font-family:Arial,sans-serif;">${law.proposals}</span>
                  </div>
                </div>
              </div>`,
              )
              .join("")}
          </div>`
              : ""
          }

          <div style="border-top:1px solid #e2e8f0;padding-top:10px;margin-top:4px;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:8px;color:#9ca3af;font-family:Arial,sans-serif;">LegalHub · Аналітичний звіт</span>
            <span style="font-size:8px;color:#9ca3af;font-family:Arial,sans-serif;">Сформовано: ${dateStr}</span>
          </div>

        </div>
      `;

      const container = document.createElement("div");
      container.style.cssText = "position:absolute;top:-9999px;left:-9999px;";
      container.innerHTML = html;
      document.body.appendChild(container);

      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      document.body.removeChild(container);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
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

      pdf.save(`supervisor-analytics-${period}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error("PDF export failed", e);
    }
  };

  if (isLoading) return <div className={styles.page}><p style={{ padding: 32 }}>Завантаження...</p></div>;
  if (error || !data) return <div className={styles.page}><p style={{ padding: 32 }}>Помилка завантаження</p></div>;

  const { kpi, weeklyActivity, topLegislators, lawCoverage } = data;

  const maxBarValue = Math.max(
    ...weeklyActivity.flatMap((w) => [w.forks, w.proposals, w.amendments]),
    1,
  );
  const maxApproved = Math.max(...topLegislators.map((l) => l.approved), 1);
  const lawMaxForks     = Math.max(...lawCoverage.map((l) => l.forks), 1);
  const lawMaxProposals = Math.max(...lawCoverage.map((l) => l.proposals), 1);

  return (
    <div className={styles.page}>
      {/* HERO */}
      <section className={`${styles.sectionPanel} panel`}>
        <div className={styles.pageHeader}>
          <div>
            <span className={styles.sectionEyebrow}>SUPERVISOR · АНАЛІТИКА</span>
            <h1 className={styles.sectionTitle} style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)" }}>
              Аналітика груп
            </h1>
          </div>
          <button type="button" className={styles.exportBtn} onClick={handleExportPDF}>
            ↓ Звіт PDF
          </button>
        </div>
        <div className={styles.kpiStrip}>
          <div className={styles.kpiCard}>
            <p className={styles.kpiLabel}>Активних законодавців</p>
            <strong className={styles.kpiValue}>{kpi.activeLegislators}</strong>
          </div>
          <div className={styles.kpiCard}>
            <p className={styles.kpiLabel}>Схвалень за період</p>
            <strong className={styles.kpiValue}>{kpi.approvalsThisPeriod}</strong>
          </div>
          <div className={styles.kpiCard}>
            <p className={styles.kpiLabel}>Груп</p>
            <strong className={styles.kpiValue}>{kpi.groups.active} / {kpi.groups.total}</strong>
          </div>
        </div>
      </section>

      {/* Period selector */}
      <select
        className={styles.periodSelect}
        value={period}
        onChange={(e) => setPeriod(e.target.value as Period)}
      >
        <option value="month">Цей місяць</option>
        <option value="3m">3 місяці</option>
        <option value="6m">6 місяців</option>
        <option value="year">Рік</option>
      </select>

      {/* KPI row */}
      <div className={styles.kpiRow}>
        <div className={styles.kpiCardAnalytic}>
          <p className={styles.kpiLabel}>Всього форків</p>
          <p className={styles.kpiValue}>{kpi.totalForks}</p>
        </div>
        <div className={styles.kpiCardAnalytic}>
          <p className={styles.kpiLabel}>Всього пропозицій</p>
          <p className={styles.kpiValue}>{kpi.totalProposals}</p>
        </div>
        <div className={styles.kpiCardAnalytic}>
          <p className={styles.kpiLabel}>% схвалення</p>
          <p className={styles.kpiValue}>{kpi.approvalRate}%</p>
        </div>
        <div className={styles.kpiCardAnalytic}>
          <p className={styles.kpiLabel}>Активних</p>
          <p className={styles.kpiValue}>{kpi.activeCount}</p>
        </div>
      </div>

      {/* Weekly activity */}
      <section className={styles.section}>
        <p className={styles.sectionTitle2}>Активність по тижнях</p>
        {weeklyActivity.every((w) => w.forks === 0 && w.proposals === 0 && w.amendments === 0) ? (
          <p style={{ opacity: 0.5, padding: "16px 0" }}>Немає даних за цей період</p>
        ) : (
          <div className={styles.chartArea}>
            <div className={styles.barChart}>
              {weeklyActivity.map((week) => (
                <div key={week.week} className={styles.barGroup}>
                  <div className={styles.barGroupInner}>
                    <div
                      className={`${styles.bar} ${styles.barFork}`}
                      style={{ height: `${(week.forks / maxBarValue) * 120}px` }}
                    />
                    <div
                      className={`${styles.bar} ${styles.barProposal}`}
                      style={{ height: `${(week.proposals / maxBarValue) * 120}px` }}
                    />
                    <div
                      className={`${styles.bar} ${styles.barAmendment}`}
                      style={{ height: `${(week.amendments / maxBarValue) * 120}px` }}
                    />
                  </div>
                  <p className={styles.barLabel}>{week.week}</p>
                </div>
              ))}
            </div>
            <div className={styles.chartLegend}>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: "#9b5de5" }} />
                Форки
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: "#4a80d4" }} />
                Пропозиції
              </span>
              <span className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: "#52b788" }} />
                Поправки
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Top-5 */}
      <section className={styles.section}>
        <p className={styles.sectionTitle2}>Топ-5 активних законодавців</p>
        {topLegislators.length === 0 ? (
          <p style={{ opacity: 0.5, padding: "16px 0" }}>Немає даних</p>
        ) : (
          <div className={styles.chartArea}>
            <div className={styles.hBarList}>
              {[...topLegislators].sort((a, b) => b.approved - a.approved).map((leg, i) => (
                <div key={leg.name} className={styles.hBarRow}>
                  <span className={styles.hBarRank}>{i + 1}</span>
                  <span className={styles.hBarName}>{leg.name}</span>
                  <div className={styles.hBarTrack}>
                    <div
                      className={styles.hBarFill}
                      style={{ width: `${(leg.approved / maxApproved) * 100}%` }}
                    />
                  </div>
                  <span className={styles.hBarValue}>{leg.approved}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* By laws */}
      {lawCoverage.length > 0 && (
        <section className={styles.section}>
          <p className={styles.sectionTitle2}>По законах</p>
          <div className={styles.lawGrid}>
            {lawCoverage.map((law) => (
              <div key={law.law} className={styles.lawCard}>
                <p className={styles.lawName}>{law.law}</p>
                <div className={styles.hBarList}>
                  <div className={styles.hBarRow}>
                    <span className={styles.hBarName} style={{ width: 80, fontSize: "0.78rem" }}>
                      Форки
                    </span>
                    <div className={styles.hBarTrack}>
                      <div
                        className={styles.hBarFill}
                        style={{ width: `${(law.forks / lawMaxForks) * 100}%` }}
                      />
                    </div>
                    <span className={styles.hBarValue}>{law.forks}</span>
                  </div>
                  <div className={styles.hBarRow}>
                    <span className={styles.hBarName} style={{ width: 80, fontSize: "0.78rem" }}>
                      Пропозиції
                    </span>
                    <div className={styles.hBarTrack}>
                      <div
                        style={{
                          width: `${(law.proposals / lawMaxProposals) * 100}%`,
                          height: "100%",
                          background: "#4a80d4",
                          borderRadius: 4,
                        }}
                      />
                    </div>
                    <span className={styles.hBarValue}>{law.proposals}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Access gate ──────────────────────────────────────────────────────────────

function AccessGate() {
  return (
    <div className={styles.accessPage}>
      <div className={styles.gate}>
        <span className="eyebrow">Supervisor Access</span>
        <h1 className={styles.gateTitle}>Доступ лише для ролі Supervisor</h1>
        <p className={styles.gateText}>
          Цей workspace призначений для викладачів, менторів та керівників робочих груп.
        </p>
        <div className={styles.gateActions}>
          <Link href={ROUTES.rolesSupervisor} className="btn btn-primary">
            Про роль Supervisor
          </Link>
          <Link href={ROUTES.help} className="btn btn-outline">
            Як отримати доступ
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SupervisorAnalyticsPage() {
  const { user, isSupervisor, isAdmin, isHydrated } = useAuth();

  if (!isHydrated) {
    return (
      <div className={styles.workspace}>
        <div className={styles.sidebar} />
        <main className={styles.mainScroll} />
      </div>
    );
  }

  if (!isSupervisor && !isAdmin) return <AccessGate />;

  const initials = (user?.displayName ?? "СВ").slice(0, 2).toUpperCase();
  const roleLabel = isAdmin ? "Адміністратор" : "Супервайзер";

  return (
    <div className={styles.workspace}>
      <SupervisorSidebar
        initials={initials}
        name={user?.displayName ?? "Supervisor"}
        role={roleLabel}
      />
      <main className={styles.mainScroll}>
        <AnalyticsContent />
      </main>
    </div>
  );
}
