export function normalizeLawTitle(title: string) {
  const isAllCaps = title === title.toUpperCase();

  if (!isAllCaps) {
    return title;
  }

  return title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
}
