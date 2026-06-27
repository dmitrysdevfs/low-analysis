import type { ManagedPagePublicResponse } from "@/types";

function makeFallback(
  slug: string,
  title: string,
  description: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blocks: any[],
): ManagedPagePublicResponse {
  return {
    slug,
    status: "published",
    title,
    description,
    seo: { title: `${title} | Law Analysis`, description, ogImage: "" },
    blocks: blocks as ManagedPagePublicResponse["blocks"],
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
  };
}

export const ROLES_GUEST_FALLBACK = makeFallback(
  "roles-guest",
  "Гість",
  "Ви відкрили платформу Law Analysis. Ось що вам доступно без реєстрації.",
  [
    {
      id: "hero-roles-guest",
      type: "hero",
      enabled: true,
      variant: "default",
      data: {
        eyebrow: "Роль: Гість",
        title: "Досліджуйте законодавство України",
        subtitle:
          "Без реєстрації ви можете переглядати закони, суб'єкти, аналіз та пошук у публічних розділах платформи.",
        primaryButtonLabel: "Зареєструватися",
        primaryButtonHref: "/auth/register",
        secondaryButtonLabel: "Переглянути закони",
        secondaryButtonHref: "/laws",
      },
      style: {
        theme: "navy-gold",
        alignment: "left",
        spacingTop: "xl",
        spacingBottom: "lg",
        background: "gradient-hero",
      },
    },
    {
      id: "cards-roles-guest",
      type: "cards",
      enabled: true,
      variant: "three-up",
      data: {
        title: "Що доступно гостю",
        items: [
          {
            badge: "✓",
            title: "Перегляд законів",
            body: "Повна структура законодавства, дерево статей та елементів.",
            linkLabel: "Закони",
            linkHref: "/laws",
          },
          {
            badge: "✓",
            title: "Пошук",
            body: "Параметричний пошук за назвою, датою, типом документа та статусом.",
            linkLabel: "Пошук",
            linkHref: "/search",
          },
          {
            badge: "✓",
            title: "Суб'єкти та аналіз",
            body: "Реєстр суб'єктів норм і аналітичний модуль у відкритому доступі.",
            linkLabel: "Суб'єкти",
            linkHref: "/subjects",
          },
        ],
      },
      style: {
        theme: "surface",
        spacingTop: "md",
        spacingBottom: "md",
        alignment: "left",
        background: "",
        accent: "",
        columns: "",
        hideOnMobile: false,
      },
    },
    {
      id: "cta-roles-guest",
      type: "cta",
      enabled: true,
      variant: "banner",
      data: {
        title: "Хочете більше можливостей?",
        body: "Після реєстрації ви отримаєте особисті нотатки, безліміт пошуку та доступ до кабінету законотворця.",
        buttonLabel: "Створити акаунт",
        buttonHref: "/auth/register",
        secondaryButtonLabel: "Дізнатися про ролі",
        secondaryButtonHref: "/roles/user",
      },
      style: {
        theme: "gold",
        spacingTop: "lg",
        spacingBottom: "xl",
        alignment: "left",
        background: "",
        accent: "",
        columns: "",
        hideOnMobile: false,
      },
    },
  ],
);

export const ROLES_USER_FALLBACK = makeFallback(
  "roles-user",
  "Користувач",
  "Активний громадянин або експерт, який пропонує зміни до законодавства.",
  [
    {
      id: "hero-roles-user",
      type: "hero",
      enabled: true,
      variant: "default",
      data: {
        eyebrow: "Роль: Користувач",
        title: "Пропонуйте зміни до законів",
        subtitle:
          "Як зареєстрований користувач ви можете пропонувати точкові зміни до статей та голосувати за пропозиції інших.",
        primaryButtonLabel: "Розпочати",
        primaryButtonHref: "/auth/register",
        secondaryButtonLabel: "Переглянути закони",
        secondaryButtonHref: "/laws",
      },
      style: {
        theme: "navy-gold",
        alignment: "left",
        spacingTop: "xl",
        spacingBottom: "lg",
        background: "gradient-hero",
        accent: "",
        columns: "",
        hideOnMobile: false,
      },
    },
    {
      id: "steps-roles-user",
      type: "steps",
      enabled: true,
      variant: "timeline",
      data: {
        title: "Як це працює",
        items: [
          {
            title: "1. Знайдіть закон",
            body: "Скористайтеся пошуком або навігацією по законах.",
          },
          {
            title: "2. Запропонуйте зміну",
            body: "Відкрийте потрібну статтю та натисніть «Запропонувати зміну».",
          },
          {
            title: "3. Голосуйте",
            body: "Ваша пропозиція виходить на голосування спільноти.",
          },
        ],
      },
      style: {
        theme: "muted",
        spacingTop: "md",
        spacingBottom: "md",
        alignment: "left",
        background: "",
        accent: "",
        columns: "",
        hideOnMobile: false,
      },
    },
    {
      id: "cta-roles-user",
      type: "cta",
      enabled: true,
      variant: "banner",
      data: {
        title: "Готові стати законотворцем?",
        body: "Законотворці мають повний доступ до форків законопроєктів та детальних поправок.",
        buttonLabel: "Про роль Законотворця",
        buttonHref: "/roles/lawmaker",
        secondaryButtonLabel: "",
        secondaryButtonHref: "",
      },
      style: {
        theme: "gold",
        spacingTop: "lg",
        spacingBottom: "xl",
        alignment: "left",
        background: "",
        accent: "",
        columns: "",
        hideOnMobile: false,
      },
    },
  ],
);

