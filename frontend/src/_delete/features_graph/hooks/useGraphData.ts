"use client";

import { useMemo, useState } from "react";
import { useLaws } from "@/hooks/useLaws";
import { useSubjects } from "@/hooks/useSubjects";
import { buildGraphFromData } from "../lib/buildGraph";
import type { GraphData, GraphNode } from "../types/graph.types";

interface UseGraphDataResult {
  graphData: GraphData | null;
  laws: ReturnType<typeof useLaws>["laws"];
  isLoading: boolean;
  error: string | null;
  selectedNode: GraphNode | null;
  setSelectedNode: (node: GraphNode | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredNodes: GraphNode[];
}

export function useGraphData(_selectedLawId?: string): UseGraphDataResult {
  const { laws, loading: lawsLoading, error: lawsError } = useLaws();
  const {
    subjects,
    loading: subjectsLoading,
    error: subjectsError,
  } = useSubjects();

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const graphData = useMemo<GraphData | null>(() => {
    if (!laws.length) return null;
    return buildGraphFromData(laws, subjects);
  }, [laws, subjects]);

  const filteredNodes = useMemo<GraphNode[]>(() => {
    if (!graphData) return [];
    if (!searchQuery.trim()) return graphData.nodes;
    const q = searchQuery.toLowerCase();
    return graphData.nodes.filter(
      (n) =>
        n.data.label.toLowerCase().includes(q) ||
        n.data.code.toLowerCase().includes(q),
    );
  }, [graphData, searchQuery]);

  return {
    graphData,
    laws,
    isLoading: lawsLoading || subjectsLoading,
    error: lawsError ?? subjectsError,
    selectedNode,
    setSelectedNode,
    searchQuery,
    setSearchQuery,
    filteredNodes,
  };
}
