import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppHeader } from "@/components/AppHeader";
import { Dialog } from "@/components/Dialog";
import { LawStructureList } from "@/components/LawStructureList";
import { SearchForm } from "@/components/SearchForm";
import { SearchResults } from "@/components/SearchResults";
import { SkeletonCard } from "@/components/SkeletonCard";
import { TreeNode } from "@/components/TreeNode";
import { buildLawSections } from "@/lib/lawTree";
import {
  ARTICLE_NODE,
  LAW_FIXTURE,
  LAW_FIXTURE_2,
  PART_NODE,
  SECTION_NODE,
  TREE_ARTICLE_NODE,
} from "@/test/fixtures";
import { setMockPathname } from "@/test/mocks/next-navigation";

describe("interactive frontend components", () => {
  it("highlights the active nav item in AppHeader", () => {
    setMockPathname("/subjects/subject-1");

    render(<AppHeader />);

    expect(screen.getByRole("link", { name: "Low Analysis" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Суб'єкти" })).toHaveClass(
      "active",
    );
  });

  it("renders skeleton card shell", () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).toHaveClass("panel");
  });

  it("toggles section children and selects leaf nodes in TreeNode", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <TreeNode node={SECTION_NODE} activeCode={null} onSelect={onSelect}>
        {[ARTICLE_NODE]}
      </TreeNode>,
    );

    expect(screen.getByText(ARTICLE_NODE.title!)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Розділ I/i }));
    expect(screen.queryByText(ARTICLE_NODE.title!)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Розділ I/i }));
    await user.click(screen.getByRole("button", { name: /Стаття 1/i }));

    expect(onSelect).toHaveBeenCalledWith(ARTICLE_NODE);
  });

  it("submits and resets search form parameters", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onReset = vi.fn();

    render(<SearchForm onSearch={onSearch} onReset={onReset} />);

    const selects = screen.getAllByRole("combobox");

    await user.type(
      screen.getByPlaceholderText("Введіть ключові слова..."),
      "конституція",
    );
    const dateInputs = screen.getAllByPlaceholderText("дд.мм.рррр");

    await user.type(dateInputs[0], "10052026");
    await user.type(dateInputs[1], "11052026");
    await user.type(
      screen.getByPlaceholderText("Код або номер акта..."),
      "254",
    );
    await user.selectOptions(selects[1], "ЗАКОН УКРАЇНИ");
    await user.selectOptions(selects[4], "title");
    await user.click(screen.getByRole("button", { name: /Шукати/i }));

    expect(onSearch).toHaveBeenCalledWith({
      q: "конституція",
      wordField: "title",
      docType: "ЗАКОН УКРАЇНИ",
      dateFrom: "2026-05-10",
      dateTo: "2026-05-11",
      numberType: "starts",
      number: "254",
      status: "",
      sort: "title",
    });

    await user.click(screen.getByRole("button", { name: /Очистити/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("renders loading, empty, error and results states in SearchResults", () => {
    const { rerender } = render(
      <SearchResults
        results={[]}
        loading={false}
        error={null}
        searched={false}
        query=""
      />,
    );

    expect(screen.getByText(/Введіть запит/i)).toBeInTheDocument();

    rerender(
      <SearchResults
        results={[]}
        loading
        error={null}
        searched={false}
        query=""
      />,
    );
    expect(
      screen.getByLabelText("Завантаження результатів пошуку"),
    ).toBeInTheDocument();

    rerender(
      <SearchResults
        results={[]}
        loading={false}
        error="Помилка пошуку"
        searched
        query="конституція"
      />,
    );
    expect(screen.getByText("Помилка пошуку")).toBeInTheDocument();

    rerender(
      <SearchResults
        results={[]}
        loading={false}
        error={null}
        searched
        query="конституція"
      />,
    );
    expect(screen.getByText(/Нічого не знайдено/i)).toBeInTheDocument();

    rerender(
      <SearchResults
        results={[LAW_FIXTURE, LAW_FIXTURE_2]}
        loading={false}
        error={null}
        searched
        query="закон"
      />,
    );
    expect(
      screen.getByText(/Результат пошуку/i, { selector: "div.mono" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /КОНСТИТУЦІЯ УКРАЇНИ/i }),
    ).toHaveAttribute("href", `/laws/${LAW_FIXTURE._id}`);
    expect(screen.getByText("1.")).toBeInTheDocument();
  });

  it("renders nested article structure and toggles it open", async () => {
    const user = userEvent.setup();

    render(
      <LawStructureList
        lawId={LAW_FIXTURE._id}
        sections={buildLawSections([
          SECTION_NODE,
          TREE_ARTICLE_NODE,
          { ...PART_NODE, parentId: TREE_ARTICLE_NODE._id },
        ])}
      />,
    );

    expect(
      screen.getByRole("link", {
        name: /Загальні засади конституційного ладу/i,
      }),
    ).toHaveAttribute("href", `/laws/${LAW_FIXTURE._id}/articles/1`);

    await user.click(
      screen.getByRole("button", { name: /Показати структуру/i }),
    );

    expect(screen.getByText(PART_NODE.text!)).toBeInTheDocument();
  });

  it("renders dialog content and closes via the close button", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <Dialog
        open
        onOpenChange={onOpenChange}
        title="Діалог"
        description="Опис"
      >
        <div>Вміст діалогу</div>
      </Dialog>,
    );

    expect(screen.getByText("Діалог")).toBeInTheDocument();
    expect(screen.getByText("Опис")).toBeInTheDocument();
    expect(screen.getByText("Вміст діалогу")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Закрити" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
