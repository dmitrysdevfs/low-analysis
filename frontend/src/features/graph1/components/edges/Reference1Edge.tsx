"use client";

import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";

import type { Graph1Edge, Graph1EdgeData, LawReferenceType } from "../../types/graph1.types";

const EDGE_TYPE_COLORS: Record<LawReferenceType, string> = {
  direct: "#4a80d4",
  blanket: "#f4a261",
  reflexive: "#52b788",
  subject: "#c8a843",
};

function Reference1EdgeInner({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps<Graph1Edge>) {
  const edgeData = data as Graph1EdgeData | undefined;

  const refType: LawReferenceType = edgeData?.refType ?? "direct";
  const confidence = edgeData?.confidence ?? 1;
  const isPath = edgeData?.isPath ?? false;
  const isHighlighted = edgeData?.isHighlighted ?? false;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const baseColor = EDGE_TYPE_COLORS[refType];
  const strokeColor = isHighlighted ? "#c8a843" : baseColor;
  const strokeWidth = isPath ? 3 : 1.5;
  const strokeOpacity = selected ? 1 : 0.65;
  const strokeDasharray = isHighlighted ? "6 3" : undefined;

  const showBadge = confidence < 0.9;
  const isLowConfidence = confidence < 0.8;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: strokeColor,
          strokeWidth,
          strokeOpacity,
          strokeDasharray,
        }}
      />
      {showBadge && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "none",
              fontSize: "0.6rem",
              fontFamily: "monospace",
              background: "rgba(9,19,40,0.9)",
              border: `1px solid ${isLowConfidence ? "#e05252" : "#52b788"}`,
              color: isLowConfidence ? "#e05252" : "#52b788",
              borderRadius: "4px",
              padding: "1px 4px",
              lineHeight: 1.4,
              whiteSpace: "nowrap",
            }}
          >
            {isLowConfidence ? "⚠ low" : "✓ high"}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const Reference1Edge = memo(Reference1EdgeInner);
