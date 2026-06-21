"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { addEdge, type Connection } from "@xyflow/react";
import {
  fetchGlobalGraph,
  fetchLawGraph,
  fetchGraphPath,
  fetchGraphSubjects,
} from "@/lib/api/graph1";
import type {
  Graph1Data,
  Graph1Edge,
  Graph1Filters,
  Graph1Mode,
  Graph1Node,
  PathFinderState,
  LawReferenceType,
  ApiGraphNode,
  ApiGraphEdge,
  GraphFork,
  GraphSubject,
} from "../types/graph1.types";

// --- Colors per edge type ---
export const EDGE_TYPE_COLORS: Record<string, string> = {
  direct: "#4a80d4",
  blanket: "#f4a261",
  reflexive: "#52b788",
  subject: "#c8a843",
};

// --- Color per law type ---
const LAW_TYPE_COLOR_MAP: Record<string, string> = {
  кодекс: "#c8a843",
  кримінальний: "#e05252",
  цивільний: "#4a80d4",
  адміністративний: "#7a98c0",
  трудовий: "#52b788",
  господарський: "#f4a261",
};

export function getLawTypeColor(lawType: string): string {
  const lower = lawType.toLowerCase();
  for (const [key, color] of Object.entries(LAW_TYPE_COLOR_MAP)) {
    if (lower.includes(key)) return color;
  }
  return "#9eb5d9";
}

// --- Transform API response → ReactFlow nodes/edges ---
function transformToGraph1(
  apiNodes: ApiGraphNode[],
  apiEdges: ApiGraphEdge[],
  adoptedYears: Map<string, number>,
): Graph1Data {
  const COLS = Math.ceil(Math.sqrt(apiNodes.length));

  const nodes: Graph1Node[] = apiNodes.map((n, index) => ({
    id: n.id,
    type: "law1Node" as const,
    position: {
      x: (index % COLS) * 280,
      y: Math.floor(index / COLS) * 220,
    },
    data: {
      id: n.id,
      label: n.label,
      code: n.code,
      lawType: n.type ?? "law",
      totalArticles: n.totalArticles ?? 0,
      adoptedYear: adoptedYears.get(n.id),
      subjectIds: n.subjectIds ?? [],
    },
  }));

  const edges: Graph1Edge[] = apiEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: "reference1Edge" as const,
    data: {
      refType: (e.type as LawReferenceType) ?? "direct",
      confidence: e.confidence ?? 0.7,
      weight: e.weight,
      fromArticle: e.fromArticle ?? null,
      toArticle: e.toArticle ?? null,
      rawText: e.rawText ?? null,
    },
  }));

  return { nodes, edges };
}

