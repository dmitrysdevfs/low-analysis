import type { TreeNode } from './law.types';

export interface ArticleResponse {
  article: TreeNode;
  children: TreeNode[];
}
