import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NotFound from "@/app/not-found";

describe("NotFound page", () => {
  it("renders the 404 state and navigation links", async () => {
    const user = userEvent.setup();

    render(<NotFound />);

    expect(screen.getAllByText("404")).toHaveLength(2);
    expect(screen.getByText(/Сторінку не знайдено/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /На головну/i })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: /Закони/i })).toHaveAttribute(
      "href",
      "/laws",
    );

    await user.pointer({
      target: screen.getAllByText("404")[0],
      coords: { clientX: 10, clientY: 10 },
    });
  });
});
