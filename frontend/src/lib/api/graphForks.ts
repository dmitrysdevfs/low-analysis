"use client";

import { getJson, requestJson } from "./_client";

export interface GraphFork {
  _id: string;
  name: string;
  description: string;
  isPublic: boolean;
  viewState: {
    centerLawId: string | null;
    depth: number;
    nodePositions: { lawId: string; x: number; y: number }[];
    highlightedNodeIds: string[];
    highlightedEdgeIds: string[];
    notes: { lawId: string; text: string }[];
    userEdges: { id: string; source: string; target: string }[];
    visibleLawIds: string[];
  };
  filters: {
    edgeTypes: string[];
    minConfidence: number;
    subjectIds: string[];
    focusMode: "global" | "focus";
  };
  pathState: {
    fromLawId: string | null;
    toLawId: string | null;
    resultPath: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export async function getMyGraphForks(): Promise<GraphFork[]> {
  return getJson<GraphFork[]>("/graph-forks/my");
}

export async function deleteGraphFork(id: string): Promise<void> {
  return requestJson<void>(`/graph-forks/${id}`, "DELETE", {});
}
