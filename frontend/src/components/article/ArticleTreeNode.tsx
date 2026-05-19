"use client";

import Link from "next/link";
import { getNodeBadge } from "@/lib/tree";
import type { TreeBranch } from "@/lib/tree";
import { highlightMatch } from "@/lib/utils/highlightMatch";
import { notify } from "@/lib/toast";
import type { Subject } from "@/types";
import { ROUTES } from "@/constants/routes";
import styles from "@/app/laws/[id]/articles/[num]/page.module.scss";

interface NestedNodeListProps {
  nodes: TreeBranch[];
  activeSubjectId?: string | null;
  highlightTerms?: string[];
  highlightColor?: string;
  subjectsMap?: Map<string, Subject>;
  lawTitle?: string;
  articleNum?: string;
  lawId?: string;
}

export function NestedNodeList({
  nodes,
  activeSubjectId,
  highlightTerms,
  highlightColor,
  subjectsMap,
  lawTitle,
  articleNum,
  lawId,
}: NestedNodeListProps) {
  return (
    <div className={styles.childrenList}>
      {nodes.map((node) => (
        <NestedNode
          key={node.key}
          node={node}
          activeSubjectId={activeSubjectId}
          highlightTerms={highlightTerms}
          highlightColor={highlightColor}
          subjectsMap={subjectsMap}
          lawTitle={lawTitle}
          articleNum={articleNum}
          lawId={lawId}
        />
      ))}
    </div>
  );
}

interface NestedNodeProps {
  node: TreeBranch;
  activeSubjectId?: string | null;
  highlightTerms?: string[];
  highlightColor?: string;
  subjectsMap?: Map<string, Subject>;
  lawTitle?: string;
  articleNum?: string;
  lawId?: string;
}

function hasTermsMatch(
  text: string | undefined | null,
  terms: string[],
): boolean {
  if (!text || !terms.length) return false;
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`(${escaped.join("|")})`, "i").test(text);
}

function formatCitation(opts: {
  badge: string;
  text: string;
  charCount: number;
  subjects: string[];
  lawId: string;
  articleNum: string;
  lawTitle: string;
  code: string;
}): string {
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/laws/${opts.lawId}/articles/${opts.articleNum}#${opts.code}`
      : `/laws/${opts.lawId}/articles/${opts.articleNum}#${opts.code}`;

  const subjectsLine = opts.subjects.length
    ? `Суб'єкти: ${opts.subjects.join(", ")}`
    : "Суб'єктів не знайдено";

  return [
    `§ ${opts.badge} — ${opts.text}`,
    `Символів: ${opts.charCount}`,
    subjectsLine,
    `Посилання: ${url}`,
    `Закон: ${opts.lawTitle}`,
  ].join("\n");
}

function NestedNode({
  node,
  activeSubjectId,
  highlightTerms,
  highlightColor,
  subjectsMap,
  lawTitle,
  articleNum,
  lawId,
}: NestedNodeProps) {
  const hasActiveSubject =
    activeSubjectId != null &&
    (node.subjects?.some((s) => s.subject_id === activeSubjectId) ?? false);

  const color = highlightColor ?? "#c8a843";
  const allTerms = highlightTerms ?? [];
  const hasTextMatch =
    activeSubjectId != null &&
    allTerms.length > 0 &&
    (hasTermsMatch(node.text, allTerms) || hasTermsMatch(node.title, allTerms));

  const isDimmed =
    activeSubjectId != null && !hasActiveSubject && !hasTextMatch;
  const activeTerms = hasActiveSubject || hasTextMatch ? allTerms : [];

  const displayText =
    activeTerms.length > 0 && node.text
      ? highlightMatch(node.text, activeTerms, color)
      : node.text;
  const displayTitle =
    activeTerms.length > 0 && node.title
      ? highlightMatch(node.title, activeTerms, color)
      : node.title;

  const charCount = node.text?.length ?? 0;

  const nodeSubjects = Array.from(
    new Map(
      (node.subjects ?? [])
        .map((s) => subjectsMap?.get(s.subject_id))
        .filter(Boolean)
        .map((s) => [s!._id, s!]),
    ).values(),
  );

  const handleCopy = async () => {
    const subjectNames = nodeSubjects.map((s) => s.canonical_name);

    const text = formatCitation({
      badge: node.code ?? "",
      text: node.text ?? "",
      charCount,
      subjects: subjectNames,
      lawId: lawId ?? "",
      articleNum: articleNum ?? "",
      lawTitle: lawTitle ?? "",
      code: node.code ?? "",
    });

    try {
      await navigator.clipboard.writeText(text);
      notify.success("Скопійовано");
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      notify.success("Скопійовано");
    }
  };

  return (
    <div
      className={styles.childItem}
      style={{
        opacity: isDimmed ? 0.3 : 1,
        transition: "opacity 0.08s ease",
        outline: hasActiveSubject ? `1px solid ${color}33` : "none",
        borderRadius: hasActiveSubject ? "4px" : undefined,
        background: hasActiveSubject ? `${color}0a` : undefined,
      }}
    >
      <span className={`mono ${styles.childBadge}`}>{getNodeBadge(node)}</span>
      {charCount > 0 && <span className={styles.charCount}>({charCount})</span>}

      <div className={styles.childContent}>
        {displayTitle ? (
          <div className={styles.childTitle}>{displayTitle}</div>
        ) : null}

        {displayText ? (
          <div className={styles.childTextOnly}>{displayText}</div>
        ) : null}

        {/* FE-T62: Subjects for this element */}
        {nodeSubjects.length > 0 ? (
          <div className={styles.nodeSubjects}>
            {nodeSubjects.map((subject) => (
              <Link
                key={subject._id}
                href={ROUTES.subject(subject._id)}
                className={styles.subjectChip}
              >
                {subject.canonical_name}
              </Link>
            ))}
          </div>
        ) : (
          <p className={styles.noSubjects}>
            Суб&apos;єктів не знайдено. AI-аналіз ще не виконано.
          </p>
        )}

        {node.children.length > 0 ? (
          <NestedNodeList
            nodes={node.children}
            activeSubjectId={activeSubjectId}
            highlightTerms={highlightTerms}
            highlightColor={highlightColor}
            subjectsMap={subjectsMap}
            lawTitle={lawTitle}
            articleNum={articleNum}
            lawId={lawId}
          />
        ) : null}
      </div>

      {/* FE-T63: Copy button */}
      <button
        className={styles.copyBtn}
        aria-label="Копіювати елемент"
        onClick={handleCopy}
      >
        ⧉
      </button>
    </div>
  );
}
