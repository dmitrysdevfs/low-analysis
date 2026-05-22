import { expect, test, type Page } from "@playwright/test";
import { seedAdminSession } from "./support/admin-session";
import {
  ApiRequestProfiler,
  type ApiScenarioMetrics,
  writeApiMetricsReport,
} from "./support/api-profiler";
import { installApiMocking } from "./support/api-mocks";

const GUEST_WELCOME_STORAGE_KEY = "low-analysis.guest.welcome-shown.v1";
const scenarioReports: ApiScenarioMetrics[] = [];

async function suppressGuestWelcome(page: Page) {
  await page.addInitScript((storageKey) => {
    window.localStorage.setItem(storageKey, "1");
  }, GUEST_WELCOME_STORAGE_KEY);
}

function getCount(snapshot: ApiScenarioMetrics, key: string) {
  return snapshot.endpoints.find((item) => item.key === key)?.count ?? 0;
}

test.describe.serial("frontend API request metrics", () => {
  test.afterAll(async () => {
    await writeApiMetricsReport("latest.json", scenarioReports);
  });

  test.beforeEach(async ({ page }) => {
    await suppressGuestWelcome(page);
  });

  test("profiles the laws catalog request load", async ({ page }) => {
    const profiler = new ApiRequestProfiler("laws-catalog");
    await installApiMocking(page, profiler);

    const lawsResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        response.url().includes("/api/laws"),
    );
    await page.goto("/laws", { waitUntil: "domcontentloaded" });
    await lawsResponse;

    const filteredResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        response.url().includes("/api/laws?q="),
    );
    await page.getByPlaceholder(/Пошук за назвою закону/i).fill("освіту");
    await filteredResponse;
    await page.waitForTimeout(150);

    const snapshot = profiler.snapshot();
    scenarioReports.push(snapshot);

    expect(snapshot.totalRequests).toBeGreaterThan(0);
    expect(getCount(snapshot, "GET /api/laws")).toBeLessThanOrEqual(3);
    expect(getCount(snapshot, "GET /api/laws?q")).toBeLessThanOrEqual(1);
  });

  test("profiles the law structure request load", async ({ page }) => {
    const profiler = new ApiRequestProfiler("law-structure");
    await installApiMocking(page, profiler);

    const treeResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        response.url().includes("/api/laws/law-1/tree"),
    );
    const statsResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        response.url().includes("/api/laws/law-1/stats"),
    );
    const subjectsResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        response.url().includes("/api/subjects"),
    );

    await page.goto("/laws/law-1", { waitUntil: "domcontentloaded" });
    await Promise.all([treeResponse, statsResponse, subjectsResponse]);
    await page.waitForTimeout(150);

    const snapshot = profiler.snapshot();
    scenarioReports.push(snapshot);

    expect(snapshot.totalRequests).toBeGreaterThan(0);
    expect(getCount(snapshot, "GET /api/laws/:id/tree")).toBeLessThanOrEqual(1);
    expect(getCount(snapshot, "GET /api/laws/:id/stats")).toBeLessThanOrEqual(
      1,
    );
    expect(getCount(snapshot, "GET /api/subjects")).toBeLessThanOrEqual(1);
  });

  test("profiles search results traffic", async ({ page }) => {
    const profiler = new ApiRequestProfiler("search-results");
    await installApiMocking(page, profiler);

    const searchResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        response.url().includes("/api/laws?q="),
    );
    await page.goto("/search/results?q=освіту&wordField=title", {
      waitUntil: "domcontentloaded",
    });
    await searchResponse;
    await page.waitForTimeout(150);

    const snapshot = profiler.snapshot();
    scenarioReports.push(snapshot);

    expect(snapshot.totalRequests).toBeGreaterThan(0);
    expect(getCount(snapshot, "GET /api/laws?q")).toBeLessThanOrEqual(1);
    expect(getCount(snapshot, "GET /api/laws")).toBeLessThanOrEqual(2);
  });

  test("profiles the article page request mix", async ({ page }) => {
    const profiler = new ApiRequestProfiler("article-page");
    await installApiMocking(page, profiler);

    const articleResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        response.url().includes("/api/laws/law-1/articles/1"),
    );
    const subjectsResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        response.url().includes("/api/subjects"),
    );

    await page.goto("/laws/law-1/articles/1", {
      waitUntil: "domcontentloaded",
    });
    await Promise.all([articleResponse, subjectsResponse]);
    await page.waitForTimeout(150);

    const snapshot = profiler.snapshot();
    scenarioReports.push(snapshot);

    expect(snapshot.totalRequests).toBeGreaterThan(0);
    expect(
      getCount(snapshot, "GET /api/laws/:id/articles/:num"),
    ).toBeLessThanOrEqual(1);
    expect(getCount(snapshot, "GET /api/subjects")).toBeLessThanOrEqual(1);
    expect(getCount(snapshot, "GET /api/laws")).toBeLessThanOrEqual(2);
  });

  test("profiles admin dashboard traffic", async ({ page }) => {
    const profiler = new ApiRequestProfiler("admin-dashboard");
    await installApiMocking(page, profiler);
    await seedAdminSession(page);

    const lawsResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        response.url().includes("/api/laws"),
    );
    const subjectsResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        response.url().includes("/api/subjects"),
    );

    await page.goto("/admin", { waitUntil: "domcontentloaded" });
    await Promise.all([lawsResponse, subjectsResponse]);
    await page.waitForTimeout(150);

    const snapshot = profiler.snapshot();
    scenarioReports.push(snapshot);

    expect(snapshot.totalRequests).toBeGreaterThan(0);
    expect(getCount(snapshot, "GET /api/laws")).toBeLessThanOrEqual(2);
    expect(getCount(snapshot, "GET /api/subjects")).toBeLessThanOrEqual(1);
  });
});
