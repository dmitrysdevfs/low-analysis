import { fireEvent, render, screen } from "@testing-library/react";
import AnalysisLawPage from "@/app/analysis/laws/[id]/page";
import AnalysisPage from "@/app/analysis/page";
import { useGlobalAnalysis } from "@/features/analysis/hooks/useGlobalAnalysis";
import { useLawAnalysis } from "@/features/analysis/hooks/useLawAnalysis";
import { useLaws } from "@/hooks/useLaws";
import {
  LAW_FIXTURE,
  LAW_FIXTURE_2,
  PART_NODE,
  SUBJECT_FIXTURE,
  TREE_ARTICLE_NODE,
} from "@/test/fixtures";
import { setMockParams } from "@/test/mocks/next-navigation";

vi.mock("@/features/analysis/hooks/useGlobalAnalysis", () => ({
  useGlobalAnalysis: vi.fn(),
}));

vi.mock("@/features/analysis/hooks/useLawAnalysis", () => ({
  useLawAnalysis: vi.fn(),
}));

vi.mock("@/hooks/useLaws", () => ({
  useLaws: vi.fn(),
}));

describe("Analysis pages", () => {
  it("renders the global analysis overview and law picker", () => {
    vi.mocked(useGlobalAnalysis).mockReturnValue({
      loading: false,
      error: null,
      laws: [LAW_FIXTURE, LAW_FIXTURE_2],
      subjects: [SUBJECT_FIXTURE],
      dataset: {
        laws: [LAW_FIXTURE, LAW_FIXTURE_2],
        subjects: [SUBJECT_FIXTURE],
        timeline: [
          {
            label: LAW_FIXTURE.code,
            cumulativeLaws: 1,
            cumulativeArticles: LAW_FIXTURE.totalArticles,
            cumulativeParagraphs: LAW_FIXTURE.totalParagraphs ?? 0,
          },
        ],
        topLaws: [
          {
            id: LAW_FIXTURE._id,
            title: LAW_FIXTURE.title,
            code: LAW_FIXTURE.code,
            articles: LAW_FIXTURE.totalArticles,
            sections: LAW_FIXTURE.totalSections,
            paragraphs: LAW_FIXTURE.totalParagraphs ?? 0,
          },
        ],
        spotlightLaws: [
          {
            law: LAW_FIXTURE,
            densityScore: 88,
            meanPerArticle: 3,
            footprint: 540,
          },
        ],
        subjectDistribution: [
          {
            label: "Фізична особа",
            count: 1,
            color: "#4a80d4",
          },
        ],
        totalArticles: LAW_FIXTURE.totalArticles + LAW_FIXTURE_2.totalArticles,
        totalSections: LAW_FIXTURE.totalSections + LAW_FIXTURE_2.totalSections,
        totalParagraphs:
          (LAW_FIXTURE.totalParagraphs ?? 0) +
          (LAW_FIXTURE_2.totalParagraphs ?? 0),
        totalSubjects: 1,
        meanArticlesPerLaw: 99,
        meanParagraphsPerLaw: 280,
        coverage: { signatory: 0, preamble: 2 },
      },
    });

    render(<AnalysisPage />);

    expect(
      screen.getByRole("heading", { name: /бачимо всю/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /обрати закон для deep-dive/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /конституція/i }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/структурно насичені акти/i)).toBeInTheDocument();
  });

  it("renders the law analysis dashboard with registry and filters", () => {
    setMockParams({ id: LAW_FIXTURE._id });

    vi.mocked(useLaws).mockReturnValue({
      fetchedQ: "",
      fetchedRefreshKey: 0,
      laws: [LAW_FIXTURE, LAW_FIXTURE_2],
      error: null,
      loading: false,
    });

    vi.mocked(useLawAnalysis).mockReturnValue({
      loading: false,
      error: null,
      law: LAW_FIXTURE,
      tree: [TREE_ARTICLE_NODE, PART_NODE],
      stats: {
        totalElements: 2,
        meanChars: 64,
        standardDeviation: 16,
        riskLevels: { green: 1, yellow: 0, red: 1, null: 0 },
      },
      subjectsMap: new Map([[SUBJECT_FIXTURE._id, SUBJECT_FIXTURE]]),
      dataset: {
        law: LAW_FIXTURE,
        stats: {
          totalElements: 2,
          meanChars: 64,
          standardDeviation: 16,
          riskLevels: { green: 1, yellow: 0, red: 1, null: 0 },
        },
        records: [
          {
            id: "node-1",
            node: TREE_ARTICLE_NODE,
            code: TREE_ARTICLE_NODE.code,
            type: TREE_ARTICLE_NODE.type,
            depth: 1,
            badge: "1",
            label: "Стаття 1",
            text: "Норма закону",
            excerpt: "Норма закону",
            articleNumber: "1",
            articleLabel: "Стаття 1",
            sectionLabel: "Розділ I",
            charsCount: 22,
            subjectsCount: 1,
            riskLevel: "green",
            zScore: 0.4,
            factor: 18,
            factorBand: "low",
            subjectLinks: [
              {
                id: SUBJECT_FIXTURE._id,
                name: SUBJECT_FIXTURE.canonical_name,
                role: "actor",
                color: "#c8a843",
              },
            ],
          },
        ],
        filteredRecords: [
          {
            id: "node-1",
            node: TREE_ARTICLE_NODE,
            code: TREE_ARTICLE_NODE.code,
            type: TREE_ARTICLE_NODE.type,
            depth: 1,
            badge: "1",
            label: "Стаття 1",
            text: "Норма закону",
            excerpt: "Норма закону",
            articleNumber: "1",
            articleLabel: "Стаття 1",
            sectionLabel: "Розділ I",
            charsCount: 22,
            subjectsCount: 1,
            riskLevel: "green",
            zScore: 0.4,
            factor: 18,
            factorBand: "low",
            subjectLinks: [
              {
                id: SUBJECT_FIXTURE._id,
                name: SUBJECT_FIXTURE.canonical_name,
                role: "actor",
                color: "#c8a843",
              },
            ],
          },
        ],
        heatmap: [
          {
            id: "art-1",
            label: "Стаття 1",
            routeNumber: "1",
            averageFactor: 18,
            worstRisk: "green",
            cells: [
              {
                id: "node-1",
                badge: "1",
                factor: 18,
                riskLevel: "green",
              },
            ],
          },
        ],
        topSubjects: [
          {
            id: SUBJECT_FIXTURE._id,
            name: SUBJECT_FIXTURE.canonical_name,
            mentions: 1,
            roles: ["actor"],
            color: "#c8a843",
          },
        ],
        anomalies: [
          {
            id: "node-1",
            badge: "1",
            articleLabel: "Стаття 1",
            factor: 18,
            charsCount: 22,
            subjectsCount: 1,
            riskLevel: "green",
            excerpt: "Норма закону",
          },
        ],
        histogram: [{ label: "0–120", count: 1 }],
        scatter: [
          {
            id: "node-1",
            label: "Стаття 1 · 1",
            chars: 22,
            subjects: 1,
            factor: 18,
          },
        ],
        totalSubjectMentions: 1,
        uniqueSubjects: 1,
        highRiskCount: 0,
        averageFactor: 18,
        articleOptions: ["Стаття 1"],
      },
    });

    render(<AnalysisLawPage />);

    expect(
      screen.getByRole("heading", { name: LAW_FIXTURE.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /точне налаштування зрізу/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/аналітична таблиця норм/i)).toBeInTheDocument();
    expect(screen.getAllByText(/норма закону/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: /до структури закону/i }),
    ).toHaveAttribute("href", `/laws/${LAW_FIXTURE._id}`);

    const anomalyButton = screen
      .getAllByRole("button")
      .find((button) => button.textContent?.includes("factor 18"));

    expect(anomalyButton).toBeDefined();

    fireEvent.click(anomalyButton as HTMLButtonElement);

    expect(
      screen.getByRole("button", { name: /весь factor/i }),
    ).toBeInTheDocument();
  });
});
