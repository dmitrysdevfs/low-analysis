import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as lawChangeApi from "@/lib/api/lawChange";

vi.mock("@/lib/api/lawChange", () => ({
  getAllProposals: vi.fn(),
  castVote: vi.fn(),
  removeVote: vi.fn(),
  getVoteStats: vi.fn(),
}));

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  );
  return {
    ...actual,
  };
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import {
  useProposals,
  useCastVote,
  useRemoveVote,
} from "@/hooks/useLawChangeProposals";

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: qc }, children);
  }
  return Wrapper;
}

const MOCK_PROPOSALS = [
  {
    _id: "p-1",
    law_id: "law-1",
    status: "active",
    change_type: "edit",
    created_by: "user-1",
    votes_for_weighted: 3,
    votes_against_weighted: 1,
    votes_for_count: 1,
    votes_against_count: 1,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useProposals", () => {
  it("returns proposals list on success", async () => {
    vi.mocked(lawChangeApi.getAllProposals).mockResolvedValue(MOCK_PROPOSALS);

    const { result } = renderHook(() => useProposals({ status: "active" }), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.proposals).toHaveLength(1);
    expect(result.current.data?.proposals[0]._id).toBe("p-1");
    expect(result.current.data?.total).toBe(1);
  });

  it("handles paginated response shape", async () => {
    vi.mocked(lawChangeApi.getAllProposals).mockResolvedValue({
      proposals: MOCK_PROPOSALS,
      total: 42,
      page: 2,
      pages: 5,
    });

    const { result } = renderHook(() => useProposals({ page: 2, limit: 10 }), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.total).toBe(42);
    expect(result.current.data?.page).toBe(2);
    expect(result.current.data?.pages).toBe(5);
  });

  it("returns empty proposals on API error", async () => {
    vi.mocked(lawChangeApi.getAllProposals).mockRejectedValue(
      new Error("Network error"),
    );

    const { result } = renderHook(() => useProposals(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});

describe("useCastVote", () => {
  it("calls castVote API with correct arguments", async () => {
    vi.mocked(lawChangeApi.castVote).mockResolvedValue({
      votes_for_weighted: 4,
      votes_against_weighted: 1,
      votes_for_count: 2,
      votes_against_count: 1,
      total_weight: 5,
      my_vote: "for",
    });

    const { result } = renderHook(() => useCastVote(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ proposalId: "p-1", vote: "for" });
    });

    expect(lawChangeApi.castVote).toHaveBeenCalledWith("p-1", { vote: "for" });
  });

  it("calls castVote with 'against' vote", async () => {
    vi.mocked(lawChangeApi.castVote).mockResolvedValue({
      votes_for_weighted: 0,
      votes_against_weighted: 3,
      votes_for_count: 0,
      votes_against_count: 1,
      total_weight: 3,
      my_vote: "against",
    });

    const { result } = renderHook(() => useCastVote(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ proposalId: "p-2", vote: "against" });
    });

    expect(lawChangeApi.castVote).toHaveBeenCalledWith("p-2", {
      vote: "against",
    });
  });

  it("surfaces error when castVote fails", async () => {
    vi.mocked(lawChangeApi.castVote).mockRejectedValue(
      Object.assign(new Error("Forbidden"), { status: 403 }),
    );

    const { result } = renderHook(() => useCastVote(), {
      wrapper: makeWrapper(),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ proposalId: "p-1", vote: "for" });
      }),
    ).rejects.toThrow("Forbidden");
  });
});

describe("useRemoveVote", () => {
  it("calls removeVote API with proposalId", async () => {
    vi.mocked(lawChangeApi.removeVote).mockResolvedValue({
      votes_for_weighted: 0,
      votes_against_weighted: 0,
      votes_for_count: 0,
      votes_against_count: 0,
      total_weight: 0,
      my_vote: null,
    });

    const { result } = renderHook(() => useRemoveVote(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync("p-1");
    });

    expect(lawChangeApi.removeVote).toHaveBeenCalledWith("p-1");
  });

  it("surfaces error when removeVote fails", async () => {
    vi.mocked(lawChangeApi.removeVote).mockRejectedValue(
      Object.assign(new Error("Not found"), { status: 404 }),
    );

    const { result } = renderHook(() => useRemoveVote(), {
      wrapper: makeWrapper(),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync("p-99");
      }),
    ).rejects.toThrow("Not found");
  });
});
