"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROUTES } from "@/constants/routes";
import { useLaws } from "@/hooks/useLaws";
import {
  addSavedArticle,
  readClientWorkspace,
  removeSavedArticle,
  type ClientWorkspace,
} from "@/lib/auth/clientWorkspace";
import { notify } from "@/lib/toast";
import { formatDateMedium } from "@/lib/utils";
import styles from "./ClientWorkspace.module.scss";

export function ClientWorkspaceSaved() {
  const { user } = useAuth();
  const userId = user?.id;
  const { laws, loading, error } = useLaws();
  const [workspace, setWorkspace] = useState<ClientWorkspace | null>(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    setWorkspace(readClientWorkspace(userId));
  }, [userId]);

  const suggestions = useMemo(() => {
    if (!workspace) {
      return [];
    }

    return laws
      .filter(
        (law) =>
          !workspace.savedArticles.some((item) => item.lawId === law._id),
      )
      .slice(0, 4);
  }, [laws, workspace]);

  if (!user || !workspace) {
    return null;
  }

  function handleSaveLaw(lawId: string) {
    if (!userId) {
      return;
    }

    const law = laws.find((item) => item._id === lawId);

    if (!law) {
      return;
    }

    const nextWorkspace = addSavedArticle(userId, {
      lawId: law._id,
      title: law.title,
      code: law.code,
      note: "Pinned from the client workspace for quick access.",
    });

    setWorkspace(nextWorkspace);
    notify.success("Закон додано до збережених.");
  }

  function handleRemoveSaved(itemId: string) {
    if (!userId) {
      return;
    }

    const nextWorkspace = removeSavedArticle(userId, itemId);
    setWorkspace(nextWorkspace);
    notify.info("Закон видалено зі збережених.");
  }

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Збережені статті</span>
          <h1 className={styles.title}>Закріплені правові матеріали</h1>
          <p className={styles.description}>
            Створіть швидкий доступ до законів та документів, до яких часто
            повертаєтесь.
          </p>
        </div>

        <div className={styles.heroMeta}>
          <div className={styles.heroIdentity}>
            <span className={styles.rolePill}>Полиця кабінету</span>
            <div className={styles.identityName}>
              {workspace.savedArticles.length} збережених елементів
            </div>
            <div className={styles.identityEmail}>
              Підібрано для {user.displayName}
            </div>
          </div>

          <div className={styles.heroActions}>
            <Link href={ROUTES.account} className={styles.heroLink}>
              Повернутися до кабінету
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.panelGrid}>
        <article className={`${styles.panel} ${styles.panelWide}`}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Список кабінету</span>
              <h2 className={styles.panelTitle}>
                Ваш набір збережених законів
              </h2>
            </div>
          </div>

          {workspace.savedArticles.length > 0 ? (
            <div className={styles.savedList}>
              {workspace.savedArticles.map((item) => (
                <div key={item.id} className={styles.savedRow}>
                  <div className={styles.savedTopRow}>
                    <div>
                      <div className={styles.savedCode}>{item.code}</div>
                      <div className={styles.savedTitle}>{item.title}</div>
                      <div className={styles.savedMeta}>
                        Збережено {formatDateMedium(item.savedAt)}
                      </div>
                    </div>
                    <span className={styles.badge}>saved</span>
                  </div>

                  <div className={styles.savedNote}>{item.note}</div>

                  <div className={styles.savedActions}>
                    <Link
                      href={ROUTES.law(item.lawId)}
                      className={styles.linkText}
                    >
                      Відкрити закон
                    </Link>
                    <button
                      type="button"
                      className={styles.miniButton}
                      onClick={() => handleRemoveSaved(item.id)}
                    >
                      Видалити
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              Ще немає закріплених законів. Скористайтесь панеллю пропозицій щоб
              додати перший.
            </div>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Пропозиції</span>
              <h2 className={styles.panelTitle}>Рекомендовані документи</h2>
            </div>
          </div>

          {loading ? (
            <div className={styles.emptyState}>
              Завантаження законів для пропозицій…
            </div>
          ) : error ? (
            <div className={styles.emptyState}>{error}</div>
          ) : suggestions.length > 0 ? (
            <div className={styles.suggestionList}>
              {suggestions.map((law) => (
                <div key={law._id} className={styles.workspaceCard}>
                  <div>
                    <div className={styles.savedCode}>{law.code}</div>
                    <div className={styles.workspaceTitle}>{law.title}</div>
                    <div className={styles.workspaceHint}>
                      {law.totalArticles} статей · {law.totalSections} розділів
                    </div>
                  </div>

                  <div className={styles.workspaceActions}>
                    <button
                      type="button"
                      className={styles.miniButton}
                      onClick={() => handleSaveLaw(law._id)}
                    >
                      Зберегти
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              Ви вже зберегли всі запропоновані закони.
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
