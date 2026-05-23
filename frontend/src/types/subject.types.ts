import type { TreeNode } from "./law.types";

export interface Subject {
  _id: string;
  canonical_name: string;
  legal_status: string;
  aliases: string[];
  description?: string | null;
  laws_count?: number;
  elements_count?: number;
  createdAt: string;
}

export interface SubjectElements {
  subject: Subject;
  elements: TreeNode[];
}