// --- Main hook ---
export function useGraph1Data() {
  const [mode, setMode] = useState<Graph1Mode>("global");
  const [focusLawId, setFocusLawId] = useState<string | null>(null);
  const [depth, setDepth] = useState<1 | 2 | 3>(1);
  const [selectedNode, setSelectedNode] = useState<Graph1Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Graph1Edge | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [nodePositions, setNodePositions] = useState<
    Map<string, { x: number; y: number }>
  >(new Map());
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<Set<string>>(
    new Set(),
  );
  const [highlightedEdgeIds, setHighlightedEdgeIds] = useState<Set<string>>(
    new Set(),
  );
  const [notes, setNotes] = useState<Map<string, string>>(new Map());
  const [filters, setFilters] = useState<Graph1Filters>({
    edgeTypes: ["direct", "blanket", "reflexive", "subject"],
    minConfidence: 0,
    subjectIds: [],
  });
  const [userEdges, setUserEdges] = useState<Graph1Edge[]>([]);
  const [visibleLawIds, setVisibleLawIds] = useState<Set<string>>(new Set());
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [subjectSearch, setSubjectSearch] = useState("");

  const [pathFinder, setPathFinder] = useState<PathFinderState>({
    fromLawId: null,
    fromLawLabel: "",
    toLawId: null,
    toLawLabel: "",
    resultPath: null,
    hops: null,
    isLoading: false,
    error: null,
  });

  // Subjects query
  const subjectsQuery = useQuery({
    queryKey: ["graph1", "subjects"],
    queryFn: fetchGraphSubjects,
    staleTime: 10 * 60 * 1000,
  });
  const subjectData: GraphSubject[] = subjectsQuery.data?.subjects ?? [];

  // Global graph query
  const globalQuery = useQuery({
    queryKey: ["graph1", "global"],
    queryFn: fetchGlobalGraph,
    staleTime: 5 * 60 * 1000,
    enabled: mode === "global",
  });

  // Focus (law-specific) query
  const focusQuery = useQuery({
    queryKey: ["graph1", "focus", focusLawId, depth],
    queryFn: () => fetchLawGraph(focusLawId!, depth),
    enabled: mode === "focus" && Boolean(focusLawId),
    staleTime: 2 * 60 * 1000,
  });

  const activeQuery = mode === "focus" && focusLawId ? focusQuery : globalQuery;

  const rawData = useMemo(() => {
    const data = activeQuery.data;
    if (!data) return null;
    return transformToGraph1(data.nodes, data.edges, new Map());
  }, [activeQuery.data]);

  // Apply node positions (from drag)
  const graphData = useMemo<Graph1Data | null>(() => {
    if (!rawData) return null;
    return {
      nodes: rawData.nodes.map((n) => {
        const savedPos = nodePositions.get(n.id);
        return {
          ...n,
          position: savedPos ?? n.position,
          data: {
            ...n.data,
            isHighlighted: highlightedNodeIds.has(n.id),
            note: notes.get(n.id),
          },
        };
      }),
      edges: rawData.edges.map((e) => ({
        ...e,
        data: {
          ...e.data!,
          isHighlighted: highlightedEdgeIds.has(e.id),
        },
      })),
    };
  }, [rawData, nodePositions, highlightedNodeIds, highlightedEdgeIds, notes]);

  // Apply filters
  const filteredEdges = useMemo<Graph1Edge[]>(() => {
    if (!graphData) return [];
    return graphData.edges.filter((e) => {
      const d = e.data!;
      if (!filters.edgeTypes.includes(d.refType)) return false;
      if (d.confidence < filters.minConfidence) return false;
      return true;
    });
  }, [graphData, filters]);

  // Apply subject + visibility filters to nodes
  const filteredNodes = useMemo<Graph1Node[]>(() => {
    if (!graphData) return [];
    let nodes = graphData.nodes;
    if (filters.subjectIds.length > 0) {
      nodes = nodes.filter((n) =>
        n.data.subjectIds.some((sid) => filters.subjectIds.includes(sid)),
      );
    }
    if (visibleLawIds.size > 0) {
      nodes = nodes.filter((n) => visibleLawIds.has(n.id));
    }
    return nodes;
  }, [graphData, filters, visibleLawIds]);

  // Search dimming
  const visibleNodes = useMemo<Graph1Node[]>(() => {
    if (!graphData) return [];
    if (!searchQuery.trim()) {
      return filteredNodes.map((n) => ({
        ...n,
        data: { ...n.data, isPath: pathFinder.resultPath?.includes(n.id) },
      }));
    }
    const q = searchQuery.toLowerCase();
    const matchIds = new Set(
      filteredNodes
        .filter(
          (n) =>
            n.data.label.toLowerCase().includes(q) ||
            n.data.code.toLowerCase().includes(q),
        )
        .map((n) => n.id),
    );
    return graphData.nodes.map((n) => ({
      ...n,
      style: matchIds.has(n.id) ? undefined : { opacity: 0.15 },
      data: { ...n.data, isPath: pathFinder.resultPath?.includes(n.id) },
    }));
  }, [graphData, filteredNodes, searchQuery, pathFinder.resultPath]);

  // Path edges highlight
  const visibleEdges = useMemo<Graph1Edge[]>(() => {
    const pathSet = pathFinder.resultPath
      ? new Set(pathFinder.resultPath)
      : new Set<string>();
    return filteredEdges.map((e) => ({
      ...e,
      data: {
        ...e.data!,
        isPath: pathSet.has(e.source) && pathSet.has(e.target),
      },
    }));
  }, [filteredEdges, pathFinder.resultPath]);

  // Subject edges — build edges between laws that share a selected subject
  const subjectEdges = useMemo<Graph1Edge[]>(() => {
    if (selectedSubjectIds.length === 0) return [];
    const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
    const edges: Graph1Edge[] = [];
    for (const subjectId of selectedSubjectIds) {
      const subject = subjectData.find((s) => s._id === subjectId);
      if (!subject) continue;
      const lawIds = subject.lawIds.filter((id) => visibleNodeIds.has(id));
      for (let i = 0; i < lawIds.length; i++) {
        for (let j = i + 1; j < lawIds.length; j++) {
          edges.push({
            id: `subject-${subjectId}-${lawIds[i]}-${lawIds[j]}`,
            source: lawIds[i],
            target: lawIds[j],
            type: "reference1Edge" as const,
            data: {
              refType: "subject" as const,
              confidence: 1,
              weight: subject.count,
              fromArticle: null,
              toArticle: null,
              rawText: subject.name,
              isSubjectEdge: true,
            },
          });
        }
      }
    }
    return edges;
  }, [selectedSubjectIds, subjectData, visibleNodes]);

  const toggleSubject = useCallback((subjectId: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId],
    );
  }, []);

  const clearSubjects = useCallback(() => {
    setSelectedSubjectIds([]);
  }, []);

  // Find path
  const findPath = useCallback(async () => {
    if (!pathFinder.fromLawId || !pathFinder.toLawId) return;
    setPathFinder((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await fetchGraphPath(
        pathFinder.fromLawId,
        pathFinder.toLawId,
      );
      setPathFinder((prev) => ({
        ...prev,
        resultPath: result.path,
        hops: result.hops,
        isLoading: false,
      }));
    } catch (err) {
      setPathFinder((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Шлях не знайдено",
        resultPath: null,
        hops: null,
      }));
    }
  }, [pathFinder.fromLawId, pathFinder.toLawId]);

  const clearPath = useCallback(() => {
    setPathFinder((prev) => ({
      ...prev,
      resultPath: null,
      hops: null,
      error: null,
    }));
  }, []);

  const saveNodePosition = useCallback(
    (nodeId: string, pos: { x: number; y: number }) => {
      setNodePositions((prev) => new Map(prev).set(nodeId, pos));
    },
    [],
  );

  const toggleNodeHighlight = useCallback((nodeId: string) => {
    setHighlightedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const toggleEdgeHighlight = useCallback((edgeId: string) => {
    setHighlightedEdgeIds((prev) => {
      const next = new Set(prev);
      if (next.has(edgeId)) next.delete(edgeId);
      else next.add(edgeId);
      return next;
    });
  }, []);

  const addUserEdge = useCallback((connection: Connection) => {
    setUserEdges((prev) =>
      addEdge(
        {
          ...connection,
          id: `user-${connection.source}-${connection.target}-${Date.now()}`,
          type: "reference1Edge" as const,
          data: {
            refType: "direct" as const,
            confidence: 1,
            weight: 1,
            fromArticle: null,
            toArticle: null,
            rawText: null,
            isUserEdge: true,
          },
        },
        prev,
      ) as Graph1Edge[],
    );
  }, []);

  const removeUserEdge = useCallback((edgeId: string) => {
    setUserEdges((prev) => prev.filter((e) => e.id !== edgeId));
  }, []);

  const toggleLawVisibility = useCallback(
    (lawId: string) => {
      setVisibleLawIds((prev) => {
        if (prev.size === 0) {
          // "Show all" state: first click hides this one law, so whitelist = all others
          const all = new Set(graphData?.nodes.map((n) => n.id) ?? []);
          all.delete(lawId);
          return all;
        }
        const next = new Set(prev);
        if (next.has(lawId)) next.delete(lawId);
        else next.add(lawId);
        return next;
      });
    },
    [graphData],
  );

  const showAllLaws = useCallback(() => {
    setVisibleLawIds(new Set());
  }, []);

  const setNote = useCallback((lawId: string, text: string) => {
    setNotes((prev) => {
      const next = new Map(prev);
      if (!text.trim()) next.delete(lawId);
      else next.set(lawId, text);
      return next;
    });
  }, []);

  const focusOnLaw = useCallback((lawId: string) => {
    setFocusLawId(lawId);
    setMode("focus");
  }, []);

  const resetToGlobal = useCallback(() => {
    setMode("global");
    setFocusLawId(null);
  }, []);

  // Build snapshot for saving fork
  const buildForkSnapshot = useCallback(
    () => ({
      viewState: {
        centerLawId: focusLawId,
        depth,
        nodePositions: [...nodePositions.entries()].map(([lawId, pos]) => ({
          lawId,
          ...pos,
        })),
        highlightedNodeIds: [...highlightedNodeIds],
        highlightedEdgeIds: [...highlightedEdgeIds],
        notes: [...notes.entries()].map(([lawId, text]) => ({ lawId, text })),
        userEdges: userEdges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
        })),
        visibleLawIds: [...visibleLawIds],
      },
      filters: {
        ...filters,
        focusMode: mode,
      },
      pathState: {
        fromLawId: pathFinder.fromLawId,
        toLawId: pathFinder.toLawId,
        resultPath: pathFinder.resultPath ?? [],
      },
    }),
    [
      focusLawId,
      depth,
      nodePositions,
      highlightedNodeIds,
      highlightedEdgeIds,
      notes,
      filters,
      mode,
      pathFinder,
      userEdges,
      visibleLawIds,
    ],
  );

  // Restore from fork snapshot
  const restoreFromFork = useCallback((fork: GraphFork) => {
    const { viewState, filters: f, pathState } = fork;
    if (viewState.centerLawId && f.focusMode === "focus") {
      setFocusLawId(viewState.centerLawId);
      setMode("focus");
    } else {
      setMode("global");
    }
    setDepth((viewState.depth ?? 1) as 1 | 2 | 3);
    setNodePositions(
      new Map(
        viewState.nodePositions.map(({ lawId, x, y }) => [lawId, { x, y }]),
      ),
    );
    setHighlightedNodeIds(new Set(viewState.highlightedNodeIds));
    setHighlightedEdgeIds(new Set(viewState.highlightedEdgeIds));
    setNotes(
      new Map(viewState.notes.map(({ lawId, text }) => [lawId, text])),
    );
    setFilters({
      edgeTypes: f.edgeTypes ?? ["direct", "blanket", "reflexive", "subject"],
      minConfidence: f.minConfidence ?? 0,
      subjectIds: f.subjectIds ?? [],
    });
    setPathFinder((prev) => ({
      ...prev,
      fromLawId: pathState.fromLawId,
      fromLawLabel: "",
      toLawId: pathState.toLawId,
      toLawLabel: "",
      resultPath: pathState.resultPath ?? null,
      hops: pathState.resultPath?.length
        ? pathState.resultPath.length - 1
        : null,
    }));
    setUserEdges(
      (viewState.userEdges ?? []).map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: "reference1Edge" as const,
        data: {
          refType: "direct" as const,
          confidence: 1,
          weight: 1,
          fromArticle: null,
          toArticle: null,
          rawText: null,
          isUserEdge: true,
        },
      })),
    );
    setVisibleLawIds(new Set(viewState.visibleLawIds ?? []));
  }, []);

  return {
    // Data
    graphData,
    visibleNodes,
    visibleEdges,
    isLoading: activeQuery.isLoading,
    error: activeQuery.error ? String(activeQuery.error) : null,
    // Selection
    selectedNode,
    setSelectedNode,
    selectedEdge,
    setSelectedEdge,
    // Search
    searchQuery,
    setSearchQuery,
    // Filters
    filters,
    setFilters,
    // Mode/depth
    mode,
    depth,
    setDepth,
    focusLawId,
    focusOnLaw,
    resetToGlobal,
    // Path
    pathFinder,
    setPathFinder,
    findPath,
    clearPath,
    // Editing
    saveNodePosition,
    toggleNodeHighlight,
    toggleEdgeHighlight,
    setNote,
    // User edges
    userEdges,
    addUserEdge,
    removeUserEdge,
    // Law visibility
    visibleLawIds,
    toggleLawVisibility,
    showAllLaws,
    // Subjects
    subjectData,
    selectedSubjectIds,
    toggleSubject,
    clearSubjects,
    subjectSearch,
    setSubjectSearch,
    subjectEdges,
    // Fork
    buildForkSnapshot,
    restoreFromFork,
    // Stats
    totalNodes: graphData?.nodes.length ?? 0,
    totalEdges: visibleEdges.length,
  };
}
