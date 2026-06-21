import type { Law } from "@/types";
import type {
  ApiGraphEdge,
  ApiGraphNode,
  ApiGraphResponse,
  LawReferenceType,
} from "@/features/graph1/types/graph1.types";

export type Radiant1NodeKind = "law" | "article" | "section" | "definition";

export type Radiant1LinkKind = "law-ref" | "satellite" | "article-ref";

export interface Radiant1ClusterMeta {
  id: string;
  label: string;
  color: string;
  glow: string;
  keywords: string[];
}

export interface Radiant1GraphNode {
  id: string;
  label: string;
  shortLabel: string;
  kind: Radiant1NodeKind;
  lawId: string;
  lawTitle: string;
  lawCode: string;
  lawType: string;
  clusterId: string;
  clusterLabel: string;
  color: string;
  glow: string;
  size: number;
  x: number;
  y: number;
  fx: number;
  fy: number;
  degree: number;
  totalArticles: number;
  totalSections: number;
  totalParagraphs: number;
  definitionsCount: number;
  adoptedYear?: number;
  subjectIds: string[];
  subjectCount: number;
  detail?: string;
  articleRange?: string;
  isPrimary?: boolean;
  isPath?: boolean;
  riskLevel?: "green" | "yellow" | "red" | null;
}

export interface Radiant1GraphLink {
  id: string;
  source: string | Radiant1GraphNode;
  target: string | Radiant1GraphNode;
  kind: Radiant1LinkKind;
  refType?: LawReferenceType;
  weight: number;
  confidence: number;
  color: string;
  particleColor: string;
  fromArticle?: string | null;
  toArticle?: string | null;
  rawText?: string | null;
  note?: string;
  isPath?: boolean;
}

export interface Radiant1Summary {
  visibleLawCount: number;
  totalNodes: number;
  totalLinks: number;
  actualLinkCount: number;
  dominantLawId: string | null;
  yearRange: {
    min: number | null;
    max: number | null;
  };
  clusterStats: Array<{
    id: string;
    label: string;
    color: string;
    count: number;
  }>;
}

export interface Radiant1GraphData {
  nodes: Radiant1GraphNode[];
  links: Radiant1GraphLink[];
  summary: Radiant1Summary;
  lawOptions: Array<{
    id: string;
    label: string;
    code: string;
    clusterId: string;
  }>;
}

export interface Radiant1BuildInput {
  graph: ApiGraphResponse;
  laws: Law[];
  lawSubjectIdsByLaw: Map<string, string[]>;
  searchQuery: string;
  activeClusterIds: string[];
  selectedSubjectId: string | null;
  selectedYear: number | null;
  selectedYearFrom?: number | null;
  pathLawIds?: Set<string>;
}

export interface Radiant1MergedLaw {
  apiNode: ApiGraphNode;
  law?: Law;
  cluster: Radiant1ClusterMeta;
  subjectIds: string[];
  adoptedYear?: number;
  definitionsCount: number;
  totalSections: number;
  totalArticles: number;
  totalParagraphs: number;
  degree: number;
}

export type Radiant1ApiEdge = ApiGraphEdge;
