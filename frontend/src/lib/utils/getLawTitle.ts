import { Proposal } from "@/types";

export function getLawTitle(law: Proposal["law_id"]) {
  if (!law) return "";
  if (typeof law === "string") return "";
  return law.title;
}
