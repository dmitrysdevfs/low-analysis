import type { TreeNode } from "@/types";
import { normalizeText, stripLeadingArticleLabel } from "./helpers";

export const ROLE_COLORS: Record<string, string> = {
  actor: "#c8a843",
  regulator: "#4a80d4",
  target_of_control: "#d4874a",
  recipient: "#4aad7a",
  protected_party: "#9b5cd4",
  issuer_of_regulations: "#4ab8d4",
  other: "#7a98c0",
};

export function getRoleColor(role: string): string {
  return ROLE_COLORS[role.toLowerCase()] ?? ROLE_COLORS.other;
}

const ROLE_LABELS: Record<string, string> = {
  actor: "Суб'єкт",
  target_of_control: "Об'єкт контролю",
  recipient: "Отримувач",
  regulator: "Регулятор",
  protected_party: "Захищена сторона",
  issuer_of_regulations: "Видавець норм",
  other: "Інше",
};

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

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role.toLowerCase()] ?? role;
}

export const LEGAL_STATUS_LABELS: Record<string, string> = {
  executive_body: "Виконавчий орган",
  official: "Посадова особа",
  legal_entity: "Юридична особа",
  individual: "Фізична особа",
  self_regulatory_org: "Саморегулівна організація",
  other: "Інше",
};

export const LEGAL_STATUS_COLORS: Record<string, string> = {
  executive_body: "#4a80d4",
  official: "#c8a843",
  legal_entity: "#4aad7a",
  individual: "#9b5cd4",
  self_regulatory_org: "#4ab8d4",
  other: "#7a98c0",
};

export function getLegalStatusLabel(status: string): string {
  return LEGAL_STATUS_LABELS[status] ?? status;
}

export function getLegalStatusColor(status: string): string {
  return LEGAL_STATUS_COLORS[status] ?? LEGAL_STATUS_COLORS.other;
}

export function getTypeLabel(type: string): string {
  return TYPE_LABELS[type as TreeNode["type"]] ?? type;
}

export function sanitizeAnchor(code: string): string {
  return code.replace(/[.:]/g, "-");
}

export function formatCitation(opts: {
  badge: string;
  text: string;
  charCount: number;
  subjectLinks: { name: string; id: string }[];
  lawId: string;
  articleNum: string;
  lawTitle: string;
  code: string;
}): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const anchor = sanitizeAnchor(opts.code);
  const url = `${origin}/laws/${opts.lawId}/articles/${opts.articleNum}#${anchor}`;

  const subjectsLine = opts.subjectLinks.length
    ? `Суб'єкти: ${opts.subjectLinks.map((s) => s.name).join(", ")}`
    : "Суб'єктів не знайдено";

  const lines = [
    `§ ${opts.badge} — ${opts.text}`,
    `Символів: ${opts.charCount}`,
    subjectsLine,
  ];

  if (opts.subjectLinks.length) {
    lines.push(
      `Профілі: ${opts.subjectLinks.map((s) => `${origin}/subjects/${s.id}`).join(", ")}`,
    );
  }

  lines.push(`Посилання: ${url}`, `Закон: ${opts.lawTitle}`);
  return lines.join("\n");
}

export function parseElementCode(code: string): {
  lawCode: string;
  sectionLabel: string | null;
  articleNumber: string | null;
} {
  if (code.includes(":")) {
    const parts = code.split(":");
    return {
      lawCode: parts[0] ?? code,
      sectionLabel: parts[1] ?? null,
      articleNumber: parts[2] ?? null,
    };
  }

  const parts = code.split(".");
  const lawCode = parts[0] ?? code;
  let sectionLabel: string | null = null;
  let articleNumber: string | null = null;

  for (const part of parts.slice(1)) {
    const rz = part.match(/^rz(\d+)$/);
    if (rz) {
      sectionLabel = `Розділ ${rz[1]}`;
      continue;
    }

    const st = part.match(/^st(\d+(?:-\d+)?)$/);
    if (st) {
      articleNumber = st[1];
      continue;
    }
  }

  return { lawCode, sectionLabel, articleNumber };
}
