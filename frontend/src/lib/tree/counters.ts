import type { TreeBranch } from "./builders";

export function countArticlesInBranch(node: TreeBranch): number {
  let count = node.type === "article" ? 1 : 0;
  if (node.children) {
    for (const child of node.children) {
      count += countArticlesInBranch(child);
    }
  }
  return count;
}

export function countSectionArticles(section: TreeBranch) {
  return section.children.reduce(
    (total, child) => total + countArticlesInBranch(child),
    0,
  );
}

export function countArticlesInSections(sections: TreeBranch[]) {
  return sections.reduce(
    (total, section) => total + countSectionArticles(section),
    0,
  );
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
    const hasChildren = section.children.length > 0;

    if (!hasChildren) {
      return result;
    }

    // If this section has 0 articles but has other children (like Section XVII),
    // it should be included regardless of whether remaining articles limit has been reached.
    if (sectionArticles === 0) {
      result.push(section);
      return result;
    }

    // For sections with articles, only include them if we still have remaining articles to show.
    if (remaining <= 0) {
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

import type { LawStats } from "@/types";

export function computeStatsFromTree(
  nodes: Array<{ risk_level?: string | null; chars_count?: number | null }>,
): LawStats | null {
  const relevant = nodes.filter(
    (n) => n.risk_level != null && n.chars_count != null && n.chars_count > 0,
  );
  if (relevant.length === 0) return null;

  let green = 0,
    yellow = 0,
    red = 0;
  let totalChars = 0;

  for (const node of relevant) {
    if (node.risk_level === "green") green++;
    else if (node.risk_level === "yellow") yellow++;
    else if (node.risk_level === "red") red++;
    totalChars += node.chars_count!;
  }

  const totalElements = relevant.length;
  const meanChars = totalChars / totalElements;
  let sumSq = 0;
  for (const node of relevant) {
    const diff = node.chars_count! - meanChars;
    sumSq += diff * diff;
  }
  const standardDeviation = Math.sqrt(sumSq / totalElements);

  return {
    totalElements,
    meanChars,
    standardDeviation,
    riskLevels: { green, yellow, red, null: 0 },
  };
}

export type RiskLevel = "green" | "yellow" | "red";
export const RISK_RANK: Record<RiskLevel, number> = {
  green: 0,
  yellow: 1,
  red: 2,
};

function worstRisk(a: RiskLevel, b: RiskLevel): RiskLevel {
  return RISK_RANK[a] >= RISK_RANK[b] ? a : b;
}

function branchMaxRisk(branch: TreeBranch): RiskLevel {
  const own = (branch.risk_level as RiskLevel | null | undefined) ?? "green";
  return branch.children.reduce(
    (acc, child) => worstRisk(acc, branchMaxRisk(child)),
    own,
  );
}

export function computeArticleRiskMap(
  sections: TreeBranch[],
): Map<string, RiskLevel> {
  const map = new Map<string, RiskLevel>();
  for (const section of sections) {
    for (const child of section.children) {
      if (child.type === "article" && child._id) {
        map.set(child._id, branchMaxRisk(child));
      }
    }
  }
  return map;
}
