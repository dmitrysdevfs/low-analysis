"use client";
// Re-exports existing useLaws hook unchanged.
// In local mode the hook already has its own module-level cache (1 min TTL).
export { useLaws as useLawsLocal } from "@/hooks/useLaws";
