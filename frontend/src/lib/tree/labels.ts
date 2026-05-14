import type { TreeNode } from "@/types";
import { normalizeText, stripLeadingArticleLabel } from "./helpers";

const TYPE_LABELS: Record<TreeNode["type"], string> = {
  section: "Розділ",
  article: "Стаття",
  part: "Частина",
  point: "Пункт",
  sub_point: "Підпункт",
  paragraph: "Абзац",
};

export function getArticleBadge(node: TreeNode) {
  const number = node.number?.trim();

  if (number) {
    return `Стаття ${number}`;
  }

  if (node.title?.trim()) {
    return normalizeText(node.title.replace(/[.:]+$/u, ""));
  }

  return "Стаття";
}

export function getArticleRouteNumber(node: TreeNode) {
  const number = node.number?.trim();

  if (number) {
    return number;
  }

  const match = `${node.title ?? ""} ${node.text ?? ""}`.match(
    /\d+(?:[-–]\d+)?/u,
  );
  return match?.[0] ?? null;
}

export function getArticleTitle(node: TreeNode) {
  const badge = getArticleBadge(node);
  const candidates = [node.text, node.title]
    .map((value) => value?.trim())
    .filter(Boolean) as string[];

  for (const candidate of candidates) {
    const stripped = stripLeadingArticleLabel(candidate, badge);

    if (stripped) {
      return normalizeText(stripped);
    }
  }

  return badge;
}

export function getNodeLabel(node: TreeNode) {
  if (node.type === "article") {
    return getArticleBadge(node);
  }

  const typeLabel = TYPE_LABELS[node.type];
  const number = node.number?.trim();

  return number ? `${typeLabel} ${number}` : typeLabel;
}

export function getNodeContent(node: TreeNode) {
  if (node.type === "article") {
    return getArticleTitle(node);
  }

  const candidate = node.text?.trim() || node.title?.trim();
  return candidate ? normalizeText(candidate) : null;
}

/**
 * Returns a readable badge label for a law tree node
 * based on its structural type and number.
 */

export function getNodeBadge(node: TreeNode) {
  switch (node.type) {
    case "part":
      return `ч. ${node.number}`;
    case "point":
      return `п. ${node.number}`;
    case "sub_point":
      return `пп. ${node.number}`;
    case "paragraph":
      return `абз. ${node.number}`;
    default:
      return node.number ?? "•";
  }
}

export function parseElementCode(code: string): {
  lawCode: string;
  sectionLabel: string | null;
  articleNumber: string | null;
} {
  const parts = code.split(":");

  return {
    lawCode: parts[0] ?? code,
    sectionLabel: parts[1] ?? null,
    articleNumber: parts[2] ?? null,
  };
}
