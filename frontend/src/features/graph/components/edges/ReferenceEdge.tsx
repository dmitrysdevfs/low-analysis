"use client";

import { BaseEdge, EdgeProps, getBezierPath } from "@xyflow/react";

const CONNECTION_COLORS: Record<string, string> = {
  subject: "#c8a843",
  direct: "#4a80d4",
  thematic: "#52b788",
};

interface ReferenceEdgeData {
  connectionType: "subject" | "direct" | "thematic";
  label?: string;
}

export function ReferenceEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const edgeData = data as ReferenceEdgeData | undefined;
  const connectionType = edgeData?.connectionType ?? "thematic";
  const color = CONNECTION_COLORS[connectionType] ?? "#9eb5d9";

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        stroke: color,
        strokeOpacity: selected ? 1 : 0.6,
        strokeWidth: selected ? 2 : 1.5,
        transition: "stroke-opacity 0.2s ease, stroke-width 0.2s ease",
      }}
    />
  );
}
