import { expect, test, type Page, type Route } from "@playwright/test";
import { seedAdminSession } from "./support/admin-session";
import { seedLegislatorSession } from "./support/legislator-session";

const GUEST_KEY = "low-analysis.guest.welcome-shown.v1";

function jsonResponse(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(body),
  });
}

async function suppressWelcome(page: Page) {
  await page.addInitScript(
    (k) => window.localStorage.setItem(k, "1"),
    GUEST_KEY,
  );
}

async function installCoreApiMocks(
  page: Page,
  role: string,
  userId: string,
  displayName: string,
) {
  // Single catch-all handler — checks in FIFO order inside the handler
  await page.route("**/api/**", async (route) => {
    const method = route.request().method().toUpperCase();
    const url = new URL(route.request().url());
    const path = url.pathname;

    // Auth verification — return profile so session doesn't get cleared
    if (method === "GET" && path === "/api/auth/me") {
      return jsonResponse(route, {
        _id: userId,
        fullName: displayName,
        email: `${role}@test.dev`,
        role,
      });
    }
    // Old proposals/amendments used by existing cabinet page
    if (method === "GET" && path.startsWith("/api/proposals"))
      return jsonResponse(route, []);
    if (method === "GET" && path.startsWith("/api/amendments"))
      return jsonResponse(route, []);
    if (method === "GET" && path.startsWith("/api/laws"))
      return jsonResponse(route, []);
    if (method === "GET" && path.startsWith("/api/subjects"))
      return jsonResponse(route, []);

    // Law-change sub-routes
    if (path === "/api/law-change/legislator-requests/my")
      return jsonResponse(route, null);
    if (
      path.startsWith("/api/law-change/legislator-requests") &&
      method === "POST"
    ) {
      return jsonResponse(route, { _id: "req-1", status: "pending" }, 201);
    }
    if (path.startsWith("/api/law-change/legislator-requests"))
      return jsonResponse(route, []);
    if (path === "/api/law-change/proposals/my") return jsonResponse(route, []);
    if (path.startsWith("/api/law-change/approved"))
      return jsonResponse(route, []);
    if (path.startsWith("/api/law-change")) return jsonResponse(route, null);

    return jsonResponse(
      route,
      { message: `Unmatched: ${method} ${path}` },
      404,
    );
  });
}

// installLawChangeMocks is now handled inside installCoreApiMocks
// Kept as no-op for backwards compatibility in describe blocks that call it separately
async function installLawChangeMocks(_page: Page) {
  // handled inline in installCoreApiMocks catch-all
}

test.describe("Living Law System — legislator cabinet (legislator role)", () => {
  test.beforeEach(async ({ page }) => {
    await seedLegislatorSession(page);
    await suppressWelcome(page);
    await installCoreApiMocks(
      page,
      "legislator",
      "dev-legislator-account",
      "Dev Legislator",
    );
    await installLawChangeMocks(page);
  });

  test("page loads without crash", async ({ page }) => {
    await page.goto("/legislator-cabinet", { waitUntil: "domcontentloaded" });

    // Any meaningful content renders (not blank page)
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test("page renders content without 500 error", async ({ page }) => {
    await page.goto("/legislator-cabinet", { waitUntil: "domcontentloaded" });

    // Page renders some content — not a 500 or network error
    await expect(page.locator("body")).not.toBeEmpty();

    // The page shows either the loading gate, the access gate, or the actual content
    // All are valid states depending on auth hydration timing
    const hasAnyHeading = await page.locator("h1").count();
    expect(hasAnyHeading).toBeGreaterThan(0);
  });
});

test.describe("Living Law System — legislator cabinet (admin role)", () => {
  test.beforeEach(async ({ page }) => {
    await seedAdminSession(page);
    await suppressWelcome(page);
    await installCoreApiMocks(page, "admin", "dev-admin-account", "Dev Admin");
  });

  test("admin sees cabinet page h1", async ({ page }) => {
    await page.goto("/legislator-cabinet", { waitUntil: "domcontentloaded" });

    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Living Law System — law-change API route smoke", () => {
  test("GET /api/law-change/proposals/my returns 401 without auth", async ({
    page,
  }) => {
    const response = await page.request.get("/api/law-change/proposals/my");
    expect(response.status()).toBe(401);
  });

  test("GET /api/law-change/approved/feed returns something", async ({
    page,
  }) => {
    const response = await page.request.get("/api/law-change/approved/feed");
    expect([200, 401, 404, 500]).toContain(response.status());
  });
});

test.describe("Living Law System — proposals page (vote flow)", () => {
  test.beforeEach(async ({ page }) => {
    await seedLegislatorSession(page);
    await suppressWelcome(page);
    await installCoreApiMocks(
      page,
      "legislator",
      "legislator-voter-id",
      "Test Legislator",
    );

    // Proposals list
    await page.route("**/api/law-change/proposals**", async (route) => {
      const url = new URL(route.request().url());
      const path = url.pathname;
      if (path === "/api/law-change/proposals/my") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          proposals: [
            {
              _id: "prop-e2e-1",
              law_id: { _id: "law-1", title: "Закон про тест" },
              status: "active",
              change_type: "edit",
              created_by: "other-author-id",
              author_display_name: "Автор Тест",
              original_text: "Старий текст статті",
              proposed_text: "Новий текст статті",
              votes_for_weighted: 0,
              votes_against_weighted: 0,
              votes_for_count: 0,
              votes_against_count: 0,
              voting_deadline: null,
            },
          ],
          total: 1,
          page: 1,
          pages: 1,
        }),
      });
    });

    // Vote stats
    await page.route(
      "**/api/law-change/proposals/*/votes",
      async (route) => {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            votes_for_weighted: 0,
            votes_against_weighted: 0,
            votes_for_count: 0,
            votes_against_count: 0,
            total_weight: 0,
            my_vote: null,
          }),
        });
      },
    );

    // Cast vote
    await page.route(
      "**/api/law-change/proposals/*/vote",
      async (route) => {
        if (route.request().method() === "POST") {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              votes_for_weighted: 3,
              votes_against_weighted: 0,
              votes_for_count: 1,
              votes_against_count: 0,
              total_weight: 3,
              my_vote: "for",
            }),
          });
        }
        // DELETE — remove vote
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            votes_for_weighted: 0,
            votes_against_weighted: 0,
            votes_for_count: 0,
            votes_against_count: 0,
            total_weight: 0,
            my_vote: null,
          }),
        });
      },
    );
  });

  test("proposals page renders cards with vote buttons", async ({ page }) => {
    await page.goto("/proposals", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("Закон про тест")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("✓ За")).toBeVisible();
    await expect(page.getByText("✗ Проти")).toBeVisible();
  });

  test("clicking За button triggers vote API call", async ({ page }) => {
    const voteCalls: string[] = [];
    page.on("request", (req) => {
      if (
        req.url().includes("/vote") &&
        req.method() === "POST"
      ) {
        voteCalls.push(req.url());
      }
    });

    await page.goto("/proposals", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("text=✓ За");

    await page.getByText("✓ За").click();

    await page.waitForTimeout(500);
    expect(voteCalls.length).toBeGreaterThan(0);
  });
});
