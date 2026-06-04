// Law view
export { useLawView } from "./hooks/useLawView";

// Proposals queries
export {
  useProposalsForLaw,
  useProposalsForElement,
  useMyProposals,
  useProposal,
} from "./hooks/useProposals";

// Proposal mutations
export {
  useCreateProposal,
  useUpdateProposal,
  useSubmitProposal,
  useWithdrawProposal,
} from "./hooks/useProposalMutations";

// Voting
export {
  useVoteStats,
  useCastVote,
  useRemoveVote,
} from "./hooks/useVoting";

// Approved changes
export {
  useApprovedChanges,
  useChangeFeed,
  useRollbackChange,
  useArchiveChange,
} from "./hooks/useApprovedChanges";

// Legislator access
export {
  useMyAccessRequest,
  useAllAccessRequests,
  useSubmitAccessRequest,
  useApproveRequest,
  useRejectRequest,
  useSetUserRole,
} from "./hooks/useLegislatorAccess";

// Pure merge utility
export { mergeLawWithChanges } from "./hooks/useLawMerge";
export type { LawElement } from "./hooks/useLawMerge";

// Components
export { AdminRequestsPanel } from "./components/AdminRequestsPanel/AdminRequestsPanel";
export { MyProposalsList } from "./components/MyProposalsList/MyProposalsList";
export { ChangeFeed } from "./components/ChangeFeed/ChangeFeed";
export { LegislatorCabinetSection } from "./LegislatorCabinetSection";
