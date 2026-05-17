"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useBilling } from "@/components/billing/BillingProvider";
import { ROUTES } from "@/constants/routes";
import {
  addWorkspaceFocusTopic,
  appendWorkspaceActivity,
  exportClientWorkspaceSnapshot,
  removeWorkspaceFocusTopic,
  readClientWorkspace,
  type ClientWorkspacePreferences,
  updateWorkspacePreferences,
  type ClientWorkspace,
  type WorkspacePreferenceKey,
} from "@/lib/auth/clientWorkspace";
import { notify } from "@/lib/toast";
import { formatDateFull } from "@/lib/utils";
import styles from "./ClientWorkspace.module.scss";

const PREFERENCE_COPY: Array<{
  key: WorkspacePreferenceKey;
  title: string;
  hint: string;
}> = [
  {
    key: "emailAlerts",
    title: "Email-сповіщення",
    hint: "Отримуйте оновлення, коли відстежувані елементи робочого простору змінюються.",
  },
  {
    key: "searchHighlights",
    title: "Підсвічування пошуку",
    hint: "Зберігайте виділення збігів юридичних запитів у пошуку та перегляді документів.",
  },
  {
    key: "compactMode",
    title: "Компактний режим читання",
    hint: "Зменшіть відступи для тривалих дослідницьких сесій із щільним юридичним текстом.",
  },
  {
    key: "weeklyDigest",
    title: "Щотижневий дайджест",
    hint: "Готуйте короткий підсумок збережених законів, нотаток та поточних тем досліджень.",
  },
];

