/**
 * Format a date string to Ukrainian locale (dd Mon, HH:mm).
 */
export function formatDateShort(value?: string): string {
  if (!value) return "No activity yet";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

/**
 * Format a date string to Ukrainian locale (dd Mon YYYY).
 */
export function formatDateMedium(value: string): string {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

/**
 * Format a date string to Ukrainian locale (dd Mon YYYY, HH:mm).
 */
export function formatDateFull(value?: string): string {
  if (!value) return "No recorded activity";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
