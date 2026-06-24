import { fireEvent, render, screen } from "@testing-library/react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { setMockPathname } from "@/test/mocks/next-navigation";

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

describe("AdminShell", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        displayName: "Dev Admin",
        email: "admin@low-analysis.dev",
      },
    } as never);
  });

  it("renders the persistent admin navigation and site switch", () => {
    setMockPathname("/admin/billing");

    render(
      <AdminShell>
        <div>billing-module</div>
      </AdminShell>,
    );

    expect(screen.getAllByText("Адмін").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: "Публічний сайт" }),
    ).toHaveAttribute("href", "/");
    expect(screen.getByRole("heading", { name: "Білінг" })).toBeInTheDocument();
    expect(screen.getByText("billing-module")).toBeInTheDocument();
  });

  it("uses fallback copy for nested admin routes", () => {
    setMockPathname("/admin/users/deep-dive");

    render(
      <AdminShell>
        <div>nested-admin-child</div>
      </AdminShell>,
    );

    expect(
      screen.getByRole("heading", { name: "Користувачі" }),
    ).toBeInTheDocument();
    expect(screen.getByText("nested-admin-child")).toBeInTheDocument();
  });

  it("expands operational admin screens when the sidebar is collapsed", () => {
    setMockPathname("/admin");

    render(
      <AdminShell>
        <div>dashboard-module</div>
      </AdminShell>,
    );

    const main = screen.getByRole("main");

    expect(main).toHaveAttribute("data-content-mode", "default");

    fireEvent.click(
      screen.getByRole("button", { name: "Згорнути бічну панель" }),
    );

    expect(main).toHaveAttribute("data-content-mode", "expanded");
  });

  it("keeps detail and help screens constrained after sidebar collapse", () => {
    setMockPathname("/admin/help");

    render(
      <AdminShell>
        <div>help-module</div>
      </AdminShell>,
    );

    const main = screen.getByRole("main");

    fireEvent.click(
      screen.getByRole("button", { name: "Згорнути бічну панель" }),
    );

    expect(main).toHaveAttribute("data-content-mode", "default");
  });

  it("keeps dedicated wide-canvas routes full width", () => {
    setMockPathname("/admin/project-page");

    render(
      <AdminShell>
        <div>page-builder-module</div>
      </AdminShell>,
    );

    expect(screen.getByRole("main")).toHaveAttribute(
      "data-content-mode",
      "full",
    );
  });
});
