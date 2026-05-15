import type { TreeNode } from "@/types";

export function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function parseNumericValue(value?: string | null) {
  const cleaned = value?.trim();

  if (!cleaned) {
    return null;
  }

  const normalized = cleaned.replace(",", ".").replace(/[^\d.-]/g, "");

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function createBranchKey(node: TreeNode, index: number) {
  return node._id ?? `${node.code}:${index}`;
}

export function stripLeadingArticleLabel(value: string, label: string) {
  const pattern = new RegExp(
    `^${escapeRegExp(label).replace(/\s+/g, "\\s+")}[\\s.:;,-]*`,
    "iu",
  );

  return value.replace(pattern, "").trim();
}
