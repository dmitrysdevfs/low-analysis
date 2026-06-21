export interface PlatformStructureItem {
  id: string;
  variant: "hero" | "small" | "wide";
  iconId: string;
  title: string;
  desc: string;
  bullets?: string[];
  href: string;
}

export interface PlatformBenefitItem {
  iconId: string;
  title: string;
  desc: string;
  href: string;
}

export interface RoadmapItem {
  done: boolean;
  text: string;
  badgeLabel: string;
}

export interface LandingStatItem {
  iconId: string;
  value: string;
  label: string;
}

export const platformStructure: PlatformStructureItem[] = [
  {
    id: "legal-base",
    variant: "hero",
    iconId: "temple",
    title: "Правова база",
    desc: "Повна та актуальна база законодавства України з офіційних джерел. Зручна навігація, пошук та фільтри.",
    bullets: [
      "Закони та кодекси",
      "Підзаконні акти",
      "Судова практика",
      "Міжнародні договори",
    ],
    href: "/laws",
  },
  {
    id: "taxonomy",
    variant: "small",
    iconId: "grid",
    title: "Систематизація",
    desc: "Структуруємо право для швидкого розуміння та застосування.",
    href: "/laws",
  },
  {
    id: "tools",
    variant: "small",
    iconId: "tools",
    title: "Інструменти",
    desc: "Професійні інструменти для аналізу, порівняння та роботи з документами.",
    href: "/search",
  },
  {
    id: "profile",
    variant: "wide",
    iconId: "profile",
    title: "Профіль користувача",
    desc: "Персоналізований кабінет, збережені запити, обрані документи та налаштування доступу під ваші задачі.",
    href: "/account",
  },
];

export const platformBenefits: PlatformBenefitItem[] = [
  {
    iconId: "search",
    title: "Розумний пошук",
    desc: "Швидкий пошук по всій правовій базі з автодоповненням та релевантними результатами.",
    href: "/search",
  },
  {
    iconId: "lexai",
    title: "Lex AI",
    desc: "Штучний інтелект для пояснення норм, аналізу документів і формування практичних висновків.",
    href: "/laws",
  },
  {
    iconId: "analytics",
    title: "Аналітика та інсайти",
    desc: "Візуалізуйте дані, відстежуйте тренди та отримуйте інсайти для обґрунтованих рішень.",
    href: "/laws",
  },
  {
    iconId: "diff",
    title: "Порівняння редакцій",
    desc: "Порівнюйте зміни в редакціях документів та відстежуйте еволюцію нормативних актів.",
    href: "/laws",
  },
  {
    iconId: "bell",
    title: "Моніторинг змін",
    desc: "Отримуйте сповіщення про зміни законодавства та важливі події у вашій сфері.",
    href: "/account",
  },
  {
    iconId: "shield",
    title: "Доступ та безпека",
    desc: "Надійний захист даних, ролі доступу та відповідність сучасним стандартам безпеки.",
    href: "/account",
  },
];

export const premiumRoadmap: RoadmapItem[] = [
  {
    done: true,
    text: "Запущено повноцінну правову базу",
    badgeLabel: "Готово",
  },
  {
    done: true,
    text: "Розумний пошук та фільтрація документів",
    badgeLabel: "Готово",
  },
  {
    done: true,
    text: "AI-помічник для аналізу норм і документів",
    badgeLabel: "Готово",
  },
  {
    done: true,
    text: "Порівняння редакцій та історія змін",
    badgeLabel: "Готово",
  },
  {
    done: true,
    text: "Персоналізований кабінет користувача",
    badgeLabel: "Готово",
  },
  {
    done: true,
    text: "Система моніторингу змін законодавства",
    badgeLabel: "Готово",
  },
  {
    done: false,
    text: "Інтеграція судової практики та аналітики",
    badgeLabel: "У планах",
  },
  {
    done: false,
    text: "Конструктор правових документів",
    badgeLabel: "У планах",
  },
  { done: false, text: "Галузеві аналітичні дашборди", badgeLabel: "У планах" },
  { done: false, text: "Мобільний застосунок", badgeLabel: "У планах" },
  {
    done: false,
    text: "API для інтеграції з вашими системами",
    badgeLabel: "У планах",
  },
  { done: false, text: "Мультимовність платформи", badgeLabel: "У планах" },
];

export const landingStats: LandingStatItem[] = [
  { iconId: "laurel", value: "12", label: "законів у базі" },
  { iconId: "experts", value: "161", label: "розділів" },
  { iconId: "acts", value: "2 765", label: "статей" },
];
