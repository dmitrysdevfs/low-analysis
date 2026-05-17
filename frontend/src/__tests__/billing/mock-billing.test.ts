import {
  consumeBillingQuota,
  getBillingPaymentsForUser,
  getBillingSubscriptionSnapshot,
  purchaseDemoPlan,
  resetBillingDemoState,
} from "@/lib/billing/mockBilling";

describe("mock billing subscription flows", () => {
  beforeEach(() => {
    resetBillingDemoState();
  });

  it("starts clients in preview mode before any purchase", () => {
    const snapshot = getBillingSubscriptionSnapshot("client-1", "client");

    expect(snapshot.previewMode).toBe(true);
    expect(snapshot.plan).toBeNull();
    expect(snapshot.searchLimit).toBeGreaterThan(0);
  });

  it("activates a trial plan and records a local payment", () => {
    const result = purchaseDemoPlan("client-1", "trial", "apple_pay", "Client One");

    expect(result.ok).toBe(true);
    expect(result.snapshot?.planId).toBe("trial");
    expect(result.snapshot?.isUnlimited).toBe(true);
    expect(getBillingPaymentsForUser("client-1")).toHaveLength(1);
  });

  it("does not allow the paid trial to be purchased twice", () => {
    purchaseDemoPlan("client-1", "trial", "apple_pay", "Client One");
    const secondAttempt = purchaseDemoPlan(
      "client-1",
      "trial",
      "google_pay",
      "Client One",
    );

    expect(secondAttempt.ok).toBe(false);
    expect(secondAttempt.error).toContain("starter week");
  });

  it("spends quota on metered monthly plans", () => {
    purchaseDemoPlan("client-1", "user", "card", "Client One");
    const attempt = consumeBillingQuota("client-1", "client", "search");
    const snapshot = getBillingSubscriptionSnapshot("client-1", "client");

    expect(attempt.allowed).toBe(true);
    expect(snapshot.searchUsed).toBe(1);
  });
});
