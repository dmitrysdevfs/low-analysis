import { getJson, requestJson } from "./_client";
import type { Proposal } from "@/types/legislator";
import type { Amendment } from "@/types/legislator";
import type { LawFork } from "@/lib/api/forks";

export interface SupervisorGroupMember {
  _id: string;
  fullName: string;
  email: string;
  role?: string;
}

export interface SupervisorLawRef {
  _id: string;
  title: string;
  code: string;
}

export interface SupervisorGroup {
  _id: string;
  name: string;
  course: string;
  supervisorId: string;
  memberIds: SupervisorGroupMember[];
  trackedLawIds: SupervisorLawRef[];
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface SupervisorStatusBreakdown {
  totalChanges: number;
  draftCount: number;
  reviewCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export interface SupervisorGroupHighlight {
  groupId: string;
  groupName: string;
  course: string;
  memberCount: number;
  trackedLawsCount: number;
  activeLawsCount: number;
  changeCount: number;
  lastActivityAt: string | null;
  draftCount: number;
  reviewCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export interface SupervisorMonitoringRow {
  groupId: string;
  groupName: string;
  course: string;
  law: SupervisorLawRef | null;
  forkCount: number;
  proposalCount: number;
  changeCount: number;
  activeAuthors: number;
  lastActivityAt: string | null;
  draftCount: number;
  reviewCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export interface SupervisorStudentGroupRef {
  id: string;
  name: string;
  course: string;
}

export interface SupervisorStudentActivity {
  userId: string;
  name: string;
  email: string;
  groups: SupervisorStudentGroupRef[];
  forkCount: number;
  proposalCount: number;
  changeCount: number;
  lastActivityAt: string | null;
  draftCount: number;
  reviewCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export interface SupervisorRecentActivityItem {
  id: string;
  type: "fork" | "proposal";
  title: string;
  author: string;
  authorEmail: string;
  law: string;
  lawCode: string;
  lawId: string;
  status: string;
  updatedAt: string;
  groupIds: string[];
  groups: string[];
  groupLabel: string;
}

export interface SupervisorDashboard {
  groups: SupervisorGroup[];
  totalMembers: number;
  totalTrackedLaws: number;
  statusBreakdown: SupervisorStatusBreakdown;
  groupHighlights: SupervisorGroupHighlight[];
  groupMonitoring: SupervisorMonitoringRow[];
  lawActivity: SupervisorMonitoringRow[];
  studentActivity: SupervisorStudentActivity[];
  recentActivity: SupervisorRecentActivityItem[];
}

export interface SupervisorGroupDetail {
  group: SupervisorGroup;
  highlight: SupervisorGroupHighlight | null;
  monitoring: SupervisorMonitoringRow[];
  students: SupervisorStudentActivity[];
  recentActivity: SupervisorRecentActivityItem[];
}

export async function getSupervisorDashboard(): Promise<SupervisorDashboard> {
  return getJson<SupervisorDashboard>("/supervisor/dashboard");
}

export async function getSupervisorGroups(): Promise<SupervisorGroup[]> {
  return getJson<SupervisorGroup[]>("/supervisor/groups");
}

export async function getSupervisorGroupDetail(
  id: string,
): Promise<SupervisorGroupDetail> {
  return getJson<SupervisorGroupDetail>(`/supervisor/groups/${id}`);
}

export async function createSupervisorGroup(
  data: Pick<SupervisorGroup, "name" | "course"> & {
    memberIds?: string[];
    trackedLawIds?: string[];
  },
): Promise<SupervisorGroup> {
  return requestJson<SupervisorGroup>("/supervisor/groups", "POST", data);
}

export async function updateSupervisorGroup(
  id: string,
  data: Partial<Pick<SupervisorGroup, "name" | "course" | "status">> & {
    memberIds?: string[];
    trackedLawIds?: string[];
  },
): Promise<SupervisorGroup> {
  return requestJson<SupervisorGroup>(`/supervisor/groups/${id}`, "PUT", data);
}

// Group-scoped proposals (supervisor + all group members)
export async function getGroupProposals(): Promise<Proposal[]> {
  return getJson<Proposal[]>("/supervisor/proposals");
}

// Group-scoped amendments (supervisor + all group members)
export async function getGroupAmendments(search?: string): Promise<Amendment[]> {
  const params = search?.trim()
    ? `?search=${encodeURIComponent(search.trim())}`
    : "";
  return getJson<Amendment[]>(`/supervisor/amendments${params}`);
}

// Group-scoped forks (supervisor + all group members)
export async function getGroupForks(): Promise<LawFork[]> {
  return getJson<LawFork[]>("/supervisor/forks");
}

// Approve or reject a fork submitted for review
export async function reviewGroupFork(
  forkId: string,
  action: "approve" | "reject",
  reviewNote?: string,
): Promise<LawFork> {
  return requestJson<LawFork>(`/supervisor/forks/${forkId}/review`, "PATCH", {
    action,
    reviewNote,
  });
}

// Approve or reject an amendment
export async function reviewAmendment(
  id: string,
  action: "approve" | "reject",
): Promise<Amendment> {
  return requestJson<Amendment>(`/amendments/${id}/review`, "PATCH", {
    action,
  });
}

// Approve or reject a proposal submitted for review
export async function reviewProposal(
  id: string,
  action: "approve" | "reject",
): Promise<import("@/types/legislator").Proposal> {
  return requestJson<import("@/types/legislator").Proposal>(
    `/proposals/${id}/review`,
    "POST",
    { action },
  );
}
