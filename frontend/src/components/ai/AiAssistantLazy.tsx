"use client";

import dynamic from "next/dynamic";

const AiAssistantDynamic = dynamic(
  () =>
    import("@/components/ai/AiAssistant").then((m) => ({
      default: m.AiAssistant,
    })),
  { ssr: false },
);

export function AiAssistantLazy() {
  return <AiAssistantDynamic />;
}
