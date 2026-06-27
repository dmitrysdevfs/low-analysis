export type RoadmapTask = {
  text: string;
  done: boolean;
};

export type RoadmapPhase = {
  id: string;
  label: string;
  status: "done" | "in_progress" | "pending" | "current_focus" | "planned" | "research" | "vision";
  tasks: RoadmapTask[];
  description?: string;
  businessValue?: string;
};

export type RoadmapItem = {
  text: string;
  done: boolean;
};

export type RoadmapDeferredItem = {
  title: string;
  reason: string;
};

export type RoadmapDecision = {
  id: string;
  title: string;
  decision: string;
  rationale: string;
};

export type RoadmapContent = {
  phases: RoadmapPhase[];
  roadmapItems: RoadmapItem[];
  deferredItems: RoadmapDeferredItem[];
  decisions: RoadmapDecision[];
  visionStatement?: string;
  whatWeBuilding?: string[];
};

export type RoadmapApiResponse = RoadmapContent & {
  updatedAt: string;
};
