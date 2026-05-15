"use client";

import type { Subject, SubjectElements } from "@/types";
import { getJson } from "./laws";

export async function getSubjects(options?: RequestInit): Promise<Subject[]> {
  return getJson<Subject[]>("/subjects", options);
}

export async function getSubjectElements(
  id: string,
  options?: RequestInit,
): Promise<SubjectElements> {
  return getJson<SubjectElements>(`/subjects/${id}/elements`, options);
}
