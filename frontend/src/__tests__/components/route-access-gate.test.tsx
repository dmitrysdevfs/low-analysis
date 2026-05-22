import { render, screen } from "@testing-library/react";
import { RouteAccessGate } from "@/components/auth/RouteAccessGate";
import { useAuth } from "@/components/auth/AuthProvider";
import { setMockPathname } from "@/test/mocks/next-navigation";

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

describe("RouteAccessGate", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      isHydrated: true,
      isAuthenticated: false,
      isAdmin: false,
      user: null,
    } as never);
  });

  it("shows the hydration state for protected routes before auth is restored", () => {
    setMockPathname("/admin");
    vi.mocked(useAuth).mockReturnValue({
      isHydrated: false,
      isAuthenticated: false,
      isAdmin: false,
      user: null,
    } as never);

    render(
      <RouteAccessGate>
        <div>protected-content</div>
      </RouteAccessGate>,
    );

    expect(screen.getByText("Відновлення сесії")).toBeInTheDocument();
    expect(screen.queryByText("protected-content")).not.toBeInTheDocument();
  });

  it("blocks unauthenticated admin access and offers login links", () => {
    setMockPathname("/admin/users");

    render(
      <RouteAccessGate>
        <div>protected-content</div>
      </RouteAccessGate>,
    );

    expect(
      screen.getByRole("link", { name: "Вхід адміністратора" }),
    ).toHaveAttribute("href", "/auth/login");
    expect(
      screen.getByRole("link", { name: "Зареєструвати адміна" }),
    ).toHaveAttribute("href", "/auth/register?role=admin");
  });

  it("blocks non-admin users on admin routes", () => {
    setMockPathname("/admin/audit");
    vi.mocked(useAuth).mockReturnValue({
      isHydrated: true,
      isAuthenticated: true,
      isAdmin: false,
      user: {
        displayName: "Client User",
      },
    } as never);

    render(
      <RouteAccessGate>
        <div>protected-content</div>
      </RouteAccessGate>,
    );

    expect(
      screen.getByRole("link", { name: "Повернутися на сайт" }),
    ).toHaveAttribute("href", "/");
    expect(
      screen.getByRole("link", { name: "Створити доступ адміна" }),
    ).toHaveAttribute("href", "/auth/register?role=admin");
  });

  it("blocks unauthenticated client workspace routes", () => {
    setMockPathname("/account/notes");

    render(
      <RouteAccessGate>
        <div>protected-content</div>
      </RouteAccessGate>,
    );

    expect(screen.getByRole("link", { name: "Увійти" })).toHaveAttribute(
      "href",
      "/auth/login",
    );
    expect(
      screen.getByRole("link", { name: "Створити акаунт" }),
    ).toHaveAttribute("href", "/auth/register?role=client");
  });

  it("lets authenticated users through protected client routes", () => {
    setMockPathname("/account");
    vi.mocked(useAuth).mockReturnValue({
      isHydrated: true,
      isAuthenticated: true,
      isAdmin: false,
      user: {
        displayName: "Client User",
      },
    } as never);

    render(
      <RouteAccessGate>
        <div>protected-content</div>
      </RouteAccessGate>,
    );

    expect(screen.getByText("protected-content")).toBeInTheDocument();
  });
});
