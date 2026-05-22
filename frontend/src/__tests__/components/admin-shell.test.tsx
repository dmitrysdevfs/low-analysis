import { render, screen } from "@testing-library/react";
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
    expect(screen.getByRole("link", { name: "Публічний сайт" })).toHaveAttribute(
      "href",
      "/",
    );
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

    expect(screen.getByRole("heading", { name: "Користувачі" })).toBeInTheDocument();
    expect(screen.getByText("nested-admin-child")).toBeInTheDocument();
  });
});
