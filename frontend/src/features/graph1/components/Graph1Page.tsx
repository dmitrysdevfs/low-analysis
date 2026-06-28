"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useReactFlow,
  type NodeMouseHandler,
  type EdgeMouseHandler,
  type NodeTypes,
  type EdgeTypes,
  type OnConnect,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useRouter } from "next/navigation";
import { Network, GitFork, List, ArrowLeft, Save } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import { ROUTES } from "@/constants/routes";
import { useGraph1Data } from "../hooks/useGraph1Data";
import { useGraph1Forks } from "../hooks/useGraph1Forks";
import { Law1Node } from "./nodes/Law1Node";
import { Reference1Edge } from "./edges/Reference1Edge";
import { Graph1ControlPanel } from "./Graph1ControlPanel";
import { Graph1InfoPanel } from "./Graph1InfoPanel";
import { EdgeInfoPanel } from "./EdgeInfoPanel";
import { ForkSavePanel } from "./ForkSavePanel";
import { GraphListFallback } from "./fallback/GraphListFallback";
import type { Graph1Node, Graph1Edge } from "../types/graph1.types";
import styles from "./Graph1Page.module.scss";

// --- Node/Edge type maps (stable references) ---
const NODE_TYPES: NodeTypes = { law1Node: Law1Node as never };
const EDGE_TYPES: EdgeTypes = { reference1Edge: Reference1Edge as never };

