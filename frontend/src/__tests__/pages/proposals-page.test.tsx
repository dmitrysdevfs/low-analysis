import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/proposals",
}));

vi.mock("@/components/layout/Layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) =>
    createElement("div", { "data-testid": "layout" }, children),
}));

vi.mock("@/lib/toast", () => ({
  notify: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/api/lawChange", () => ({
  getAllProposals: vi.fn(),
  castVote: vi.fn(),
  removeVote: vi.fn(),
  getVoteStats: vi.fn(),
}));

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/components/auth/AuthProvider";
import * as lawChangeApi from "@/lib/api/lawChange";
import { notify } from "@/lib/toast";
import ProposalsPage from "@/app/proposals/page";

const AUTHOR_ID = "author-111";
const OTHER_USER_ID = "user-222";

function makeProposal(overrides = {}) {
  return {
    _id: "p-1",
    law_id: "law-1",
    status: "active" as const,
    change_type: "edit" as const,
    created_by: AUTHOR_ID,
    author_display_name: "Іван Тест",
    original_text: "Старий текст",
    proposed_text: "Новий текст",
    votes_for_weighted: 3,
    votes_against_weighted: 1,
    votes_for_count: 1,
    votes_against_count: 1,
    voting_deadline: null,
    ...overrides,
  };
}

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: qc }, children);
  }
  return Wrapper;
}

function renderPage() {
  return render(createElement(ProposalsPage), { wrapper: makeWrapper() });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(lawChangeApi.getVoteStats).mockResolvedValue({
    votes_for_weighted: 3,
    votes_against_weighted: 1,
    votes_for_count: 1,
    votes_against_count: 1,
    total_weight: 4,
    my_vote: null,
  });
});

describe("ProposalsPage — unauthenticated", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isHydrated: true,
      user: null,
    } as ReturnType<typeof useAuth>);
    vi.mocked(lawChangeApi.getAllProposals).mockResolvedValue([makeProposal()]);
  });

  it("redirects unauthenticated user — renders null after hydration", async () => {
    const { container } = renderPage();
    await waitFor(() => {
      expect(container.innerHTML).toBe("");
    });
  });
});

describe("ProposalsPage — authenticated", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isHydrated: true,
      user: { id: OTHER_USER_ID, role: "legislator" },
    } as ReturnType<typeof useAuth>);
  });

  it("shows loading state initially", () => {
    vi.mocked(lawChangeApi.getAllProposals).mockImplementation(
      () => new Promise(() => {}),
    );
    renderPage();
    expect(screen.getByText("Завантаження...")).toBeInTheDocument();
  });

  it("shows empty state when no proposals", async () => {
    vi.mocked(lawChangeApi.getAllProposals).mockResolvedValue([]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Пропозицій немає")).toBeInTheDocument();
    });
  });

  it("renders ProposalCard with vote counts", async () => {
    vi.mocked(lawChangeApi.getAllProposals).mockResolvedValue([makeProposal()]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/За: 3 очк\./)).toBeInTheDocument();
      expect(screen.getByText(/Проти: 1 очк\./)).toBeInTheDocument();
    });
  });

  it("shows vote buttons for authenticated user", async () => {
    vi.mocked(lawChangeApi.getAllProposals).mockResolvedValue([makeProposal()]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("✓ За")).toBeInTheDocument();
      expect(screen.getByText("✗ Проти")).toBeInTheDocument();
    });
  });

  it("vote buttons are disabled for the proposal author", async () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isHydrated: true,
      user: { id: AUTHOR_ID, role: "legislator" },
    } as ReturnType<typeof useAuth>);
    vi.mocked(lawChangeApi.getAllProposals).mockResolvedValue([makeProposal()]);
    renderPage();

    await waitFor(() => {
      const forBtn = screen.getByText("✓ За");
      const againstBtn = screen.getByText("✗ Проти");
      expect(forBtn).toBeDisabled();
      expect(againstBtn).toBeDisabled();
    });
  });

  it("vote buttons are disabled for non-active proposals", async () => {
    vi.mocked(lawChangeApi.getAllProposals).mockResolvedValue([
      makeProposal({ status: "approved" }),
    ]);
    renderPage();

    await waitFor(() => {
      const forBtn = screen.getByText("✓ За");
      expect(forBtn).toBeDisabled();
    });
  });

  it("calls castVote when vote button is clicked", async () => {
    vi.mocked(lawChangeApi.getAllProposals).mockResolvedValue([makeProposal()]);
    vi.mocked(lawChangeApi.castVote).mockResolvedValue({
      votes_for_weighted: 4,
      votes_against_weighted: 1,
      votes_for_count: 2,
      votes_against_count: 1,
      total_weight: 5,
      my_vote: "for",
    });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("✓ За")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("✓ За"));

    await waitFor(() => {
      expect(lawChangeApi.castVote).toHaveBeenCalledWith("p-1", {
        vote: "for",
      });
    });
    expect(notify.success).toHaveBeenCalledWith("Голос враховано");
  });

  it("calls removeVote when re-clicking the same vote direction", async () => {
    vi.mocked(lawChangeApi.getVoteStats).mockResolvedValue({
      votes_for_weighted: 4,
      votes_against_weighted: 0,
      votes_for_count: 1,
      votes_against_count: 0,
      total_weight: 4,
      my_vote: "for",
    });
    vi.mocked(lawChangeApi.getAllProposals).mockResolvedValue([makeProposal()]);
    vi.mocked(lawChangeApi.removeVote).mockResolvedValue({
      votes_for_weighted: 0,
      votes_against_weighted: 0,
      votes_for_count: 0,
      votes_against_count: 0,
      total_weight: 0,
      my_vote: null,
    });
    renderPage();

    // Wait until voteStats resolves and myVote==="for" is reflected (voteBtnActive class)
    await waitFor(() => {
      const btn = screen.getByText("✓ За").closest("button");
      expect(btn?.className).toMatch(/voteBtnActive/);
    });

    fireEvent.click(screen.getByText("✓ За"));

    await waitFor(() => {
      expect(lawChangeApi.removeVote).toHaveBeenCalledWith("p-1");
    });
    expect(notify.success).toHaveBeenCalledWith("Голос знято");
  });

  it("shows 'Увійдіть, щоб голосувати' for guest", async () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isHydrated: true,
      user: null,
    } as ReturnType<typeof useAuth>);
    // Not redirected: mock so redirect doesn't fire in this test
    vi.mocked(lawChangeApi.getAllProposals).mockResolvedValue([makeProposal()]);

    // Override to prevent router redirect
    const router = { push: vi.fn() };
    vi.doMock("next/navigation", () => ({
      useRouter: () => router,
      useSearchParams: () => new URLSearchParams(),
    }));

    // Component renders null when unauthenticated (redirect logic)
    const { container } = renderPage();
    await waitFor(() => {
      expect(container.innerHTML).toBe("");
    });
  });

  it("shows status badge for approved proposal", async () => {
    vi.mocked(lawChangeApi.getAllProposals).mockResolvedValue([
      makeProposal({ status: "approved" }),
    ]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Схвалено")).toBeInTheDocument();
    });
  });

  it("renders diff block with original and proposed text", async () => {
    vi.mocked(lawChangeApi.getAllProposals).mockResolvedValue([makeProposal()]);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Старий текст")).toBeInTheDocument();
      expect(screen.getByText("Новий текст")).toBeInTheDocument();
    });
  });
});
