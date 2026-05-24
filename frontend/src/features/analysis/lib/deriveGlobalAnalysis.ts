import { getLegalStatusColor, getLegalStatusLabel } from "@/lib/tree";
import type { Law, Subject } from "@/types";
import type {
  GlobalAnalysisDataset,
  GlobalDistributionSegment,
  GlobalLawSpotlight,
  GlobalTimelinePoint,
  GlobalTopLawRow,
} from "../types";

function sortByDateAsc<
  T extends { createdAt: string; adoptedDate?: string | null },
>(items: T[]) {
  return [...items].sort(
    (left, right) =>
      new Date(left.adoptedDate ?? left.createdAt).getTime() -
      new Date(right.adoptedDate ?? right.createdAt).getTime(),
  );
}

function buildCorpusTimeline(laws: Law[]): GlobalTimelinePoint[] {
  let cumulativeLaws = 0;
  let cumulativeArticles = 0;
  let cumulativeParagraphs = 0;

  return sortByDateAsc(laws).map((law) => {
    cumulativeLaws += 1;
    cumulativeArticles += law.totalArticles;
    cumulativeParagraphs += law.totalParagraphs ?? 0;

    return {
      label: law.code,
      cumulativeLaws,
      cumulativeArticles,
      cumulativeParagraphs,
    };
  });
}

function buildTopLaws(laws: Law[]): GlobalTopLawRow[] {
  return [...laws]
    .sort((left, right) => {
      const leftWeight =
        left.totalArticles * 3 +
        left.totalSections +
        (left.totalParagraphs ?? 0);
      const rightWeight =
        right.totalArticles * 3 +
        right.totalSections +
        (right.totalParagraphs ?? 0);

      return rightWeight - leftWeight;
    })
    .slice(0, 6)
    .map((law) => ({
      id: law._id,
      title: law.title,
      code: law.code,
      articles: law.totalArticles,
      sections: law.totalSections,
      paragraphs: law.totalParagraphs ?? 0,
    }));
}

function buildLawSpotlights(laws: Law[]): GlobalLawSpotlight[] {
  return [...laws]
    .map((law) => {
      const footprint =
        law.totalArticles * 2 + law.totalSections + (law.totalParagraphs ?? 0);
      const meanPerArticle = law.totalArticles
        ? Math.round((law.totalParagraphs ?? 0) / law.totalArticles)
        : 0;
      const densityScore = Math.round(
        law.totalArticles * 1.2 + meanPerArticle * 3 + law.totalSections * 1.5,
      );

      return {
        law,
        densityScore,
        meanPerArticle,
        footprint,
      };
    })
    .sort((left, right) => right.densityScore - left.densityScore)
    .slice(0, 5);
}

function buildSubjectDistribution(
  subjects: Subject[],
): GlobalDistributionSegment[] {
  const counts = new Map<string, number>();

  for (const subject of subjects) {
    const key = subject.legal_status || "other";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([status, count]) => ({
      label: getLegalStatusLabel(status),
      count,
      color: getLegalStatusColor(status),
    }));
}

export function deriveGlobalAnalysis(
  laws: Law[],
  subjects: Subject[],
): GlobalAnalysisDataset {
  const totalArticles = laws.reduce((sum, law) => sum + law.totalArticles, 0);
  const totalSections = laws.reduce((sum, law) => sum + law.totalSections, 0);
  const totalParagraphs = laws.reduce(
    (sum, law) => sum + (law.totalParagraphs ?? 0),
    0,
  );

  const coverage = {
    signatory: laws.filter((law) => Boolean(law.signatory)).length,
    preamble: laws.filter((law) => Boolean(law.preamble)).length,
  };

  return {
    laws,
    subjects,
    timeline: buildCorpusTimeline(laws),
    topLaws: buildTopLaws(laws),
    spotlightLaws: buildLawSpotlights(laws),
    subjectDistribution: buildSubjectDistribution(subjects),
    totalArticles,
    totalSections,
    totalParagraphs,
    totalSubjects: subjects.length,
    meanArticlesPerLaw: laws.length
      ? Math.round(totalArticles / laws.length)
      : 0,
    meanParagraphsPerLaw: laws.length
      ? Math.round(totalParagraphs / laws.length)
      : 0,
    coverage,
  };
}
