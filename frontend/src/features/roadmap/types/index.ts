export type RoadmapTask = {
  text: string;
  done: boolean;
};

export type RoadmapPhase = {
  id: string;
  label: string;
  status: "done" | "in_progress" | "pending";
  tasks: RoadmapTask[];
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
};

export type RoadmapApiResponse = RoadmapContent & {
  updatedAt: string;
};
