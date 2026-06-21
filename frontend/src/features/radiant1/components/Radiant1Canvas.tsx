"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Radiant1GraphData, Radiant1GraphLink, Radiant1GraphNode } from "../types";

interface ForceGraphHandle {
  width(value: number): ForceGraphHandle;
  height(value: number): ForceGraphHandle;
  graphData(data: { nodes: Radiant1GraphNode[]; links: Radiant1GraphLink[] }): ForceGraphHandle;
  backgroundColor(value: string): ForceGraphHandle;
  nodeRelSize(value: number): ForceGraphHandle;
  cooldownTicks(value: number): ForceGraphHandle;
  autoPauseRedraw(value: boolean): ForceGraphHandle;
  enableNodeDrag(value: boolean): ForceGraphHandle;
  linkCurvature(value: (link: Radiant1GraphLink) => number): ForceGraphHandle;
  linkWidth(value: (link: Radiant1GraphLink) => number): ForceGraphHandle;
  linkColor(value: (link: Radiant1GraphLink) => string): ForceGraphHandle;
  linkLineDash(value: (link: Radiant1GraphLink) => number[] | undefined): ForceGraphHandle;
  linkDirectionalArrowLength(value: (link: Radiant1GraphLink) => number): ForceGraphHandle;
  linkDirectionalArrowRelPos(value: number): ForceGraphHandle;
  linkDirectionalParticles(value: (link: Radiant1GraphLink) => number): ForceGraphHandle;
  linkDirectionalParticleWidth(value: (link: Radiant1GraphLink) => number): ForceGraphHandle;
  linkDirectionalParticleColor(value: (link: Radiant1GraphLink) => string): ForceGraphHandle;
  linkDirectionalParticleSpeed(value: (link: Radiant1GraphLink) => number): ForceGraphHandle;
  nodeCanvasObjectMode(value: "replace" | ((node: Radiant1GraphNode) => "replace")): ForceGraphHandle;
  nodeCanvasObject(
    value: (
      node: Radiant1GraphNode,
      ctx: CanvasRenderingContext2D,
      globalScale: number,
    ) => void,
  ): ForceGraphHandle;
  nodePointerAreaPaint(
    value: (
      node: Radiant1GraphNode,
      color: string,
      ctx: CanvasRenderingContext2D,
      globalScale: number,
    ) => void,
  ): ForceGraphHandle;
  onNodeClick(
    value: (node: Radiant1GraphNode, event: MouseEvent) => void,
  ): ForceGraphHandle;
  onLinkClick(
    value: (link: Radiant1GraphLink, event: MouseEvent) => void,
  ): ForceGraphHandle;
  onLinkHover(
    value: (link: Radiant1GraphLink | null, previousLink: Radiant1GraphLink | null) => void,
  ): ForceGraphHandle;
  onBackgroundClick(value: (event: MouseEvent) => void): ForceGraphHandle;
  centerAt(x?: number, y?: number, durationMs?: number): ForceGraphHandle;
  zoom(scale?: number, durationMs?: number): ForceGraphHandle;
  zoomToFit(
    durationMs?: number,
    padding?: number,
    nodeFilter?: (node: Radiant1GraphNode) => boolean,
  ): ForceGraphHandle;
  d3Force(forceName: string): {
    strength?: (value: number | ((link: Radiant1GraphLink) => number)) => void;
    distance?: (value: number | ((link: Radiant1GraphLink) => number)) => void;
  } | null;
  d3ReheatSimulation(): ForceGraphHandle;
  _destructor?: () => void;
}

interface Radiant1CanvasProps {
  graph: Radiant1GraphData;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  hoveredEdgeId: string | null;
  onNodeSelect: (nodeId: string) => void;
  onEdgeSelect: (edgeId: string) => void;
  onEdgeHover: (edgeId: string | null) => void;
  onBackgroundClick: () => void;
  onResetReady: (fn: () => void) => void;
}

function toRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const normalized =
    clean.length === 3
      ? clean
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : clean;
  const value = Number.parseInt(normalized, 16);
  if (!Number.isFinite(value)) return `rgba(255, 255, 255, ${alpha})`;
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function resolveNodeId(nodeOrId: string | Radiant1GraphNode) {
  return typeof nodeOrId === "string" ? nodeOrId : nodeOrId.id;
}

