import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import LegalPage from "@/app/legal/page";

vi.mock("@/components/layout/Layout", () => ({
  Layout: ({ children }: { children: ReactNode }) => (
    <div data-testid="legal-layout">{children}</div>
  ),
}));

describe("Legal page", () => {
  it("renders the legal and privacy sections with navigation links", () => {
    render(<LegalPage />);

    expect(screen.getByTestId("legal-layout")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Умови та конфіденційність" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Умови використання" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Політика конфіденційності" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /повернутись на головну/i }),
    ).toHaveAttribute("href", "/");
    expect(
      screen.getByRole("link", { name: /умови використання/i }),
    ).toHaveAttribute("href", "#terms");
  });
});
