import { describe, expect, it } from "vitest";

import {
  buildMentions,
  resolveCurrentMentionIndex,
  type ArticleMention,
} from "@/lib/subject/mentionHelpers";
import type { Law, TreeNode } from "@/types";

const el = (lawId: string, code: string, text = ""): TreeNode =>
  ({ _id: code, lawId, type: "part", code, text }) as unknown as TreeNode;

const law = (id: string, title: string): Law =>
  ({ _id: id, title, code: id }) as unknown as Law;

describe("buildMentions", () => {
  it("dedupes by law/article and assigns sequential global indexes", () => {
    const lawsMap = new Map<string, Law>([
      ["1953-20", law("1953-20", "Про фінансові послуги")],
      ["3153-20", law("3153-20", "Про захист прав споживачів")],
    ]);
    const elements = [
      el("1953-20", "1953-20.st3.ch1", "частина перша"),
      el("1953-20", "1953-20.st3.ch2", "частина друга"), // same article → deduped
      el("1953-20", "1953-20.st31", "стаття 31"),
      el("3153-20", "3153-20.st27", "стаття 27"),
    ];

    const mentions = buildMentions(elements, lawsMap);

    expect(mentions.map((m) => `${m.lawId}/${m.articleNum}`)).toEqual([
      "1953-20/3",
      "1953-20/31",
      "3153-20/27",
    ]);
    expect(mentions.map((m) => m.globalIdx)).toEqual([0, 1, 2]);
    expect(mentions[2].lawTitle).toBe("Про захист прав споживачів");
  });
});

describe("resolveCurrentMentionIndex", () => {
  const mentions: ArticleMention[] = [
    {
      lawId: "1953-20",
      articleNum: "3",
      lawTitle: "",
      snippet: "",
      globalIdx: 0,
    },
    {
      lawId: "1953-20",
      articleNum: "31",
      lawTitle: "",
      snippet: "",
      globalIdx: 1,
    },
    {
      lawId: "3153-20",
      articleNum: "27",
      lawTitle: "",
      snippet: "",
      globalIdx: 2,
    },
  ];

  it("returns the exact current article index (article-level stays in place)", () => {
    expect(resolveCurrentMentionIndex(mentions, "1953-20", "31")).toBe(1);
    expect(resolveCurrentMentionIndex(mentions, "3153-20", "27")).toBe(2);
  });

  it("falls back to the first mention within the current law (law level)", () => {
    expect(resolveCurrentMentionIndex(mentions, "1953-20", null)).toBe(0);
  });

  it("falls back to the current law when the article has no mention", () => {
    expect(resolveCurrentMentionIndex(mentions, "1953-20", "99")).toBe(0);
  });

  it("returns -1 when the subject is absent from the current law", () => {
    expect(resolveCurrentMentionIndex(mentions, "1667-20", "4")).toBe(-1);
  });

  it("returns -1 for empty mentions or missing law context", () => {
    expect(resolveCurrentMentionIndex([], "1953-20", "31")).toBe(-1);
    expect(resolveCurrentMentionIndex(mentions, null, "31")).toBe(-1);
  });
});