export const ROLES_LAWMAKER_FALLBACK = makeFallback(
  "roles-lawmaker",
  "Законотворець",
  "Студент права, юрист або аналітик — ви створюєте форки та поправки.",
  [
    {
      id: "hero-roles-lawmaker",
      type: "hero",
      enabled: true,
      variant: "default",
      data: {
        eyebrow: "Роль: Законотворець",
        title: "Створюйте форки та поправки",
        subtitle:
          "Законотворець — це студент права, юрист або аналітик, який може створювати повноцінні форки законопроєктів і вносити детальні поправки.",
        primaryButtonLabel: "Кабінет законотворця",
        primaryButtonHref: "/legislator-cabinet",
        secondaryButtonLabel: "Зареєструватися",
        secondaryButtonHref: "/auth/register",
      },
      style: {
        theme: "navy-gold",
        alignment: "left",
        spacingTop: "xl",
        spacingBottom: "lg",
        background: "gradient-hero",
        accent: "",
        columns: "",
        hideOnMobile: false,
      },
    },
    {
      id: "cards-roles-lawmaker",
      type: "cards",
      enabled: true,
      variant: "three-up",
      data: {
        title: "Можливості законотворця",
        items: [
          {
            badge: "Fork",
            title: "Форки законопроєктів",
            body: "Створіть власну версію закону з набором поправок у статусі draft → review → approved.",
            linkLabel: "",
            linkHref: "",
          },
          {
            badge: "Diff",
            title: "Порівняння версій",
            body: "Система показує було/стало для кожної поправки з точним diff-переглядом.",
            linkLabel: "",
            linkHref: "",
          },
          {
            badge: "Submit",
            title: "Подання на розгляд",
            body: "Після завершення форк передається супервізеру або на публічне голосування.",
            linkLabel: "",
            linkHref: "",
          },
        ],
      },
      style: {
        theme: "surface",
        spacingTop: "md",
        spacingBottom: "md",
        alignment: "left",
        background: "",
        accent: "",
        columns: "",
        hideOnMobile: false,
      },
    },
    {
      id: "cta-roles-lawmaker",
      type: "cta",
      enabled: true,
      variant: "banner",
      data: {
        title: "Хочете навчати або керувати групою?",
        body: "Роль Супервізера дозволяє моніторити роботу групи студентів і порівнювати їх форки.",
        buttonLabel: "Про роль Супервізера",
        buttonHref: "/roles/supervisor",
        secondaryButtonLabel: "",
        secondaryButtonHref: "",
      },
      style: {
        theme: "gold",
        spacingTop: "lg",
        spacingBottom: "xl",
        alignment: "left",
        background: "",
        accent: "",
        columns: "",
        hideOnMobile: false,
      },
    },
  ],
);

