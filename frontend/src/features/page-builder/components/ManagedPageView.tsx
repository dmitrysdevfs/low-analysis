"use client";

import { useEffect, useState } from "react";
import { getPublicPage } from "@/lib/api/pages";
import type { ManagedPagePublicResponse } from "@/types";
import { ProjectPageRenderer } from "./ProjectPageRenderer";
import styles from "../PageBuilder.module.scss";

interface ManagedPageViewProps {
  slug: string;
  fallback: ManagedPagePublicResponse;
  eyebrow?: string;
}

export function ManagedPageView({
  slug,
  fallback,
  eyebrow,
}: ManagedPageViewProps) {
  const [page, setPage] = useState<ManagedPagePublicResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await getPublicPage(slug);
        if (!active) return;
        setPage(data);
        setFallbackMode(false);
      } catch {
        if (!active) return;
        setPage(fallback);
        setFallbackMode(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [slug, fallback]);

  if (loading && !page) {
    return <section className={styles.builderState}>Завантаження...</section>;
  }

  const activePage = page ?? fallback;

  return (
    <div className={styles.publicShell}>
      {fallbackMode && (
        <div className={styles.noticeBar}>
          Показано локальний резервний знімок сторінки.
        </div>
      )}
      <ProjectPageRenderer page={activePage} eyebrow={eyebrow} />
    </div>
  );
}
