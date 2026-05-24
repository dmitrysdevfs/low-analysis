import {
  buildTreeBranches,
  getArticleBadge,
  getNodeBadge,
  getNodeContent,
  getRoleColor,
} from "@/lib/tree";
import type { RiskLevel, TreeBranch } from "@/lib/tree";
import type { Law, LawStats, Subject, TreeNode } from "@/types";
import type {
  AnalysisAnomaly,
  AnalysisElementRecord,
  AnalysisHeatmapArticle,
  AnalysisHistogramBucket,
  AnalysisLawDataset,
  AnalysisScatterPoint,
  AnalysisTopSubject,
  FactorBand,
} from "../types";

const HISTOGRAM_BUCKETS = [120, 240, 400, 700, 1100];

function normalizeRisk(
  riskLevel: TreeNode["risk_level"],
  zScore: number,
): RiskLevel {
  if (riskLevel === "green" || riskLevel === "yellow" || riskLevel === "red") {
    return riskLevel;
  }

  if (zScore > 2) return "red";
  if (zScore > 1) return "yellow";
  return "green";
}

function getCharsCount(node: TreeNode) {
  return node.chars_count ?? node.text?.trim().length ?? 0;
}

function getSubjectsCount(node: TreeNode) {
  return node.subjects_count ?? node.subjects?.length ?? 0;
}

function buildFactor(
  node: TreeNode,
  stats: LawStats,
  charsCount: number,
  subjectsCount: number,
  riskLevel: RiskLevel,
  zScore: number,
) {
  const meanChars = Math.max(stats.meanChars || 0, 1);
  const std = Math.max(stats.standardDeviation || 0, 1);
  const lengthPressure = Math.max(0, (charsCount - meanChars) / std);
  const normalizedLength = Math.min(lengthPressure / 3, 1);
  const normalizedSubjects = Math.min(subjectsCount / 5, 1);
  const riskSeed =
    riskLevel === "red" ? 0.82 : riskLevel === "yellow" ? 0.54 : 0.26;
  const zSeed = Math.min(Math.abs(zScore) / 3, 1);

  const factor = Math.round(
    Math.min(
      100,
      riskSeed * 42 +
        normalizedLength * 28 +
        normalizedSubjects * 22 +
        zSeed * 8,
    ),
  );

  return Math.max(
    factor,
    riskLevel === "red" ? 65 : riskLevel === "yellow" ? 40 : 12,
  );
}

function getFactorBand(factor: number): FactorBand {
  if (factor >= 68) return "high";
  if (factor >= 38) return "medium";
  return "low";
}

