import { DATA_SOURCE_OPTIONS } from "@/constants/filters";
import { NAV_ITEMS } from "@/constants/navigation";
import { ROUTES } from "@/constants/routes";

describe("frontend route and config constants", () => {
  it("builds static and dynamic routes", () => {
    expect(ROUTES.home).toBe("/");
    expect(ROUTES.laws).toBe("/laws");
    expect(ROUTES.analysis).toBe("/analysis");
    expect(ROUTES.projectInfo).toBe("/project-info");
    expect(ROUTES.subjects).toBe("/subjects");
    expect(ROUTES.search).toBe("/search");
    expect(ROUTES.admin).toBe("/admin");
    expect(ROUTES.adminAnalytics).toBe("/admin/analytics");
    expect(ROUTES.adminApiCenter).toBe("/admin/api-center");
    expect(ROUTES.adminNotifications).toBe("/admin/notifications");
    expect(ROUTES.adminJobs).toBe("/admin/jobs");
    expect(ROUTES.adminDataTools).toBe("/admin/data-tools");
    expect(ROUTES.adminProjectPage).toBe("/admin/project-page");
    expect(ROUTES.auth).toBe("/auth");
    expect(ROUTES.authLogin).toBe("/auth/login");
    expect(ROUTES.authRegister).toBe("/auth/register");
    expect(ROUTES.account).toBe("/account");
    expect(ROUTES.accountBilling).toBe("/account/billing");
    expect(ROUTES.accountCheckout).toBe("/account/billing/checkout");
    expect(ROUTES.accountSaved).toBe("/account/saved");
    expect(ROUTES.accountNotes).toBe("/account/notes");
    expect(ROUTES.supervisorGroups).toBe("/supervisor/groups");
    expect(ROUTES.supervisorHistory).toBe("/supervisor/history");
    expect(ROUTES.supervisorTemplates).toBe("/supervisor/templates");
    expect(ROUTES.supervisorChat).toBe("/supervisor/chat");
    expect(ROUTES.legislatorCabinetGroups).toBe("/legislator-cabinet/groups");
    expect(ROUTES.legislatorCabinetHistory).toBe("/legislator-cabinet/history");
    expect(ROUTES.legislatorCabinetTemplates).toBe("/legislator-cabinet/templates");
    expect(ROUTES.legislatorCabinetChat).toBe("/legislator-cabinet/chat");
    expect(ROUTES.law("law-42")).toBe("/laws/law-42");
    expect(ROUTES.analysisLaw("law-42")).toBe("/analysis/laws/law-42");
    expect(ROUTES.article("law-42", "12")).toBe("/laws/law-42/articles/12");
    expect(ROUTES.subject("subject-1")).toBe("/subjects/subject-1");
  });

  it("exposes ukrainian navigation items bound to routes", () => {
    expect(NAV_ITEMS).toEqual([
      { label: "Головна", href: ROUTES.home },
      { label: "Закони", href: ROUTES.laws },
      { label: "Аналіз", href: ROUTES.analysis },
      { label: "Проєкт", href: ROUTES.projectInfo },
      { label: "Суб'єкти", href: ROUTES.subjects },
      { label: "Пошук", href: ROUTES.search },
      { label: "Lex AI", href: ROUTES.assistant },
      { label: "Roadmap", href: ROUTES.roadmap },
      { label: "Довідка", href: ROUTES.help },
    ]);
  });

  it("lists backend source options for search/data switching", () => {
    expect(DATA_SOURCE_OPTIONS).toEqual([
      { label: "Сервер Render", value: "render" },
      { label: "Локальний сервер", value: "local" },
    ]);
  });
});
