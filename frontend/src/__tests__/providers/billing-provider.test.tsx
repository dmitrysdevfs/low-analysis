import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { BillingProvider, useBilling } from "@/components/billing/BillingProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  adminAssignDemoPlan,
  BILLING_PAYMENTS_STORAGE_KEY,
  BILLING_PLAN_CATALOG,
  BILLING_SUBSCRIPTIONS_STORAGE_KEY,
  consumeBillingQuota,
  getBillingPaymentsForUser,
  getBillingRegistrySnapshot,
  getBillingSubscriptionSnapshot,
  purchaseDemoPlan,
} from "@/lib/billing/mockBilling";

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/billing/mockBilling", () => ({
  BILLING_PAYMENTS_STORAGE_KEY: "billing-payments",
  BILLING_PLAN_CATALOG: [{ id: "trial", label: "Trial" }],
  BILLING_SUBSCRIPTIONS_STORAGE_KEY: "billing-subscriptions",
  adminAssignDemoPlan: vi.fn(),
  consumeBillingQuota: vi.fn(),
  getBillingPaymentsForUser: vi.fn(),
  getBillingRegistrySnapshot: vi.fn(),
  getBillingSubscriptionSnapshot: vi.fn(),
  purchaseDemoPlan: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return <BillingProvider>{children}</BillingProvider>;
}

describe("BillingProvider", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "user-1",
        accountType: "client",
        displayName: "Alice",
      },
    } as never);
    vi.mocked(getBillingSubscriptionSnapshot).mockReturnValue({
      userId: "user-1",
      accountType: "client",
      planId: "trial",
      plan: BILLING_PLAN_CATALOG[0],
      status: "trialing",
      accessLabel: "Trial",
      description: "Trial access",
      daysRemaining: 7,
      isUnlimited: false,
      searchLimit: 30,
      viewLimit: 10,
      searchUsed: 4,
      viewUsed: 2,
      searchRemaining: 26,
      viewRemaining: 8,
      previewMode: false,
    } as never);
    vi.mocked(getBillingPaymentsForUser).mockReturnValue([
      {
        id: "payment-1",
        userId: "user-1",
      },
    ] as never);
    vi.mocked(getBillingRegistrySnapshot).mockReturnValue([] as never);
    vi.mocked(purchaseDemoPlan).mockReturnValue({ ok: true } as never);
    vi.mocked(adminAssignDemoPlan).mockReturnValue({ ok: true } as never);
    vi.mocked(consumeBillingQuota).mockReturnValue({
      allowed: true,
      snapshot: vi.mocked(getBillingSubscriptionSnapshot).mock.results[0]?.value,
    } as never);
  });

  it("hydrates subscription and payments for an authenticated user", async () => {
    const { result } = renderHook(() => useBilling(), { wrapper });

    await waitFor(() => expect(result.current.isHydrated).toBe(true));

    expect(getBillingSubscriptionSnapshot).toHaveBeenCalledWith(
      "user-1",
      "client",
    );
    expect(getBillingPaymentsForUser).toHaveBeenCalledWith("user-1");
    expect(result.current.subscription?.accessLabel).toBe("Trial");
    expect(result.current.payments).toHaveLength(1);
  });

  it("returns empty billing state when no user is active", async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null } as never);

    const { result } = renderHook(() => useBilling(), { wrapper });

    await waitFor(() => expect(result.current.isHydrated).toBe(true));

    expect(result.current.subscription).toBeNull();
    expect(result.current.payments).toEqual([]);
  });

  it("refreshes on storage updates", async () => {
    const { result } = renderHook(() => useBilling(), { wrapper });
    await waitFor(() => expect(result.current.isHydrated).toBe(true));

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: BILLING_SUBSCRIPTIONS_STORAGE_KEY,
        }),
      );
    });

    expect(getBillingSubscriptionSnapshot).toHaveBeenCalledTimes(2);

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: BILLING_PAYMENTS_STORAGE_KEY,
        }),
      );
    });

    expect(getBillingPaymentsForUser).toHaveBeenCalledTimes(3);
    expect(result.current.planCatalog).toEqual(BILLING_PLAN_CATALOG);
  });

  it("runs purchase, assign and quota actions through the mock billing layer", async () => {
    const { result } = renderHook(() => useBilling(), { wrapper });
    await waitFor(() => expect(result.current.isHydrated).toBe(true));

    act(() => {
      expect(result.current.purchasePlan("trial", "apple_pay")).toEqual({
        ok: true,
      });
    });
    expect(purchaseDemoPlan).toHaveBeenCalledWith(
      "user-1",
      "trial",
      "apple_pay",
      "Alice",
    );

    act(() => {
      expect(result.current.assignPlan("user-2", "trial", "Admin")).toEqual({
        ok: true,
      });
    });
    expect(adminAssignDemoPlan).toHaveBeenCalledWith("user-2", "trial", "Admin");

    act(() => {
      expect(result.current.consumeQuota("search").allowed).toBe(true);
    });
    expect(consumeBillingQuota).toHaveBeenCalledWith("user-1", "client", "search");
  });
});
