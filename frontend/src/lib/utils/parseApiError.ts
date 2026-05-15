export function parseApiError(error: unknown): string {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "__ABORT__";
  }
  if (
    error instanceof TypeError &&
    error.message.toLowerCase().includes("fetch")
  ) {
    return "Немає зв'язку з сервером. Перевірте підключення до інтернету.";
  }
  if (error instanceof Error) {
    if (error.message.startsWith("HTTP 404")) return "Дані не знайдено.";
    if (
      error.message.startsWith("HTTP 401") ||
      error.message.startsWith("HTTP 403")
    ) {
      return "Доступ заборонено.";
    }
    if (error.message.match(/^HTTP 5/))
      return "Помилка сервера. Спробуйте пізніше.";
    if (error.message.trim()) return error.message;
  }
  return "Невідома помилка. Спробуйте знову.";
}
