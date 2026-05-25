import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { LawCard } from "@/components/law/LawCard";
import { Layout } from "@/components/layout/Layout";
import layoutStyles from "@/components/Layout.module.scss";
import Footer from "@/layout/Footer/Footer";
import { LAW_FIXTURE } from "@/test/fixtures";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AUTH_SESSION_STORAGE_KEY } from "@/lib/auth/mockAuth";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("shell components", () => {
  it("renders breadcrumb items with links and a current item", () => {
    render(
      <Breadcrumb
        items={[{ label: "Закони", href: "/laws" }, { label: "Стаття 1" }]}
      />,
    );

    expect(screen.getByRole("link", { name: "Закони" })).toHaveAttribute(
      "href",
      "/laws",
    );
    expect(screen.getByText("Стаття 1")).toBeInTheDocument();
    expect(screen.getByLabelText("breadcrumb")).toBeInTheDocument();
  });

  it("applies full-height mode in Layout when requested", () => {
    const { rerender, container } = render(
      <Layout>
        <span>Вміст</span>
      </Layout>,
    );

    expect(container.firstChild).toHaveClass(layoutStyles.layout);
    expect(container.firstChild).not.toHaveClass(layoutStyles.layoutFullHeight);

    rerender(
      <Layout fullHeight>
        <span>Вміст</span>
      </Layout>,
    );

    expect(container.firstChild).toHaveClass(layoutStyles.layoutFullHeight);
  });

  it("renders law cards with title, code and counters", () => {
    render(<LawCard law={LAW_FIXTURE} index={0} />);

    expect(screen.getAllByText(LAW_FIXTURE.title).length).toBeGreaterThan(0);
    expect(screen.getByText(LAW_FIXTURE.code)).toBeInTheDocument();
    expect(screen.getByText("розділів")).toBeInTheDocument();
    expect(screen.getByText("статей")).toBeInTheDocument();
    expect(screen.getByText("абзаців")).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link")
        .some(
          (link) => link.getAttribute("href") === `/laws/${LAW_FIXTURE._id}`,
        ),
    ).toBe(true);
  });

  it("renders footer branding", () => {
    const Wrapper = createWrapper();
    render(<Footer />, { wrapper: Wrapper });
    expect(screen.getAllByText(/law\s+analysis/i).length).toBeGreaterThan(0);
  });

  it("renders API Docs link inside Footer for administrator session", async () => {
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

    const Wrapper = createWrapper();
    render(
      <AuthProvider>
        <Footer />
      </AuthProvider>,
      { wrapper: Wrapper },
    );

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: /Документація API/i }),
      ).toHaveAttribute("href", "https://low-analysis.onrender.com/api-docs");
    });
  });
});
