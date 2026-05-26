"use client";

import { useEffect, useState } from "react";
import { getPublicPage } from "@/lib/api";
import type { ManagedPagePublicResponse } from "@/types";
import { PROJECT_INFO_FALLBACK } from "../lib/pageBuilderBlocks";
import { ProjectPageRenderer } from "./ProjectPageRenderer";
import styles from "../PageBuilder.module.scss";

const PAGE_SLUG = "project-info";

export function ProjectInfoPageView() {
  const [page, setPage] = useState<ManagedPagePublicResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadPage() {
      try {
        const nextPage = await getPublicPage(PAGE_SLUG);
        if (!active) return;
        setPage(nextPage);
        setFallbackMode(false);
      } catch {
        if (!active) return;
        setPage(PROJECT_INFO_FALLBACK);
        setFallbackMode(true);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      active = false;
    };
  }, []);

  if (loading && !page) {
    return (
      <section className={styles.builderState}>
        Завантаження сторінки «Інформація про проєкт»...
      </section>
    );
  }

  return (
    <div className={styles.publicShell}>
      {fallbackMode && (
        <div className={styles.noticeBar}>
          Показано локальний резервний знімок сторінки. Опублікований контент із
          бекенду зараз недоступний.
        </div>
      )}
      <ProjectPageRenderer page={page ?? PROJECT_INFO_FALLBACK} />
    </div>
  );
}
