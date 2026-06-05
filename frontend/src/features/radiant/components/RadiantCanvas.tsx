"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type React from "react";
import type { RadiantGraph, RadiantNode } from "../types/radiant.types";
import { FORCE_CONFIG } from "../lib/forceConfig";

interface ForceGraphMethods {
  cameraPosition(
    pos: { x: number; y: number; z: number },
    lookAt: { x: number; y: number; z: number },
    durationMs: number,
  ): void;
}

interface RadiantCanvasProps {
  graph: RadiantGraph;
  highlightedIds: Set<string>;
  selectedNodeId: string | null;
  onNodeClick: (node: RadiantNode) => void;
  onResetCamera: (resetFn: () => void) => void;
}

export function RadiantCanvas({
  graph,
  highlightedIds,
  selectedNodeId,
  onNodeClick,
  onResetCamera,
}: RadiantCanvasProps) {
  const graphRef = useRef<ForceGraphMethods | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [FG, setFG] = useState<React.ElementType | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Dynamically import ForceGraph3D on client only
  useEffect(() => {
    let cancelled = false;
    import("react-force-graph-3d").then((mod) => {
      if (!cancelled) {
        setFG(() => mod.default);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Track container dimensions
  useEffect(() => {
    const update = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  // Expose camera reset function to parent
  useEffect(() => {
    onResetCamera(() => {
      graphRef.current?.cameraPosition(
        { x: 0, y: 0, z: 500 },
        { x: 0, y: 0, z: 0 },
        1000,
      );
    });
  }, [onResetCamera]);

  const nodeColor = useCallback(
    (node: RadiantNode) => {
      if (highlightedIds.size === 0) return node.color;
      if (node.id === selectedNodeId) return "#ffffff";
      return highlightedIds.has(node.id) ? node.color : "rgba(80,80,80,0.4)";
    },
    [highlightedIds, selectedNodeId],
  );

  const nodeVal = useCallback((node: RadiantNode) => node.size, []);

  if (!FG || dimensions.width === 0) return null;

  const ForceGraph3D = FG;

  return (
    <div ref={containerRef} style={{ position: "absolute", inset: 0 }}>
      <ForceGraph3D
        ref={graphRef}
        graphData={{ nodes: [...graph.nodes], links: [...graph.links] }}
        nodeLabel="name"
        nodeColor={nodeColor}
        nodeVal={nodeVal}
        nodeOpacity={0.92}
        nodeResolution={16}
        linkColor={() => "rgba(200,168,67,0.55)"}
        linkWidth={1}
        linkOpacity={0.7}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.004}
        linkDirectionalParticleWidth={2}
        linkDirectionalParticleColor={() => "#c8a843"}
        backgroundColor="#060d1c"
        onNodeClick={(node: RadiantNode) => onNodeClick(node)}
        d3AlphaDecay={FORCE_CONFIG.alphaDecay}
        d3VelocityDecay={FORCE_CONFIG.velocityDecay}
        width={dimensions.width}
        height={dimensions.height}
      />
    </div>
  );
}
