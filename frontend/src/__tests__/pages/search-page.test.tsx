import { act, render, screen } from "@testing-library/react";
import SearchPage from "@/app/search/page";
import { getRouterMock } from "@/test/mocks/next-navigation";

type SearchFormProps = {
  loading: boolean;
  onSearch: (params: Record<string, string>) => void;
  onReset?: () => void;
};

let capturedOnSearch: SearchFormProps["onSearch"] | null = null;

vi.mock("@/components/search/SearchForm", () => ({
  SearchForm: ({ loading, onSearch, onReset }: SearchFormProps) => {
    capturedOnSearch = onSearch;
    return (
      <div>
        SearchForm:{String(loading)}:{typeof onSearch}:{typeof onReset}
      </div>
    );
  },
}));

describe("Search page", () => {
  beforeEach(() => {
    capturedOnSearch = null;
  });

  it("passes search handler into the search form", () => {
    render(<SearchPage />);

    expect(
      screen.getByText("SearchForm:false:function:undefined"),
    ).toBeInTheDocument();
  });

  it("navigates to results page with correct query params on search", () => {
    render(<SearchPage />);

    act(() => {
      capturedOnSearch?.({ q: "конституція", sort: "date", docType: "" });
    });

    expect(getRouterMock().push).toHaveBeenCalledWith(
      expect.stringContaining("/search/results"),
    );
    const pushArg = getRouterMock().push.mock.calls[0]?.[0] as string;
    const url = new URL(pushArg, "https://test.test");
    expect(url.searchParams.get("q")).toBe("конституція");
    expect(url.searchParams.get("sort")).toBe("date");
    expect(url.searchParams.has("docType")).toBe(false);
  });
});
