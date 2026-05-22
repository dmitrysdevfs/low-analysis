import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { scrollToHashWithRetry } from "@/lib/utils/scrollToHashWithRetry";

describe("scrollToHashWithRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("scrolls to element if it exists", () => {
    const scrollIntoView = vi.fn();

    const element = document.createElement("div");
    element.id = "test-anchor";
    element.scrollIntoView = scrollIntoView;

    document.body.appendChild(element);

    scrollToHashWithRetry("#test-anchor");

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
  });

  it("retries until element appears", () => {
    const scrollIntoView = vi.fn();

    scrollToHashWithRetry("#delayed-anchor");

    setTimeout(() => {
      const element = document.createElement("div");
      element.id = "delayed-anchor";
      element.scrollIntoView = scrollIntoView;

      document.body.appendChild(element);
    }, 240);

    vi.advanceTimersByTime(500);

    expect(scrollIntoView).toHaveBeenCalled();
  });

  it("stops retrying after max attempts", () => {
    const getElementSpy = vi.spyOn(document, "getElementById");

    scrollToHashWithRetry("#missing");

    vi.advanceTimersByTime(5000);

    expect(getElementSpy).toHaveBeenCalledTimes(15);
  });
});
