"use client";

import type {
  RoadmapApiResponse,
  RoadmapContent,
} from "@/features/roadmap/types";
import { getJson } from "./laws";

export async function getRoadmap(
  options?: RequestInit,
): Promise<RoadmapApiResponse> {
  return getJson<RoadmapApiResponse>("/roadmap", options);
}

export async function getAdminRoadmap(
  options?: RequestInit,
): Promise<RoadmapApiResponse> {
  return getJson<RoadmapApiResponse>("/admin/roadmap", options);
}

export async function updateAdminRoadmap(
  content: RoadmapContent,
  options?: RequestInit,
): Promise<RoadmapApiResponse> {
  return getJson<RoadmapApiResponse>("/admin/roadmap", {
    ...options,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    body: JSON.stringify(content),
  });
}
