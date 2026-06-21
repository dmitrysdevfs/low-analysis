"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLaws } from "@/lib/api";
import { transformToGraph } from "../lib/transformToGraph";
import type { RadiantGraph, RadiantNode } from "../types/radiant.types";
import type { Law } from "@/types";

export function useRadiantData() {
  const [selectedNode, setSelectedNode] = useState<RadiantNode | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data, isLoading, error } = useQuery<Law[]>({
    queryKey: ["radiant-laws"],
    queryFn: () => getLaws(),
    staleTime: 5 * 60 * 1000,
  });

  const graph = useMemo<RadiantGraph | null>(() => {
    if (!data?.length) return null;
    return transformToGraph(data);
  }, [data]);

  const highlightedIds = useMemo<Set<string>>(() => {
    if (!searchQuery.trim() || !graph) return new Set();
    const query = searchQuery.toLowerCase();
    return new Set(
      graph.nodes
        .filter((n) => n.name.toLowerCase().includes(query))
        .map((n) => n.id),
    );
  }, [searchQuery, graph]);

  return {
    graph,
    isLoading,
    error: error ? (error as Error).message : null,
    totalLaws: graph?.nodes.length ?? 0,
    selectedNode,
    setSelectedNode,
    searchQuery,
    setSearchQuery,
    highlightedIds,
  };
}
