"use client";

import { useEffect } from "react";

export function BackendWarmup() {
  useEffect(() => {
    fetch("/api/laws", { method: "GET" }).catch(() => {});
  }, []);

  return null;
}
