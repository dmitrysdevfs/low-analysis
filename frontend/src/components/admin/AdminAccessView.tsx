"use client";

import { useState, useMemo } from "react";
import {
  Users,
  User,
  Scale,
  Eye,
  ShieldCheck,
  Layers,
  CheckCircle,
  Lock,
  Search,
} from "lucide-react";
import { useAdminWorkspace } from "./useAdminWorkspace";
import { AdminRequestsPanel } from "@/features/law-change/components/AdminRequestsPanel/AdminRequestsPanel";
import styles from "./AdminAccess.module.scss";

const ROLE_META = {
  guest: {
    label: "Гість",
    Icon: Users,
    color: "#4a80d4",
    desc: "Публічний доступ без авторизації",
  },
  user: {
    label: "Клієнт",
    Icon: User,
    color: "#52b788",
    desc: "Авторизований користувач базового плану",
  },
  legislator: {
    label: "Законотворець",
    Icon: Scale,
    color: "#c8a843",
    desc: "Розширений доступ до законодавчого кабінету",
  },
  supervisor: {
    label: "Супервайзер",
    Icon: Eye,
    color: "#9b5de5",
    desc: "Наглядовий доступ до активності платформи",
  },
  admin: {
    label: "Адмін",
    Icon: ShieldCheck,
    color: "#e9774b",
    desc: "Повний доступ до всіх поверхонь",
  },
} as const;

type RoleKey = keyof typeof ROLE_META;

const MODULES = [
  { key: "home", label: "Головна" },
  { key: "laws", label: "Закони" },
  { key: "subjects", label: "Субʼєкти" },
  { key: "search", label: "Пошук" },
  { key: "account", label: "Акаунт" },
  { key: "legislatorCabinet", label: "Кабінет" },
  { key: "supervisorDashboard", label: "Supervisor" },
  { key: "adminPanel", label: "Адмін" },
] as const;

type ModuleKey = (typeof MODULES)[number]["key"];

function MatrixIcon({ value }: { value: boolean }) {
  if (value) {
    return <CheckCircle size={15} className={styles.iconYes} />;
  }
  return <Lock size={14} className={styles.iconNo} />;
}

