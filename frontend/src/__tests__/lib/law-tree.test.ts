import { describe, expect, it } from "vitest";

import {
  buildLawSections,
  countArticlesInSections,
  countNestedNodes,
  getArticleBadge,
  getArticleRouteNumber,
  getArticleTitle,
  getNodeContent,
  getNodeLabel,
  getSortedArticles,
  limitLawSections,
} from "@/lib/lawTree";
import type { TreeNode } from "@/types";

describe("law tree helpers", () => {
  const section: TreeNode = {
    _id: "section-1",
    lawId: "law-1",
    type: "section",
    code: "law-1.rz1",
    number: "1",
    title: "Розділ I. Загальні положення",
    depth: 0,
    order: 10,
  };

  const articleTwo: TreeNode = {
    _id: "article-2",
    lawId: "law-1",
    parentId: "section-1",
    type: "article",
    code: "law-1.rz1.st2",
    number: "2",
    title: "Стаття 2.",
    text: "Сфера дії закону",
    depth: 1,
    order: 30,
  };

  const articleOne: TreeNode = {
    _id: "article-1",
    lawId: "law-1",
    parentId: "section-1",
    type: "article",
    code: "law-1.rz1.st1",
    number: "1",
    title: "Стаття 1.",
    text: "Стаття 1 Загальні терміни",
    depth: 1,
    order: 20,
  };

  const part: TreeNode = {
    _id: "part-1",
    lawId: "law-1",
    parentId: "article-1",
    type: "part",
    code: "law-1.rz1.st1.ch1",
    number: "1",
    text: "Положення цієї статті застосовуються до всіх суб'єктів.",
    depth: 2,
    order: 21,
  };

  const point: TreeNode = {
    _id: "point-1",
    lawId: "law-1",
    parentId: "part-1",
    type: "point",
    code: "law-1.rz1.st1.ch1.p1",
    number: "1",
    text: "Перша умова застосування норми.",
    depth: 3,
    order: 22,
  };

  it("groups flat elements into ordered sections with nested articles", () => {
    const sections = buildLawSections([
      point,
      articleTwo,
      section,
      part,
      articleOne,
    ]);

    expect(sections).toHaveLength(1);
    expect(sections[0].children.map((node) => node.number)).toEqual(["1", "2"]);
    expect(sections[0].children[0].children[0].children[0].text).toBe(
      point.text,
    );
    expect(countNestedNodes(sections[0].children[0])).toBe(2);
  });

  it("limits the amount of visible articles without breaking section order", () => {
    const sections = buildLawSections([
      point,
      articleTwo,
      section,
      part,
      articleOne,
    ]);
    const limitedSections = limitLawSections(sections, 1);

    expect(countArticlesInSections(limitedSections)).toBe(1);
    expect(limitedSections[0].children.map((node) => node.number)).toEqual([
      "1",
    ]);
    expect(limitedSections[0].children[0].children[0].text).toBe(part.text);
  });

  it("derives stable article labels and readable text", () => {
    expect(getArticleBadge(articleOne)).toBe("Стаття 1");
    expect(getArticleRouteNumber(articleOne)).toBe("1");
    expect(getArticleTitle(articleOne)).toBe("Загальні терміни");
    expect(getNodeLabel(part)).toBe("Частина 1");
    expect(getNodeContent(part)).toBe(part.text);
  });

  it("returns only articles sorted by order", () => {
    const unorderedElements: TreeNode[] = [
      point,
      articleTwo,
      section,
      articleOne,
      part,
    ];

    const articles = getSortedArticles(unorderedElements);

    expect(articles).toHaveLength(2);
    expect(articles.map((article) => article.number)).toEqual(["1", "2"]);
    expect(articles.every((node) => node.type === "article")).toBe(true);
  });
});
