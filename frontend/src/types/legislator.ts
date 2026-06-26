export type AmendmentChangeType = "edit" | "add" | "delete";
export type ProposalStatus = "draft" | "review" | "approved" | "rejected";
export type VoteValue = "positive" | "neutral" | "negative";

export interface Amendment {
  _id: string;
  law_id: string | { _id: string; title: string };
  element_id: string;
  proposal_id: string | null;
  created_by: string | { _id: string; fullName: string };
  change_type: AmendmentChangeType;
  original_text: string;
  proposed_text: string;
  reason: string;
  context: {
    section_title?: string;
    article_num?: string;
    article_title?: string;
    element_code: string;
  };
  votes_summary: {
    positive: number;
    neutral: number;
    negative: number;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface Proposal {
  _id: string;
  law_id: string | { _id: string; title: string };
  created_by: string | { _id: string; fullName: string };
  title: string;
  description: string;
  status: ProposalStatus;
  amendments_count: number;
  votes_summary: {
    positive: number;
    neutral: number;
    negative: number;
  };
  amendments?: Amendment[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  target_type: "amendment" | "proposal";
  target_id: string;
  created_by: { _id: string; fullName: string };
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vote {
  _id: string;
  amendment_id: string;
  user_id: string;
  value: VoteValue;
  createdAt: string;
  updatedAt: string;
}

export interface VoteSummary {
  positive: number;
  neutral: number;
  negative: number;
}

export interface ProposalDocument {
  proposal_info: {
    title: string;
    description: string;
    status: string;
  };
  law_info: {
    title: string;
    code: string;
  };
  amendments: Array<{
    change_type: string;
    original_text: string;
    proposed_text: string;
    reason: string;
    context: {
      section_title?: string;
      article_num?: string;
      article_title?: string;
      element_code: string;
    };
  }>;
}