export const ROLES_SUPERVISOR_FALLBACK = makeFallback(
  "roles-supervisor",
  "Супервізер",
  "Викладач або керівник робочої групи — ви моніторите роботу студентів.",
  [
    {
      id: "hero-roles-supervisor",
      type: "hero",
      enabled: true,
      variant: "default",
      data: {
        eyebrow: "Роль: Супервізер",
        title: "Контролюйте роботу вашої групи",
        subtitle:
          "Супервізер — це викладач або керівник робочої групи, який бачить активність своїх студентів-законотворців та може моніторити роботу над конкретними законами.",
        primaryButtonLabel: "Подати заявку",
        primaryButtonHref: "/roles/supervisor/request",
        secondaryButtonLabel: "Про роль Супервізора",
        secondaryButtonHref: "/roles/supervisor",
      },
      style: {
        theme: "navy-gold",
        alignment: "left",
        spacingTop: "xl",
        spacingBottom: "lg",
        background: "gradient-hero",
        accent: "",
        columns: "",
        hideOnMobile: false,
      },
    },
    {
      id: "cards-roles-supervisor",
      type: "cards",
      enabled: true,
      variant: "three-up",
      data: {
        title: "Можливості супервізера",
        items: [
          {
            badge: "Groups",
            title: "Мої групи",
            body: "Створюйте групи студентів і прив'язуйте до них конкретні закони для роботи.",
            linkLabel: "",
            linkHref: "",
          },
          {
            badge: "Monitor",
            title: "Моніторинг активності",
            body: "Бачите хто і що змінював: форки, поправки, пропозиції — в реальному часі.",
            linkLabel: "",
            linkHref: "",
          },
          {
            badge: "Compare",
            title: "Порівняння версій",
            body: "Дашборд показує diff між оригіналом і форком кожного студента.",
            linkLabel: "",
            linkHref: "",
          },
        ],
      },
      style: {
        theme: "surface",
        spacingTop: "md",
        spacingBottom: "md",
        alignment: "left",
        background: "",
        accent: "",
        columns: "",
        hideOnMobile: false,
      },
    },
    {
      id: "faq-roles-supervisor",
      type: "faq",
      enabled: true,
      variant: "accordion",
      data: {
        title: "Питання та відповіді",
        items: [
          {
            question: "Як стати супервізером?",
            answer:
              "Зверніться до адміністратора платформи — він призначить вам роль Supervisor і ви отримаєте доступ до дашборду.",
          },
          {
            question: "Скільки груп можна створити?",
            answer:
              "На поточному MVP до 10 активних груп. Обмеження встановлюється адміністратором.",
          },
          {
            question: "Чи бачать студенти мій моніторинг?",
            answer:
              "Студенти бачать свою роботу, але не знають про моніторинг супервізера.",
          },
        ],
      },
      style: {
        theme: "surface",
        spacingTop: "md",
        spacingBottom: "md",
        alignment: "left",
        background: "",
        accent: "",
        columns: "",
        hideOnMobile: false,
      },
    },
  ],
);

export const ROLES_ADMIN_FALLBACK = makeFallback(
  "roles-admin",
  "Адміністратор",
  "Повний контроль над системою, користувачами та контентом.",
  [
    {
      id: "hero-roles-admin",
      type: "hero",
      enabled: true,
      variant: "default",
      data: {
        eyebrow: "Роль: Адміністратор",
        title: "Управляйте платформою",
        subtitle:
          "Адміністратор має повний доступ до всіх функцій: управління користувачами, модерація пропозицій, налаштування системи та аналітика.",
        primaryButtonLabel: "Адмін-панель",
        primaryButtonHref: "/admin",
        secondaryButtonLabel: "",
        secondaryButtonHref: "",
      },
      style: {
        theme: "navy-gold",
        alignment: "left",
        spacingTop: "xl",
        spacingBottom: "lg",
        background: "gradient-hero",
        accent: "",
        columns: "",
        hideOnMobile: false,
      },
    },
    {
      id: "cards-roles-admin",
      type: "cards",
      enabled: true,
      variant: "three-up",
      data: {
        title: "Функції адміністратора",
        items: [
          {
            badge: "Users",
            title: "Управління користувачами",
            body: "Список, ролі, статуси, призначення прав і призупинення акаунтів.",
            linkLabel: "Користувачі",
            linkHref: "/admin/users",
          },
          {
            badge: "Laws",
            title: "Управління законами",
            body: "Додавання, редагування та парсинг нових законодавчих актів.",
            linkLabel: "Адмін",
            linkHref: "/admin",
          },
          {
            badge: "Audit",
            title: "Аудит і модерація",
            body: "Черга пропозицій і поправок на розгляд, скарги та лог дій.",
            linkLabel: "Аудит",
            linkHref: "/admin/audit",
          },
        ],
      },
      style: {
        theme: "surface",
        spacingTop: "md",
        spacingBottom: "xl",
        alignment: "left",
        background: "",
        accent: "",
        columns: "",
        hideOnMobile: false,
      },
    },
  ],
);

