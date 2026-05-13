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
  subjects?: string[];
}

export interface Subject {
  _id: string;
  name: string;
  aliases: string[];
  elementIds: string[];
  lawIds: string[];
  createdAt: string;
}

export interface ArticleResponse {
  article: TreeNode;
  children: TreeNode[];
}

export interface SubjectElements {
  subject: Subject;
  elements: TreeNode[];
}

export interface ParseLawResponse {
  message: string;
  lawId: string;
  elementsCount: number;
}
