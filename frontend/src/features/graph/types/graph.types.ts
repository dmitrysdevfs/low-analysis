export interface GraphLaw extends Record<string, unknown> {
  id: string;
  label: string;
  code: string;
  lawType: string;
  totalArticles: number;
  adoptedYear?: number;
}

export interface GraphNode {
  id: string;
  data: GraphLaw;
  position: { x: number; y: number };
  type: "lawNode";
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: "referenceEdge";
  data?: {
    connectionType: "subject" | "direct" | "thematic";
    label?: string;
  };
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type GraphMode = "focus" | "overview";
