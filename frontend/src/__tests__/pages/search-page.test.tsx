import { render, screen } from "@testing-library/react";
import SearchPage from "@/app/search/page";

vi.mock("@/components/SearchForm", () => ({
  SearchForm: ({
    loading,
    onSearch,
    onReset,
  }: {
    loading: boolean;
    onSearch: () => void;
    onReset?: () => void;
  }) => (
    <div>
      SearchForm:{String(loading)}:{typeof onSearch}:{typeof onReset}
    </div>
  ),
}));

describe("Search page", () => {
  it("passes search handler into the search form", () => {
    render(<SearchPage />);

    expect(
      screen.getByText("SearchForm:false:function:undefined"),
    ).toBeInTheDocument();
  });
});
