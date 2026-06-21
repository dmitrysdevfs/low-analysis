import type { Node, Edge } from "@xyflow/react";

// --- Edge types from LawReference model ---
export type LawReferenceType = "direct" | "blanket" | "reflexive" | "subject";

export interface Graph1EdgeData extends Record<string, unknown> {
  refType: LawReferenceType;
  confidence: number; // 0..1
  weight?: number; // кількість references між цими двома законами (global graph)
  fromArticle: string | null;
  toArticle: string | null;
  rawText: string | null;
  isPath?: boolean; // true якщо це частина знайденого path
  isHighlighted?: boolean; // true якщо вручну виділено
  isUserEdge?: boolean; // true якщо намальовано юзером вручну
  isSubjectEdge?: boolean; // true якщо побудовано через спільний суб'єкт
}

// --- Subject types ---
export interface GraphSubject {
  _id: string;
  name: string;
  count: number;
  lawIds: string[];
}

export interface ApiGraphSubjectsResponse {
  subjects: GraphSubject[];
}

export interface Graph1NodeData extends Record<string, unknown> {
  id: string;
  label: string;
  code: string;
  lawType: string;
  totalArticles: number;
  adoptedYear?: number;
  subjectIds: string[]; // для фільтрації по суб'єкту
  isPath?: boolean; // true якщо вузол у знайденому path
  isHighlighted?: boolean; // вручну виділений
  note?: string; // нотатка від юзера
}

export type Graph1Node = Node<Graph1NodeData, "law1Node">;
export type Graph1Edge = Edge<Graph1EdgeData, "reference1Edge">;

export interface Graph1Data {
  nodes: Graph1Node[];
  edges: Graph1Edge[];
}

// --- Backend API response types ---
export interface ApiGraphNode {
  id: string;
  label: string;
  code: string;
  type: string; // documentType[0]
  totalArticles: number;
  subjectIds?: string[];
}

export interface ApiGraphEdge {
  id: string;
  source: string;
  target: string;
  type: LawReferenceType;
  confidence?: number;
  weight?: number;
  fromArticle?: string | null;
  toArticle?: string | null;
  rawText?: string | null;
}

export interface ApiGraphResponse {
  nodes: ApiGraphNode[];
  edges: ApiGraphEdge[];
  meta?: { generatedAt: string };
}

export interface ApiPathResponse {
  path: string[];
  hops: number;
}

// --- Fork types ---
export interface GraphForkViewState {
  centerLawId: string | null;
  depth: 1 | 2 | 3;
  nodePositions: { lawId: string; x: number; y: number }[];
  highlightedNodeIds: string[];
  highlightedEdgeIds: string[];
  notes: { lawId: string; text: string }[];
  userEdges: { id: string; source: string; target: string }[];
  visibleLawIds: string[];
}

export interface GraphForkFilters {
  edgeTypes: LawReferenceType[];
  minConfidence: number;
  subjectIds: string[];
  focusMode: "global" | "focus";
}

export interface GraphForkPathState {
  fromLawId: string | null;
  toLawId: string | null;
  resultPath: string[] | null;
}

export interface GraphFork {
  _id: string;
  userId: string;
  name: string;
  description: string;
  viewState: GraphForkViewState;
  filters: GraphForkFilters;
  pathState: GraphForkPathState;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// --- UI State types ---
export interface Graph1Filters {
  edgeTypes: LawReferenceType[];
  minConfidence: number;
  subjectIds: string[];
}

export type Graph1Mode = "global" | "focus";

export interface PathFinderState {
  fromLawId: string | null;
  fromLawLabel: string;
  toLawId: string | null;
  toLawLabel: string;
  resultPath: string[] | null;
  hops: number | null;
  isLoading: boolean;
  error: string | null;
}