// --- Inner canvas component that uses useReactFlow ---
function FlowCanvas({
  visibleNodes,
  visibleEdges,
  onNodeClick,
  onEdgeClick,
  onNodeDragStop,
  onPaneClick,
  onConnect,
}: {
  visibleNodes: Graph1Node[];
  visibleEdges: Graph1Edge[];
  onNodeClick: NodeMouseHandler;
  onEdgeClick: EdgeMouseHandler;
  onNodeDragStop: (event: React.MouseEvent, node: Graph1Node) => void;
  onPaneClick: () => void;
  onConnect: OnConnect;
}) {
  const { fitView } = useReactFlow();

  const handlePaneClick = useCallback(() => {
    onPaneClick();
  }, [onPaneClick]);

  return (
    <ReactFlow
      nodes={visibleNodes}
      edges={visibleEdges}
      nodeTypes={NODE_TYPES}
      edgeTypes={EDGE_TYPES}
      onNodeClick={onNodeClick}
      onEdgeClick={onEdgeClick}
      onNodeDragStop={onNodeDragStop as never}
      onPaneClick={handlePaneClick}
      onConnect={onConnect}
      fitView
      defaultEdgeOptions={{ animated: false }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        color="rgba(200,168,67,0.07)"
        gap={24}
      />
      <Controls
        style={{
          background: "rgba(13,28,58,0.9)",
          border: "1px solid rgba(200,168,67,0.2)",
          borderRadius: 8,
        }}
        onFitView={() => fitView({ padding: 0.08 })}
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
  );
}

// --- Main page component ---
export function Graph1Page({
  initialForkId = null,
}: {
  initialForkId?: string | null;
}) {
  const router = useRouter();
  const { isLegislator, isSupervisor, isAdmin } = useAuth();
  const canUseForks = isLegislator || isSupervisor || isAdmin;

  const [showForkPanel, setShowForkPanel] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [autoLoadDone, setAutoLoadDone] = useState(false);

  const graph = useGraph1Data();
  const forks = useGraph1Forks();

  const {
    visibleNodes,
    visibleEdges,
    isLoading,
    error,
    selectedNode,
    setSelectedNode,
    selectedEdge,
    setSelectedEdge,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    mode,
    depth,
    setDepth,
    focusLawId,
    focusOnLaw,
    resetToGlobal,
    pathFinder,
    setPathFinder,
    findPath,
    clearPath,
    saveNodePosition,
    toggleNodeHighlight,
    toggleEdgeHighlight,
    setNote,
    buildForkSnapshot,
    restoreFromFork,
    userEdges,
    addUserEdge,
    visibleLawIds,
    toggleLawVisibility,
    showAllLaws,
    subjectData,
    selectedSubjectIds,
    toggleSubject,
    clearSubjects,
    subjectSearch,
    setSubjectSearch,
    subjectEdges,
    totalNodes,
    totalEdges,
    graphData,
  } = graph;

  // Auto-load fork from URL param
  useEffect(() => {
    if (autoLoadDone || !initialForkId || forks.isLoading) return;
    const target = forks.forks.find((f) => f._id === initialForkId);
    if (target) {
      restoreFromFork(target);
      setAutoLoadDone(true);
    }
  }, [
    initialForkId,
    forks.forks,
    forks.isLoading,
    restoreFromFork,
    autoLoadDone,
  ]);

  const allLaws = useMemo(
    () =>
      graphData?.nodes.map((n) => ({
        id: n.id,
        label: n.data.label,
        code: n.data.code,
      })) ?? [],
    [graphData],
  );

  const allVisibleEdges = useMemo(
    () => [...visibleEdges, ...userEdges, ...subjectEdges],
    [visibleEdges, userEdges, subjectEdges],
  );

  // --- Handlers ---
  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      setSelectedNode(node as Graph1Node);
      setSelectedEdge(null);
    },
    [setSelectedNode, setSelectedEdge],
  );

  const handleEdgeClick: EdgeMouseHandler = useCallback(
    (_event, edge) => {
      setSelectedEdge(edge as Graph1Edge);
      setSelectedNode(null);
    },
    [setSelectedEdge, setSelectedNode],
  );

  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Graph1Node) => {
      saveNodePosition(node.id, { x: node.position.x, y: node.position.y });
    },
    [saveNodePosition],
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, [setSelectedNode, setSelectedEdge]);

  const handleFocusInPanel = useCallback(
    (nodeId: string) => {
      focusOnLaw(nodeId);
    },
    [focusOnLaw],
  );

  // --- Fork actions ---
  const handleForkSave = useCallback(
    (name: string, description: string, isPublic: boolean) => {
      const snapshot = buildForkSnapshot();
      forks.create({
        name,
        description,
        viewState: snapshot.viewState,
        filters: snapshot.filters,
        pathState: snapshot.pathState,
        isPublic,
      });
    },
    [buildForkSnapshot, forks],
  );

  const handleQuickSave = useCallback(() => {
    if (!canUseForks) return;
    const name = `Форк ${new Date().toLocaleDateString("uk-UA")}`;
    handleForkSave(name, "", false);
  }, [canUseForks, handleForkSave]);

  const handleForkLoad = useCallback(
    (fork: Parameters<typeof restoreFromFork>[0]) => {
      restoreFromFork(fork);
      setShowForkPanel(false);
    },
    [restoreFromFork],
  );

  const handleForkDelete = useCallback(
    (id: string) => {
      forks.remove(id);
    },
    [forks],
  );

  // --- Loading / error states ---
  if (isLoading) {
    return <div className={styles.loading}>Завантаження графу...</div>;
  }

  if (error) {
    return <div className={styles.error}>Помилка завантаження: {error}</div>;
  }

  return (
    <div className={styles.page}>
      {/* Topbar */}
      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => router.back()}
          >
            <ArrowLeft size={13} />
            Назад
          </button>
          <Network size={15} className={styles.topbarIcon} />
          <span className={styles.topbarTitle}>
            Граф зв&apos;язків між нормами (v2)
          </span>
          <span className={styles.betaBadge}>Beta</span>
        </div>

        <div className={styles.topbarRight}>
          <button
            type="button"
            className={styles.topbarBtn}
            onClick={handleQuickSave}
            disabled={!canUseForks}
            title={
              canUseForks
                ? "Зберегти поточний стан як форк"
                : "Тільки для законотворця / супервізера"
            }
          >
            <Save size={13} />
            Зберегти
          </button>

          <button
            type="button"
            className={`${styles.topbarBtn} ${showForkPanel ? styles.topbarBtnActive : ""}`}
            onClick={() => setShowForkPanel((v) => !v)}
          >
            <GitFork size={13} />
            Мої форки
          </button>

          <button
            type="button"
            className={`${styles.topbarBtn} ${showFallback ? styles.topbarBtnActive : ""}`}
            onClick={() => setShowFallback((v) => !v)}
          >
            <List size={13} />
            Текстовий режим
          </button>
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        {/* Left control panel */}
        <Graph1ControlPanel
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onFiltersChange={setFilters}
          mode={mode}
          depth={depth}
          onDepthChange={setDepth}
          focusLawLabel={
            focusLawId
              ? (graphData?.nodes.find((n) => n.id === focusLawId)?.data
                  .label ?? focusLawId)
              : undefined
          }
          onResetToGlobal={resetToGlobal}
          pathFinder={pathFinder}
          onPathFinderChange={(p) =>
            setPathFinder((prev) => ({ ...prev, ...p }))
          }
          onFindPath={findPath}
          onClearPath={clearPath}
          allLaws={allLaws}
          visibleLawIds={visibleLawIds}
          onToggleLawVisibility={toggleLawVisibility}
          onShowAllLaws={showAllLaws}
          totalNodes={totalNodes}
          totalEdges={totalEdges}
          showFallback={showFallback}
          onToggleFallback={() => setShowFallback((v) => !v)}
          onResetView={() => {
            setSelectedNode(null);
            setSelectedEdge(null);
          }}
          subjectData={subjectData}
          selectedSubjectIds={selectedSubjectIds}
          onToggleSubject={toggleSubject}
          onClearSubjects={clearSubjects}
          subjectSearch={subjectSearch}
          onSubjectSearchChange={setSubjectSearch}
        />

        {/* Canvas */}
        {showFallback ? (
          <div className={styles.canvas} style={{ overflowY: "auto" }}>
            <GraphListFallback
              laws={
                graphData?.nodes.map((n) => ({
                  _id: n.id,
                  title: n.data.label,
                  code: n.data.code,
                  documentType: [n.data.lawType],
                  totalArticles: n.data.totalArticles,
                  totalSections: 0,
                  createdAt: "",
                  adoptedDate: n.data.adoptedYear
                    ? new Date(n.data.adoptedYear, 0, 1).toISOString()
                    : null,
                })) ?? []
              }
            />
          </div>
        ) : (
          <div className={styles.canvas}>
            <ReactFlowProvider>
              <FlowCanvas
                visibleNodes={visibleNodes}
                visibleEdges={allVisibleEdges}
                onNodeClick={handleNodeClick}
                onEdgeClick={handleEdgeClick}
                onNodeDragStop={handleNodeDragStop}
                onPaneClick={handlePaneClick}
                onConnect={addUserEdge}
              />
            </ReactFlowProvider>
          </div>
        )}

        {/* Right panels */}
        <div className={styles.rightPanels}>
          {selectedNode && (
            <Graph1InfoPanel
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
              onNavigate={(lawId) => router.push(ROUTES.law(lawId))}
              onFocusOnLaw={handleFocusInPanel}
              onToggleHighlight={toggleNodeHighlight}
              onSetNote={setNote}
              isHighlighted={!!selectedNode.data.isHighlighted}
            />
          )}
          {selectedEdge && !selectedNode && (
            <EdgeInfoPanel
              edge={selectedEdge}
              sourceNode={
                graphData?.nodes.find((n) => n.id === selectedEdge.source) ??
                null
              }
              targetNode={
                graphData?.nodes.find((n) => n.id === selectedEdge.target) ??
                null
              }
              onClose={() => setSelectedEdge(null)}
              onToggleHighlight={toggleEdgeHighlight}
              isHighlighted={!!selectedEdge.data?.isHighlighted}
            />
          )}
          {showForkPanel && (
            <ForkSavePanel
              forks={forks.forks}
              isLoading={forks.isLoading}
              isCreating={forks.isCreating}
              isDeleting={forks.isDeleting}
              onSave={handleForkSave}
              onLoad={handleForkLoad}
              onDelete={handleForkDelete}
              canUseForks={canUseForks}
            />
          )}
        </div>
      </div>
    </div>
  );
}
