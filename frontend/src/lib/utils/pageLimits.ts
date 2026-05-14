export const DEFAULT_ARTICLE_LIMIT = 20;
export const ARTICLE_LIMIT_OPTIONS = [10, 20, 50, 100] as const;

export function parseLimitValue(rawValue: string | null) {
  if (rawValue === "all") {
    return "all" as const;
  }

  const parsed = Number(rawValue);
  return ARTICLE_LIMIT_OPTIONS.includes(
    parsed as (typeof ARTICLE_LIMIT_OPTIONS)[number],
  )
    ? parsed
    : DEFAULT_ARTICLE_LIMIT;
}

export function toLimitParam(value: number | "all") {
  return value === "all" ? "all" : String(value);
}

export function getNextLimitValue(current: number | "all") {
  if (current === "all") {
    return "all" as const;
  }

  return ARTICLE_LIMIT_OPTIONS.find((option) => option > current) ?? "all";
}