export function ClientWorkspaceHome() {
  const { user, updateProfile, changePassword } = useAuth();
  const { subscription } = useBilling();
  const userId = user?.id;
  const [workspace, setWorkspace] = useState<ClientWorkspace | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [focusTopic, setFocusTopic] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!userId || !user) {
      return;
    }

    setWorkspace(readClientWorkspace(userId));
    setDisplayName(user.displayName);
  }, [user, userId]);

  const stats = useMemo(() => {
    if (!workspace || !user) {
      return [];
    }

    return [
      {
        label: "Збережені статті",
        value: workspace.savedArticles.length,
        note: "Закріплені юридичні документи, готові для швидкого доступу.",
      },
      {
        label: "Нотатки",
        value: workspace.notes.length,
        note: "Робочі спостереження, запитання та завдання для подальшого дослідження.",
      },
      {
        label: "Режим робочого простору",
        value: workspace.preferences.compactMode ? "Компактний" : "Класичний",
        note: "Поточний макет читання для щоденних досліджень.",
      },
      {
        label: "Останній вхід",
        value: formatDateFull(user.lastLoginAt),
        note: "Остання автентифікована сесія в цьому попередньому перегляді.",
      },
      {
        label: "Поточний план",
        value: subscription?.plan?.label ?? "Preview",
        note: subscription?.description ?? "Local billing preview is active for this account.",
      },
    ];
  }, [subscription?.description, subscription?.plan?.label, user, workspace]);

  const latestSaved = workspace?.savedArticles[0] ?? null;
  const pinnedNote =
    workspace?.notes.find((note) => note.pinned) ?? workspace?.notes[0] ?? null;
  const recentActivity = workspace?.activity.slice(0, 6) ?? [];

  if (!user || !workspace) {
    return null;
  }

  function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = updateProfile(displayName);

    if (!result.ok) {
      notify.warning(result.error ?? "Profile update failed.");
      return;
    }

    if (userId) {
      setWorkspace(
        appendWorkspaceActivity(userId, {
          type: "profile",
          title: "Profile updated",
          detail: `Display name changed to ${displayName.trim()}.`,
        }),
      );
    }

    notify.success("Display name updated.");
  }

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (nextPassword.length < 8) {
      notify.warning("Use at least 8 characters for the new password.");
      return;
    }

    if (nextPassword !== confirmPassword) {
      notify.warning("The new password and confirmation do not match.");
      return;
    }

    const result = changePassword(currentPassword, nextPassword);

    if (!result.ok) {
      notify.warning(result.error ?? "Password change failed.");
      return;
    }

    notify.success("Password updated successfully.");
    setCurrentPassword("");
    setNextPassword("");
    setConfirmPassword("");

    if (userId) {
      setWorkspace(
        appendWorkspaceActivity(userId, {
          type: "security",
          title: "Password changed",
          detail: "Security credentials were refreshed for this workspace.",
        }),
      );
    }
  }

  function handleTogglePreference(key: WorkspacePreferenceKey) {
    if (!userId || !workspace) {
      return;
    }

    const nextWorkspace = updateWorkspacePreferences(userId, {
      [key]: !workspace.preferences[key],
    } as Partial<ClientWorkspacePreferences>);

    setWorkspace(nextWorkspace);
  }

  function handleAddFocusTopic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId || !workspace) {
      return;
    }

    if (focusTopic.trim().length < 2) {
      notify.warning("Add a more specific legal topic before saving it.");
      return;
    }

    const nextWorkspace = addWorkspaceFocusTopic(userId, focusTopic);

    if (nextWorkspace.focusTopics.length === workspace.focusTopics.length) {
      notify.info("This topic is already tracked in your workspace.");
      return;
    }

    setWorkspace(nextWorkspace);
    setFocusTopic("");
    notify.success("Research focus added.");
  }

  function handleRemoveFocusTopic(topicId: string) {
    if (!userId) {
      return;
    }

    const nextWorkspace = removeWorkspaceFocusTopic(userId, topicId);
    setWorkspace(nextWorkspace);
    notify.info("Research focus removed.");
  }

  function handleExportWorkspace() {
    if (!userId) {
      return;
    }

    const json = exportClientWorkspaceSnapshot(userId);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `low-analysis-workspace-${userId}.json`;
    anchor.click();
    URL.revokeObjectURL(url);

    setWorkspace(
      appendWorkspaceActivity(userId, {
        type: "export",
        title: "Workspace exported",
        detail: "A local JSON snapshot of the client workspace was downloaded.",
      }),
    );
    notify.success("Workspace export downloaded.");
  }

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Клієнтський простір</span>
          <h1 className={styles.title}>Особистий юридичний центр роботи</h1>
          <p className={styles.description}>
            Тримайте профіль, нотатки, збережені закони та активні теми досліджень в одному
            кабінеті, не змінюючи решту потоку платформи.
          </p>
        </div>

        <div className={styles.heroMeta}>
          <div className={styles.heroIdentity}>
            <span className={styles.rolePill}>{user.accountType}</span>
            <div className={styles.identityName}>{user.displayName}</div>
            <div className={styles.identityEmail}>{user.email}</div>
          </div>

          <div className={styles.heroActions}>
            <Link href={ROUTES.accountSaved} className={styles.heroLink}>
              Відкрити збережені статті
            </Link>
            <Link href={ROUTES.accountNotes} className={styles.secondaryButton}>
              Відкрити нотатки
            </Link>
            <Link href={ROUTES.accountBilling} className={styles.secondaryButton}>
              План та оплата
            </Link>
            <button
              type="button"
              className={styles.ghostButton}
              onClick={handleExportWorkspace}
            >
              Експортувати JSON простору
            </button>
          </div>
        </div>
      </div>

      {(workspace.lastViewedLawId || workspace.lastSearchQuery) && (
        <div className={styles.continuePanel}>
          <span className={`mono ${styles.continueEyebrow}`}>Продовжити роботу</span>

          {workspace.lastViewedLawId && (
            <Link href={`/laws/${workspace.lastViewedLawId}`} className={styles.continueItem}>
              <span className={styles.continueIcon}>§</span>
              <span className={styles.continueText}>
                {workspace.lastViewedLawTitle ?? "Закон"}
              </span>
              {workspace.lastViewedArticleNum && (
                <span className={styles.continueDetail}>
                  → ст. {workspace.lastViewedArticleNum}
                </span>
              )}
            </Link>
          )}

          {workspace.lastSearchQuery && (
            <Link
              href={`/search?q=${encodeURIComponent(workspace.lastSearchQuery)}`}
              className={styles.continueItem}
            >
              <span className={styles.continueIcon}>⌕</span>
              <span className={styles.continueText}>"{workspace.lastSearchQuery}"</span>
            </Link>
          )}
        </div>
      )}

      <div className={styles.statsGrid}>
        {stats.map((stat) => (
          <article key={stat.label} className={styles.statCard}>
            <span className={styles.statLabel}>{stat.label}</span>
            <strong className={styles.statValue}>{stat.value}</strong>
            <p className={styles.statNote}>{stat.note}</p>
          </article>
        ))}
      </div>

      <div className={styles.panelGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Billing</span>
              <h2 className={styles.panelTitle}>План та квоти доступу</h2>
            </div>
          </div>

          <div className={styles.workspaceList}>
            <div className={styles.workspaceCard}>
              <div>
                <div className={styles.workspaceTitle}>
                  {subscription?.accessLabel ?? "Preview access"}
                </div>
                <div className={styles.workspaceHint}>
                  {subscription?.description ??
                    "Manage trial, monthly plans, and checkout directly in the client cabinet."}
                </div>
              </div>
              <div className={styles.workspaceActions}>
                <span className={styles.badge}>
                  {subscription?.plan?.badge ?? "local preview"}
                </span>
                <Link href={ROUTES.accountBilling} className={styles.linkText}>
                  Відкрити billing
                </Link>
              </div>
            </div>

            <div className={styles.workspaceCard}>
              <div>
                <div className={styles.workspaceTitle}>Квоти запитів</div>
                <div className={styles.workspaceHint}>
                  Search:{" "}
                  {subscription?.searchRemaining === null
                    ? "unlimited"
                    : `${subscription?.searchRemaining ?? 0} / ${subscription?.searchLimit ?? 0}`}{" "}
                  · Views:{" "}
                  {subscription?.viewRemaining === null
                    ? "unlimited"
                    : `${subscription?.viewRemaining ?? 0} / ${subscription?.viewLimit ?? 0}`}
                </div>
              </div>
              <div className={styles.workspaceActions}>
                <span className={styles.badgeAccent}>
                  {subscription?.daysRemaining === null
                    ? "no expiry"
                    : `${subscription?.daysRemaining} d left`}
                </span>
                <Link href={ROUTES.accountCheckout} className={styles.linkText}>
                  Перейти до checkout
                </Link>
              </div>
            </div>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Продовження</span>
              <h2 className={styles.panelTitle}>Продовжити дослідження</h2>
            </div>
          </div>

          <div className={styles.workspaceList}>
            <div className={styles.workspaceCard}>
              <div>
                <div className={styles.workspaceTitle}>Останній збережений закон</div>
                <div className={styles.workspaceHint}>
                  {latestSaved
                    ? `${latestSaved.code} готовий для швидкого доступу з вашої полиці.`
                    : "Жодного закону ще не закріплено. Збережіть стратегічний документ для швидшого повернення."}
                </div>
              </div>
              <div className={styles.workspaceActions}>
                {latestSaved ? (
                  <>
                    <span className={styles.badge}>збережено</span>
                    <Link href={ROUTES.law(latestSaved.lawId)} className={styles.linkText}>
                      Відкрити закон
                    </Link>
                  </>
                ) : (
                  <Link href={ROUTES.accountSaved} className={styles.linkText}>
                    Відкрити збережені
                  </Link>
                )}
              </div>
            </div>

            <div className={styles.workspaceCard}>
              <div>
                <div className={styles.workspaceTitle}>Закріплена нотатка</div>
                <div className={styles.workspaceHint}>
                  {pinnedNote
                    ? pinnedNote.title
                    : "Зафіксуйте наступне юридичне питання та перетворіть його на дослідницький шлях."}
                </div>
              </div>
              <div className={styles.workspaceActions}>
                {pinnedNote ? (
                  <span className={styles.badgeAccent}>
                    оновлено {formatDateFull(pinnedNote.updatedAt)}
                  </span>
                ) : null}
                <Link href={ROUTES.accountNotes} className={styles.linkText}>
                  Відкрити нотатник
                </Link>
              </div>
            </div>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Профіль</span>
              <h2 className={styles.panelTitle}>Налаштування особистості</h2>
            </div>
          </div>

          <form className={styles.fieldGrid} onSubmit={handleProfileSubmit}>
            <label className={styles.field}>
              <span className={styles.label}>Відображуване ім'я</span>
              <input
                className={styles.input}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>

            <p className={styles.subtleNote}>
              Це ім'я відображається у чіпі заголовка та в клієнтському просторі.
            </p>

            <div className={styles.actionRow}>
              <button type="submit" className={styles.primaryButton}>
                Зберегти профіль
              </button>
            </div>
          </form>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Безпека</span>
              <h2 className={styles.panelTitle}>Змінити пароль</h2>
            </div>
          </div>

          <form className={styles.fieldGrid} onSubmit={handlePasswordSubmit}>
            <label className={styles.field}>
              <span className={styles.label}>Поточний пароль</span>
              <input
                className={styles.input}
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Новий пароль</span>
              <input
                className={styles.input}
                type="password"
                value={nextPassword}
                onChange={(event) => setNextPassword(event.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Підтвердити новий пароль</span>
              <input
                className={styles.input}
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </label>

            <p className={styles.subtleNote}>
              Зміни пароля залишаються лише на фронтенді в цьому попередньому перегляді та зберігаються в локальному сховищі браузера.
            </p>

            <div className={styles.actionRow}>
              <button type="submit" className={styles.primaryButton}>
                Оновити пароль
              </button>
            </div>
          </form>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Карта досліджень</span>
              <h2 className={styles.panelTitle}>Відстежувані теми</h2>
            </div>
          </div>

          <form className={styles.fieldGrid} onSubmit={handleAddFocusTopic}>
            <label className={styles.field}>
              <span className={styles.label}>Додати тему</span>
              <input
                className={styles.input}
                value={focusTopic}
                onChange={(event) => setFocusTopic(event.target.value)}
                placeholder="Податкова політика, трудове право, конституційний огляд..."
              />
            </label>

            <div className={styles.actionRow}>
              <button type="submit" className={styles.primaryButton}>
                Додати тему
              </button>
            </div>
          </form>

          {workspace.focusTopics.length > 0 ? (
            <div className={styles.focusList}>
              {workspace.focusTopics.map((topic) => (
                <div key={topic.id} className={styles.focusChip}>
                  <span>{topic.label}</span>
                  <button
                    type="button"
                    className={styles.focusChipRemove}
                    onClick={() => handleRemoveFocusTopic(topic.id)}
                    aria-label={`Видалити ${topic.label}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.subtleNote}>
              Додайте свої поточні юридичні теми тут, щоб робочий простір став справжньою дослідницькою дошкою, а не просто статичною сторінкою профілю.
            </p>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Налаштування</span>
              <h2 className={styles.panelTitle}>Читання та сповіщення</h2>
            </div>
          </div>

          <div className={styles.toggleList}>
            {PREFERENCE_COPY.map((item) => (
              <div key={item.key} className={styles.toggleRow}>
                <div>
                  <div className={styles.toggleTitle}>{item.title}</div>
                  <div className={styles.toggleHint}>{item.hint}</div>
                </div>

                <button
                  type="button"
                  className={`${styles.ghostButton} ${workspace.preferences[item.key] ? styles.toggleButtonActive : ""}`}
                  onClick={() => handleTogglePreference(item.key)}
                >
                  {workspace.preferences[item.key] ? "Увімкнено" : "Вимкнено"}
                </button>
              </div>
            ))}
          </div>
        </article>

        <article className={`${styles.panel} ${styles.panelWide}`}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Активність</span>
              <h2 className={styles.panelTitle}>Остання хронологія простору</h2>
            </div>
          </div>

          {recentActivity.length > 0 ? (
            <div className={styles.activityList}>
              {recentActivity.map((item) => (
                <div key={item.id} className={styles.activityRow}>
                  <div className={styles.activityDot} />
                  <div className={styles.activityContent}>
                    <div className={styles.activityTopRow}>
                      <span className={styles.activityTitle}>{item.title}</span>
                      <span className={styles.activityTime}>{formatDateFull(item.createdAt)}</span>
                    </div>
                    <div className={styles.activityDetail}>{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              Дії в робочому просторі з'являться тут, коли ви зберігатимете закони, редагуватимете нотатки, оновлюватимете налаштування та формуватимете свій дослідницький процес.
            </div>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Простір</span>
              <h2 className={styles.panelTitle}>Швидкі дії</h2>
            </div>
          </div>

          <div className={styles.workspaceList}>
            <div className={styles.workspaceCard}>
              <div>
                <div className={styles.workspaceTitle}>Збережені статті</div>
                <div className={styles.workspaceHint}>
                  Тримайте стратегічні закони та часто використовувані документи на відстані одного кліку.
                </div>
              </div>
              <div className={styles.workspaceActions}>
                <span className={styles.badge}>{workspace.savedArticles.length} елем.</span>
                <Link href={ROUTES.accountSaved} className={styles.linkText}>
                  Відкрити список
                </Link>
              </div>
            </div>

            <div className={styles.workspaceCard}>
              <div>
                <div className={styles.workspaceTitle}>Особисті нотатки</div>
                <div className={styles.workspaceHint}>
                  Фіксуйте юридичні спостереження, дослідницькі запитання та завдання для подальшого опрацювання.
                </div>
              </div>
              <div className={styles.workspaceActions}>
                <span className={styles.badgeAccent}>{workspace.notes.length} нотат.</span>
                <Link href={ROUTES.accountNotes} className={styles.linkText}>
                  Відкрити нотатник
                </Link>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
