"use client";

import { getNodeBadge } from "@/lib/lawTree";
import type { TreeBranch } from "@/lib/lawTree";
import styles from "@/app/laws/[id]/articles/[num]/page.module.scss";

export function NestedNodeList({ nodes }: { nodes: TreeBranch[] }) {
  return (
    <div className={styles.childrenList}>
      {nodes.map((node) => (
        <NestedNode key={node.key} node={node} />
      ))}
    </div>
  );
}

function NestedNode({ node }: { node: TreeBranch }) {
  return (
    <div className={styles.childItem}>
      <span className={`mono ${styles.childBadge}`}>{getNodeBadge(node)}</span>

      <div className={styles.childContent}>
        {node.title ? (
          <div className={styles.childTitle}>{node.title}</div>
        ) : null}

        {node.text ? (
          <div className={styles.childTextOnly}>{node.text}</div>
        ) : null}

        {node.children.length > 0 ? (
          <NestedNodeList nodes={node.children} />
        ) : null}
      </div>
    </div>
  );
}
