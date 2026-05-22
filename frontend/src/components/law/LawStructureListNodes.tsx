"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const riskLevel = node.risk_level ?? null;

  const nodeSubjects =
    subjectsMap && node.subjects?.length
      ? Array.from(
          new Map(
            node.subjects
              .map((s) => {
                const subject = subjectsMap.get(s.subject_id);
                return subject ? { subject, role: s.role } : null;
              })
              .filter(
                (item): item is { subject: Subject; role: string } =>
                  item !== null,
              )
              .map((item) => [item.subject._id, item]),
          ).values(),
        )
      : [];

  const router = useRouter();
  const anchorId = node.code ? sanitizeAnchor(node.code) : "";

  const handleAnchorClick = async () => {
    if (!anchorId || !lawId || !articleNum) return;

    router.push(`/laws/${lawId}/articles/${articleNum}#${anchorId}`);
  };

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
      id={anchorId || undefined}
      className={`law-structure-node ${isHighlighted ? styles.highlightedNode : ""}`}
    >
      <div className={styles.nodeHeader}>
        {riskLevel && (
          <span
            className={`${styles.riskDot} ${styles[`risk${riskLevel.charAt(0).toUpperCase()}${riskLevel.slice(1)}`]}`}
            title={
              riskLevel === "red"
                ? `Об'ємний елемент · ${charCount} симв.`
                : riskLevel === "yellow"
                  ? `Помірна складність · ${charCount} симв.`
                  : `Норма · ${charCount} симв.`
            }
          />
        )}
        <button
          type="button"
          onClick={handleAnchorClick}
          className="law-structure-node-label"
        >
          {getNodeLabel(node)}
        </button>
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
