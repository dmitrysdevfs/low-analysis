import { render, screen } from "@testing-library/react";
import SubjectDetailPage from "@/app/subjects/[id]/page";
import SubjectsPage from "@/app/subjects/page";
import { useSubjectDetail } from "@/hooks/useSubjectDetail";
import { useSubjects } from "@/hooks/useSubjects";
import { ARTICLE_NODE, SUBJECT_FIXTURE } from "@/test/fixtures";
import { setMockParams } from "@/test/mocks/next-navigation";

vi.mock("@/hooks/useSubjects", () => ({
  useSubjects: vi.fn(),
}));

vi.mock("@/hooks/useSubjectDetail", () => ({
  useSubjectDetail: vi.fn(),
}));

vi.mock("@/hooks/useLawsMap", () => ({
  useLawsMap: vi.fn(() => ({
    lawsMap: new Map(),
    laws: [],
    loading: false,
    error: null,
  })),
}));

vi.mock("@/hooks/useTaxonomies", () => ({
  useTaxonomies: vi.fn(() => ({
    taxonomies: [],
    taxonomyMap: {},
    loading: false,
  })),
}));

describe("Subjects pages", () => {
  it("renders the subjects list and linked aliases", () => {
    vi.mocked(useSubjects).mockReturnValue({
      subjects: [SUBJECT_FIXTURE],
      error: null,
      loading: false,
    });

    render(<SubjectsPage />);

    expect(screen.getByText("Суб'єкти")).toBeInTheDocument();
    expect(screen.getByText("регулювання")).toBeInTheDocument();
    expect(screen.getByText(/Топ 1/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Переглянути деталі/i }),
    ).toHaveAttribute("href", `/subjects/${SUBJECT_FIXTURE._id}`);
    expect(screen.getByText("ФОП")).toBeInTheDocument();
  });

  it("renders subject details with aliases and linked elements", () => {
    setMockParams({ id: SUBJECT_FIXTURE._id });
    vi.mocked(useSubjectDetail).mockReturnValue({
      fetchedId: SUBJECT_FIXTURE._id,
      subject: SUBJECT_FIXTURE,
      elements: [ARTICLE_NODE],
      error: null,
      loading: false,
    });

    render(<SubjectDetailPage />);

    expect(
      screen.getByRole("heading", { name: SUBJECT_FIXTURE.canonical_name }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Псевдоніми \/ синоніми/i)).toBeInTheDocument();
    expect(screen.getByText(ARTICLE_NODE.text!)).toBeInTheDocument();
  });

  it("renders the empty linked-elements hint", () => {
    setMockParams({ id: SUBJECT_FIXTURE._id });
    vi.mocked(useSubjectDetail).mockReturnValue({
      fetchedId: SUBJECT_FIXTURE._id,
      subject: SUBJECT_FIXTURE,
      elements: [],
      error: null,
      loading: false,
    });

    render(<SubjectDetailPage />);

    expect(screen.getByText(/Елементів не знайдено/i)).toBeInTheDocument();
  });
});
