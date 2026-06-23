"use client";
import { getJson, requestJson } from "./_client";

export type RadiantProposalType =
  | "add_node"
  | "remove_node"
  | "add_link"
  | "remove_link";
export type RadiantProposalStatus =
  | "draft"
  | "active"
  | "approved"
  | "rejected"
  | "withdrawn"
  | "expired";

export interface RadiantProposal {
  _id: string;
  proposal_type: RadiantProposalType;
  node_law_id?: string | { _id: string; title: string; code: string };
  source_law_id?: string | { _id: string; title: string; code: string };
  target_law_id?: string | { _id: string; title: string; code: string };
  link_type?: string;
  reason: string;
  created_by: string | { _id: string; displayName: string };
  author_display_name: string;
  status: RadiantProposalStatus;
  votes_for_weighted: number;
  votes_against_weighted: number;
  votes_for_count: number;
  votes_against_count: number;
  voting_deadline: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RadiantVoteStats {
  votes_for_weighted: number;
  votes_against_weighted: number;
  votes_for_count: number;
  votes_against_count: number;
  my_vote: "for" | "against" | null;
}

type RadiantProposalsResponse =
  | RadiantProposal[]
  | {
      proposals: RadiantProposal[];
      total: number;
      page: number;
      pages: number;
    };

export const getRadiantProposals = (params?: {
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
  return getJson<RadiantProposalsResponse>(`/radiant-proposals?${q}`);
};

export const deleteRadiantProposal = (id: string) =>
  requestJson<void>(`/radiant-proposals/${id}`, "DELETE");

export const createRadiantProposal = (data: Partial<RadiantProposal>) =>
  requestJson<RadiantProposal>("/radiant-proposals", "POST", data);

export const submitRadiantProposal = (id: string, reason: string) =>
  requestJson<RadiantProposal>(`/radiant-proposals/${id}/submit`, "POST", {
    reason,
  });

export const castRadiantVote = (id: string, vote: "for" | "against") =>
  requestJson<RadiantVoteStats>(`/radiant-proposals/${id}/vote`, "POST", {
    vote,
  });

export const removeRadiantVote = (id: string) =>
  requestJson<RadiantVoteStats>(`/radiant-proposals/${id}/vote`, "DELETE");

export const getRadiantVoteStats = (id: string) =>
  getJson<RadiantVoteStats>(`/radiant-proposals/${id}/votes`);

export const reviewRadiantProposal = (
  id: string,
  action: "approve" | "reject",
) =>
  requestJson<RadiantProposal>(`/radiant-proposals/${id}/review`, "POST", {
    action,
  });
