"use client";
import { getJson, requestJson } from "./_client";

export type GraphProposalType =
  | "add_law"
  | "remove_law"
  | "add_edge"
  | "remove_edge";
export type GraphProposalStatus =
  | "draft"
  | "active"
  | "approved"
  | "rejected"
  | "withdrawn"
  | "expired";

export interface GraphProposal {
  _id: string;
  proposal_type: GraphProposalType;
  law_id?: string | { _id: string; title: string; code: string };
  source_law_id?: string | { _id: string; title: string; code: string };
  target_law_id?: string | { _id: string; title: string; code: string };
  edge_type?: string;
  reason: string;
  created_by: string | { _id: string; displayName: string };
  author_display_name: string;
  status: GraphProposalStatus;
  votes_for_weighted: number;
  votes_against_weighted: number;
  votes_for_count: number;
  votes_against_count: number;
  voting_deadline: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GraphVoteStats {
  votes_for_weighted: number;
  votes_against_weighted: number;
  votes_for_count: number;
  votes_against_count: number;
  my_vote: "for" | "against" | null;
}

type GraphProposalsResponse =
  | GraphProposal[]
  | { proposals: GraphProposal[]; total: number; page: number; pages: number };

export const getGraphProposals = (params?: {
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}) => {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.type) q.set("proposal_type", params.type);
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  return getJson<GraphProposalsResponse>(`/graph-proposals?${q}`);
};

export const deleteGraphProposal = (id: string) =>
  requestJson<void>(`/graph-proposals/${id}`, "DELETE");

export const createGraphProposal = (data: Partial<GraphProposal>) =>
  requestJson<GraphProposal>("/graph-proposals", "POST", data);

export const submitGraphProposal = (id: string, reason: string) =>
  requestJson<GraphProposal>(`/graph-proposals/${id}/submit`, "POST", {
    reason,
  });

export const castGraphVote = (id: string, vote: "for" | "against") =>
  requestJson<GraphVoteStats>(`/graph-proposals/${id}/vote`, "POST", { vote });

export const removeGraphVote = (id: string) =>
  requestJson<GraphVoteStats>(`/graph-proposals/${id}/vote`, "DELETE");

export const getGraphVoteStats = (id: string) =>
  getJson<GraphVoteStats>(`/graph-proposals/${id}/votes`);

export const reviewGraphProposal = (id: string, action: "approve" | "reject") =>
  requestJson<GraphProposal>(`/graph-proposals/${id}/review`, "POST", {
    action,
  });
