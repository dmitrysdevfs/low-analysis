import { DATA_SOURCE_OPTIONS } from "@/constants/filters";
import { NAV_ITEMS } from "@/constants/navigation";
import { ROUTES } from "@/constants/routes";

describe("frontend route and config constants", () => {
  it("builds static and dynamic routes", () => {
    expect(ROUTES.home).toBe("/");
    expect(ROUTES.laws).toBe("/laws");
    expect(ROUTES.subjects).toBe("/subjects");
    expect(ROUTES.search).toBe("/search");
    expect(ROUTES.admin).toBe("/admin");
    expect(ROUTES.adminAnalytics).toBe("/admin/analytics");
    expect(ROUTES.auth).toBe("/auth");
    expect(ROUTES.authLogin).toBe("/auth/login");
    expect(ROUTES.authRegister).toBe("/auth/register");
    expect(ROUTES.account).toBe("/account");
    expect(ROUTES.accountBilling).toBe("/account/billing");
    expect(ROUTES.accountCheckout).toBe("/account/billing/checkout");
    expect(ROUTES.accountSaved).toBe("/account/saved");
    expect(ROUTES.accountNotes).toBe("/account/notes");
    expect(ROUTES.law("law-42")).toBe("/laws/law-42");
    expect(ROUTES.article("law-42", "12")).toBe("/laws/law-42/articles/12");
    expect(ROUTES.subject("subject-1")).toBe("/subjects/subject-1");
  });

  it("exposes ukrainian navigation items bound to routes", () => {
    expect(NAV_ITEMS).toEqual([
      { label: "Головна", href: ROUTES.home },
      { label: "Закони", href: ROUTES.laws },
      { label: "Суб'єкти", href: ROUTES.subjects },
      { label: "Пошук", href: ROUTES.search },
    ]);
  });

  it("lists backend source options for search/data switching", () => {
    expect(DATA_SOURCE_OPTIONS).toEqual([
      { label: "Сервер Render", value: "render" },
      { label: "Локальний сервер", value: "local" },
    ]);
  });
});
