import type { Page } from "@playwright/test";

const AUTH_SESSION_STORAGE_KEY = "low-analysis.auth.session";
const AUTH_TOKEN_STORAGE_KEY = "low-analysis.auth.token";

// Fake JWT-like token (base64) — passes readStoredToken check
const FAKE_TOKEN = "dev-fake-token-e2e";

export async function seedUserSession(page: Page) {
  await page.addInitScript(
    ({ sessionKey, tokenKey, session, token }) => {
      window.localStorage.setItem(sessionKey, JSON.stringify(session));
      window.localStorage.setItem(tokenKey, token);
    },
    {
      sessionKey: AUTH_SESSION_STORAGE_KEY,
      tokenKey: AUTH_TOKEN_STORAGE_KEY,
      token: FAKE_TOKEN,
      session: {
        id: "dev-user-account",
        displayName: "Dev User",
        email: "user@low-analysis.dev",
        roles: ["user"],
        accountType: "client",
        lastLoginAt: "2026-06-04T08:00:00.000Z",
      },
    },
  );
}

export async function seedLegislatorSession(page: Page) {
  await page.addInitScript(
    ({ sessionKey, tokenKey, session, token }) => {
      window.localStorage.setItem(sessionKey, JSON.stringify(session));
      window.localStorage.setItem(tokenKey, token);
    },
    {
      sessionKey: AUTH_SESSION_STORAGE_KEY,
      tokenKey: AUTH_TOKEN_STORAGE_KEY,
      token: FAKE_TOKEN,
      session: {
        id: "dev-legislator-account",
        displayName: "Dev Legislator",
        email: "legislator@low-analysis.dev",
        roles: ["legislator"],
        accountType: "client",
        lastLoginAt: "2026-06-04T08:00:00.000Z",
      },
    },
  );
}

export { FAKE_TOKEN };
