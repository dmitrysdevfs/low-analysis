import { Proposal, Law } from "@/types";

export function getLawTitle(
  law: Proposal["law_id"] | Law | string | null | undefined,
): string {
  if (!law) return "";
  if (typeof law === "string") return law;
  return "title" in law ? law.title : "";
}
