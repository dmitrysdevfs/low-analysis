import type { TreeNode } from "@/types";
import type { Law } from "@/types";
import { parseElementCode } from "@/lib/tree";

export interface ArticleMention {
  lawId: string;
  articleNum: string;
  lawTitle: string;
  snippet: string;
  globalIdx: number;
}

export function buildMentions(
  elements: TreeNode[],
  lawsMap: Map<string, Law>,
): ArticleMention[] {
  const map = new Map<string, Omit<ArticleMention, "globalIdx">>();
  for (const el of elements) {
    if (!el.lawId) continue;
    const { articleNumber } = parseElementCode(el.code);
    if (!articleNumber) continue;
    const key = `${el.lawId}/${articleNumber}`;
    if (!map.has(key)) {
      map.set(key, {
        lawId: el.lawId,
        articleNum: articleNumber,
        lawTitle: lawsMap.get(el.lawId)?.title ?? el.lawId,
        snippet: el.text?.slice(0, 90) ?? el.title ?? "",
      });
    }
  }
  return Array.from(map.values()).map((m, i) => ({ ...m, globalIdx: i }));
}

export function resolveCurrentMentionIndex(
  mentions: ArticleMention[],
  currentLawId: string | null,
  currentArticleNum: string | null,
): number {
  if (!currentLawId || mentions.length === 0) return -1;
  if (currentArticleNum) {
    const exact = mentions.findIndex(
      (m) => m.lawId === currentLawId && m.articleNum === currentArticleNum,
    );
    if (exact !== -1) return exact;
  }
  return mentions.findIndex((m) => m.lawId === currentLawId);
}

export function buildArticlePartsMap(
  elements: TreeNode[],
): Map<string, TreeNode[]> {
  const map = new Map<string, TreeNode[]>();
  for (const el of elements) {
    if (!el.lawId || el.type === "article" || el.type === "section") continue;
    const { articleNumber } = parseElementCode(el.code);
    if (!articleNumber) continue;
    const key = `${el.lawId}/${articleNumber}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(el);
  }
  return map;
}
