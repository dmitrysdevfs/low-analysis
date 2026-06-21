import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import AccountPage from "@/app/account/page";
import AccountBillingPage from "@/app/account/billing/page";
import AccountSavedPage from "@/app/account/saved/page";
import AdminPage from "@/app/admin/page";
import AdminUsersPage from "@/app/admin/users/page";
import AdminBillingPage from "@/app/admin/billing/page";
import AdminAccessPage from "@/app/admin/access/page";
import AdminCodesPage from "@/app/admin/codes/page";
import AdminAuditPage from "@/app/admin/audit/page";
import AdminAnalyticsPage from "@/app/admin/analytics/page";
import AdminLayout from "@/app/admin/layout";

vi.mock("@/features/account1/AccountDashboard", () => ({
  AccountDashboard: () => (
    <div data-testid="account-dashboard">account-dashboard</div>
  ),
}));

vi.mock("@/features/account1/BillingDashboard", () => ({
  BillingDashboard: () => (
    <div data-testid="billing-dashboard">billing-dashboard</div>
  ),
}));

vi.mock("@/features/account1/SavedDashboard", () => ({
  SavedDashboard: () => (
    <div data-testid="saved-dashboard">saved-dashboard</div>
  ),
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
  it("renders account dashboard", () => {
    render(<AccountPage />);
    expect(screen.getByTestId("account-dashboard")).toBeInTheDocument();
  });

  it("renders billing dashboard", () => {
    render(<AccountBillingPage />);
    expect(screen.getByTestId("billing-dashboard")).toBeInTheDocument();
  });

  it("renders saved dashboard", () => {
    render(<AccountSavedPage />);
    expect(screen.getByTestId("saved-dashboard")).toBeInTheDocument();
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
