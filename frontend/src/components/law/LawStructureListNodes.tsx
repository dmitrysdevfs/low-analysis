"use client";

import { getNodeContent, getNodeLabel, type TreeBranch } from "@/lib/lawTree";

function NestedNode({ node }: { node: TreeBranch }) {
  const content = getNodeContent(node);

  return (
    <div className="law-structure-node">
      <div className="law-structure-node-label">{getNodeLabel(node)}</div>
      {content ? (
        <div className="law-structure-node-text">{content}</div>
      ) : null}
      {node.children.length > 0 ? (
        <div className="law-structure-node-children">
          <NestedNodeList nodes={node.children} />
        </div>
      ) : null}
    </div>
  );
}

export function NestedNodeList({ nodes }: { nodes: TreeBranch[] }) {
  return (
    <div className="law-structure-nested-list">
      {nodes.map((node) => (
        <NestedNode key={node.key} node={node} />
      ))}
    </div>
  );
}