export const SUPPORT_FALLBACK = makeFallback(
  "support",
  "Підтримати проєкт",
  "Law Analysis — відкрита платформа. Підтримайте розвиток через Patreon.",
  [
    {
      id: "hero-support",
      type: "hero",
      enabled: true,
      variant: "default",
      data: {
        eyebrow: "♥ Підтримка",
        title: "Підтримайте Law Analysis",
        subtitle:
          "Проєкт розвивається силами ентузіастів. Ваша підтримка допоможе розвивати платформу, додавати нові закони та покращувати інструменти аналізу.",
        primaryButtonLabel: "♥ Підтримати на Patreon",
        primaryButtonHref: "https://www.patreon.com/LawAnalysis",
        secondaryButtonLabel: "Дізнатися більше",
        secondaryButtonHref: "/project-info",
      },
      style: {
        theme: "navy-gold",
        alignment: "left",
        spacingTop: "xl",
        spacingBottom: "lg",
        background: "gradient-hero",
        accent: "",
        columns: "",
        hideOnMobile: false,
      },
    },
    {
      id: "cards-support",
      type: "cards",
      enabled: true,
      variant: "three-up",
      data: {
        title: "Рівні підтримки",
        items: [
          {
            badge: "$3/міс",
            title: "Supporter",
            body: "Базова підтримка проєкту. Ваше ім'я в списку меценатів платформи.",
            linkLabel: "Підтримати",
            linkHref: "https://www.patreon.com/LawAnalysis",
          },
          {
            badge: "$15/міс",
            title: "Professional",
            body: "Розширений доступ до аналітики та пріоритетна підтримка.",
            linkLabel: "Підтримати",
            linkHref: "https://www.patreon.com/LawAnalysis",
          },
          {
            badge: "$100/міс",
            title: "Organization",
            body: "Для університетів і команд. Логотип організації на сторінці проєкту.",
            linkLabel: "Зв'язатися",
            linkHref: "https://www.patreon.com/LawAnalysis",
          },
        ],
      },
      style: {
        theme: "surface",
        spacingTop: "md",
        spacingBottom: "md",
        alignment: "left",
        background: "",
        accent: "",
        columns: "",
        hideOnMobile: false,
      },
    },
    {
      id: "richtext-support",
      type: "richText",
      enabled: true,
      variant: "default",
      data: {
        title: "Куди йдуть кошти",
        body: "Серверна інфраструктура та база даних.\n\nРозвиток нових модулів: аналітика суб'єктів, supervisor dashboard, система голосування.\n\nДодавання нових законів до бази та підтримка актуальності даних.",
      },
      style: {
        theme: "muted",
        spacingTop: "md",
        spacingBottom: "xl",
        alignment: "left",
        background: "",
        accent: "",
        columns: "",
        hideOnMobile: false,
      },
    },
  ],
);

export const DOCS_FALLBACK = makeFallback(
  "docs",
  "Документація",
  "Технічна документація для розробників і аналітиків платформи.",
  [
    {
      id: "hero-docs",
      type: "hero",
      enabled: true,
      variant: "default",
      data: {
        eyebrow: "Developer Docs",
        title: "Документація платформи",
        subtitle:
          "Все необхідне для швидкого старту: архітектура, API, структура фронту та покроковий onboarding для нових розробників.",
        primaryButtonLabel: "Swagger API",
        primaryButtonHref: "/api-docs",
        secondaryButtonLabel: "GitHub",
        secondaryButtonHref: "https://github.com",
      },
      style: {
        theme: "navy-gold",
        alignment: "left",
        spacingTop: "xl",
        spacingBottom: "lg",
        background: "gradient-hero",
        accent: "",
        columns: "",
        hideOnMobile: false,
      },
    },
    {
      id: "steps-docs",
      type: "steps",
      enabled: true,
      variant: "timeline",
      data: {
        title: "Start Here: підняти проєкт за 1 день",
        items: [
          {
            title: "1. Prerequisites",
            body: "Node.js 20+, MongoDB 7+, Redis. Встановіть залежності: npm install з кореня монорепо.",
          },
          {
            title: "2. Налаштування env",
            body: "Скопіюйте backend/.env.example → backend/.env та frontend/.env.example → frontend/.env.local.",
          },
          {
            title: "3. Запуск",
            body: "npm run dev запускає backend (порт 3000) та frontend (порт 3001) через concurrently.",
          },
          {
            title: "4. Перша фіча",
            body: "Backend: новий роут у src/routes/. Frontend: нова сторінка у src/app/. Дивіться AGENTS.md.",
          },
        ],
      },
      style: {
        theme: "muted",
        spacingTop: "md",
        spacingBottom: "md",
        alignment: "left",
        background: "",
        accent: "",
        columns: "",
        hideOnMobile: false,
      },
    },
    {
      id: "cards-docs",
      type: "cards",
      enabled: true,
      variant: "three-up",
      data: {
        title: "Розділи документації",
        items: [
          {
            badge: "Frontend",
            title: "Структура фронту",
            body: "App Router, компоненти, хуки, стан, API-клієнт, types та constants.",
            linkLabel: "",
            linkHref: "",
          },
          {
            badge: "Backend",
            title: "API та моделі",
            body: "Express роути, Mongoose моделі, middleware, BullMQ черга та auth flow.",
            linkLabel: "Swagger",
            linkHref: "/api-docs",
          },
          {
            badge: "QA",
            title: "Тестування",
            body: "Vitest unit тести (backend + frontend), Playwright E2E, CI pipeline.",
            linkLabel: "",
            linkHref: "",
          },
        ],
      },
      style: {
        theme: "surface",
        spacingTop: "md",
        spacingBottom: "xl",
        alignment: "left",
        background: "",
        accent: "",
        columns: "",
        hideOnMobile: false,
      },
    },
  ],
);
