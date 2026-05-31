import { render, screen } from "@testing-library/react";
import ArticlePage from "@/app/laws/[id]/articles/[num]/page";
import { useArticle } from "@/hooks/useArticle";
import { useLawsMap } from "@/hooks/useLawsMap";
import { useAmendments } from "@/hooks/useAmendments";
import { ARTICLE_RESPONSE_FIXTURE, LAW_FIXTURE } from "@/test/fixtures";
import { setMockParams } from "@/test/mocks/next-navigation";

vi.mock("@/hooks/useArticle", () => ({
  useArticle: vi.fn(),
}));

vi.mock("@/hooks/useAmendments", () => ({
  useAmendments: vi.fn(),
  useDeleteAmendment: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

vi.mock("@/hooks/useLawsMap", () => ({
  useLawsMap: vi.fn(),
}));

vi.mock("@/hooks/useSubjectsMap", () => ({
  useSubjectsMap: vi.fn(() => ({
    subjectsMap: new Map(),
    loading: false,
    error: null,
  })),
}));

describe("Article page", () => {
  beforeEach(() => {
    setMockParams({ id: LAW_FIXTURE._id, num: "1" });
    vi.mocked(useLawsMap).mockReturnValue({
      lawsMap: new Map([[LAW_FIXTURE._id, LAW_FIXTURE]]),
      laws: [LAW_FIXTURE],
      loading: false,
      error: null,
    });
    vi.mocked(useAmendments).mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useAmendments>);
  });

  it("renders article content and nested children", () => {
    vi.mocked(useArticle).mockReturnValue({
      fetchedKey: `${LAW_FIXTURE._id}:1`,
      article: ARTICLE_RESPONSE_FIXTURE.article,
      children: ARTICLE_RESPONSE_FIXTURE.children,
      error: null,
      loading: false,
    });

    render(<ArticlePage />);

    expect(screen.getAllByText(LAW_FIXTURE.title).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("heading", {
        name: ARTICLE_RESPONSE_FIXTURE.article.title!,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Вміст статті/i)).toBeInTheDocument();
    expect(
      screen.getByText(ARTICLE_RESPONSE_FIXTURE.children[0].text!),
    ).toBeInTheDocument();
  });

  it("renders the not-found state when the article is absent", () => {
    vi.mocked(useArticle).mockReturnValue({
      fetchedKey: `${LAW_FIXTURE._id}:1`,
      article: null,
      children: [],
      error: null,
      loading: false,
    });

    render(<ArticlePage />);

    expect(screen.getByText(/Статтю не знайдено/i)).toBeInTheDocument();
  });
});
