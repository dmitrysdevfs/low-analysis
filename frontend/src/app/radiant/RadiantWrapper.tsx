"use client";

import dynamic from "next/dynamic";

const RadiantPage = dynamic(
  () => import("@/features/radiant").then((m) => m.RadiantPage),
  { ssr: false },
);

export function RadiantWrapper() {
  return <RadiantPage />;
}
