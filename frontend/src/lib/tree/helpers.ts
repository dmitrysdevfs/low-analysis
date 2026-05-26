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

export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "122,152,192";
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ].join(",");
}
