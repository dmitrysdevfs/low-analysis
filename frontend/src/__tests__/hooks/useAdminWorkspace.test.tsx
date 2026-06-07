import { act, renderHook, waitFor } from "@testing-library/react";
import { useAdminWorkspace } from "@/components/admin/useAdminWorkspace";
import { AdminWorkspaceProvider } from "@/components/admin/AdminWorkspaceContext";
import { useAuth } from "@/components/auth/AuthProvider";
import { notify } from "@/lib/toast";
import { adminApi } from "@/lib/api/admin";
import type { AdminDashboardApiSnapshot } from "@/lib/api/admin";

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  notify: {
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/lib/api/admin", () => ({
  adminApi: {
    getDashboard: vi.fn(),
    appendAuditEntry: vi.fn(),
    setUserStatus: vi.fn(),
    setUserRole: vi.fn(),
    setUserBilling: vi.fn(),
    forceLogout: vi.fn(),
    rotateSuperCode: vi.fn(),
  },
}));

vi.mock("@/lib/guestLimits", () => ({
  getGuestLimitSnapshot: vi.fn(() => ({
    search: {
      limit: 6,
      used: 2,
      remaining: 4,
      windowMs: 0,
      cooldownMs: 0,
      cooldownUntil: 0,
      cooldownRemainingMs: 0,
      isCoolingDown: false,
    },
    view: {
      limit: 12,
      used: 3,
      remaining: 9,
      windowMs: 0,
      cooldownMs: 0,
      cooldownUntil: 0,
      cooldownRemainingMs: 0,
      isCoolingDown: true,
    },
  })),
}));

const API_FIXTURE: AdminDashboardApiSnapshot = {
  totalAccounts: 3,
  clientAccounts: 2,
  adminAccounts: 1,
  protectedRoutes: 7,
  activeSessionRole: "admin",
  billingCounts: {},
  latestUsers: [
    {
      _id: "client-1",
      fullName: "Alice",
      email: "alice@test.dev",
      role: "user",
      status: "active",
      billingPlan: "preview",
      createdAt: "2026-05-20T00:00:00.000Z",
      updatedAt: "2026-05-20T00:00:00.000Z",
    },
    {
      _id: "admin-1",
      fullName: "Admin",
      email: "admin@test.dev",
      role: "admin",
      status: "active",
      billingPlan: "preview",
      createdAt: "2026-05-20T00:00:00.000Z",
      updatedAt: "2026-05-20T00:00:00.000Z",
    },
  ],
  recentLaws: [],
  auditLog: [],
  auditCount: 0,
  activeSuperCode: "SUPER-001",
  superCodeHistory: [],
  accessMatrix: [],
};

describe("useAdminWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(adminApi.getDashboard).mockResolvedValue(API_FIXTURE);
    vi.mocked(adminApi.appendAuditEntry).mockResolvedValue({
      _id: "audit-1",
      action: "",
      detail: "",
      actor: "",
      severity: "info",
      createdAt: "",
    });
    vi.mocked(adminApi.forceLogout).mockResolvedValue({ ok: true });
    vi.mocked(adminApi.rotateSuperCode).mockResolvedValue({
      code: "SUPER-777",
      rotatedAt: "",
    });
    vi.mocked(adminApi.setUserStatus).mockResolvedValue(
      API_FIXTURE.latestUsers[0],
    );
    vi.mocked(adminApi.setUserRole).mockResolvedValue(
      API_FIXTURE.latestUsers[0],
    );
    vi.mocked(adminApi.setUserBilling).mockResolvedValue(
      API_FIXTURE.latestUsers[0],
    );

    vi.mocked(useAuth).mockReturnValue({
      user: {
        email: "admin@test.dev",
        displayName: "Dev Admin",
        accountType: "admin",
      },
    } as never);

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("hydrates the admin snapshot and computes billing counts", async () => {
    const { result } = renderHook(() => useAdminWorkspace(), {
      wrapper: AdminWorkspaceProvider,
    });

    await waitFor(() => expect(result.current.snapshot).not.toBeNull());

    expect(adminApi.getDashboard).toHaveBeenCalled();
    expect(result.current.snapshot?.activeSuperCode).toBe("SUPER-001");
    expect(result.current.billingCounts).toEqual({
      preview: 1,
      trial: 0,
      user: 0,
      plus: 0,
      pro: 0,
      admin: 1,
    });
  });

  it("copies the active super code and logs the audit event", async () => {
    const { result } = renderHook(() => useAdminWorkspace(), {
      wrapper: AdminWorkspaceProvider,
    });
    await waitFor(() => expect(result.current.snapshot).not.toBeNull());

    await act(async () => {
      await result.current.handleCopyCode();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("SUPER-001");
    expect(notify.success).toHaveBeenCalled();
    expect(adminApi.appendAuditEntry).toHaveBeenCalled();
  });

  it("falls back to info notification when clipboard is unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });

    const { result } = renderHook(() => useAdminWorkspace(), {
      wrapper: AdminWorkspaceProvider,
    });
    await waitFor(() => expect(result.current.snapshot).not.toBeNull());

    await act(async () => {
      await result.current.handleCopyCode();
    });

    expect(notify.info).toHaveBeenCalled();
  });

  it("handles force logout and plan assignment", async () => {
    const { result } = renderHook(() => useAdminWorkspace(), {
      wrapper: AdminWorkspaceProvider,
    });
    await waitFor(() => expect(result.current.snapshot).not.toBeNull());

    await act(async () => {
      await result.current.handleAccountAction(
        "forceLogout",
        "client-1",
        "Alice",
      );
    });

    expect(adminApi.forceLogout).toHaveBeenCalledWith("client-1");
    expect(adminApi.appendAuditEntry).toHaveBeenCalled();

    await act(async () => {
      await result.current.handleAssignPlan("client-1", "Alice", "pro");
    });

    expect(adminApi.setUserBilling).toHaveBeenCalledWith("client-1", "pro");
    expect(notify.success).toHaveBeenCalled();
  });

  it("regenerates the code and copies guest status summaries", async () => {
    const { result } = renderHook(() => useAdminWorkspace(), {
      wrapper: AdminWorkspaceProvider,
    });
    await waitFor(() => expect(result.current.snapshot).not.toBeNull());

    await act(async () => {
      await result.current.handleRegenerateCode();
    });
    expect(adminApi.rotateSuperCode).toHaveBeenCalled();

    await act(async () => {
      await result.current.handleCopyGuestStatus();
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});
