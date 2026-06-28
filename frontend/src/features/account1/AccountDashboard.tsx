"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  User,
  Search,
  Bookmark,
  Bell,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  Eye,
  EyeOff,
  Lock,
  Send,
  Target,
  Zap,
  Clock,
  FolderOpen,
  Crown,
  Plus,
  X,
  FileText,
  ChevronRight,
  ShieldCheck,
  MapPin,
  CalendarClock,
  Globe,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useBilling } from "@/components/billing/BillingProvider";
import { useNotes } from "@/hooks/useNotes";
import { ROUTES } from "@/constants/routes";
import { preferencesApi, savedApi, topicsApi } from "@/lib/api/me";
import {
  type ClientWorkspacePreferences,
  type SavedArticleItem,
  type ClientFocusTopic,
  type WorkspacePreferenceKey,
  readUiCache,
  isWorkspaceMigrationDone,
  readLegacyWorkspace,
  clearLegacyWorkspace,
  markWorkspaceMigrationDone,
} from "@/lib/auth/clientWorkspace";
import { notify } from "@/lib/toast";
import styles from "./AccountDashboard.module.scss";

const DEFAULT_PREFS: ClientWorkspacePreferences = {
  emailAlerts: true,
  searchHighlights: true,
  compactMode: false,
  weeklyDigest: true,
};

const PREFS_CONFIG: Array<{
  key: WorkspacePreferenceKey;
  label: string;
  hint: string;
}> = [
  {
    key: "emailAlerts",
    label: "Email-сповіщення",
    hint: "Отримуйте повідомлення та спеціальні оновлення на вашу пошту.",
  },
  {
    key: "weeklyDigest",
    label: "Підсумкові огляди",
    hint: "Щоденний огляд ключових змін і рішень за вибраними темами.",
  },
  {
    key: "searchHighlights",
    label: "Ключові повідомлення",
    hint: "Ключові події та оновлення по подіях обраних справ та тем важливих запитів.",
  },
  {
    key: "compactMode",
    label: "Персональні рекомендації",
    hint: "Індивідуальні вибірки статей, справ і аналітики за вашим стилем термінів.",
  },
];

