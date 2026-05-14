"use client";

import type { Subject, SubjectElements } from "@/types";
import { getJson } from "./laws";

export async function getSubjects(): Promise<Subject[]> {
  return getJson<Subject[]>("/subjects");
}

export async function getSubjectElements(id: string): Promise<SubjectElements> {
  return getJson<SubjectElements>(`/subjects/${id}/elements`);
}
