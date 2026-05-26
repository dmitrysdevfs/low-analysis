"use client";

import { useEffect } from "react";
import { getJson } from "@/lib/api";

export function BackendWarmup() {
  useEffect(() => {
    getJson("/laws").catch(() => {});
  }, []);

  return null;
}
