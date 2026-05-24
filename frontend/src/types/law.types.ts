export interface Law {
  _id: string;
  title: string;
  code: string;
  preamble?: string | null;
  signatory?: string | null;
  status?: string | null;
  totalSections: number;
  totalArticles: number;
  totalParagraphs?: number;
  createdAt: string;
  adoptedDate?: string | null;
  documentType?: string[] | null;
  source?: string | null;
  updatedAt?: string;
  global_context?: {
    preamble?: string | null;
    definitions: Array<{ term: string; definition: string }>;
  } | null;
}

export interface LawStats {
  totalElements: number;
  meanChars: number;
  standardDeviation: number;
  riskLevels: {
    green: number;
    yellow: number;
    red: number;
    null: number;
  };
}

export interface LawTreeResponse {
  law: Law;
  elements: TreeNode[];
}

export type TreeNodeType =
  | "section"
  | "article"
  | "part"
  | "point"
  | "sub_point"
  | "paragraph";

export interface TreeNode {
  _id?: string;
  lawId?: string;
  parentId?: string | null;
  type: TreeNodeType;
  code: string;
  title?: string | null;
  number?: string | null;
  text?: string | null;
  depth: number;
  order?: number;
  subjects?: { subject_id: string; role: string }[];
  chars_count?: number;
  subjects_count?: number;
  z_score?: number;
  factor?: number | null;
  risk_level?: "green" | "yellow" | "red" | null;
  taxonomy?: {
    legalFunctions: string[];
    domains: string[];
    keywords: string[];
    confidence: number;
    source: 'rules' | 'llm' | 'manual';
  } | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedLawsResponse {
  data: Law[];
  pagination: Pagination;
}
