"use client";

import dynamic from "next/dynamic";

const RoadmapPublicView = dynamic(
  () =>
    import("@/features/roadmap").then((m) => ({
      default: m.RoadmapPublicView,
    })),
  { ssr: false },
);

export default function RoadmapClientWrapper() {
  return <RoadmapPublicView />;
}
