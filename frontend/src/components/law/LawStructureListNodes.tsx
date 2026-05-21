"use client";

import Link from "next/link";
import {
  formatCitation,
  getNodeBadge,
  getNodeContent,
  getNodeLabel,
  getRoleColor,
  sanitizeAnchor,
  type TreeBranch,
} from "@/lib/tree";
import { notify } from "@/lib/toast";
import type { Subject } from "@/types";
import { ROUTES } from "@/constants/routes";
import styles from "./LawStructureList.module.scss";

interface NodeListProps {
  nodes: TreeBranch[];
  highlightSubjectId?: string | null;
  subjectsMap?: Map<string, Subject>;
  lawId?: string;
  lawTitle?: string;
  articleNum?: string;
}

function NestedNode({
  node,
  highlightSubjectId,
  subjectsMap,
  lawId,
  lawTitle,
  articleNum,
}: Omit<NodeListProps, "nodes"> & { node: TreeBranch }) {
  const content = getNodeContent(node);
  const isHighlighted =
    highlightSubjectId != null &&
    (node.subjects?.some((s) => s.subject_id === highlightSubjectId) ?? false);

  const charCount = node.text?.length ?? 0;

  const nodeSubjects =
    subjectsMap && node.subjects?.length
      ? Array.from(
          new Map(
            node.subjects
              .map((s) => {
                const subject = subjectsMap.get(s.subject_id);
                return subject ? { subject, role: s.role } : null;
              })
              .filter((item): item is { subject: Subject; role: string } => item !== null)
              .map((item) => [item.subject._id, item]),
          ).values(),
        )
      : [];

  const handleCopy = async () => {
    if (!lawId || !articleNum) return;
    const copyText = node.text ?? node.title ?? "";
    const text = formatCitation({
      badge: getNodeBadge(node),
      text: copyText,
      charCount: copyText.length,
      subjectLinks: nodeSubjects.map(({ subject }) => ({
        name: subject.canonical_name,
        id: subject._id,
      })),
      lawId,
      articleNum,
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
      id={node.code ? sanitizeAnchor(node.code) : undefined}
      className={`law-structure-node ${isHighlighted ? styles.highlightedNode : ""}`}
    >
      <div className={styles.nodeHeader}>
        <span className="law-structure-node-label">{getNodeLabel(node)}</span>
        {charCount > 0 && (
          <span className={`mono ${styles.nodeCharCount}`}>{charCount}</span>
        )}
        {lawId && articleNum && (
          <button
            type="button"
            className={styles.nodeCopyBtn}
            aria-label="Копіювати елемент"
            onClick={handleCopy}
          >
            ⧉
          </button>
        )}
      </div>

      {content ? (
        <div
          className={`law-structure-node-text ${isHighlighted ? styles.highlightedText : ""}`}
        >
          {content}
        </div>
      ) : null}

      {nodeSubjects.length > 0 && (
        <div className={styles.nodeSubjects}>
          {nodeSubjects.map(({ subject, role }) => (
            <Link
              key={subject._id}
              href={ROUTES.subject(subject._id)}
              className={styles.nodeSubjectChip}
              style={{ "--rc": getRoleColor(role) } as React.CSSProperties}
            >
              {subject.canonical_name}
            </Link>
          ))}
        </div>
      )}

      {node.children.length > 0 ? (
        <div className="law-structure-node-children">
          <NestedNodeList
            nodes={node.children}
            highlightSubjectId={highlightSubjectId}
            subjectsMap={subjectsMap}
            lawId={lawId}
            lawTitle={lawTitle}
            articleNum={articleNum}
          />
        </div>
      ) : null}
    </div>
  );
}

export function NestedNodeList({
  nodes,
  highlightSubjectId,
  subjectsMap,
  lawId,
  lawTitle,
  articleNum,
}: NodeListProps) {
  return (
    <div className="law-structure-nested-list">
      {nodes.map((node) => (
        <NestedNode
          key={node.key}
          node={node}
          highlightSubjectId={highlightSubjectId}
          subjectsMap={subjectsMap}
          lawId={lawId}
          lawTitle={lawTitle}
          articleNum={articleNum}
        />
      ))}
    </div>
  );
}
