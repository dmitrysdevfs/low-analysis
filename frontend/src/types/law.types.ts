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
  z_score?: number;
  risk_level?: "green" | "yellow" | "red" | null;
}
