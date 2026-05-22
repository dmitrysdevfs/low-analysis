import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  GuestLimitsProvider,
  useGuestLimits,
} from "@/components/guest/GuestLimitsProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { useBilling } from "@/components/billing/BillingProvider";
import { attemptGuestAction, getGuestLimitSnapshot } from "@/lib/guestLimits";
import { setMockPathname } from "@/test/mocks/next-navigation";

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/components/billing/BillingProvider", () => ({
  useBilling: vi.fn(),
}));

vi.mock("@/lib/guestLimits", () => ({
  GUEST_LIMITS_STORAGE_KEY: "guest-limits",
  attemptGuestAction: vi.fn(),
  formatRemainingCooldown: vi.fn(() => "2 хв"),
  getGuestLimitSnapshot: vi.fn(),
}));

function Consumer({
  onConsumeSearch,
}: {
  onConsumeSearch?: (
    result: ReturnType<typeof useGuestLimits>["snapshot"],
  ) => void;
}) {
  const guestLimits = useGuestLimits();

  return (
    <div>
      <div data-testid="search-remaining">
        {guestLimits.snapshot.search.remaining}
      </div>
      <button
        type="button"
        onClick={() => {
          const result = guestLimits.consumeSearch();
          onConsumeSearch?.(result.snapshot as never);
        }}
      >
        consume-search
      </button>
    </div>
  );
}

describe("GuestLimitsProvider", () => {
  const consumeQuota = vi.fn();

  beforeEach(() => {
    setMockPathname("/laws");
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      user: null,
    } as never);
    vi.mocked(useBilling).mockReturnValue({
      subscription: null,
      consumeQuota,
    } as never);
    vi.mocked(getGuestLimitSnapshot).mockReturnValue({
      search: {
        limit: 6,
        used: 1,
        remaining: 5,
        windowMs: 1000,
        cooldownMs: 500,
        cooldownUntil: 0,
        cooldownRemainingMs: 0,
        isCoolingDown: false,
      },
      view: {
        limit: 12,
        used: 2,
        remaining: 10,
        windowMs: 1000,
        cooldownMs: 500,
        cooldownUntil: 0,
        cooldownRemainingMs: 0,
        isCoolingDown: false,
      },
    } as never);
    vi.mocked(attemptGuestAction).mockReturnValue({
      allowed: true,
      snapshot: {
        search: {
          limit: 6,
          used: 2,
          remaining: 4,
          windowMs: 1000,
          cooldownMs: 500,
          cooldownUntil: 0,
          cooldownRemainingMs: 0,
          isCoolingDown: false,
        },
        view: {
          limit: 12,
          used: 2,
          remaining: 10,
          windowMs: 1000,
          cooldownMs: 500,
          cooldownUntil: 0,
          cooldownRemainingMs: 0,
          isCoolingDown: false,
        },
      },
    } as never);
    consumeQuota.mockReset();
  });

  it("shows the guest welcome dialog on public routes", () => {
    render(
      <GuestLimitsProvider>
        <div>guest-child</div>
      </GuestLimitsProvider>,
    );

    expect(
      screen.getByText("Повний доступ до Law Analysis"),
    ).toBeInTheDocument();
    expect(screen.getByText("guest-child")).toBeInTheDocument();
  });

  it("consumes guest search quotas and updates the snapshot", async () => {
    const user = userEvent.setup();

    render(
      <GuestLimitsProvider>
        <Consumer />
      </GuestLimitsProvider>,
    );

    expect(screen.getByTestId("search-remaining")).toHaveTextContent("5");
    await user.click(
      screen.getByRole("button", { name: "Продовжити як гість" }),
    );

    await user.click(screen.getByRole("button", { name: "consume-search" }));

    expect(attemptGuestAction).toHaveBeenCalledWith("search");
    expect(screen.getByTestId("search-remaining")).toHaveTextContent("4");
  });

  it("bypasses quota consumption for admin sessions", async () => {
    const user = userEvent.setup();
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      user: {
        id: "admin-1",
        accountType: "admin",
      },
    } as never);
    vi.mocked(useBilling).mockReturnValue({
      subscription: {
        userId: "admin-1",
        accountType: "admin",
        planId: null,
        plan: null,
        status: "active",
        accessLabel: "Admin access",
        description: "Unlimited",
        daysRemaining: null,
        isUnlimited: true,
        searchLimit: null,
        viewLimit: null,
        searchUsed: 0,
        viewUsed: 0,
        searchRemaining: null,
        viewRemaining: null,
        previewMode: false,
      },
      consumeQuota,
    } as never);

    render(
      <GuestLimitsProvider>
        <Consumer />
      </GuestLimitsProvider>,
    );

    await user.click(screen.getByRole("button", { name: "consume-search" }));

    expect(consumeQuota).not.toHaveBeenCalled();
    expect(attemptGuestAction).not.toHaveBeenCalled();
  });

  it("opens the billing limit dialog for client quota failures", async () => {
    const user = userEvent.setup();
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      user: {
        id: "client-1",
        accountType: "client",
      },
    } as never);
    consumeQuota.mockReturnValue({
      allowed: false,
      reason: "preview_limit",
      message: "Preview quota reached.",
      snapshot: {
        userId: "client-1",
        accountType: "client",
        planId: null,
        plan: null,
        status: "inactive",
        accessLabel: "Preview",
        description: "Preview access",
        daysRemaining: null,
        isUnlimited: false,
        searchLimit: 5,
        viewLimit: 3,
        searchUsed: 5,
        viewUsed: 1,
        searchRemaining: 0,
        viewRemaining: 2,
        previewMode: true,
      },
    });
    vi.mocked(useBilling).mockReturnValue({
      subscription: {
        userId: "client-1",
        accountType: "client",
        planId: null,
        plan: null,
        status: "inactive",
        accessLabel: "Preview",
        description: "Preview access",
        daysRemaining: null,
        isUnlimited: false,
        searchLimit: 5,
        viewLimit: 3,
        searchUsed: 5,
        viewUsed: 1,
        searchRemaining: 0,
        viewRemaining: 2,
        previewMode: true,
      },
      consumeQuota,
    } as never);

    render(
      <GuestLimitsProvider>
        <Consumer />
      </GuestLimitsProvider>,
    );

    await user.click(screen.getByRole("button", { name: "consume-search" }));

    expect(screen.getByText("Preview quota reached.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "План та оплата" }),
    ).toHaveAttribute("href", "/account/billing");
  });
});
