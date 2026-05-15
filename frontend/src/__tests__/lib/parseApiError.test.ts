import { parseApiError } from "@/lib/utils";

describe("parseApiError", () => {
  it("returns __ABORT__ for DOMException AbortError", () => {
    const err = new DOMException("Aborted", "AbortError");
    expect(parseApiError(err)).toBe("__ABORT__");
  });

  it("returns network message for fetch TypeError", () => {
    const err = new TypeError("Failed to fetch");
    expect(parseApiError(err)).toMatch(/зв'язку з сервером/);
  });

  it("maps HTTP 404 to Ukrainian not-found message", () => {
    expect(parseApiError(new Error("HTTP 404 Not Found"))).toBe(
      "Дані не знайдено.",
    );
  });

  it("maps HTTP 401 to access-denied message", () => {
    expect(parseApiError(new Error("HTTP 401 Unauthorized"))).toBe(
      "Доступ заборонено.",
    );
  });

  it("maps HTTP 403 to access-denied message", () => {
    expect(parseApiError(new Error("HTTP 403 Forbidden"))).toBe(
      "Доступ заборонено.",
    );
  });

  it("maps HTTP 500 to server error message", () => {
    expect(parseApiError(new Error("HTTP 500 Internal Server Error"))).toBe(
      "Помилка сервера. Спробуйте пізніше.",
    );
  });

  it("maps HTTP 503 to server error message", () => {
    expect(parseApiError(new Error("HTTP 503 Service Unavailable"))).toBe(
      "Помилка сервера. Спробуйте пізніше.",
    );
  });

  it("passes through custom error message as-is", () => {
    expect(parseApiError(new Error("Щось пішло не так"))).toBe(
      "Щось пішло не так",
    );
  });

  it("returns fallback for null", () => {
    expect(parseApiError(null)).toBe("Невідома помилка. Спробуйте знову.");
  });

  it("returns fallback for plain objects", () => {
    expect(parseApiError({ code: 42 })).toBe(
      "Невідома помилка. Спробуйте знову.",
    );
  });

  it("returns fallback for undefined", () => {
    expect(parseApiError(undefined)).toBe("Невідома помилка. Спробуйте знову.");
  });
});