function truncateText(value: string, max = 180) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trim()}…`;
}

function flattenBranches(
  branches: TreeBranch[],
  subjectsMap: Map<string, Subject>,
  stats: LawStats,
): AnalysisElementRecord[] {
  const records: AnalysisElementRecord[] = [];

  const visit = (
    node: TreeBranch,
    sectionLabel: string,
    articleNumber: string | null,
    articleLabel: string,
  ) => {
    if (node.type === "section") {
      const nextSection = node.title?.trim()
        ? `${node.number ? `${node.number} · ` : ""}${node.title.trim()}`
        : node.number
          ? `Розділ ${node.number}`
          : "Поза розділом";

      node.children.forEach((child) =>
        visit(child, nextSection, articleNumber, articleLabel),
      );
      return;
    }

    const nextArticleNumber =
      node.type === "article" ? (node.number?.trim() ?? null) : articleNumber;
    const nextArticleLabel =
      node.type === "article" ? getArticleBadge(node) : articleLabel;

    const text =
      getNodeContent(node) ?? node.title?.trim() ?? node.text?.trim() ?? "";
    const charsCount = getCharsCount(node);
    const subjectsCount = getSubjectsCount(node);
    const zScore = node.z_score ?? 0;
    const riskLevel = normalizeRisk(node.risk_level, zScore);
    const subjectLinksMap = new Map<
      string,
      AnalysisElementRecord["subjectLinks"][number]
    >();

    for (const subject of node.subjects ?? []) {
      const resolved = subjectsMap.get(subject.subject_id);
      if (!resolved) continue;

      const key = `${resolved._id}:${subject.role}`;
      if (subjectLinksMap.has(key)) continue;

      subjectLinksMap.set(key, {
        id: resolved._id,
        name: resolved.canonical_name,
        role: subject.role,
        color: getRoleColor(subject.role),
      });
    }

    const subjectLinks = [...subjectLinksMap.values()];
    const factor =
      typeof node.factor === "number" && Number.isFinite(node.factor)
        ? Math.round(Math.max(0, Math.min(100, node.factor)))
        : buildFactor(
            node,
            stats,
            charsCount,
            subjectsCount,
            riskLevel,
            zScore,
          );

    records.push({
      id: node._id ?? node.key,
      node,
      code: node.code,
      type: node.type,
      depth: node.depth,
      badge: getNodeBadge(node),
      label: nextArticleLabel,
      text,
      excerpt: truncateText(text),
      articleNumber: nextArticleNumber,
      articleLabel: nextArticleLabel,
      sectionLabel,
      charsCount,
      subjectsCount,
      riskLevel,
      zScore,
      factor,
      factorBand: getFactorBand(factor),
      subjectLinks,
      legalFunctions: node.taxonomy?.legalFunctions ?? [],
      domains: node.taxonomy?.domains ?? [],
    });

    node.children.forEach((child) =>
      visit(child, sectionLabel, nextArticleNumber, nextArticleLabel),
    );
  };

  branches.forEach((branch) =>
    visit(branch, "Поза розділом", null, "Без статті"),
  );

  return records.filter((record) => record.type !== "section");
}

function buildHeatmap(
  records: AnalysisElementRecord[],
): AnalysisHeatmapArticle[] {
  const map = new Map<string, AnalysisElementRecord[]>();

  for (const record of records) {
    const key = record.articleLabel;
    const bucket = map.get(key);
    if (bucket) {
      bucket.push(record);
    } else {
      map.set(key, [record]);
    }
  }

  return [...map.entries()].map(([label, nodes]) => {
    const averageFactor = Math.round(
      nodes.reduce((sum, node) => sum + node.factor, 0) / nodes.length,
    );
    const worstRisk = nodes.reduce<RiskLevel>((acc, node) => {
      if (node.riskLevel === "red" || acc === "red") return "red";
      if (node.riskLevel === "yellow" || acc === "yellow") return "yellow";
      return "green";
    }, "green");

    return {
      id: label,
      label,
      routeNumber: nodes[0]?.articleNumber ?? null,
      averageFactor,
      worstRisk,
      cells: nodes.map((node) => ({
        id: node.id,
        badge: node.badge,
        factor: node.factor,
        riskLevel: node.riskLevel,
      })),
    };
  });
}

function buildTopSubjects(
  records: AnalysisElementRecord[],
): AnalysisTopSubject[] {
  const map = new Map<
    string,
    { name: string; mentions: number; roles: Set<string>; color: string }
  >();

  for (const record of records) {
    for (const link of record.subjectLinks) {
      const current = map.get(link.id);
      if (current) {
        current.mentions += 1;
        current.roles.add(link.role);
      } else {
        map.set(link.id, {
          name: link.name,
          mentions: 1,
          roles: new Set([link.role]),
          color: link.color,
        });
      }
    }
  }

  return [...map.entries()]
    .map(([id, value]) => ({
      id,
      name: value.name,
      mentions: value.mentions,
      roles: [...value.roles],
      color: value.color,
    }))
    .sort((left, right) => right.mentions - left.mentions)
    .slice(0, 8);
}

function buildHistogram(
  records: AnalysisElementRecord[],
): AnalysisHistogramBucket[] {
  const buckets = [
    { label: `0–${HISTOGRAM_BUCKETS[0]}`, count: 0 },
    { label: `${HISTOGRAM_BUCKETS[0] + 1}–${HISTOGRAM_BUCKETS[1]}`, count: 0 },
    { label: `${HISTOGRAM_BUCKETS[1] + 1}–${HISTOGRAM_BUCKETS[2]}`, count: 0 },
    { label: `${HISTOGRAM_BUCKETS[2] + 1}–${HISTOGRAM_BUCKETS[3]}`, count: 0 },
    { label: `${HISTOGRAM_BUCKETS[3] + 1}–${HISTOGRAM_BUCKETS[4]}`, count: 0 },
    { label: `${HISTOGRAM_BUCKETS[4] + 1}+`, count: 0 },
  ];

  for (const record of records) {
    const chars = record.charsCount;
    if (chars <= HISTOGRAM_BUCKETS[0]) buckets[0].count += 1;
    else if (chars <= HISTOGRAM_BUCKETS[1]) buckets[1].count += 1;
    else if (chars <= HISTOGRAM_BUCKETS[2]) buckets[2].count += 1;
    else if (chars <= HISTOGRAM_BUCKETS[3]) buckets[3].count += 1;
    else if (chars <= HISTOGRAM_BUCKETS[4]) buckets[4].count += 1;
    else buckets[5].count += 1;
  }

  return buckets;
}

function buildScatter(
  records: AnalysisElementRecord[],
): AnalysisScatterPoint[] {
  return records.slice(0, 160).map((record) => ({
    id: record.id,
    label: `${record.badge} · ${record.articleLabel}`,
    chars: record.charsCount,
    subjects: record.subjectsCount,
    factor: record.factor,
  }));
}

function buildAnomalies(records: AnalysisElementRecord[]): AnalysisAnomaly[] {
  return [...records]
    .sort((left, right) => right.factor - left.factor)
    .slice(0, 8)
    .map((record) => ({
      id: record.id,
      badge: record.badge,
      articleLabel: record.articleLabel,
      factor: record.factor,
      charsCount: record.charsCount,
      subjectsCount: record.subjectsCount,
      riskLevel: record.riskLevel,
      excerpt: record.excerpt,
    }));
}

function fallbackStats(records: AnalysisElementRecord[]): LawStats {
  const totalElements = records.length;
  const meanChars = totalElements
    ? records.reduce((sum, record) => sum + record.charsCount, 0) /
      totalElements
    : 0;

  const standardDeviation = totalElements
    ? Math.sqrt(
        records.reduce((sum, record) => {
          const diff = record.charsCount - meanChars;
          return sum + diff * diff;
        }, 0) / totalElements,
      )
    : 0;

  return {
    totalElements,
    meanChars,
    standardDeviation,
    riskLevels: {
      green: records.filter((record) => record.riskLevel === "green").length,
      yellow: records.filter((record) => record.riskLevel === "yellow").length,
      red: records.filter((record) => record.riskLevel === "red").length,
      null: 0,
    },
  };
}

export function deriveLawAnalysis(
  law: Law,
  tree: TreeNode[],
  stats: LawStats | null,
  subjectsMap: Map<string, Subject>,
  filters?: {
    query?: string;
    risk?: "all" | RiskLevel;
    factorBand?: "all" | FactorBand;
    article?: "all" | string;
    subjectsThreshold?: number;
  },
): AnalysisLawDataset {
  const branches = buildTreeBranches(tree);
  const provisionalStats =
    stats ??
    fallbackStats(
      flattenBranches(branches, subjectsMap, {
        totalElements: 0,
        meanChars: 0,
        standardDeviation: 0,
        riskLevels: { green: 0, yellow: 0, red: 0, null: 0 },
      }),
    );

  const records = flattenBranches(branches, subjectsMap, provisionalStats);
  const finalStats = stats ?? fallbackStats(records);
  const normalizedRecords = stats
    ? records
    : flattenBranches(branches, subjectsMap, finalStats);
  const query = filters?.query?.trim().toLowerCase() ?? "";
  const riskFilter = filters?.risk ?? "all";
  const factorBand = filters?.factorBand ?? "all";
  const articleFilter = filters?.article ?? "all";
  const subjectsThreshold = filters?.subjectsThreshold ?? 0;

  const filteredRecords = normalizedRecords.filter((record) => {
    if (riskFilter !== "all" && record.riskLevel !== riskFilter) return false;
    if (factorBand !== "all" && record.factorBand !== factorBand) return false;
    if (articleFilter !== "all" && record.articleLabel !== articleFilter)
      return false;
    if (record.subjectsCount < subjectsThreshold) return false;
    if (!query) return true;

    return [
      record.badge,
      record.articleLabel,
      record.sectionLabel,
      record.excerpt,
      record.code,
      ...record.subjectLinks.map((item) => item.name),
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  const totalSubjectMentions = normalizedRecords.reduce(
    (sum, record) => sum + record.subjectsCount,
    0,
  );
  const uniqueSubjects = new Set(
    normalizedRecords.flatMap((record) =>
      record.subjectLinks.map((item) => item.id),
    ),
  ).size;
  const highRiskCount = normalizedRecords.filter(
    (record) => record.riskLevel === "red" || record.factor >= 68,
  ).length;
  const averageFactor = normalizedRecords.length
    ? Math.round(
        normalizedRecords.reduce((sum, record) => sum + record.factor, 0) /
          normalizedRecords.length,
      )
    : 0;
  const articleOptions = [
    ...new Set(normalizedRecords.map((record) => record.articleLabel)),
  ];

  return {
    law,
    stats: finalStats,
    records: normalizedRecords,
    filteredRecords,
    heatmap: buildHeatmap(normalizedRecords),
    topSubjects: buildTopSubjects(normalizedRecords),
    anomalies: buildAnomalies(normalizedRecords),
    histogram: buildHistogram(normalizedRecords),
    scatter: buildScatter(normalizedRecords),
    totalSubjectMentions,
    uniqueSubjects,
    highRiskCount,
    averageFactor,
    articleOptions,
  };
}
