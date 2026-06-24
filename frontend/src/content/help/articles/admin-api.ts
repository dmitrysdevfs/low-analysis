import type { HelpArticle } from "../types";

const article: HelpArticle = {
  slug: "admin-api",
  title: "API Center та документація",
  summary:
    "Як переглядати ендпоінти, тестувати запити через Swagger UI та читати схеми відповідей.",
  category: "API",
  audience: "admin",
  updatedAt: "2026-06-18",
  relatedSlugs: ["admin-analytics", "admin-audit"],
  steps: [
    {
      heading: "Відкрийте API Center",
      body: "У бічному меню адмін-панелі натисніть «API Center». Відкриється інтерактивна карта всіх ендпоінтів бекенда, згрупованих по модулях.",
    },
    {
      heading: "Пошук та фільтрація",
      body: "У верхньому рядку — пошук по шляху, опису та тегах. Фільтри: HTTP-метод (GET, POST, PATCH, DELETE), рівень авторизації (публічний / Bearer / admin), модуль (Laws, Auth, Admin, Support тощо).",
    },
    {
      heading: "Перегляд деталей ендпоінту",
      body: "Клікніть на рядок ендпоінту — праворуч відкриється інспектор: параметри, тіло запиту, схеми відповідей (200/400/401/403/500) та приклад запиту.",
    },
    {
      heading: "Вкладки cURL / JS / JSON",
      body: "В інспекторі є три вкладки прикладів: cURL (для термінала), JavaScript fetch (для коду), JSON (приклад тіла відповіді). Копіюйте кнопкою у правому куті.",
      tip: "cURL автоматично підставляє базову URL production-сервера.",
    },
    {
      heading: "Swagger UI",
      body: "Кнопка «Swagger UI» у нижній смузі відкриває повну OpenAPI документацію в окремій вкладці. Там можна авторизуватись та надсилати реальні запити.",
    },
    {
      heading: "OpenAPI JSON",
      body: "Кнопка «OpenAPI JSON» завантажує raw-специфікацію у форматі JSON. Корисна для підключення до Postman, Insomnia або генерації SDK.",
    },
  ],
};

export default article;
