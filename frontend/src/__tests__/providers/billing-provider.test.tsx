import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import {
  BillingProvider,
  useBilling,
} from "@/components/billing/BillingProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { getMyBilling, demoPurchase, adminAssignPlan } from "@/lib/api/billing";
import { BILLING_PLAN_CATALOG } from "@/lib/billing/mockBilling";

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/billing/mockBilling", () => ({
  BILLING_PLAN_CATALOG: [
    {
      id: "trial",
      label: "Trial",
      badge: "$1",
      description: "Trial plan",
      priceUsd: 1,
      durationDays: 7,
      periodLabel: "7-day trial",
      isUnlimited: true,
      searchLimit: null,
      viewLimit: null,
      features: [],
    },
  ],
}));

vi.mock("@/lib/api/billing", () => ({
  getMyBilling: vi.fn(),
  demoPurchase: vi.fn(),
  adminAssignPlan: vi.fn(),
}));

vi.mock("@/lib/api/_client", () => ({
  requestJson: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return <BillingProvider>{children}</BillingProvider>;
}

const mockSubscription = {
  _id: "sub-1",
  userId: "user-1",
  planId: "trial" as const,
  status: "trialing" as const,
  usageSearch: 4,
  usageView: 2,
  startedAt: new Date().toISOString(),
  endsAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
};

describe("BillingProvider", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "user-1",
        accountType: "client",
        displayName: "Alice",
      },
    } as never);

    vi.mocked(getMyBilling).mockResolvedValue({
      subscription: mockSubscription,
      transactions: [
        {
          _id: "txn-1",
          userId: "user-1",
          planId: "trial",
          amount: 1,
          method: "card",
          status: "completed",
          provider: "demo",
          createdAt: new Date().toISOString(),
        },
      ],
    });
  });

  it("hydrates subscription and payments for an authenticated user", async () => {
    const { result } = renderHook(() => useBilling(), { wrapper });

    await waitFor(() => expect(result.current.isHydrated).toBe(true));

    expect(getMyBilling).toHaveBeenCalled();
    expect(result.current.subscription?.planId).toBe("trial");
    expect(result.current.subscription?.status).toBe("trialing");
    expect(result.current.payments).toHaveLength(1);
  });

  it("returns empty billing state when no user is active", async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null } as never);

    const { result } = renderHook(() => useBilling(), { wrapper });

    await waitFor(() => expect(result.current.isHydrated).toBe(true));

    expect(result.current.subscription?.planId).toBeNull();
    expect(result.current.payments).toEqual([]);
  });

  it("exposes planCatalog from BILLING_PLAN_CATALOG", async () => {
    const { result } = renderHook(() => useBilling(), { wrapper });
    await waitFor(() => expect(result.current.isHydrated).toBe(true));

    expect(result.current.planCatalog).toEqual(BILLING_PLAN_CATALOG);
  });

  it("purchasePlan calls demoPurchase and refreshBilling", async () => {
    vi.mocked(demoPurchase).mockResolvedValue({
      ok: true,
      subscription: mockSubscription,
      transaction: {} as never,
    });

    const { result } = renderHook(() => useBilling(), { wrapper });
    await waitFor(() => expect(result.current.isHydrated).toBe(true));

    const res = await result.current.purchasePlan("trial", "card");

    expect(demoPurchase).toHaveBeenCalledWith("trial", "card");
    expect(res.ok).toBe(true);
  });

  it("assignPlan calls adminAssignPlan and refreshBilling", async () => {
    vi.mocked(adminAssignPlan).mockResolvedValue({
      ok: true,
      subscription: mockSubscription,
    });

    const { result } = renderHook(() => useBilling(), { wrapper });
    await waitFor(() => expect(result.current.isHydrated).toBe(true));

    const res = await result.current.assignPlan("user-2", "trial");

    expect(adminAssignPlan).toHaveBeenCalledWith("user-2", "trial");
    expect(res.ok).toBe(true);
  });
});
