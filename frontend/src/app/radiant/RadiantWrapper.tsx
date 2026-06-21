"use client";

import dynamic from "next/dynamic";

const Radiant1Page = dynamic(
  () => import("@/features/radiant1").then((m) => m.Radiant1Page),
  { ssr: false },
);

export function RadiantWrapper() {
  return <Radiant1Page />;
}
