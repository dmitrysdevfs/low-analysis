import type { TreeNode } from './law.types';

export interface Subject {
  _id: string;
  canonical_name: string;
  legal_status: string;
  aliases: string[];
  createdAt: string;
}

export interface SubjectElements {
  subject: Subject;
  elements: TreeNode[];
}