export function Radiant1Canvas({
  graph,
  selectedNodeId,
  selectedEdgeId,
  hoveredEdgeId,
  onNodeSelect,
  onEdgeSelect,
  onEdgeHover,
  onBackgroundClick,
  onResetReady,
}: Radiant1CanvasProps) {
  const graphRef = useRef<ForceGraphHandle | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const graphData = useMemo(
    () => ({
      nodes: graph.nodes.map((node) => ({ ...node })),
      links: graph.links.map((link) => ({ ...link })),
    }),
    [graph],
  );

  const selectedNodeIdRef = useRef<string | null>(selectedNodeId);
  const edgeAccentIdRef = useRef<string | null>(selectedEdgeId ?? hoveredEdgeId);
  const onNodeSelectRef = useRef(onNodeSelect);
  const onEdgeSelectRef = useRef(onEdgeSelect);
  const onEdgeHoverRef = useRef(onEdgeHover);
  const onBackgroundClickRef = useRef(onBackgroundClick);
  const graphDataRef = useRef(graphData);

  useEffect(() => {
    selectedNodeIdRef.current = selectedNodeId;
  }, [selectedNodeId]);

  useEffect(() => {
    edgeAccentIdRef.current = selectedEdgeId ?? hoveredEdgeId;
  }, [hoveredEdgeId, selectedEdgeId]);

  useEffect(() => {
    onNodeSelectRef.current = onNodeSelect;
  }, [onNodeSelect]);

  useEffect(() => {
    onEdgeSelectRef.current = onEdgeSelect;
  }, [onEdgeSelect]);

  useEffect(() => {
    onEdgeHoverRef.current = onEdgeHover;
  }, [onEdgeHover]);

  useEffect(() => {
    onBackgroundClickRef.current = onBackgroundClick;
  }, [onBackgroundClick]);

  useEffect(() => {
    graphDataRef.current = graphData;
  }, [graphData]);

  const handleResetView = useCallback(() => {
    graphRef.current?.zoomToFit(600, 80, (node) => node.kind === "law");
    graphRef.current?.zoom(1.1, 600);
  }, []);

  useEffect(() => {
    onResetReady(handleResetView);
  }, [handleResetView, onResetReady]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    const update = () => {
      const rect = element.getBoundingClientRect();
      setDimensions({
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener("resize", update);
    const frameId = window.requestAnimationFrame(update);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const nodeCanvasObject = useCallback(
    (
      node: Radiant1GraphNode,
      ctx: CanvasRenderingContext2D,
      globalScale: number,
    ) => {
      const selected = node.id === selectedNodeIdRef.current;
      const baseRadius = node.size;
      const lawNode = node.kind === "law";
      const radius = lawNode ? baseRadius : baseRadius * 0.88;

      ctx.save();
      ctx.shadowColor = lawNode ? node.glow : toRgba(node.color, 0.32);
      ctx.shadowBlur = selected ? 28 : lawNode ? 18 : 10;

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + (lawNode ? 1.6 : 0), 0, Math.PI * 2);
      ctx.fillStyle = lawNode
        ? toRgba(node.color, selected ? 0.28 : 0.18)
        : toRgba(node.color, selected ? 0.95 : 0.82);
      ctx.fill();

      if (lawNode) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius - 3, 0, Math.PI * 2);
        ctx.fillStyle = selected ? "#132347" : "#0d1528";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.lineWidth = selected ? 2.6 : 1.6;
        ctx.strokeStyle = selected ? "#f8d47d" : toRgba(node.color, 0.8);
        ctx.stroke();

        ctx.font = `${Math.max(10, 10 / globalScale)}px var(--font-mono)`;
        ctx.fillStyle = selected ? "#f6c765" : "#dfe7f6";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.lawCode.slice(0, 6).toUpperCase(), node.x, node.y);
      }

      const showLabel =
        selected ||
        node.isPrimary ||
        (lawNode && globalScale >= 1.5) ||
        (!lawNode && globalScale >= 3.6);

      if (showLabel) {
        const fontSize = lawNode
          ? Math.max(10, 11 / globalScale)
          : Math.max(8, 9 / globalScale);
        ctx.font = `${fontSize}px var(--font-body)`;
        const text = lawNode ? node.shortLabel : node.label;
        const textWidth = ctx.measureText(text).width;
        const boxWidth = textWidth + 18;
        const boxHeight = lawNode ? 22 : 18;
        const boxY = node.y + radius + 12;

        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = "rgba(8, 15, 32, 0.9)";
        ctx.strokeStyle = toRgba(node.color, 0.28);
        ctx.lineWidth = 1;
        ctx.roundRect(node.x - boxWidth / 2, boxY, boxWidth, boxHeight, 999);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = selected ? "#ffffff" : "#d4ddf1";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, node.x, boxY + boxHeight / 2 + 0.5);
        ctx.restore();
      }

      ctx.restore();
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const element = containerRef.current;
      if (!element) return;

      const mod = await import("force-graph");
      if (cancelled || !containerRef.current) return;

      const ForceGraph2D = mod.default as unknown as new (
        element: HTMLElement,
      ) => ForceGraphHandle;

      const instance = new ForceGraph2D(containerRef.current)
        .backgroundColor("#07111f")
        .nodeRelSize(5)
        .cooldownTicks(0)
        .autoPauseRedraw(false)
        .enableNodeDrag(false)
        .nodeCanvasObjectMode("replace")
        .linkCurvature((link) => {
          if (resolveNodeId(link.source) === resolveNodeId(link.target)) return 0.55;
          if (link.kind === "article-ref") return 0.22;
          if (link.kind === "law-ref") return 0.12;
          return 0;
        })
        .linkWidth((link) => {
          const edgeAccentId = edgeAccentIdRef.current;
          if (link.id === edgeAccentId) return 3;
          if (link.isPath) return 2.4;
          if (link.kind === "law-ref") return 1 + Math.min(link.weight, 3) * 0.5;
          if (link.kind === "article-ref") return 1.1;
          return 0.55;
        })
        .linkColor((link) => {
          const edgeAccentId = edgeAccentIdRef.current;
          if (link.id === edgeAccentId) return "#f6c765";
          if (link.isPath) return "#f0dd9a";
          return link.color;
        })
        .linkLineDash((link) =>
          link.kind === "article-ref" ? [5, 3] : undefined,
        )
        .linkDirectionalArrowLength((link) =>
          link.kind === "satellite" ? 0 : link.kind === "article-ref" ? 5 : 7,
        )
        .linkDirectionalArrowRelPos(0.94)
        .linkDirectionalParticles((link) =>
          link.kind === "satellite" ? 0 : link.isPath ? 3 : 1,
        )
        .linkDirectionalParticleWidth((link) =>
          link.kind === "law-ref" ? 2.1 : 1.5,
        )
        .linkDirectionalParticleColor((link) => {
          const edgeAccentId = edgeAccentIdRef.current;
          return link.id === edgeAccentId ? "#f6c765" : link.particleColor;
        })
        .linkDirectionalParticleSpeed((link) =>
          link.isPath ? 0.012 : link.kind === "article-ref" ? 0.006 : 0.004,
        )
        .nodeCanvasObject(nodeCanvasObject)
        .nodePointerAreaPaint((node, color, ctx) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(
            node.x,
            node.y,
            node.kind === "law" ? node.size + 8 : node.size + 5,
            0,
            Math.PI * 2,
            false,
          );
          ctx.fill();
        })
        .onNodeClick((node) => {
          onNodeSelectRef.current(node.id);
        })
        .onLinkClick((link) => {
          onEdgeSelectRef.current(link.id);
        })
        .onLinkHover((link) => {
          onEdgeHoverRef.current(link?.id ?? null);
        })
        .onBackgroundClick(() => {
          onBackgroundClickRef.current();
        });

      graphRef.current = instance;

      const rect = containerRef.current.getBoundingClientRect();
      instance
        .width(Math.max(1, Math.round(rect.width)))
        .height(Math.max(1, Math.round(rect.height)))
        .graphData(graphDataRef.current);

      const charge = instance.d3Force("charge");
      charge?.strength?.(-58);

      const link = instance.d3Force("link");
      link?.distance?.((edge: Radiant1GraphLink) => {
        if (edge.kind === "satellite") return 22;
        if (edge.kind === "article-ref") return 96;
        return 138;
      });
      link?.strength?.((edge: Radiant1GraphLink) => {
        if (edge.kind === "satellite") return 0.95;
        if (edge.kind === "article-ref") return 0.36;
        return 0.18;
      });

      instance.d3ReheatSimulation();
      handleResetView();
    }

    init();

    return () => {
      cancelled = true;
      graphRef.current?._destructor?.();
      graphRef.current = null;
    };
  }, [handleResetView, nodeCanvasObject]);

  useEffect(() => {
    if (!graphRef.current || dimensions.width <= 0 || dimensions.height <= 0) {
      return;
    }

    graphRef.current.width(dimensions.width).height(dimensions.height);
  }, [dimensions.height, dimensions.width]);

  useEffect(() => {
    if (!graphRef.current) return;

    graphRef.current.graphData(graphData);

    const charge = graphRef.current.d3Force("charge");
    charge?.strength?.(-58);

    const link = graphRef.current.d3Force("link");
    link?.distance?.((edge: Radiant1GraphLink) => {
      if (edge.kind === "satellite") return 22;
      if (edge.kind === "article-ref") return 96;
      return 138;
    });
    link?.strength?.((edge: Radiant1GraphLink) => {
      if (edge.kind === "satellite") return 0.95;
      if (edge.kind === "article-ref") return 0.36;
      return 0.18;
    });

    graphRef.current.d3ReheatSimulation();
  }, [graphData]);

  useEffect(() => {
    if (!graphRef.current || !selectedNodeId) return;

    const node = graph.nodes.find((item) => item.id === selectedNodeId);
    if (!node) return;

    graphRef.current.centerAt(node.x, node.y, 500);
    graphRef.current.zoom(node.kind === "law" ? 2.1 : 2.8, 500);
  }, [graph.nodes, selectedNodeId]);

  useEffect(() => {
    if (!graphRef.current) return;
    graphRef.current.d3ReheatSimulation();
  }, [hoveredEdgeId, selectedEdgeId, selectedNodeId]);

  return <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />;
}
