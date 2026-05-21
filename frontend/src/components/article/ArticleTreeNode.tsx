"use client";

import Link from "next/link";
import { getNodeBadge, getRoleColor, sanitizeAnchor, formatCitation } from "@/lib/tree";
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
        .map((s) => {
          const subject = subjectsMap?.get(s.subject_id);
          return subject ? { subject, role: s.role } : null;
        })
        .filter(
          (item): item is { subject: Subject; role: string } => item !== null,
        )
        .map((item) => [item.subject._id, item]),
    ).values(),
  );

  const handleCopy = async () => {
    const subjectLinks = nodeSubjects.map(({ subject }) => ({
      name: subject.canonical_name,
      id: subject._id,
    }));
    const copyText = node.text ?? node.title ?? "";

    const text = formatCitation({
      badge: getNodeBadge(node),
      text: copyText,
      charCount: copyText.length,
      subjectLinks,
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
      id={sanitizeAnchor(node.code)}
      className={styles.childItem}
      style={{
        color: isDimmed ? "var(--color-smoke)" : undefined,
        transition: "color 0.12s ease",
        outline: hasActiveSubject ? `1px solid ${color}33` : "none",
        borderRadius: hasActiveSubject ? "4px" : undefined,
        background: hasActiveSubject ? `${color}0a` : undefined,
      }}
    >
      <div className={styles.leftMeta}>
        <span className={`mono ${styles.childBadge}`}>
          {getNodeBadge(node)}
        </span>
        {charCount > 0 && (
          <span className={`mono ${styles.charCount}`}>{charCount}</span>
        )}
        {/* FE-T63: Copy button */}
        <button
          type="button"
          className={styles.copyBtn}
          aria-label="Копіювати елемент"
          onClick={handleCopy}
        >
          ⧉
        </button>
      </div>

      <div className={styles.childContent}>
        {displayTitle ? (
          <div className={styles.childTitle}>{displayTitle}</div>
        ) : null}

        {displayText ? (
          <div className={styles.childTextOnly}>{displayText}</div>
        ) : null}

        {/* FE-T62: Subjects for this element */}
        {nodeSubjects.length > 0 && (
          <div className={styles.nodeSubjects}>
            <span className={`mono ${styles.subjectsLabel}`}>
              Суб&apos;єкти:
            </span>
            {nodeSubjects.map(({ subject, role }) => (
              <Link
                key={subject._id}
                href={ROUTES.subject(subject._id)}
                className={styles.subjectChip}
                style={{
                  color: getRoleColor(role),
                  borderColor: `${getRoleColor(role)}40`,
                }}
              >
                {subject.canonical_name}
              </Link>
            ))}
          </div>
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
    </div>
  );
}
