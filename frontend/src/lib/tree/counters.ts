import type { TreeBranch } from "./builders";

export function countSectionArticles(section: TreeBranch) {
  return section.children.filter((child) => child.type === "article").length;
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
