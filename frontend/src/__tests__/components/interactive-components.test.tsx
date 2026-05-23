import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppHeader } from "@/components/layout/AppHeader";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Dialog } from "@/components/ui/Dialog";
import { LawStructureList } from "@/components/law/LawStructureList";
import { SearchForm } from "@/components/search/SearchForm";
import { SearchResults } from "@/components/search/SearchResults";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { NestedNodeList } from "@/components/article/ArticleTreeNode";
import type { TreeBranch } from "@/lib/tree";
import { AUTH_SESSION_STORAGE_KEY } from "@/lib/auth/mockAuth";
import { buildLawSections } from "@/lib/tree";
import {
  LAW_FIXTURE,
  LAW_FIXTURE_2,
  PART_NODE,
  SECTION_NODE,
  TREE_ARTICLE_NODE,
} from "@/test/fixtures";
import { setMockPathname } from "@/test/mocks/next-navigation";

describe("interactive frontend components", () => {
  it("highlights the active nav item in AppHeader for guest view", () => {
    setMockPathname("/subjects/subject-1");

    render(<AppHeader />);

    expect(screen.getByRole("link", { name: "Law Analysis" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: /Вхід/i })).toHaveAttribute(
      "href",
      "/auth",
    );
    expect(screen.getByRole("link", { name: "Суб'єкти" })).toHaveClass(
      "active",
    );
  });

  it("shows admin switch and logout controls for administrator session", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({
        id: "admin-1",
        displayName: "Root Admin",
        email: "admin@low.test",
        roles: ["admin", "client"],
        accountType: "admin",
        lastLoginAt: "2026-05-17T10:00:00.000Z",
      }),
    );
    setMockPathname("/laws");

    render(
      <AuthProvider>
        <AppHeader />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: "Панель адміна" }),
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Сайт" })).toHaveAttribute(
        "href",
        "/",
      );
    });

    await user.click(
      screen.getByRole("button", { name: "Відкрити меню акаунту" }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("menuitem", { name: "Вийти з акаунту" }),
      ).toBeInTheDocument();
    });
  });

  it("renders skeleton card shell", () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).toHaveClass("panel");
  });

  it("NestedNodeList renders charCount when node.text is non-empty", () => {
    const branch: TreeBranch = {
      ...PART_NODE,
      key: PART_NODE.code ?? "part-1",
      children: [],
    };

    render(<NestedNodeList nodes={[branch]} />);

    expect(
      screen.getByText(String(PART_NODE.text!.length)),
    ).toBeInTheDocument();
  });

  it("NestedNodeList does not render charCount when node.text is absent", () => {
    const branch: TreeBranch = {
      ...SECTION_NODE,
      key: SECTION_NODE.code ?? "section-1",
      children: [],
    };

    const { container } = render(<NestedNodeList nodes={[branch]} />);

    expect(container.querySelector(".charCount")).toBeNull();
  });

  it("submits and resets search form parameters", () => {
    const onSearch = vi.fn();
    const onReset = vi.fn();

    render(<SearchForm onSearch={onSearch} onReset={onReset} />);

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(
      screen.getByPlaceholderText("Введіть ключові слова..."),
      { target: { value: "конституція" } },
    );

    const dateInputs = screen.getAllByPlaceholderText("дд.мм.рррр");
    fireEvent.change(dateInputs[0], { target: { value: "10.05.2026" } });
    fireEvent.change(dateInputs[1], { target: { value: "11.05.2026" } });
    fireEvent.change(screen.getByPlaceholderText("Код або номер акта..."), {
      target: { value: "254" },
    });
    fireEvent.change(selects[1], { target: { value: "ЗАКОН УКРАЇНИ" } });
    fireEvent.change(selects[4], { target: { value: "title" } });
    fireEvent.submit(screen.getByRole("button", { name: /Шукати/i }));

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

    fireEvent.click(screen.getByRole("button", { name: /Очистити/i }));
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
