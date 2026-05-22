import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LawTreePage from "@/app/laws/[id]/page";
import { useLawTree } from "@/hooks/useLawTree";
import {
  LAW_FIXTURE,
  PART_NODE,
  SECTION_NODE,
  TREE_ARTICLE_NODE,
} from "@/test/fixtures";
import {
  setMockParams,
  setMockPathname,
  setMockSearchParams,
} from "@/test/mocks/next-navigation";
import type { TreeNode } from "@/types";

vi.mock("@/hooks/useLawTree", () => ({
  useLawTree: vi.fn(),
}));

vi.mock("@/hooks/useSubjectsMap", () => ({
  useSubjectsMap: () => ({ subjectsMap: new Map(), loading: false }),
}));

function createArticleNode(index: number): TreeNode {
  return {
    ...TREE_ARTICLE_NODE,
    _id: `article-${index}`,
    parentId: SECTION_NODE._id,
    code: `constitution.section-1.article-${index}`,
    number: String(index),
    title: `Стаття ${index}.`,
    text: `Назва статті ${index}`,
    order: index,
  };
}

function createOrphanParagraphNode(): TreeNode {
  return {
    _id: "orphan-paragraph-1",
    lawId: LAW_FIXTURE._id,
    parentId: SECTION_NODE._id,
    type: "paragraph",
    code: "rz1.abz999",
    number: "1",
    text: "Сирітський абзац не повинен з'являтися в загальному списку закону.",
    depth: 1,
    order: 999,
  };
}

describe("Law tree page", () => {
  it("renders sectioned articles and hides orphan nodes from the law list", () => {
    setMockParams({ id: LAW_FIXTURE._id });
    setMockPathname(`/laws/${LAW_FIXTURE._id}`);

    vi.mocked(useLawTree).mockReturnValue({
      fetchedId: LAW_FIXTURE._id,
      law: LAW_FIXTURE,
      tree: [
        { ...PART_NODE, parentId: TREE_ARTICLE_NODE._id },
        TREE_ARTICLE_NODE,
        SECTION_NODE,
        createOrphanParagraphNode(),
      ],
      error: null,
      loading: false,
    });

    render(<LawTreePage />);

    expect(
      screen.getByRole("heading", { name: LAW_FIXTURE.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /Загальні засади конституційного ладу/i,
      }),
    ).toHaveAttribute("href", `/laws/${LAW_FIXTURE._id}/articles/1`);
    expect(screen.getByText("Розділ I")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Сирітський абзац не повинен з'являтися в загальному списку закону.",
      ),
    ).not.toBeInTheDocument();
  });

  it("lets the reader limit the amount of visible articles", async () => {
    setMockParams({ id: LAW_FIXTURE._id });
    setMockPathname(`/laws/${LAW_FIXTURE._id}`);
    setMockSearchParams({ limit: "10" });

    vi.mocked(useLawTree).mockReturnValue({
      fetchedId: LAW_FIXTURE._id,
      law: LAW_FIXTURE,
      tree: [
        SECTION_NODE,
        ...Array.from({ length: 24 }, (_, index) => createArticleNode(index + 1)),
      ],
      error: null,
      loading: false,
    });

    render(<LawTreePage />);

    expect(screen.getByText("Показано 10 із 24 статей")).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Показувати статей" }),
    ).toHaveValue("10");
    expect(
      screen.getByRole("link", { name: "Назва статті 10" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Назва статті 11" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Показати ще" }));

    await waitFor(() => {
      expect(screen.getByText("Показано 20 із 24 статей")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("link", { name: "Назва статті 11" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("option", { name: "50" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Всі" }),
    ).toBeInTheDocument();
  });

  it("renders the tree request error", () => {
    setMockParams({ id: LAW_FIXTURE._id });
    setMockPathname(`/laws/${LAW_FIXTURE._id}`);

    vi.mocked(useLawTree).mockReturnValue({
      fetchedId: LAW_FIXTURE._id,
      law: LAW_FIXTURE,
      tree: [],
      error: "Помилка дерева",
      loading: false,
    });

    render(<LawTreePage />);

    expect(screen.getByText("Помилка дерева")).toBeInTheDocument();
  });

  it("renders loading and empty states", () => {
    setMockParams({ id: LAW_FIXTURE._id });
    setMockPathname(`/laws/${LAW_FIXTURE._id}`);

    vi.mocked(useLawTree).mockReturnValue({
      fetchedId: null,
      law: null,
      tree: [],
      error: null,
      loading: true,
    });

    const { rerender } = render(<LawTreePage />);
    expect(
      screen.getByLabelText("Завантажуємо структуру закону"),
    ).toBeInTheDocument();

    vi.mocked(useLawTree).mockReturnValue({
      fetchedId: LAW_FIXTURE._id,
      law: LAW_FIXTURE,
      tree: [SECTION_NODE],
      error: null,
      loading: false,
    });

    rerender(<LawTreePage />);
    expect(
      screen.getByText(/У цьому законі поки немає статей для відображення/i),
    ).toBeInTheDocument();
  });
});
