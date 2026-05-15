import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useParseLaw } from "@/hooks/useParseLaw";
import { parseLaw } from "@/lib/api";
import { notify } from "@/lib/toast";

vi.mock("@/lib/api", () => ({
  parseLaw: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useParseLaw", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits a law parsing request successfully", async () => {
    const onSuccess = vi.fn();

    vi.mocked(parseLaw).mockResolvedValue({
      message: "Success",
      lawId: "law-1",
      elementsCount: 10,
    });

    const { result } = renderHook(() => useParseLaw(onSuccess));

    await act(async () => {
      await result.current.submit(
        "https://zakon.rada.gov.ua/laws/show/254к/96-вр",
      );
    });

    expect(parseLaw).toHaveBeenCalledWith(
      "https://zakon.rada.gov.ua/laws/show/254к/96-вр",
    );

    expect(onSuccess).toHaveBeenCalled();
    expect(notify.success).toHaveBeenCalledWith("Закон успішно додано!");
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("handles parse request errors", async () => {
    vi.mocked(parseLaw).mockRejectedValue(new Error("Помилка парсингу"));

    const { result } = renderHook(() => useParseLaw());

    await act(async () => {
      await result.current.submit(
        "https://zakon.rada.gov.ua/laws/show/254к/96-вр",
      );
    });

    expect(result.current.error).toBe("Помилка парсингу");
    expect(notify.error).toHaveBeenCalledWith("Помилка парсингу");
    expect(result.current.loading).toBe(false);
  });

  it("maps HTTP 404 error to Ukrainian message and notifies", async () => {
    vi.mocked(parseLaw).mockRejectedValue(new Error("HTTP 404 Not Found"));

    const { result } = renderHook(() => useParseLaw());

    await act(async () => {
      await result.current.submit(
        "https://zakon.rada.gov.ua/laws/show/254к/96-вр",
      );
    });

    expect(result.current.error).toBe("Дані не знайдено.");
    expect(notify.error).toHaveBeenCalledWith("Дані не знайдено.");
  });

  it("maps network TypeError to Ukrainian message and notifies", async () => {
    vi.mocked(parseLaw).mockRejectedValue(new TypeError("Failed to fetch"));

    const { result } = renderHook(() => useParseLaw());

    await act(async () => {
      await result.current.submit(
        "https://zakon.rada.gov.ua/laws/show/254к/96-вр",
      );
    });

    expect(result.current.error).toMatch(/зв'язку з сервером/);
    expect(notify.error).toHaveBeenCalledWith(
      expect.stringMatching(/зв'язку з сервером/),
    );
  });
});
