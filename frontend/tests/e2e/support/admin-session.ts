import type { Page } from "@playwright/test";

const AUTH_SESSION_STORAGE_KEY = "low-analysis.auth.session";

const ADMIN_SESSION = {
  id: "dev-admin-account",
  displayName: "Dev Admin",
  email: "admin@low-analysis.dev",
  roles: ["admin", "client"],
  accountType: "admin",
  lastLoginAt: "2026-05-22T08:00:00.000Z",
};

export async function seedAdminSession(page: Page) {
  await page.addInitScript(
    ({ storageKey, session }) => {
      window.localStorage.setItem(storageKey, JSON.stringify(session));
    },
    {
      storageKey: AUTH_SESSION_STORAGE_KEY,
      session: ADMIN_SESSION,
    },
  );
}
