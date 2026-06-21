"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  X,
  ChevronRight,
  Mail,
  Users,
  MailCheck,
  Eye,
  AlertCircle,
  Clock,
  FileText,
  TrendingUp,
} from "lucide-react";
import { adminApi, type EmailCampaign } from "@/lib/api/admin";
import styles from "./page.module.scss";

const STATUS_LABELS: Record<EmailCampaign["status"], string> = {
  draft: "Чернетка",
  sending: "Надсилання",
  sent: "Надіслано",
  failed: "Помилка",
};

const STATUS_FILTERS = [
  { id: "all", label: "Всі" },
  { id: "sent", label: "Надіслані" },
  { id: "draft", label: "Чернетки" },
  { id: "sending", label: "В процесі" },
  { id: "failed", label: "З помилкою" },
];

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function deliveryRate(c: EmailCampaign) {
  if (!c.recipientCount) return "—";
  return `${Math.round((c.deliveredCount / c.recipientCount) * 100)}%`;
}

function openRate(c: EmailCampaign) {
  if (!c.deliveredCount || !c.openCount) return "—";
  return `${Math.round((c.openCount / c.deliveredCount) * 100)}%`;
}

export default function AdminEmailHistoryPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<EmailCampaign | null>(null);

  const {
    data: campaigns,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["email-campaigns"],
    queryFn: () => adminApi.getEmailCampaigns(),
  });

  const { data: logs } = useQuery({
    queryKey: ["email-campaign-logs", selected?._id],
    queryFn: () => adminApi.getCampaignLogs(selected!._id),
    enabled: !!selected,
  });

  const filtered = useMemo(() => {
    if (!campaigns) return [];
    return campaigns.filter((c) => {
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      const matchSearch =
        !search || c.subject.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [campaigns, statusFilter, search]);

  const totalSent =
    campaigns
      ?.filter((c) => c.status === "sent")
      .reduce((s, c) => s + c.deliveredCount, 0) ?? 0;
  const totalRecipients =
    campaigns?.reduce((s, c) => s + c.recipientCount, 0) ?? 0;
  const avgOpen = (() => {
    const withOpen = campaigns?.filter((c) => c.openCount > 0) ?? [];
    if (!withOpen.length) return 0;
    return Math.round(
      (withOpen.reduce((s, c) => s + c.openCount / (c.deliveredCount || 1), 0) /
        withOpen.length) *
        100,
    );
  })();

  return (
    <div className={styles.root}>
      {/* KPI strip */}
      <div className={styles.kpiStrip}>
        <div className={styles.kpiItem}>
          <Mail
            size={14}
            className={styles.kpiIcon}
            style={{ color: "#4a80d4" }}
          />
          <div>
            <div className={styles.kpiNum}>{campaigns?.length ?? 0}</div>
            <div className={styles.kpiLabel}>Кампаній</div>
          </div>
        </div>
        <div className={styles.kpiItem}>
          <Users
            size={14}
            className={styles.kpiIcon}
            style={{ color: "#c8a843" }}
          />
          <div>
            <div className={styles.kpiNum}>
              {totalRecipients.toLocaleString("uk-UA")}
            </div>
            <div className={styles.kpiLabel}>Отримувачів</div>
          </div>
        </div>
        <div className={styles.kpiItem}>
          <MailCheck
            size={14}
            className={styles.kpiIcon}
            style={{ color: "#52b788" }}
          />
          <div>
            <div className={styles.kpiNum}>
              {totalSent.toLocaleString("uk-UA")}
            </div>
            <div className={styles.kpiLabel}>Доставлено</div>
          </div>
        </div>
        <div className={styles.kpiItem}>
          <TrendingUp
            size={14}
            className={styles.kpiIcon}
            style={{ color: "#a78bfa" }}
          />
          <div>
            <div className={styles.kpiNum}>{avgOpen ? `${avgOpen}%` : "—"}</div>
            <div className={styles.kpiLabel}>Середнє відкрито</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <div className={styles.searchWrap}>
            <Search size={13} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Пошук по темі..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className={styles.searchClear}
                onClick={() => setSearch("")}
              >
                <X size={12} />
              </button>
            )}
          </div>
          <div className={styles.filterTabs}>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`${styles.filterTab} ${statusFilter === f.id ? styles.filterTabActive : ""}`}
                onClick={() => setStatusFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={styles.toolbarBtn}
            onClick={() => refetch()}
          >
            <RefreshCw size={13} />
          </button>
          <button type="button" className={styles.toolbarBtn}>
            <Download size={13} />
            Експорт
          </button>
        </div>
      </div>

      {/* Main content */}
      <div
        className={`${styles.content} ${selected ? styles.contentWithInspector : ""}`}
      >
        {/* List */}
        <div className={styles.list}>
          {isLoading && <div className={styles.empty}>Завантаження...</div>}
          {!isLoading && !filtered.length && (
            <div className={styles.empty}>
              <FileText size={32} />
              <span>Розсилок не знайдено</span>
            </div>
          )}
          {filtered.map((c) => (
            <div
              key={c._id}
              className={`${styles.row} ${selected?._id === c._id ? styles.rowActive : ""}`}
              onClick={() => setSelected(selected?._id === c._id ? null : c)}
            >
              <div className={styles.rowLeft}>
                <div
                  className={`${styles.statusDot} ${styles[`dot_${c.status}`]}`}
                />
              </div>
              <div className={styles.rowMain}>
                <div className={styles.subject}>{c.subject}</div>
                <div className={styles.meta}>
                  {c.templateSlug} · {c.theme} ·{" "}
                  {formatDate(c.sentAt ?? c.createdAt)}
                </div>
              </div>
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.statNum}>{c.recipientCount}</span>
                  <span className={styles.statLabel}>отримувачів</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statNum}>{deliveryRate(c)}</span>
                  <span className={styles.statLabel}>доставл.</span>
                </div>
                {c.openCount > 0 && (
                  <div className={styles.stat}>
                    <span className={styles.statNum}>{openRate(c)}</span>
                    <span className={styles.statLabel}>відкрито</span>
                  </div>
                )}
              </div>
              <div className={`${styles.badge} ${styles[`badge_${c.status}`]}`}>
                {STATUS_LABELS[c.status]}
              </div>
              <ChevronRight
                size={14}
                className={`${styles.rowArrow} ${selected?._id === c._id ? styles.rowArrowOpen : ""}`}
              />
            </div>
          ))}
        </div>

        {/* Inspector */}
        {selected && (
          <div className={styles.inspector}>
            <div className={styles.inspectorHeader}>
              <span className={styles.inspectorTitle}>Кампанія</span>
              <button
                type="button"
                className={styles.inspectorClose}
                onClick={() => setSelected(null)}
              >
                <X size={14} />
              </button>
            </div>

            <div className={styles.inspectorSection}>
              <div className={styles.inspectorLabel}>Тема</div>
              <div className={styles.inspectorValue}>{selected.subject}</div>
            </div>
            <div className={styles.inspectorRow}>
              <div className={styles.inspectorSection}>
                <div className={styles.inspectorLabel}>Шаблон</div>
                <div className={styles.inspectorValue}>
                  {selected.templateSlug}
                </div>
              </div>
              <div className={styles.inspectorSection}>
                <div className={styles.inspectorLabel}>Тема оформлення</div>
                <div className={styles.inspectorValue}>{selected.theme}</div>
              </div>
            </div>

            <div className={styles.inspectorStats}>
              <div className={styles.inspectorStat}>
                <Users size={13} style={{ color: "#4a80d4" }} />
                <div>
                  <div className={styles.inspectorStatNum}>
                    {selected.recipientCount}
                  </div>
                  <div className={styles.inspectorStatLabel}>Отримувачів</div>
                </div>
              </div>
              <div className={styles.inspectorStat}>
                <MailCheck size={13} style={{ color: "#52b788" }} />
                <div>
                  <div className={styles.inspectorStatNum}>
                    {selected.deliveredCount}
                  </div>
                  <div className={styles.inspectorStatLabel}>Доставлено</div>
                </div>
              </div>
              <div className={styles.inspectorStat}>
                <Eye size={13} style={{ color: "#c8a843" }} />
                <div>
                  <div className={styles.inspectorStatNum}>
                    {selected.openCount || "—"}
                  </div>
                  <div className={styles.inspectorStatLabel}>Відкрито</div>
                </div>
              </div>
              <div className={styles.inspectorStat}>
                {selected.status === "failed" ? (
                  <AlertCircle size={13} style={{ color: "#f87171" }} />
                ) : (
                  <Clock size={13} style={{ color: "#6a88b0" }} />
                )}
                <div>
                  <div className={styles.inspectorStatNum}>
                    {formatDate(selected.sentAt)}
                  </div>
                  <div className={styles.inspectorStatLabel}>Надіслано</div>
                </div>
              </div>
            </div>

            <div className={styles.inspectorLogsHeader}>
              Логи ({logs?.length ?? 0})
            </div>
            <div className={styles.inspectorLogs}>
              {!logs?.length && (
                <div className={styles.inspectorNoLogs}>Логи відсутні</div>
              )}
              {logs?.slice(0, 12).map((log, i) => (
                <div key={i} className={styles.logRow}>
                  <div
                    className={`${styles.logDot} ${log.status === "delivered" ? styles.logDotOk : styles.logDotErr}`}
                  />
                  <span className={styles.logEmail}>{log.recipientEmail}</span>
                  <span className={styles.logStatus}>{log.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
