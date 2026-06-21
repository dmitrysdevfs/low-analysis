"use client";

import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { getLaws, getLawTree } from "@/lib/api";
import { getLawSubjects } from "@/lib/api/laws";
import {
  fetchGlobalGraph,
  fetchLawGraph,
} from "@/lib/api/graph1";
import { useSubjectsMap } from "@/hooks/useSubjectsMap";

export function useRadiant1Data(selectedLawId: string | null) {
  const globalGraphQuery = useQuery({
    queryKey: ["radiant1", "global-graph"],
    queryFn: fetchGlobalGraph,
    staleTime: 5 * 60 * 1000,
  });

  const lawsQuery = useQuery({
    queryKey: ["radiant1", "laws"],
    queryFn: () => getLaws(),
    staleTime: 5 * 60 * 1000,
  });

  const subjectQueries = useQueries({
    queries: (globalGraphQuery.data?.nodes ?? []).map((node) => ({
      queryKey: ["radiant1", "law-subjects", node.id],
      queryFn: () => getLawSubjects(node.id),
      staleTime: 5 * 60 * 1000,
      enabled: Boolean(globalGraphQuery.data),
    })),
  });

  const selectedLawGraphQuery = useQuery({
    queryKey: ["radiant1", "law-graph", selectedLawId],
    queryFn: () => fetchLawGraph(selectedLawId!, 2),
    enabled: Boolean(selectedLawId),
    staleTime: 2 * 60 * 1000,
  });

  const selectedLawTreeQuery = useQuery({
    queryKey: ["radiant1", "law-tree", selectedLawId],
    queryFn: () => getLawTree(selectedLawId!),
    enabled: Boolean(selectedLawId),
    staleTime: 2 * 60 * 1000,
  });

  const { subjectsMap, loading: subjectsLoading } = useSubjectsMap();

  const lawSubjectIdsByLaw = useMemo(() => {
    const map = new Map<string, string[]>();
    subjectQueries.forEach((query, index) => {
      const lawId = globalGraphQuery.data?.nodes[index]?.id;
      if (!lawId || !query.data) return;
      map.set(
        lawId,
        query.data.map((subject) => subject._id),
      );
    });
    return map;
  }, [globalGraphQuery.data, subjectQueries]);

  const subjectsLoadingAny = subjectsLoading || subjectQueries.some((query) => query.isLoading);

  return {
    globalGraphQuery,
    lawsQuery,
    selectedLawGraphQuery,
    selectedLawTreeQuery,
    lawSubjectIdsByLaw,
    subjectsMap,
    subjectsLoading: subjectsLoadingAny,
  };
}