export function AdminAccessView() {
  const { snapshot } = useAdminWorkspace();
  const [roleFilter, setRoleFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [diffOnly, setDiffOnly] = useState(false);

  const matrix = snapshot?.accessMatrix ?? [];

  const visibleRoles =
    roleFilter === "all" ? matrix : matrix.filter((r) => r.role === roleFilter);

  const filteredModules = useMemo(() => {
    let mods = MODULES as readonly { key: ModuleKey; label: string }[];
    if (moduleFilter !== "all") {
      mods = mods.filter((m) => m.key === moduleFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      mods = mods.filter((m) => m.label.toLowerCase().includes(q));
    }
    if (diffOnly) {
      mods = mods.filter((m) => {
        const vals = matrix.map((r) => r[m.key as ModuleKey] as boolean);
        return !vals.every((v) => v === vals[0]);
      });
    }
    return mods;
  }, [matrix, moduleFilter, search, diffOnly]);

  if (!snapshot) return null;

  const colTemplate = `180px repeat(${filteredModules.length}, 1fr)`;

  return (
    <section className={styles.page}>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Доступ</span>
          <h2 className={styles.title}>Тримайте права доступу в полі зору.</h2>
          <p className={styles.description}>
            Матриця ролей платформи — хто і до яких поверхонь має доступ. Захист
            маршрутів відбувається на рівні RouteAccessGate і підтверджується
            адмін-оболонкою.
          </p>
        </div>
        <div className={styles.heroShield}>
          <ShieldCheck size={40} className={styles.shieldIcon} />
          <strong className={styles.shieldCount}>
            {snapshot.protectedRoutes}
          </strong>
          <span className={styles.shieldLabel}>захищених маршрутів</span>
          <p className={styles.shieldMeta}>
            Усі адмінські поверхні ізольовані від публічної оболонки
          </p>
        </div>
      </section>

      {/* ROLE TILES */}
      <section className={styles.roleTiles}>
        {(
          Object.entries(ROLE_META) as [RoleKey, (typeof ROLE_META)[RoleKey]][]
        ).map(([roleKey, meta]) => {
          const row = matrix.find((r) => r.role === roleKey);
          const allowed = row
            ? MODULES.filter((m) => row[m.key as ModuleKey]).length
            : 0;
          const { Icon, color, label, desc } = meta;
          return (
            <article key={roleKey} className={styles.roleTile}>
              <div
                className={styles.roleTileIcon}
                style={{ background: `${color}1a` }}
              >
                <Icon size={16} style={{ color }} />
              </div>
              <span className={styles.roleTileName}>{label}</span>
              <strong className={styles.roleTileCount}>{allowed}</strong>
              <p className={styles.roleTileDesc}>{desc}</p>
              <div
                className={styles.roleTileAccent}
                style={{ background: color }}
              />
            </article>
          );
        })}
        <article className={styles.roleTile}>
          <div
            className={styles.roleTileIcon}
            style={{ background: "rgba(158,181,217,0.08)" }}
          >
            <Layers size={16} style={{ color: "rgba(158,181,217,0.45)" }} />
          </div>
          <span className={styles.roleTileName}>Адмін-оболонка</span>
          <strong className={styles.roleTileCount}>
            {snapshot.protectedRoutes}
          </strong>
          <p className={styles.roleTileDesc}>
            Захищені адмін-маршрути окремого простору
          </p>
          <div
            className={styles.roleTileAccent}
            style={{ background: "rgba(158,181,217,0.3)" }}
          />
        </article>
      </section>

      {/* MATRIX PANEL */}
      <section className={styles.matrixPanel}>
        <div className={styles.matrixPanelHeader}>
          <div className={styles.matrixPanelTitles}>
            <span className={styles.matrixPanelEyebrow}>Матриця ролей</span>
            <h3 className={styles.matrixPanelTitle}>Хто що може відкрити</h3>
          </div>
          <div className={styles.matrixToolbar}>
            <select
              className={styles.matrixSelect}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">Усі ролі</option>
              {(
                Object.entries(ROLE_META) as [
                  RoleKey,
                  (typeof ROLE_META)[RoleKey],
                ][]
              ).map(([k, m]) => (
                <option key={k} value={k}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              className={styles.matrixSelect}
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
            >
              <option value="all">Усі модулі</option>
              {MODULES.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
            <div className={styles.searchWrap}>
              <Search size={12} className={styles.searchIcon} />
              <input
                className={styles.matrixSearch}
                placeholder="Пошук модулів..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              className={`${styles.diffToggle}${diffOnly ? ` ${styles.active}` : ""}`}
              onClick={() => setDiffOnly((d) => !d)}
            >
              Тільки відмінності
            </button>
          </div>
        </div>

        <div className={styles.matrix}>
          <div
            className={styles.matrixHead}
            style={{ gridTemplateColumns: colTemplate }}
          >
            <span className={styles.matrixHeadCell}>Роль</span>
            {filteredModules.map((m) => (
              <span key={m.key} className={styles.matrixHeadCell}>
                {m.label}
              </span>
            ))}
          </div>

          {visibleRoles.map((row) => {
            const meta = ROLE_META[row.role as RoleKey];
            const Icon = meta?.Icon ?? User;
            const color = meta?.color ?? "#9eb5d9";
            return (
              <div
                key={row.role}
                className={styles.matrixRow}
                style={{ gridTemplateColumns: colTemplate }}
              >
                <div className={styles.matrixRoleCell}>
                  <Icon size={13} style={{ color, flexShrink: 0 }} />
                  <span className={styles.matrixRoleName}>
                    {meta?.label ?? row.role}
                  </span>
                </div>
                {filteredModules.map((m) => (
                  <div key={m.key} className={styles.matrixCell}>
                    <MatrixIcon value={!!row[m.key as ModuleKey]} />
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div className={styles.matrixLegend}>
          <span className={styles.legendItem}>
            <CheckCircle size={12} className={styles.iconYes} />
            Так
          </span>
          <span className={styles.legendItem}>
            <Lock size={11} className={styles.iconNo} />
            Ні
          </span>
        </div>
      </section>

      <AdminRequestsPanel />
    </section>
  );
}
