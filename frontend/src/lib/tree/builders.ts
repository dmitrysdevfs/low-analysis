import type { TreeNode } from "@/types";
import { parseNumericValue, createBranchKey } from "./helpers";

export interface TreeBranch extends TreeNode {
  children: TreeBranch[];
  key: string;
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
    const parent = branch.parentId
      ? branchesById.get(branch.parentId)
      : undefined;

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

/**
 * Filters tree elements and returns only article nodes
 * sorted according to their order in the law structure.
 *
 * @param elements Array of law tree nodes.
 * @returns Sorted array containing only article nodes.
 */

export function getSortedArticles(elements: TreeNode[]) {
  return elements
    .filter((node) => node.type === "article")
    .sort(compareTreeNodes);
}
