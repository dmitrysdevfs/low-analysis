import { deriveGlobalAnalysis } from "@/features/analysis/lib/deriveGlobalAnalysis";
import { deriveLawAnalysis } from "@/features/analysis/lib/deriveLawAnalysis";
import {
  LAW_FIXTURE,
  LAW_FIXTURE_2,
  SECTION_NODE,
  TREE_ARTICLE_NODE,
  PART_NODE,
  SUBJECT_FIXTURE,
} from "@/test/fixtures";
import type { LawStats, Subject, TreeNode } from "@/types";

const SUBJECT_FIXTURE_2: Subject = {
  _id: "subject-2",
  canonical_name: "Національний банк України",
  legal_status: "executive_body",
  aliases: ["НБУ"],
  createdAt: "2026-05-11T10:00:00.000Z",
};

describe("analysis derivations", () => {
  it("builds global analysis aggregates", () => {
    const dataset = deriveGlobalAnalysis(
      [LAW_FIXTURE, LAW_FIXTURE_2],
      [SUBJECT_FIXTURE, SUBJECT_FIXTURE_2],
    );

    expect(dataset.totalArticles).toBe(
      LAW_FIXTURE.totalArticles + LAW_FIXTURE_2.totalArticles,
    );
    expect(dataset.totalSections).toBe(
      LAW_FIXTURE.totalSections + LAW_FIXTURE_2.totalSections,
    );
    expect(dataset.subjectDistribution[0]?.count).toBeGreaterThan(0);
    expect(dataset.timeline).toHaveLength(2);
    expect(dataset.spotlightLaws[0]?.law._id).toBe(LAW_FIXTURE._id);
  });

  it("builds law analysis records, factor, anomalies and heatmap", () => {
    const stats: LawStats = {
      totalElements: 3,
      meanChars: 48,
      standardDeviation: 12,
      riskLevels: { green: 1, yellow: 1, red: 1, null: 0 },
    };

    const tree: TreeNode[] = [
      SECTION_NODE,
      {
        ...TREE_ARTICLE_NODE,
        subjects: [{ subject_id: SUBJECT_FIXTURE._id, role: "actor" }],
        chars_count: 32,
        z_score: 0.4,
        risk_level: "green",
      },
      {
        ...PART_NODE,
        parentId: TREE_ARTICLE_NODE._id,
        code: "rz1.st1.ch1",
        text: "Довгий та насичений суб'єктами елемент.",
        subjects: [
          { subject_id: SUBJECT_FIXTURE._id, role: "actor" },
          { subject_id: SUBJECT_FIXTURE_2._id, role: "regulator" },
        ],
        chars_count: 96,
        z_score: 2.4,
        risk_level: "red",
      },
    ];

    const dataset = deriveLawAnalysis(
      LAW_FIXTURE,
      tree,
      stats,
      new Map([
        [SUBJECT_FIXTURE._id, SUBJECT_FIXTURE],
        [SUBJECT_FIXTURE_2._id, SUBJECT_FIXTURE_2],
      ]),
      { risk: "all", factorBand: "all", article: "all", subjectsThreshold: 0 },
    );

    expect(dataset.records).toHaveLength(2);
    expect(dataset.uniqueSubjects).toBe(2);
    expect(dataset.totalSubjectMentions).toBe(3);
    expect(dataset.highRiskCount).toBeGreaterThan(0);
    expect(dataset.heatmap).toHaveLength(1);
    expect(dataset.anomalies[0]?.factor).toBeGreaterThanOrEqual(
      dataset.anomalies[1]?.factor ?? 0,
    );
    expect(dataset.filteredRecords[1]?.factor).toBeGreaterThan(
      dataset.filteredRecords[0]?.factor ?? 0,
    );
  });

  it("deduplicates repeated subject-role links inside one element", () => {
    const stats: LawStats = {
      totalElements: 1,
      meanChars: 24,
      standardDeviation: 8,
      riskLevels: { green: 1, yellow: 0, red: 0, null: 0 },
    };

    const tree: TreeNode[] = [
      {
        ...TREE_ARTICLE_NODE,
        subjects: [
          { subject_id: SUBJECT_FIXTURE._id, role: "other" },
          { subject_id: SUBJECT_FIXTURE._id, role: "other" },
        ],
        chars_count: 24,
        z_score: 0.1,
        risk_level: "green",
      },
    ];

    const dataset = deriveLawAnalysis(
      LAW_FIXTURE,
      tree,
      stats,
      new Map([[SUBJECT_FIXTURE._id, SUBJECT_FIXTURE]]),
      { risk: "all", factorBand: "all", article: "all", subjectsThreshold: 0 },
    );

    expect(dataset.records[0]?.subjectLinks).toHaveLength(1);
    expect(dataset.topSubjects[0]?.mentions).toBe(1);
  });
});
