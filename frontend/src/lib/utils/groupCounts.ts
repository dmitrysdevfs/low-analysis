/**
 * Count occurrences of each unique value in an array,
 * returning entries sorted by count descending.
 */
export function groupCounts(values: string[]): Array<[string, number]> {
  const counts = new Map<string, number>();

  values.forEach((value) => {
    const key = value.trim() || "Unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return [...counts.entries()].sort((left, right) => right[1] - left[1]);
}
