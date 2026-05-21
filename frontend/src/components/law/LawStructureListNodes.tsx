"use client";

import { getNodeContent, getNodeLabel, type TreeBranch } from "@/lib/tree";
import styles from "./LawStructureList.module.scss";

function NestedNode({
  node,
  highlightSubjectId,
}: {
  node: TreeBranch;
  highlightSubjectId?: string | null;
}) {
  const content = getNodeContent(node);
  const isHighlighted =
    highlightSubjectId &&
    node.subjects?.some((s) => s.subject_id === highlightSubjectId);

  return (
    <div
      className={`law-structure-node ${
        isHighlighted ? styles.highlightedNode : ""
      }`}
    >
      <div className="law-structure-node-label">{getNodeLabel(node)}</div>
      {content ? (
        <div
          className={`law-structure-node-text ${
            isHighlighted ? styles.highlightedText : ""
          }`}
        >
          {content}
        </div>
      ) : null}
      {node.children.length > 0 ? (
        <div className="law-structure-node-children">
          <NestedNodeList
            nodes={node.children}
            highlightSubjectId={highlightSubjectId}
          />
        </div>
      ) : null}
    </div>
  );
}

export function NestedNodeList({
  nodes,
  highlightSubjectId,
}: {
  nodes: TreeBranch[];
  highlightSubjectId?: string | null;
}) {
  return (
    <div className="law-structure-nested-list">
      {nodes.map((node) => (
        <NestedNode
          key={node.key}
          node={node}
          highlightSubjectId={highlightSubjectId}
        />
      ))}
    </div>
  );
}
