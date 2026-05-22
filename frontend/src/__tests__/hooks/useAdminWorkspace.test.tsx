import { act, renderHook, waitFor } from "@testing-library/react";
import { useAdminWorkspace } from "@/components/admin/useAdminWorkspace";
import { useAuth } from "@/components/auth/AuthProvider";
import { useBilling } from "@/components/billing/BillingProvider";
import { notify } from "@/lib/toast";
import {
  appendAdminAuditLog,
  deactivateMockAccount,
  forceLogoutMockAccount,
  getAdminDashboardSnapshot,
  promoteMockAccount,
  regenerateAdminSuperCode,
} from "@/lib/auth/mockAuth";

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/components/billing/BillingProvider", () => ({
  useBilling: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  notify: {
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/lib/auth/mockAuth", () => ({
  appendAdminAuditLog: vi.fn(),
  deactivateMockAccount: vi.fn(),
  forceLogoutMockAccount: vi.fn(),
  getAdminDashboardSnapshot: vi.fn(),
  promoteMockAccount: vi.fn(),
  regenerateAdminSuperCode: vi.fn(),
}));

const SNAPSHOT_FIXTURE = {
  totalAccounts: 3,
  clientAccounts: 2,
  adminAccounts: 1,
  protectedRoutes: 7,
  activeSessionRole: "admin",
  latestAccounts: [],
  registryAccounts: [
    {
      id: "client-1",
      displayName: "Alice",
      email: "alice@test.dev",
      accountType: "client",
      status: "active",
      roles: ["client"],
      createdAt: "2026-05-20T00:00:00.000Z",
      source: "stored",
      superCodeProtected: false,
    },
    {
      id: "admin-1",
      displayName: "Admin",
      email: "admin@test.dev",
      accountType: "admin",
      status: "active",
      roles: ["admin", "client"],
      createdAt: "2026-05-20T00:00:00.000Z",
      source: "dev",
      superCodeProtected: true,
    },
  ],
  accessMatrix: [],
  activeSuperCode: "SUPER-001",
  superCodeHistory: [],
  auditLog: [],
  guestPressure: {
    searchUsed: 2,
    searchRemaining: 4,
    searchLimit: 6,
    searchCooldownActive: false,
    viewUsed: 3,
    viewRemaining: 9,
    viewLimit: 12,
    viewCooldownActive: true,
  },
};

const BILLING_REGISTRY_FIXTURE = [
  {
    id: "client-1",
    displayName: "Alice",
    email: "alice@test.dev",
    accountType: "client",
    subscription: {
      planId: "plus",
      status: "active",
    },
  },
  {
    id: "client-2",
    displayName: "Bob",
    email: "bob@test.dev",
    accountType: "client",
    subscription: {
      planId: null,
      status: "inactive",
    },
  },
  {
    id: "admin-1",
    displayName: "Admin",
    email: "admin@test.dev",
    accountType: "admin",
    subscription: {
      planId: null,
      status: "active",
    },
  },
];

describe("useAdminWorkspace", () => {
  const getBillingRegistry = vi.fn();
  const assignPlan = vi.fn();

  beforeEach(() => {
    getBillingRegistry.mockReset();
    assignPlan.mockReset();
    vi.mocked(getAdminDashboardSnapshot).mockReturnValue(
      SNAPSHOT_FIXTURE as never,
    );
    vi.mocked(useAuth).mockReturnValue({
      user: {
        email: "admin@test.dev",
        displayName: "Dev Admin",
      },
    } as never);
    vi.mocked(useBilling).mockReturnValue({
      getBillingRegistry,
      assignPlan,
    } as never);
    getBillingRegistry.mockReturnValue(BILLING_REGISTRY_FIXTURE);
    assignPlan.mockReturnValue({ ok: true });
    vi.mocked(deactivateMockAccount).mockReturnValue({ ok: true } as never);
    vi.mocked(promoteMockAccount).mockReturnValue({ ok: true } as never);
    vi.mocked(regenerateAdminSuperCode).mockReturnValue({
      code: "SUPER-777",
    } as never);

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("hydrates the admin snapshot and computes billing counts", async () => {
    const { result } = renderHook(() => useAdminWorkspace());

    await waitFor(() => expect(result.current.snapshot).not.toBeNull());

    expect(getAdminDashboardSnapshot).toHaveBeenCalled();
    expect(getBillingRegistry).toHaveBeenCalledWith([
      {
        id: "client-1",
        displayName: "Alice",
        email: "alice@test.dev",
        accountType: "client",
      },
      {
        id: "admin-1",
        displayName: "Admin",
        email: "admin@test.dev",
        accountType: "admin",
      },
    ]);
    expect(result.current.billingCounts).toEqual({
      preview: 1,
      trial: 0,
      user: 0,
      plus: 1,
      pro: 0,
      admin: 1,
    });
  });

  it("copies the active super code and logs the audit event", async () => {
    const { result } = renderHook(() => useAdminWorkspace());
    await waitFor(() => expect(result.current.snapshot).not.toBeNull());

    await act(async () => {
      await result.current.handleCopyCode();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("SUPER-001");
    expect(notify.success).toHaveBeenCalled();
    expect(appendAdminAuditLog).toHaveBeenCalled();
  });

  it("falls back to info notification when clipboard is unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });

    const { result } = renderHook(() => useAdminWorkspace());
    await waitFor(() => expect(result.current.snapshot).not.toBeNull());

    await act(async () => {
      await result.current.handleCopyCode();
    });

    expect(notify.info).toHaveBeenCalled();
  });

  it("handles account actions and plan assignment", async () => {
    const { result } = renderHook(() => useAdminWorkspace());
    await waitFor(() => expect(result.current.snapshot).not.toBeNull());

    act(() => {
      result.current.handleAccountAction("forceLogout", "client-1", "Alice");
    });

    expect(forceLogoutMockAccount).toHaveBeenCalledWith("client-1");
    expect(appendAdminAuditLog).toHaveBeenCalled();

    act(() => {
      result.current.handleAssignPlan("client-1", "Alice", "pro");
    });

    expect(assignPlan).toHaveBeenCalledWith(
      "client-1",
      "pro",
      "admin@test.dev",
    );
    expect(notify.success).toHaveBeenCalled();
  });

  it("regenerates the code and copies guest status summaries", async () => {
    const { result } = renderHook(() => useAdminWorkspace());
    await waitFor(() => expect(result.current.snapshot).not.toBeNull());

    act(() => {
      result.current.handleRegenerateCode();
    });
    expect(regenerateAdminSuperCode).toHaveBeenCalled();

    await act(async () => {
      await result.current.handleCopyGuestStatus();
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});
