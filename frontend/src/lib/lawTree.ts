import type { TreeNode } from "@/types";

export interface TreeBranch extends TreeNode {
  children: TreeBranch[];
  key: string;
}

const TYPE_LABELS: Record<TreeNode["type"], string> = {
  section: "Розділ",
  article: "Стаття",
  part: "Частина",
  point: "Пункт",
  sub_point: "Підпункт",
  paragraph: "Абзац",
};

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function parseNumericValue(value?: string | null) {
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createBranchKey(node: TreeNode, index: number) {
  return node._id ?? `${node.code}:${index}`;
}

function stripLeadingArticleLabel(value: string, label: string) {
  const pattern = new RegExp(
    `^${escapeRegExp(label).replace(/\s+/g, "\\s+")}[\\s.:;,-]*`,
    "iu",
  );

  return value.replace(pattern, "").trim();
}

export function compareTreeNodes(a: TreeNode, b: TreeNode) {
  const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
  const orderB = b.order ?? Number.MAX_SAFE_INTEGER;

  if (orderA !== orderB) {
    return orderA - orderB;
  }

  const numericA = parseNumericValue(a.number);
  const numericB = parseNumericValue(b.number);

  if (numericA !== null && numericB !== null && numericA !== numericB) {
    return numericA - numericB;
  }

  if (numericA !== null && numericB === null) {
    return -1;
  }

  if (numericA === null && numericB !== null) {
    return 1;
  }

  return a.code.localeCompare(b.code, "uk", {
    numeric: true,
    sensitivity: "base",
  });
}

export function buildTreeBranches(elements: TreeNode[]) {
  const branches = elements.map((element, index) => ({
    ...element,
    key: createBranchKey(element, index),
    children: [] as TreeBranch[],
  }));

  const branchesById = new Map<string, TreeBranch>();

  for (const branch of branches) {
    if (branch._id) {
      branchesById.set(branch._id, branch);
    }
  }

  const roots: TreeBranch[] = [];

  for (const branch of branches) {
    const parent = branch.parentId ? branchesById.get(branch.parentId) : undefined;

    if (parent) {
      parent.children.push(branch);
    } else {
      roots.push(branch);
    }
  }

  const sortRecursively = (nodes: TreeBranch[]) => {
    nodes.sort(compareTreeNodes);
    nodes.forEach((node) => sortRecursively(node.children));
  };

  sortRecursively(roots);

  return roots;
}

export function buildLawSections(elements: TreeNode[]) {
  const roots = buildTreeBranches(elements);
  const sections = roots.filter((node) => node.type === "section");
  const looseNodes = roots.filter((node) => node.type !== "section");

  if (!looseNodes.length) {
    return sections;
  }

  return [
    {
      key: "__unsectioned__",
      _id: "__unsectioned__",
      type: "section" as const,
      code: "__unsectioned__",
      lawId: looseNodes[0]?.lawId,
      parentId: null,
      number: null,
      title: "Статті без розділу",
      text: null,
      depth: 0,
      order: -1,
      subjects: [],
      children: looseNodes,
    },
    ...sections,
  ];
}

export function countSectionArticles(section: TreeBranch) {
  return section.children.filter((child) => child.type === "article").length;
}

export function countArticlesInSections(sections: TreeBranch[]) {
  return sections.reduce((total, section) => total + countSectionArticles(section), 0);
}

export function limitLawSections(sections: TreeBranch[], limit: number | null) {
  if (!limit || limit < 1) {
    return sections;
  }

  const totalArticles = countArticlesInSections(sections);

  if (limit >= totalArticles) {
    return sections;
  }

  let remaining = limit;

  return sections.reduce<TreeBranch[]>((result, section) => {
    const sectionArticles = countSectionArticles(section);

    if (sectionArticles === 0 || remaining <= 0) {
      return result;
    }

    const takeCount = Math.min(sectionArticles, remaining);
    let taken = 0;

    const children = section.children.filter((child) => {
      if (child.type !== "article") {
        return true;
      }

      if (taken < takeCount) {
        taken += 1;
        return true;
      }

      return false;
    });

    remaining -= takeCount;
    result.push({ ...section, children });
    return result;
  }, []);
}

export function countNestedNodes(node: TreeBranch): number {
  return node.children.reduce(
    (total, child) => total + 1 + countNestedNodes(child),
    0,
  );
}

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

  const match = `${node.title ?? ""} ${node.text ?? ""}`.match(/\d+(?:[-–]\d+)?/u);
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
