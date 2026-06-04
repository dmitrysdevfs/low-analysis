"use client";

import dynamic from "next/dynamic";

const AssistantPageView = dynamic(
  () =>
    import("@/features/assistant").then((m) => ({
      default: m.AssistantPageView,
    })),
  { ssr: false },
);

export default function AssistantClientWrapper() {
  return <AssistantPageView />;
}