const NAV_ITEMS = [
  { href: ROUTES.account, label: "Особистий кабінет", Icon: User },
  { href: ROUTES.search, label: "Пошук документів", Icon: Search },
  { href: ROUTES.accountSaved, label: "Збережені статті", Icon: Bookmark },
  { href: ROUTES.accountNotes, label: "Нотатки", Icon: Bell },
  {
    href: ROUTES.accountBilling,
    label: "План та оплата",
    Icon: CreditCard,
  },
  { href: ROUTES.account, label: "Налаштування", Icon: Settings },
  { href: ROUTES.support, label: "Підтримка", Icon: HelpCircle },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

function formatRenewal(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("uk-UA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
}

function formatLastLogin(dateStr: string | null | undefined): string {
  if (!dateStr) return "невідомо";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "невідомо";
  return d.toLocaleString("uk-UA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface GeoInfo {
  country: string;
  city: string;
  timezone: string;
  flag: string;
}

async function fetchGeoInfo(): Promise<GeoInfo | null> {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timezone) return null;
    return { country: "", city: "", timezone, flag: "" };
  } catch {
    return null;
  }
}

export function AccountDashboard() {
  const { user, logout, updateProfile, changePassword } = useAuth();
  const { subscription } = useBilling();
  const { notes } = useNotes();
  const userId = user?.id;

  const uiCache = useMemo(() => (userId ? readUiCache(userId) : {}), [userId]);

  const [preferences, setPreferences] =
    useState<ClientWorkspacePreferences>(DEFAULT_PREFS);
  const [savedArticles, setSavedArticles] = useState<SavedArticleItem[]>([]);
  const [focusTopics, setFocusTopics] = useState<ClientFocusTopic[]>([]);

  const [geoInfo, setGeoInfo] = useState<GeoInfo | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [localTime, setLocalTime] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    if (user) setDisplayName(user.displayName);
  }, [user]);

  useEffect(() => {
    fetchGeoInfo().then((info) => {
      setGeoInfo(info);
      setGeoLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!geoInfo?.timezone) return;
    const tick = () => {
      setLocalTime(
        new Date().toLocaleTimeString("uk-UA", {
          timeZone: geoInfo.timezone,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [geoInfo?.timezone]);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const needsMigration = !isWorkspaceMigrationDone(userId);
      const legacy = needsMigration ? readLegacyWorkspace(userId) : null;

      const [prefsRes, savedRes, topicsRes] = await Promise.allSettled([
        preferencesApi.get(),
        savedApi.getAll(),
        topicsApi.getAll(),
      ]);

      if (prefsRes.status === "fulfilled")
        setPreferences({ ...DEFAULT_PREFS, ...prefsRes.value });
      if (savedRes.status === "fulfilled") setSavedArticles(savedRes.value);
      if (topicsRes.status === "fulfilled") setFocusTopics(topicsRes.value);

      if (needsMigration && legacy) {
        try {
          if (legacy.preferences)
            await preferencesApi.update(legacy.preferences);
          if (legacy.savedArticles?.length)
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
          if (legacy.focusTopics?.length)
            await topicsApi.migrate(
              legacy.focusTopics.map(({ label }) => ({ label })),
            );
          clearLegacyWorkspace(userId);
        } catch {
          // retry next session
        }
        markWorkspaceMigrationDone(userId);
        const [s, t] = await Promise.allSettled([
          savedApi.getAll(),
          topicsApi.getAll(),
        ]);
        if (s.status === "fulfilled") setSavedArticles(s.value);
        if (t.status === "fulfilled") setFocusTopics(t.value);
      }
    })();
  }, [userId]);

  const activityFeed = useMemo(() => {
    const items: Array<{
      icon: typeof FileText;
      iconColor: string;
      title: string;
      detail: string;
      time: string;
      badge: string;
      badgeVariant: "blue" | "gold" | "green";
      href?: string;
    }> = [];

    savedArticles.slice(0, 2).forEach((art) => {
      items.push({
        icon: Bookmark,
        iconColor: "#c8a843",
        title: "Збережено пошук",
        detail: `"${art.title || art.code}"`,
        time: formatTime(art.savedAt),
        badge: "Відкрити пошук",
        badgeVariant: "gold",
        href: ROUTES.accountSaved,
      });
    });

    focusTopics.slice(0, 1).forEach((topic) => {
      items.push({
        icon: Target,
        iconColor: "#4a80d4",
        title: "Особисті налаштування",
        detail: `Додано тему «${topic.label}»`,
        time: formatTime(topic.createdAt),
        badge: "Відкрити профіль",
        badgeVariant: "blue",
        href: ROUTES.account,
      });
    });

    if (notes.length > 0) {
      items.push({
        icon: FileText,
        iconColor: "#56b87a",
        title: "Оновлена стаття",
        detail: "Додано нові статті для відстежуваних тем",
        time: formatTime(notes[0]?.updatedAt),
        badge: "Відкрити теми",
        badgeVariant: "green",
        href: ROUTES.accountNotes,
      });
    }

    if (subscription?.plan?.label) {
      items.push({
        icon: Crown,
        iconColor: "#c8a843",
        title: "Оновлено підписку",
        detail: `План ${subscription.plan.label} активний до ${formatRenewal(subscription.endsAt) || "безстроково"}`,
        time: "",
        badge: "Деталі підписки",
        badgeVariant: "gold",
        href: ROUTES.accountBilling,
      });
    }

    return items.slice(0, 4);
  }, [savedArticles, focusTopics, notes, subscription]);

  if (!user) return null;

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    const res = await updateProfile(displayName);
    if (!res.ok) {
      notify.warning(res.error ?? "Не вдалося оновити профіль.");
      return;
    }
    notify.success("Ім'я оновлено.");
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    if (nextPassword.length < 8) {
      notify.warning("Пароль має містити щонайменше 8 символів.");
      return;
    }
    if (nextPassword !== confirmPassword) {
      notify.warning("Паролі не збігаються.");
      return;
    }
    const res = await changePassword(currentPassword, nextPassword);
    if (!res.ok) {
      notify.warning(res.error ?? "Не вдалося змінити пароль.");
      return;
    }
    notify.success("Пароль оновлено.");
    setCurrentPassword("");
    setNextPassword("");
    setConfirmPassword("");
  }

  async function handleTogglePref(key: WorkspacePreferenceKey) {
    const patch = {
      [key]: !preferences[key],
    } as Partial<ClientWorkspacePreferences>;
    setPreferences((p) => ({ ...p, ...patch }));
    try {
      const updated = await preferencesApi.update(patch);
      setPreferences({ ...DEFAULT_PREFS, ...updated });
    } catch {
      setPreferences((p) => ({ ...p, [key]: !patch[key] }));
      notify.warning("Не вдалося зберегти налаштування.");
    }
  }

  async function handleAddTopic(e: FormEvent) {
    e.preventDefault();
    if (newTopic.trim().length < 2) {
      notify.warning("Введіть конкретнішу тему.");
      return;
    }
    if (
      focusTopics.some(
        (t) => t.label.toLowerCase() === newTopic.trim().toLowerCase(),
      )
    ) {
      notify.info("Ця тема вже відстежується.");
      return;
    }
    try {
      const topic = await topicsApi.create(newTopic.trim());
      setFocusTopics((prev) => [topic, ...prev]);
      setNewTopic("");
      notify.success("Тему додано.");
    } catch {
      notify.warning("Не вдалося додати тему.");
    }
  }

  async function handleRemoveTopic(id: string) {
    try {
      await topicsApi.delete(id);
      setFocusTopics((prev) => prev.filter((t) => t.id !== id));
    } catch {
      notify.warning("Не вдалося видалити тему.");
    }
  }

  const planLabel = subscription?.plan?.label ?? "Класичний";
  const renewalDate = formatRenewal(subscription?.endsAt);
  const initials = getInitials(user.displayName || user.email);

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
              className={`${styles.navItem} ${label === "Особистий кабінет" ? styles.navItemActive : ""}`}
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

      {/* Main content */}
      <main className={styles.content}>
        <div className={styles.contentInner}>
          {/* Page title */}
          <div className={styles.pageTitle}>
            <h1 className={styles.pageTitleText}>
              Особистий юридичний центр роботи
            </h1>
            <p className={styles.pageTitleSub}>
              Керуйте профілем, доступом, підпискою та налаштуваннями. Швидкий
              доступ до документів, аналітики та важливих інструментів.
            </p>
          </div>

          {/* Profile header card */}
          <div className={styles.profileCard}>
            <div className={styles.profileLeft}>
              <div className={styles.profileAvatar}>
                <span>{initials}</span>
              </div>
              <div className={styles.profileInfo}>
                <div className={styles.profileName}>{user.displayName}</div>
                <div className={styles.profileEmail}>{user.email}</div>
                <div className={styles.profileBadges}>
                  <span className={styles.badgeRole}>{user.accountType}</span>
                  <span className={styles.badgeStatus}>
                    <span className={styles.statusDot} />
                    Активний акаунт
                  </span>
                </div>

                <div className={styles.profileMeta}>
                  <div className={styles.profileMetaRow}>
                    <CalendarClock
                      size={13}
                      className={styles.profileMetaIcon}
                    />
                    <span>Останній вхід:&nbsp;</span>
                    <strong>{formatLastLogin(user.lastLoginAt)}</strong>
                  </div>
                  <div className={styles.profileMetaRow}>
                    {geoLoading ? (
                      <>
                        <Globe size={13} className={styles.profileMetaIcon} />
                        <span className={styles.profileMetaLoading}>
                          Визначення локації…
                        </span>
                      </>
                    ) : geoInfo ? (
                      <>
                        <MapPin size={13} className={styles.profileMetaIcon} />
                        <span>
                          {geoInfo.flag && (
                            <span className={styles.profileMetaFlag}>
                              {geoInfo.flag}
                            </span>
                          )}
                          {[geoInfo.city, geoInfo.country]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                        {localTime && (
                          <span className={styles.profileMetaIp}>
                            · {localTime}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <Globe size={13} className={styles.profileMetaIcon} />
                        <span>Локація недоступна</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.profileActions}>
              <Link href={ROUTES.account} className={styles.profileBtn}>
                <User size={14} />
                Редагувати профіль
              </Link>
              <Link
                href={ROUTES.accountBilling}
                className={styles.profileBtnGhost}
              >
                <CreditCard size={14} />
                Керування підпискою
              </Link>
              <Link href={ROUTES.search} className={styles.profileBtnGhost}>
                <Search size={14} />
                Пошук по порталу
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <FolderOpen size={24} className={styles.statIcon} />
              <div className={styles.statBody}>
                <div className={styles.statValue}>{savedArticles.length}</div>
                <div className={styles.statLabel}>Збережені документи</div>
                <div className={styles.statSub}>
                  Ваші збережені документи, статті та матеріали
                </div>
              </div>
            </div>

            <div className={styles.statCard}>
              <Bell size={24} className={styles.statIcon} />
              <div className={styles.statBody}>
                <div className={styles.statValue}>{notes.length}</div>
                <div className={styles.statLabel}>Активні сповіщення</div>
                <div className={styles.statSub}>
                  Підключення, важливі та актуальні для вас
                </div>
              </div>
            </div>

            <div className={styles.statCard}>
              <Crown size={24} className={styles.statIconGold} />
              <div className={styles.statBody}>
                <div className={styles.statValueGold}>{planLabel}</div>
                <div className={styles.statLabel}>Поточний план</div>
                <div className={styles.statSub}>
                  Повний доступ до всіх інструментів платформи
                </div>
              </div>
            </div>

            <div className={styles.statCard}>
              <Clock size={24} className={styles.statIcon} />
              <div className={styles.statBody}>
                <div className={styles.statValueSm}>{renewalDate || "—"}</div>
                <div className={styles.statLabel}>Наступна подія</div>
                <div className={styles.statSub}>
                  Перегляд: Оновлені актуальні теми
                </div>
              </div>
            </div>
          </div>

          {/* Cards grid */}
          <div className={styles.cardsGrid}>
            {/* Preview card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconWrap}>
                  <Eye size={18} />
                </div>
                <h3 className={styles.cardTitle}>Перегляд</h3>
              </div>
              <p className={styles.cardSub}>Ваш поточний вигляд</p>
              <p className={styles.cardText}>
                Область та вид отримання доступу.
              </p>
              {uiCache.lastViewedLawId && (
                <div className={styles.cardHint}>
                  Останній перегляд: {uiCache.lastViewedLawTitle ?? "закон"}
                  {uiCache.lastViewedArticleNum &&
                    ` · ст. ${uiCache.lastViewedArticleNum}`}
                </div>
              )}
              <Link href={ROUTES.laws} className={styles.cardBtn}>
                Перейти до preview
              </Link>
            </div>

            {/* Plan & Access card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconWrap}>
                  <Lock size={18} />
                </div>
                <h3 className={styles.cardTitle}>План та доступ</h3>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardRowLabel}>Ваш поточний доступ</span>
                <span className={styles.cardRowValue}>
                  {subscription?.accessLabel ?? "Основні інструменти платформи"}
                </span>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardRowLabel}>Ключ активації</span>
                <span className={styles.cardRowValueMuted}>
                  {subscription?.plan?.badge ?? "Ви не маєте ключів."}
                </span>
              </div>
              <div className={styles.cardActions}>
                <Link
                  href={ROUTES.accountBilling}
                  className={styles.cardBtnOutline}
                >
                  <CreditCard size={13} />
                  Перейти до billing
                </Link>
                <Link
                  href={ROUTES.accountCheckout}
                  className={styles.cardBtnOutline}
                >
                  <ChevronRight size={13} />
                  Перейти до checkout
                </Link>
              </div>
            </div>

            {/* Notification priorities card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconWrap}>
                  <Send size={18} />
                </div>
                <h3 className={styles.cardTitle}>Пріоритети розсилок</h3>
              </div>
              <div className={styles.cardRow}>
                <span className={styles.cardRowLabel}>Обраний канал:</span>
                <span className={styles.cardRowValue}>Email</span>
              </div>
              <p className={styles.cardText}>
                Важливі для вас оновлення, підписки та нагадування надходять на
                email.
              </p>
              <div className={styles.cardActions}>
                <button
                  type="button"
                  className={styles.cardBtnOutline}
                  onClick={() => notify.success("Запити збережено.")}
                >
                  Зберегти запити
                </button>
                <Link href={ROUTES.account} className={styles.cardBtnOutline}>
                  Відкрити налаштування
                </Link>
              </div>
            </div>

            {/* Profile settings card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconWrap}>
                  <User size={18} />
                </div>
                <h3 className={styles.cardTitle}>Налаштування особистості</h3>
              </div>
              <p className={styles.cardSub}>Ім'я користувача</p>
              <form onSubmit={handleProfileSubmit} className={styles.cardForm}>
                <input
                  className={styles.cardInput}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ваше ім'я"
                />
                <button type="submit" className={styles.cardBtnPrimary}>
                  Редагувати профіль
                </button>
              </form>
            </div>

            {/* Change password card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconWrap}>
                  <ShieldCheck size={18} />
                </div>
                <h3 className={styles.cardTitle}>Змінити пароль</h3>
              </div>
              <form onSubmit={handlePasswordSubmit} className={styles.cardForm}>
                <div className={styles.cardFieldRow}>
                  <span className={styles.cardFieldLabel}>Поточний пароль</span>
                  <div className={styles.cardInputWrap}>
                    <input
                      className={styles.cardInput}
                      type={showPasswords ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className={styles.cardEyeBtn}
                      onClick={() => setShowPasswords((v) => !v)}
                      aria-label={
                        showPasswords ? "Приховати паролі" : "Показати паролі"
                      }
                    >
                      {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className={styles.cardFieldRow}>
                  <span className={styles.cardFieldLabel}>Новий пароль</span>
                  <div className={styles.cardInputWrap}>
                    <input
                      className={styles.cardInput}
                      type={showPasswords ? "text" : "password"}
                      value={nextPassword}
                      onChange={(e) => setNextPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className={styles.cardEyeBtn}
                      onClick={() => setShowPasswords((v) => !v)}
                      aria-label={
                        showPasswords ? "Приховати паролі" : "Показати паролі"
                      }
                    >
                      {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className={styles.cardFieldRow}>
                  <span className={styles.cardFieldLabel}>
                    Підтвердження нового пароля
                  </span>
                  <div className={styles.cardInputWrap}>
                    <input
                      className={styles.cardInput}
                      type={showPasswords ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className={styles.cardEyeBtn}
                      onClick={() => setShowPasswords((v) => !v)}
                      aria-label={
                        showPasswords ? "Приховати паролі" : "Показати паролі"
                      }
                    >
                      {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" className={styles.cardBtnPrimary}>
                  Оновити пароль
                </button>
              </form>
            </div>

            {/* Tracked topics card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconWrap}>
                  <Target size={18} />
                </div>
                <h3 className={styles.cardTitle}>Відстежувані теми</h3>
              </div>
              <form onSubmit={handleAddTopic} className={styles.topicForm}>
                <input
                  className={styles.cardInput}
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="Додайте тему"
                />
                <button type="submit" className={styles.topicAddBtn}>
                  <Plus size={14} />
                </button>
              </form>
              <div className={styles.topicChips}>
                {focusTopics.map((topic) => (
                  <div key={topic.id} className={styles.topicChip}>
                    <span>{topic.label}</span>
                    <button
                      type="button"
                      className={styles.topicChipRemove}
                      onClick={() => handleRemoveTopic(topic.id)}
                      aria-label={`Видалити ${topic.label}`}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Reading & notifications card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconWrap}>
                  <Bell size={18} />
                </div>
                <h3 className={styles.cardTitle}>Читання та сповіщення</h3>
              </div>
              <div className={styles.toggleList}>
                {PREFS_CONFIG.map(({ key, label, hint }) => (
                  <div key={key} className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <div className={styles.toggleLabel}>{label}</div>
                      <div className={styles.toggleHint}>{hint}</div>
                    </div>
                    <button
                      type="button"
                      className={`${styles.toggleBtn} ${preferences[key] ? styles.toggleBtnOn : styles.toggleBtnOff}`}
                      onClick={() => handleTogglePref(key)}
                    >
                      {preferences[key] ? "Увімкнено" : "Вимкнено"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconWrap}>
                  <Zap size={18} />
                </div>
                <h3 className={styles.cardTitle}>Швидкі дії</h3>
              </div>
              <div className={styles.quickGrid}>
                <Link href={ROUTES.search} className={styles.quickBtn}>
                  <Search size={20} className={styles.quickIcon} />
                  <span className={styles.quickLabel}>Відкрити пошук</span>
                  <span className={styles.quickSub}>Пошук по документах</span>
                </Link>
                <Link href={ROUTES.accountNotes} className={styles.quickBtn}>
                  <Bell size={20} className={styles.quickIcon} />
                  <span className={styles.quickLabel}>
                    Керувати сповіщеннями
                  </span>
                  <span className={styles.quickSub}>Налаштування email</span>
                </Link>
                <Link href={ROUTES.accountBilling} className={styles.quickBtn}>
                  <CreditCard size={20} className={styles.quickIcon} />
                  <span className={styles.quickLabel}>Керувати billing</span>
                  <span className={styles.quickSub}>Підписка та оплата</span>
                </Link>
                <Link href={ROUTES.accountSaved} className={styles.quickBtn}>
                  <FileText size={20} className={styles.quickIcon} />
                  <span className={styles.quickLabel}>
                    Переглянути документи
                  </span>
                  <span className={styles.quickSub}>Ваші збережені файли</span>
                </Link>
              </div>
            </div>

            {/* Activity feed card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconWrap}>
                  <Clock size={18} />
                </div>
                <h3 className={styles.cardTitle}>Останні дії та сповіщення</h3>
              </div>
              <div className={styles.activityTabs}>
                <button
                  type="button"
                  className={`${styles.activityTab} ${styles.activityTabActive}`}
                >
                  Усі
                </button>
                <button type="button" className={styles.activityTab}>
                  Сповіщення
                </button>
              </div>
              <div className={styles.activityList}>
                {activityFeed.length > 0 ? (
                  activityFeed.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className={styles.activityItem}>
                        <div
                          className={`${styles.activityIconWrap} ${styles[`activityIconWrap_${item.badgeVariant}`]}`}
                        >
                          <Icon size={14} />
                        </div>
                        <div className={styles.activityBody}>
                          <div className={styles.activityTop}>
                            <span className={styles.activityTitle}>
                              {item.title}
                            </span>
                            {item.time && (
                              <span className={styles.activityTime}>
                                {item.time}
                              </span>
                            )}
                          </div>
                          <div className={styles.activityDetail}>
                            {item.detail}
                          </div>
                        </div>
                        {item.href && (
                          <Link
                            href={item.href}
                            className={`${styles.activityBadge} ${styles[`activityBadge_${item.badgeVariant}`]}`}
                          >
                            {item.badge}
                          </Link>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className={styles.activityEmpty}>
                    Активність з'явиться після перших дій у системі.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
