"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  type NodeMouseHandler,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useRouter } from "next/navigation";
import { Network, ArrowLeft } from "lucide-react";

import { ROUTES } from "@/constants/routes";
import { useGraphData } from "../hooks/useGraphData";
import { LawNode } from "./nodes/LawNode";
import { ReferenceEdge } from "./edges/ReferenceEdge";
import { GraphControlPanel } from "./GraphControlPanel";
import { GraphInfoPanel } from "./GraphInfoPanel";
import { GraphListFallback } from "./fallback/GraphListFallback";
import type { GraphNode } from "../types/graph.types";
import styles from "./GraphPage.module.scss";
import { useState } from "react";

export function GraphPage() {
  const router = useRouter();
  const [showFallback, setShowFallback] = useState(false);

  const {
    graphData,
    laws,
    isLoading,
    error,
    selectedNode,
    setSelectedNode,
    searchQuery,
    setSearchQuery,
    filteredNodes,
  } = useGraphData();

  const nodeTypes = useMemo<NodeTypes>(
    () => ({ lawNode: LawNode as never }),
    [],
  );
  const edgeTypes = useMemo<EdgeTypes>(
    () => ({ referenceEdge: ReferenceEdge as never }),
    [],
  );

  const visibleNodes = useMemo(() => {
    if (!graphData) return [];
    if (!searchQuery.trim()) return graphData.nodes;
    const filteredIds = new Set(filteredNodes.map((n) => n.id));
    return graphData.nodes.map((n) => ({
      ...n,
      style: filteredIds.has(n.id) ? undefined : { opacity: 0.2 },
    }));
  }, [graphData, filteredNodes, searchQuery]);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      setSelectedNode(node as unknown as GraphNode);
    },
    [setSelectedNode],
  );

  const handleNavigate = useCallback(
    (lawId: string) => {
      router.push(ROUTES.law(lawId));
    },
    [router],
  );

  const handleResetView = useCallback(() => {
    // ReactFlow fitView is triggered via ref in production; here we just deselect
    setSelectedNode(null);
  }, [setSelectedNode]);

  if (isLoading) {
    return <div className={styles.loading}>Завантаження графу...</div>;
  }

  if (error) {
    return (
      <div className={styles.loading} style={{ color: "#e05252" }}>
        Помилка завантаження: {error}
      </div>
    );
  }

  const totalNodes = graphData?.nodes.length ?? 0;
  const totalEdges = graphData?.edges.length ?? 0;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => router.back()}
        >
          <ArrowLeft size={14} />
          Назад
        </button>
        <Network size={16} style={{ color: "#c8a843" }} />
        <span className={styles.headerTitle}>
          Граф зв&apos;язків між нормами законів
        </span>
        <span className={styles.headerBeta}>Beta</span>
      </div>

      <div className={styles.body}>
        <GraphControlPanel
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalNodes={totalNodes}
          totalEdges={totalEdges}
          onResetView={handleResetView}
          showFallback={showFallback}
          onToggleFallback={() => setShowFallback((v) => !v)}
        />

        {showFallback ? (
          <div className={styles.canvas} style={{ overflowY: "auto" }}>
            <GraphListFallback laws={laws} />
          </div>
        ) : (
          <div className={styles.canvas}>
            <ReactFlow
              nodes={visibleNodes}
              edges={graphData?.edges ?? []}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodeClick={handleNodeClick}
              fitView
              defaultEdgeOptions={{ animated: false }}
            >
              <Background
                variant={BackgroundVariant.Dots}
                color="rgba(200,168,67,0.08)"
                gap={24}
              />
              <Controls
                style={{
                  background: "rgba(13,28,58,0.9)",
                  border: "1px solid rgba(200,168,67,0.2)",
                  borderRadius: 8,
                }}
              />
              <MiniMap
                style={{
                  background: "rgba(8,15,32,0.9)",
                  border: "1px solid rgba(200,168,67,0.15)",
                }}
                nodeColor="rgba(200,168,67,0.4)"
                maskColor="rgba(6,13,28,0.6)"
              />
            </ReactFlow>
          </div>
        )}

        <GraphInfoPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onNavigate={handleNavigate}
        />
      </div>
    </div>
  );
}
