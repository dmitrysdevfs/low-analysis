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
  Radar,
  RefreshCcw,
  Scale,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { notify } from "@/lib/toast";
import {
  usePublicGroups,
  useMyGroups,
  useSubmitRequest,
  useMyGroupRequests,
} from "@/hooks/useGroups";
import type { Group } from "@/lib/api/groups";
import { ROUTES } from "@/constants/routes";
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

function getGroupButtonState(
  group: Group,
  userId: string | undefined,
  pendingGroupIds: Set<string>,
): "member" | "pending" | "full" | "closed" | "join" {
  if (!userId) return "join";

  const isMember = group.members.some((m) => {
    const uid = typeof m.userId === "object" ? m.userId._id : m.userId;
    return uid === userId && m.status === "active";
  });
  if (isMember) return "member";

  if (pendingGroupIds.has(group._id)) return "pending";

  const activeCount = group.members.filter((m) => m.status === "active").length;
  if (activeCount >= group.maxMembers) return "full";
  if (group.status !== "active") return "closed";

  return "join";
}

interface RequestModalProps {
  group: Group;
  onClose: () => void;
  onSubmit: (message: string) => void;
  isPending: boolean;
}

function RequestModal({
  group,
  onClose,
  onSubmit,
  isPending,
}: RequestModalProps) {
  const [message, setMessage] = useState("");
  const supervisorName =
    typeof group.supervisorId === "object"
      ? group.supervisorId.fullName
      : "Куратор";

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>
          Заявка до групи &ldquo;{group.name}&rdquo;
        </h2>
        <p className={styles.modalSubtitle}>Куратор: {supervisorName}</p>
        <textarea
          className={styles.textarea}
          placeholder="Розкажіть чому хочете долучитись — необов'язково"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onClose}
          >
            Скасувати
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => onSubmit(message)}
            disabled={isPending}
          >
            {isPending ? "Відправляємо..." : "Подати заявку →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function GroupsPageContent({ userId }: { userId: string | undefined }) {
  const {
    data: publicGroups = [],
    isLoading: loadingPublic,
    isError: errorPublic,
  } = usePublicGroups();
  const { data: myGroups = [], isLoading: loadingMy } = useMyGroups();
  const { data: myRequests = [] } = useMyGroupRequests();
  const submitRequestMutation = useSubmitRequest();

  const pendingGroupIds = new Set(
    myRequests.map((r) => {
      const gid = r.groupId;
      return typeof gid === "object"
        ? (gid as { _id: string })._id
        : String(gid);
    }),
  );

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const handleSubmit = async (message: string) => {
    if (!selectedGroup) return;
    try {
      await submitRequestMutation.mutateAsync({
        groupId: selectedGroup._id,
        message: message.trim() || undefined,
      });
      notify.success("Заявку подано успішно");
      setSelectedGroup(null);
    } catch {
      notify.error("Не вдалося подати заявку");
    }
  };

  return (
    <div className={styles.mainContent}>
      <span className={styles.eyebrow}>КАБІНЕТ ЗАКОНОТВОРЦЯ · ГРУПИ</span>
      <h1 className={styles.pageTitle}>Знайдіть свою групу</h1>

      <div className={styles.twoCol}>
        {/* ── Left: Catalog ─────────────────────────────────────────────── */}
        <div className={styles.catalogSection}>
          {loadingPublic && (
            <p className={styles.loadingState}>Завантаження...</p>
          )}
          {errorPublic && (
            <p className={styles.errorState}>Помилка завантаження</p>
          )}
          {!loadingPublic &&
            !errorPublic &&
            publicGroups.map((group) => {
              const btnState = getGroupButtonState(
                group,
                userId,
                pendingGroupIds,
              );
              const supervisorName =
                typeof group.supervisorId === "object"
                  ? group.supervisorId.fullName
                  : "—";
              const membersCount = group.members.filter(
                (m) => m.status === "active",
              ).length;
              const progressPct = Math.min(
                100,
                Math.round((membersCount / group.maxMembers) * 100),
              );

              return (
                <div key={group._id} className={styles.groupCard}>
                  <div>
                    <div className={styles.groupCardCourse}>{group.course}</div>
                    <div className={styles.groupCardName}>{group.name}</div>
                    <div className={styles.groupCardSupervisor}>
                      Куратор: {supervisorName}
                    </div>
                  </div>

                  {group.trackedLaws.length > 0 && (
                    <div className={styles.lawTags}>
                      {group.trackedLaws.slice(0, 4).map((law, i) => {
                        const code =
                          typeof law === "object" ? law.code : String(law);
                        return (
                          <span key={i} className={styles.lawTag}>
                            {code}
                          </span>
                        );
                      })}
                      {group.trackedLaws.length > 4 && (
                        <span className={styles.lawTag}>
                          +{group.trackedLaws.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  <div>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className={styles.progressLabel}>
                      {membersCount} / {group.maxMembers} учасників
                    </div>
                  </div>

                  {btnState === "member" && (
                    <div className={styles.btnSuccess}>Ви учасник ✓</div>
                  )}
                  {btnState === "pending" && (
                    <div className={styles.btnWarning}>Очікується...</div>
                  )}
                  {btnState === "full" && (
                    <button
                      type="button"
                      className={`${styles.btnPrimary} ${styles.btnDisabled}`}
                      disabled
                    >
                      Заповнена
                    </button>
                  )}
                  {btnState === "closed" && (
                    <button
                      type="button"
                      className={`${styles.btnPrimary} ${styles.btnDisabled}`}
                      disabled
                    >
                      Закрита
                    </button>
                  )}
                  {btnState === "join" && (
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      onClick={() => setSelectedGroup(group)}
                    >
                      Подати заявку
                    </button>
                  )}
                </div>
              );
            })}

          {!loadingPublic && !errorPublic && publicGroups.length === 0 && (
            <p className={styles.emptyHint}>Груп поки що немає.</p>
          )}
        </div>

        {/* ── Right: My status ──────────────────────────────────────────── */}
        <div className={styles.sidebar2}>
          {/* My groups */}
          <div className={styles.sideSection}>
            <span className={styles.sideSectionTitle}>Мої групи</span>
            {loadingMy ? (
              <p className={styles.emptyHint}>Завантаження...</p>
            ) : myGroups.length === 0 ? (
              <p className={styles.emptyHint}>
                Ви ще не є учасником жодної групи.
              </p>
            ) : (
              myGroups.map((group) => {
                const myMembership = group.members.find((m) => {
                  const uid =
                    typeof m.userId === "object" ? m.userId._id : m.userId;
                  return uid === userId;
                });
                const joinedAt = myMembership?.joinedAt
                  ? new Date(myMembership.joinedAt).toLocaleDateString(
                      "uk-UA",
                      { day: "2-digit", month: "short", year: "numeric" },
                    )
                  : "";

                return (
                  <div key={group._id} className={styles.myGroupItem}>
                    <div className={styles.myGroupName}>{group.name}</div>
                    {joinedAt && (
                      <div className={styles.myGroupDate}>
                        Вступив: {joinedAt}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Tips */}
          <div className={styles.tipsBox}>
            Вкажіть мотивацію у заявці — підвищує шанс прийняття. Куратор
            отримає повідомлення та розгляне заявку якнайшвидше.
          </div>
        </div>
      </div>

      {/* ── Modal ──────────────────────────────────────────────────────── */}
      {selectedGroup && (
        <RequestModal
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
          onSubmit={handleSubmit}
          isPending={submitRequestMutation.isPending}
        />
      )}
    </div>
  );
}

export default function LegislatorGroupsPage() {
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
        <GroupsPageContent userId={user?.id} />
      </main>
    </div>
  );
}
