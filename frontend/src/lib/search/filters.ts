import type { Law } from "@/types";
import type { SearchParams } from "@/types/search.types";

export function applySearchFilters(laws: Law[], params: SearchParams): Law[] {
  let filtered = [...laws];

  if (params.docType) {
    filtered = filtered.filter((law) =>
      law.documentType?.some((t) =>
        t.toLowerCase().includes(params.docType.toLowerCase()),
      ) ?? false,
    );
  }

  if (params.number.trim()) {
    const num = params.number.trim().toLowerCase();
    if (params.numberType === "starts") {
      filtered = filtered.filter((law) =>
        law.code.toLowerCase().startsWith(num),
      );
    } else if (params.numberType === "contains") {
      filtered = filtered.filter((law) => law.code.toLowerCase().includes(num));
    } else {
      filtered = filtered.filter((law) => law.code.toLowerCase() === num);
    }
  }

  if (params.dateFrom) {
    const from = new Date(params.dateFrom).getTime();
    filtered = filtered.filter(
      (law) => new Date(law.adoptedDate ?? law.createdAt).getTime() >= from,
    );
  }

  if (params.dateTo) {
    const to = new Date(params.dateTo + "T23:59:59.999").getTime();
    filtered = filtered.filter(
      (law) => new Date(law.adoptedDate ?? law.createdAt).getTime() <= to,
    );
  }

  if (params.status) {
    filtered = filtered.filter((law) =>
      (law.status ?? "").toLowerCase().includes(params.status.toLowerCase()),
    );
  }

  return filtered;
}

export function sortLaws(laws: Law[], sort: SearchParams["sort"]): Law[] {
  const sorted = [...laws];

  if (sort === "title") {
    sorted.sort((a, b) => a.title.localeCompare(b.title, "uk"));
  } else if (sort === "date") {
    sorted.sort(
      (a, b) =>
        new Date(b.adoptedDate ?? b.createdAt).getTime() -
        new Date(a.adoptedDate ?? a.createdAt).getTime(),
    );
  }

  return sorted;
}
