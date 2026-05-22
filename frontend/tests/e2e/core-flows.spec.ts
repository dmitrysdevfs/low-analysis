import { expect, test, type Page } from "@playwright/test";
import { installApiMocking } from "./support/api-mocks";
import { seedAdminSession } from "./support/admin-session";

const GUEST_WELCOME_STORAGE_KEY = "low-analysis.guest.welcome-shown.v1";

async function suppressGuestWelcome(page: Page) {
  await page.addInitScript((storageKey) => {
    window.localStorage.setItem(storageKey, "1");
  }, GUEST_WELCOME_STORAGE_KEY);
}

test.describe("frontend browser flows", () => {
  test.beforeEach(async ({ page }) => {
    await installApiMocking(page);
    await suppressGuestWelcome(page);
  });

  test("laws catalog supports search and article preview", async ({ page }) => {
    const lawsResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        response.url().includes("/api/laws"),
    );

    await page.goto("/laws", { waitUntil: "domcontentloaded" });
    await lawsResponse;

    await expect(page.getByRole("heading", { name: /Закони/i })).toBeVisible();

    const searchInput = page.getByPlaceholder(/Пошук за назвою закону/i);
    await expect(searchInput).toBeVisible();

    const filteredResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        response.url().includes("/api/laws?q="),
    );
    await searchInput.fill("Конституція");
    await filteredResponse;

    const treeResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        response.url().includes("/api/laws/law-1/tree"),
    );
    await page.locator("h2").first().click();
    await treeResponse;

    await expect(
      page.getByPlaceholder(/Пошук за номером статті/i),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Всі статті закону/i }),
    ).toBeVisible();
  });

  test("search results route renders matching law", async ({ page }) => {
    const searchResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        response.url().includes("/api/laws?q="),
    );

    await page.goto("/search/results?q=освіту&wordField=title", {
      waitUntil: "domcontentloaded",
    });
    await searchResponse;

    await expect(page.getByText(/Результат пошуку/i)).toBeVisible();
    await expect(page.getByText(/Про освіту/i)).toBeVisible();
  });

  test("article page renders subject chips and copy actions", async ({
    page,
  }) => {
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
    await articleResponse;
    await subjectsResponse;

    await expect(
      page.getByRole("button", { name: "Копіювати елемент" }).first(),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "держава" })).toBeVisible();
  });

  test("admin dashboard opens inside the dedicated shell", async ({ page }) => {
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
    await lawsResponse;
    await subjectsResponse;

    await expect(
      page.getByRole("link", { name: /Публічний сайт/i }),
    ).toBeVisible();
    await expect(page.getByText(/Поточний масштаб/i)).toBeVisible();
  });
});
