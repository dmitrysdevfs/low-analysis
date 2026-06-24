export type LawChangeType = "edit" | "add" | "delete" | "move";
export type LawChangeStatus =
  | "draft"
  | "active"
  | "approved"
  | "rejected"
  | "withdrawn"
  | "archived"
  | "superseded";
export type VoteDirection = "for" | "against";

export interface LawChangeProposal {
  _id: string;
  law_id: string;
  element_id: string | null;
  parent_element_id: string | null;
  change_type: LawChangeType;
  element_type: "article" | "clause" | "point" | "subpoint" | null;
  original_text: string;
  proposed_text: string | null;
  move_after_element_id: string | null;
  reason: string;
  created_by: string | { _id: string; displayName: string };
  author_display_name: string;
  status: LawChangeStatus;
  votes_for_weighted: number;
  votes_against_weighted: number;
  votes_for_count: number;
  votes_against_count: number;
  based_on_change_id: string | null;
  iteration: number;
  voting_deadline: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LawChangeVote {
  _id: string;
  proposal_id: string;
  user_id: string;
  vote: VoteDirection;
  vote_weight: number;
  createdAt: string;
}

export interface ApprovedChange {
  _id: string;
  law_id: string;
  element_id: string | null;
  winning_proposal_id: string;
  change_type: LawChangeType;
  element_type: "article" | "clause" | "point" | "subpoint" | null;
  new_text: string | null;
  move_after_element_id: string | null;
  votes_for_weighted: number;
  iteration: number;
  supersedes_id: string | null;
  is_current: boolean;
  status: "active" | "archived" | "rolled_back";
  parent_element_id: string | null;
  sort_order: number;
  approved_at: string;
}

export type RequestedRole = "legislator" | "supervisor";

export interface LegislatorAccessRequest {
  _id: string;
  userId: string | { _id: string; displayName: string; email: string };
  requestedRole: RequestedRole;
  organization: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  adminNote: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  retryAfterMs?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LawViewResponse {
  law: { _id: string; title: string };
  elements: unknown[];
  approved_changes: ApprovedChange[];
  active_proposals: LawChangeProposal[];
}

export interface CreateProposalPayload {
  law_id: string;
  element_id?: string | null;
  parent_element_id?: string | null;
  change_type: LawChangeType;
  element_type?: string;
  proposed_text?: string;
  move_after_element_id?: string | null;
  reason?: string;
}

export interface SubmitProposalPayload {
  reason: string;
}

export interface VotePayload {
  vote: VoteDirection;
}

export interface VoteStats {
  votes_for_weighted: number;
  votes_against_weighted: number;
  votes_for_count: number;
  votes_against_count: number;
  my_vote: VoteDirection | null;
}
