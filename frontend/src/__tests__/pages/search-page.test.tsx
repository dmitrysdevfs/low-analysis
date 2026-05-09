import { render, screen } from "@testing-library/react";
import SearchPage from "@/app/search/page";
import { useSearch } from "@/hooks/useSearch";
import { LAW_FIXTURE } from "@/test/fixtures";

vi.mock("@/hooks/useSearch", () => ({
  useSearch: vi.fn(),
}));

vi.mock("@/components/SearchForm", () => ({
  SearchForm: ({
    loading,
    onSearch,
    onReset,
  }: {
    loading: boolean;
    onSearch: () => void;
    onReset: () => void;
  }) => (
    <div>
      SearchForm:{String(loading)}:{typeof onSearch}:{typeof onReset}
    </div>
  ),
}));

vi.mock("@/components/SearchResults", () => ({
  SearchResults: ({
    results,
    query,
  }: {
    results: Array<{ _id: string }>;
    query: string;
  }) => <div>SearchResults:{results.length}:{query}</div>,
}));

describe("Search page", () => {
  it("passes search state into the search form and results components", () => {
    vi.mocked(useSearch).mockReturnValue({
      results: [LAW_FIXTURE],
      loading: false,
      error: null,
      searched: true,
      params: {
        q: "конституція",
        wordField: "title",
        docType: "",
        dateFrom: "",
        dateTo: "",
        numberType: "starts",
        number: "",
        status: "",
        sort: "title",
      },
      search: vi.fn(),
      reset: vi.fn(),
    });

    render(<SearchPage />);

    expect(screen.getByText("SearchForm:false:function:function")).toBeInTheDocument();
    expect(screen.getByText("SearchResults:1:конституція")).toBeInTheDocument();
  });
});
