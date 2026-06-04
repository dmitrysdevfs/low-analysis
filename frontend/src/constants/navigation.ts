import { ROUTES } from "./routes";

const BASE_NAV_ITEMS = [
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

export function buildNavItems(opts: { isAuthenticated: boolean }) {
  if (!opts.isAuthenticated) return BASE_NAV_ITEMS;
  return [
    ...BASE_NAV_ITEMS,
    { label: "Кабінет законотворця", href: ROUTES.legislatorCabinet },
  ];
}

export type SessionMenuItem = {
  href: string;
  label: string;
  caption: string;
};

export function buildSessionMenuItems(opts: {
  isAdmin: boolean;
  isLegislator: boolean;
}): SessionMenuItem[] {
  const items: SessionMenuItem[] = [
    {
      href: ROUTES.account,
      label: "Мій кабінет",
      caption: "Профіль, пароль та особисті налаштування",
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
    {
      href: ROUTES.legislatorCabinet,
      label: "Кабінет законотворця",
      caption: opts.isLegislator
        ? "Поправки, пропозиції та робота із законопроєктами"
        : "Подайте запит на роль законотворця",
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
