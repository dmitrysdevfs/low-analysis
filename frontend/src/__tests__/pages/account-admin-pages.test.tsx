import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import AccountPage from "@/app/account/page";
import AccountBillingPage from "@/app/account/billing/page";
import AccountBillingCheckoutPage from "@/app/account/billing/checkout/page";
import AccountSavedPage from "@/app/account/saved/page";
import AdminPage from "@/app/admin/page";
import AdminUsersPage from "@/app/admin/users/page";
import AdminBillingPage from "@/app/admin/billing/page";
import AdminAccessPage from "@/app/admin/access/page";
import AdminCodesPage from "@/app/admin/codes/page";
import AdminAuditPage from "@/app/admin/audit/page";
import AdminAnalyticsPage from "@/app/admin/analytics/page";
import AdminLayout from "@/app/admin/layout";

vi.mock("@/components/layout/Layout", () => ({
  Layout: ({
    children,
    fullHeight,
  }: {
    children: ReactNode;
    fullHeight?: boolean;
  }) => (
    <div data-testid="layout" data-full-height={String(Boolean(fullHeight))}>
      {children}
    </div>
  ),
}));

vi.mock("@/components/account/ClientWorkspaceHome", () => ({
  ClientWorkspaceHome: () => <div>workspace-home</div>,
}));

vi.mock("@/components/account/ClientBillingOverview", () => ({
  ClientBillingOverview: () => <div>billing-overview</div>,
}));

vi.mock("@/components/account/CheckoutDemo", () => ({
  CheckoutDemo: () => <div>checkout-demo</div>,
}));

vi.mock("@/components/account/ClientWorkspaceSaved", () => ({
  ClientWorkspaceSaved: () => <div>workspace-saved</div>,
}));

vi.mock("@/components/admin/AdminDashboardView", () => ({
  AdminDashboardView: () => <div>admin-dashboard-view</div>,
}));

vi.mock("@/features/admin/AccessRequestsPanel", () => ({
  AccessRequestsPanel: () => null,
}));

vi.mock("@/components/admin/AdminUsersView", () => ({
  AdminUsersView: () => <div>admin-users-view</div>,
}));

vi.mock("@/components/admin/AdminBillingView", () => ({
  AdminBillingView: () => <div>admin-billing-view</div>,
}));

vi.mock("@/components/admin/AdminAccessView", () => ({
  AdminAccessView: () => <div>admin-access-view</div>,
}));

vi.mock("@/components/admin/AdminCodesView", () => ({
  AdminCodesView: () => <div>admin-codes-view</div>,
}));

vi.mock("@/components/admin/AdminAuditView", () => ({
  AdminAuditView: () => <div>admin-audit-view</div>,
}));

vi.mock("@/components/admin/AdminAnalyticsView", () => ({
  AdminAnalyticsView: () => <div>admin-analytics-view</div>,
}));

vi.mock("@/components/admin/AdminShell", () => ({
  AdminShell: ({ children }: { children: ReactNode }) => (
    <div data-testid="admin-shell">{children}</div>
  ),
}));

describe("account and admin route wrappers", () => {
  it("renders account workspace inside full-height layout", () => {
    render(<AccountPage />);

    expect(screen.getByTestId("layout")).toHaveAttribute(
      "data-full-height",
      "true",
    );
    expect(screen.getByText("workspace-home")).toBeInTheDocument();
  });

  it("renders account billing inside full-height layout", () => {
    render(<AccountBillingPage />);

    expect(screen.getByText("billing-overview")).toBeInTheDocument();
    expect(screen.getByTestId("layout")).toHaveAttribute(
      "data-full-height",
      "true",
    );
  });

  it("renders checkout demo inside full-height layout", () => {
    render(<AccountBillingCheckoutPage />);

    expect(screen.getByText("checkout-demo")).toBeInTheDocument();
    expect(screen.getByTestId("layout")).toHaveAttribute(
      "data-full-height",
      "true",
    );
  });

  it("renders saved workspace inside full-height layout", () => {
    render(<AccountSavedPage />);

    expect(screen.getByText("workspace-saved")).toBeInTheDocument();
    expect(screen.getByTestId("layout")).toHaveAttribute(
      "data-full-height",
      "true",
    );
  });

  it("renders each admin page with its dedicated view", () => {
    const pages = [
      [<AdminPage key="dashboard" />, "admin-dashboard-view"],
      [<AdminUsersPage key="users" />, "admin-users-view"],
      [<AdminBillingPage key="billing" />, "admin-billing-view"],
      [<AdminAccessPage key="access" />, "admin-access-view"],
      [<AdminCodesPage key="codes" />, "admin-codes-view"],
      [<AdminAuditPage key="audit" />, "admin-audit-view"],
      [<AdminAnalyticsPage key="analytics" />, "admin-analytics-view"],
    ] as const;

    for (const [page, marker] of pages) {
      const { unmount } = render(page);
      expect(screen.getByText(marker)).toBeInTheDocument();
      unmount();
    }
  });

  it("wraps admin children with the admin shell layout", () => {
    render(
      <AdminLayout>
        <div>admin-child-content</div>
      </AdminLayout>,
    );

    expect(screen.getByTestId("admin-shell")).toBeInTheDocument();
    expect(screen.getByText("admin-child-content")).toBeInTheDocument();
  });
});
