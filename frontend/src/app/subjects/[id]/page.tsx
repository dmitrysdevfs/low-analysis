"use client";

import { useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Layout } from "@/components/layout/Layout";
import { ROUTES } from "@/constants/routes";
import { useSubjectDetail } from "@/hooks/useSubjectDetail";
import { useLawsMap } from "@/hooks/useLawsMap";
import { NoteModal } from "@/components/notes/NoteModal";
import SelectionTooltip from "@/components/notes/SelectionTooltip";
import { SubjectHero } from "@/components/subject/SubjectHero";
import { SubjectRoleStrip } from "@/components/subject/SubjectRoleStrip";
import { SubjectLawGroup } from "@/components/subject/SubjectLawGroup";
import type { NoteDraft } from "@/lib/notes/types";
import styles from "./page.module.scss";

export default function SubjectDetailPage() {
  const params = useParams<{ id: string }>();
  const subjectId = params?.id ?? "";
  const { subject, elements, loading, error } = useSubjectDetail(
    subjectId || undefined,
  );
  const { lawsMap } = useLawsMap();
  const containerRef = useRef<HTMLElement | null>(null);
  const [noteDraft, setNoteDraft] = useState<NoteDraft | null>(null);
  const [activeRole, setActiveRole] = useState<string | null>(null);

  const lawsCount = useMemo(
    () => new Set(elements.map((e) => e.lawId).filter(Boolean)).size,
    [elements],
  );

  const rolesCount = useMemo(() => {
    const s = new Set<string>();
    elements.forEach((el) => {
      const r = el.subjects?.find((sub) => sub.subject_id === subjectId)?.role;
      if (r) s.add(r);
    });
    return s.size;
  }, [elements, subjectId]);

  const groupedElements = useMemo(() => {
    const filtered = activeRole
      ? elements.filter((el) =>
          el.subjects?.some(
            (s) => s.subject_id === subjectId && s.role === activeRole,
          ),
        )
      : elements;
    const map = new Map<string, typeof elements>();
    filtered.forEach((el) => {
      if (!el.lawId) return;
      const arr = map.get(el.lawId) ?? [];
      arr.push(el);
      map.set(el.lawId, arr);
    });
    return Array.from(map.entries());
  }, [elements, subjectId, activeRole]);

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={styles.breadcrumbBar}
      >
        <Breadcrumb
          items={[
            { label: "Суб'єкти", href: ROUTES.subjects },
            { label: subject?.canonical_name ?? subjectId ?? "…" },
          ]}
        />
      </motion.div>

      <div
        className={styles.scrollArea}
        ref={(el) => {
          containerRef.current = el;
        }}
      >
        <div className={styles.inner}>
          {loading ? (
            <div className={styles.skeletonList}>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.15,
                  }}
                  className={styles.skeletonItem}
                  style={{
                    height: i === 0 ? 48 : 22,
                    width: i === 0 ? "60%" : `${45 + i * 15}%`,
                  }}
                />
              ))}
            </div>
          ) : null}

          {!loading && error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={styles.errorBox}
            >
              {error}
            </motion.div>
          ) : null}

          {!loading && !error && subject ? (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <SubjectHero
                subject={subject}
                lawsCount={lawsCount}
                normsCount={elements.length}
                rolesCount={rolesCount}
              />
              <SubjectRoleStrip
                elements={elements}
                subjectId={subjectId}
                activeRole={activeRole}
                onRoleChange={setActiveRole}
              />
              {groupedElements.length === 0 ? (
                <div className={styles.emptyState}>Елементів не знайдено</div>
              ) : (
                groupedElements.map(([lawId, lawElements], i) => (
                  <SubjectLawGroup
                    key={lawId}
                    lawId={lawId}
                    law={lawsMap.get(lawId)}
                    elements={lawElements}
                    subjectId={subjectId}
                    defaultOpen={i === 0}
                  />
                ))
              )}
            </motion.div>
          ) : null}
        </div>
      </div>

      <SelectionTooltip
        containerRef={containerRef}
        lawId=""
        lawTitle=""
        articleNum=""
        articleTitle={subject?.canonical_name ?? ""}
        onRequestNote={(draft: NoteDraft) => setNoteDraft(draft)}
      />
      <NoteModal
        open={noteDraft !== null}
        draft={noteDraft}
        onClose={() => setNoteDraft(null)}
        onSaved={() => setNoteDraft(null)}
      />
    </Layout>
  );
}
