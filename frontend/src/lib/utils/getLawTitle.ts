import { Proposal, Law } from "@/types";

export function getLawTitle(
  law: Proposal["law_id"] | Law | string | null | undefined,
): string {
  if (!law || typeof law === "string") return "";
  return "title" in law ? law.title : "";
}
