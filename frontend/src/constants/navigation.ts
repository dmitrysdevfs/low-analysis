import { ROUTES } from "./routes";

export type NavItem = {
  label: string;
  href: string;
  subItems?: { label: string; href: string }[];
};

// Always visible (guests + authenticated)
const BASE_NAV_ITEMS: NavItem[] = [
  { label: "Головна", href: ROUTES.home },
  { label: "Закони", href: ROUTES.laws },
  { label: "Аналіз", href: ROUTES.analysis },
  { label: "Проєкт", href: ROUTES.projectInfo },
  { label: "Суб'єкти", href: ROUTES.subjects },
  { label: "Пошук", href: ROUTES.search },
  { label: "Lex AI", href: ROUTES.assistant },
  { label: "Roadmap", href: ROUTES.roadmap },
  { label: "Довідка", href: ROUTES.help },
];

export const NAV_ITEMS = BASE_NAV_ITEMS;

export function buildNavItems(opts: {
  isAuthenticated: boolean;
  isLegislator?: boolean;
  isSupervisor?: boolean;
}): NavItem[] {
  if (!opts.isAuthenticated) return BASE_NAV_ITEMS;

  const result: NavItem[] = [];
  for (const item of BASE_NAV_ITEMS) {
    result.push(item);
    if (item.href === ROUTES.subjects) {
      if (opts.isLegislator) {
        result.push({
          label: "Кабінет законотворця",
          href: ROUTES.legislatorCabinet,
        });
      }
      if (opts.isSupervisor) {
        result.push({
          label: "Супервізор",
          href: ROUTES.supervisorDashboard,
        });
      }
    }
    if (item.href === ROUTES.assistant) {
      result.push({ label: "Граф", href: ROUTES.graph });
      result.push({ label: "Радіант", href: ROUTES.radiant });
    }
  }
  return result;
}

export type SessionMenuItem = {
  href: string;
  label: string;
  caption: string;
};

export function buildSessionMenuItems(opts: {
  isAdmin: boolean;
  isLegislator: boolean;
  isSupervisor?: boolean;
}): SessionMenuItem[] {
  const items: SessionMenuItem[] = [
    {
      href: ROUTES.account,
      label: "Мій кабінет",
      caption: "Профіль, пароль та особисті налаштування",
    },
    {
      href: ROUTES.legislatorCabinet,
      label: "Кабінет законотворця",
      caption: opts.isLegislator
        ? "Поправки, пропозиції та робота із законопроєктами"
        : "Подайте запит на роль законотворця",
    },
    {
      href: ROUTES.supervisorDashboard,
      label: "Супервізор",
      caption: opts.isSupervisor
        ? "Панель нагляду та моніторингу платформи"
        : "Подайте запит на роль супервізора",
    },
    {
      href: ROUTES.accountSaved,
      label: "Збережені статті",
      caption: "Швидкий доступ до важливих документів",
    },
    {
      href: ROUTES.accountNotes,
      label: "Нотатки",
      caption: "Особисті правові чернетки та спостереження",
    },
    {
      href: ROUTES.accountBilling,
      label: "План та оплата",
      caption: "Поточний рівень доступу, квоти та demo-checkout",
    },
  ];

  if (opts.isAdmin) {
    items.push({
      href: ROUTES.adminAnalytics,
      label: "Аналітика",
      caption: "Метрики, покриття та операційний огляд",
    });
  }

  return items;
}
