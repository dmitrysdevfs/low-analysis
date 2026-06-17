import { getJson, requestJson } from "./_client";

export interface SupervisorGroup {
  _id: string;
  name: string;
  course: string;
  supervisorId: string;
  memberIds: { _id: string; fullName: string; email: string; role?: string }[];
  trackedLawIds: { _id: string; title: string; code: string }[];
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface LawActivityItem {
  law: { _id: string; title: string; code: string };
  forkCount: number;
  proposalCount: number;
  lastActivityAt: string | null;
}

export interface ActivityItem {
  type: "fork" | "proposal";
  title: string;
  author: string;
  law: string;
  status: string;
  updatedAt: string;
}

export interface SupervisorDashboard {
  groups: SupervisorGroup[];
  totalMembers: number;
  totalTrackedLaws: number;
  lawActivity: LawActivityItem[];
  recentActivity: ActivityItem[];
}

export async function getSupervisorDashboard(): Promise<SupervisorDashboard> {
  return getJson<SupervisorDashboard>("/supervisor/dashboard");
}

export async function getSupervisorGroups(): Promise<SupervisorGroup[]> {
  return getJson<SupervisorGroup[]>("/supervisor/groups");
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
