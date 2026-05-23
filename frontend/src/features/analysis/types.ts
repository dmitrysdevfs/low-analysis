import type { Law, LawStats, Subject, TreeNode } from "@/types";
import type { RiskLevel } from "@/lib/tree";

export type FactorBand = "low" | "medium" | "high";

export interface AnalysisSubjectLink {
  id: string;
  name: string;
  role: string;
  color: string;
}

export interface AnalysisElementRecord {
  id: string;
  node: TreeNode;
  code: string;
  type: TreeNode["type"];
  depth: number;
  badge: string;
  label: string;
  text: string;
  excerpt: string;
  articleNumber: string | null;
  articleLabel: string;
  sectionLabel: string;
  charsCount: number;
  subjectsCount: number;
  riskLevel: RiskLevel;
  zScore: number;
  factor: number;
  factorBand: FactorBand;
  subjectLinks: AnalysisSubjectLink[];
}

export interface AnalysisHeatmapArticle {
  id: string;
  label: string;
  routeNumber: string | null;
  averageFactor: number;
  worstRisk: RiskLevel;
  cells: Array<{
    id: string;
    badge: string;
    factor: number;
    riskLevel: RiskLevel;
  }>;
}

export interface AnalysisTopSubject {
  id: string;
  name: string;
  mentions: number;
  roles: string[];
  color: string;
}

export interface AnalysisAnomaly {
  id: string;
  badge: string;
  articleLabel: string;
  factor: number;
  charsCount: number;
  subjectsCount: number;
  riskLevel: RiskLevel;
  excerpt: string;
}

export interface AnalysisHistogramBucket {
  label: string;
  count: number;
}

export interface AnalysisScatterPoint {
  id: string;
  label: string;
  chars: number;
  subjects: number;
  factor: number;
}

export interface AnalysisLawDataset {
  law: Law;
  stats: LawStats;
  records: AnalysisElementRecord[];
  filteredRecords: AnalysisElementRecord[];
  heatmap: AnalysisHeatmapArticle[];
  topSubjects: AnalysisTopSubject[];
  anomalies: AnalysisAnomaly[];
  histogram: AnalysisHistogramBucket[];
  scatter: AnalysisScatterPoint[];
  totalSubjectMentions: number;
  uniqueSubjects: number;
  highRiskCount: number;
  averageFactor: number;
  articleOptions: string[];
}

export interface GlobalTimelinePoint {
  label: string;
  cumulativeLaws: number;
  cumulativeArticles: number;
  cumulativeParagraphs: number;
}

export interface GlobalLawSpotlight {
  law: Law;
  densityScore: number;
  meanPerArticle: number;
  footprint: number;
}

export interface GlobalDistributionSegment {
  label: string;
  count: number;
  color: string;
}

export interface GlobalTopLawRow {
  id: string;
  title: string;
  code: string;
  articles: number;
  sections: number;
  paragraphs: number;
}

export interface GlobalAnalysisDataset {
  laws: Law[];
  subjects: Subject[];
  timeline: GlobalTimelinePoint[];
  topLaws: GlobalTopLawRow[];
  spotlightLaws: GlobalLawSpotlight[];
  subjectDistribution: GlobalDistributionSegment[];
  totalArticles: number;
  totalSections: number;
  totalParagraphs: number;
  totalSubjects: number;
  meanArticlesPerLaw: number;
  meanParagraphsPerLaw: number;
  coverage: {
    signatory: number;
    preamble: number;
  };
}
