import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../src/config/db.js';
import RoadmapDoc from '../src/modules/roadmap/roadmap.model.js';
import { ROADMAP_DOC_ID } from '../src/modules/roadmap/roadmap.constants.js';

dotenv.config();

const CORRECT_ROADMAP_CONTENT = {
  phases: [
    {
      id: 'phase-1',
      label: 'Фаза 1 — Парсинг та структура',
      status: 'done',
      tasks: [
        {
          text: 'Cheerio-парсинг законів з zakon.rada.gov.ua',
          done: true,
        },
        {
          text: 'MongoDB Atlas: зберігання дерева елементів',
          done: true,
        },
        {
          text: 'REST API для закону, дерева та статей',
          done: true,
        },
        {
          text: 'Ієрархічний код rз→ст→ч для кожного елемента',
          done: true,
        },
      ],
    },
    {
      id: 'phase-2',
      label: 'Фаза 2 — NLP та аналітика',
      status: 'done',
      tasks: [
        {
          text: "Виявлення суб'єктів регулювання (NLP)",
          done: true,
        },
        {
          text: 'Z-score та рівні ризику: зелений / жовтий / червоний',
          done: true,
        },
        {
          text: 'Таксономія норм: домени, функції, ключові слова',
          done: true,
        },
        {
          text: 'Теплова карта розподілу норм по закону',
          done: true,
        },
      ],
    },
    {
      id: 'phase-3',
      label: 'Фаза 3 — UI та особистий кабінет',
      status: 'done',
      tasks: [
        {
          text: 'Ієрархічний перегляд закону: розділ → стаття → абзац',
          done: true,
        },
        {
          text: 'Пошук і фільтрація по назві, статусу та даті',
          done: true,
        },
        { text: 'Нотатки з drag-and-drop зі статей', done: true },
        {
          text: 'Особистий кабінет: збережені матеріали та нотатки',
          done: true,
        },
      ],
    },
    {
      id: 'phase-4',
      label: 'Фаза 4 — AI та адмін-панель',
      status: 'done',
      tasks: [
        {
          text: 'AI-асистент для запитів до норм закону',
          done: true,
        },
        {
          text: 'Адмін-панель: аналітика, користувачі, аудит',
          done: true,
        },
        {
          text: 'Білінг-плани, квоти та призначення',
          done: true,
        },
        {
          text: 'Супер-код, матриця доступу, ролева модель',
          done: true,
        },
      ],
    },
    {
      id: 'phase-5',
      label: 'Фаза 5 — Масштабування',
      status: 'pending',
      tasks: [
        {
          text: 'Кодекси України: КУпАП, Цивільний, Кримінальний',
          done: false,
        },
        {
          text: "Граф зв'язків між нормами різних законів",
          done: false,
        },
        {
          text: '"Радіант" — 3D-візуалізація законодавчої бази',
          done: false,
        },
        {
          text: 'Повнотекстовий пошук на рівні бекенду',
          done: false,
        },
      ],
    },
  ],
  roadmapItems: [
    {
      text: 'Структурований перегляд законів: розділ → стаття → абзац',
      done: true,
    },
    {
      text: 'Пошук і фільтрація по назві, статусу та даті',
      done: true,
    },
    {
      text: "Суб'єкти регулювання з ролями та інтерактивною фільтрацією",
      done: true,
    },
    {
      text: 'Статистика елементів: Z-score, рівні ризику, теплова карта',
      done: true,
    },
    {
      text: 'Таксономія норм: правові функції, домени, ключові слова',
      done: true,
    },
    {
      text: 'Нотатки з drag-and-drop зі статей та особистий кабінет',
      done: true,
    },
    {
      text: 'AI-асистент для запитів до будь-якої норми закону',
      done: true,
    },
    {
      text: 'Адмін-панель: аналітика, керування користувачами, аудит',
      done: true,
    },
    {
      text: 'Кодекси України: КУпАП, Цивільний, Кримінальний',
      done: false,
    },
    {
      text: "Граф зв'язків між нормами різних законів",
      done: false,
    },
    {
      text: '"Радіант" — 3D-візуалізація законодавчої бази',
      done: false,
    },
  ],
  deferredItems: [
    {
      title: 'Повнотекстовий пошук на бекенді',
      reason:
        'Для поточних 11 законів клієнтська фільтрація достатня. Потрібен при виході на 100+ документів.',
    },
    {
      title: 'WebSocket real-time сповіщення',
      reason:
        'Платформа read-only, real-time не критично. Повернемось при появі collaborative-режиму.',
    },
    {
      title: 'PDF-парсинг документів',
      reason:
        'Складна структура таблиць і форматування. Потребує окремого парсера та ручної верифікації.',
    },
    {
      title: 'Мобільний застосунок',
      reason:
        'Поза MVP-скоупом. Поточний responsive-UI покриває мобільні браузери достатньо.',
    },
  ],
  decisions: [
    {
      id: 'd-1',
      title: 'MongoDB Atlas Free Tier',
      decision: 'Використовуємо хмарну MongoDB замість локальної бази',
      rationale:
        'Нульова операційна вартість на старті. Free Tier достатній для поточних обсягів. Вбудований Atlas Search при масштабуванні.',
    },
    {
      id: 'd-2',
      title: 'Next.js App Router',
      decision:
        'SSR для публічних сторінок, Client Components для інтерактивності',
      rationale:
        'SEO для сторінок законів. Server Components скорочують JS-бандл. Routing-first архітектура спрощує навігацію.',
    },
    {
      id: 'd-3',
      title: 'LOCAL_MODE = true в адмін-панелі',
      decision: 'Адмін-дані з localStorage до готовності повного backend API',
      rationale:
        'Дозволяє розробляти і демонструвати UI незалежно від бекенду. Перемикач в одному файлі — легко прибрати.',
    },
    {
      id: 'd-4',
      title: 'TanStack Query v5',
      decision: 'Server-state management замість Redux для всіх API-запитів',
      rationale:
        'Автоматичний кеш, deduplicated запити, devtools. Менше boilerplate ніж Redux Toolkit для read-heavy платформи.',
    },
    {
      id: 'd-5',
      title: 'Cheerio замість Puppeteer',
      decision: 'HTML-парсинг через Cheerio (легкий) а не headless browser',
      rationale:
        'zakon.rada.gov.ua повертає статичний HTML. Puppeteer зайвий overhead. Cheerio 10x швидший для batch-парсингу.',
    },
    {
      id: 'd-6',
      title: 'Framer Motion для анімацій',
      decision:
        'Декларативні анімації через Framer Motion замість CSS-тільки підходу',
      rationale:
        'AnimatePresence для mount/unmount. Stagger-ефекти для списків. whileInView для scroll-triggered анімацій без IntersectionObserver вручну.',
    },
    {
      id: 'd-7',
      title: 'LLM як семантичний шар (SRL)',
      decision:
        "Використання LLM (Gemini API) для семантичного аналізу (Semantic Role Labeling) та витягування суб'єктів регулювання",
      rationale:
        "Українське законодавство має складну синтаксичну структуру. Класичні NLP-бібліотеки або регулярні вирази дають низьку точність на непрямих формулюваннях норм. Двошарова архітектура (Cheerio для синтаксичного дерева + LLM для семантичного виділення акторів) дозволяє виявляти суб'єктів з точністю >95% та гнучко будувати зв'язки.",
    },
  ],
};

const resetRoadmap = async () => {
  await connectDB();

  console.log(
    `Resetting/updating roadmap document (ID: '${ROADMAP_DOC_ID}')...`,
  );

  const updatedDoc = await RoadmapDoc.findByIdAndUpdate(
    ROADMAP_DOC_ID,
    {
      _id: ROADMAP_DOC_ID,
      ...CORRECT_ROADMAP_CONTENT,
    },
    { upsert: true, new: true },
  );

  console.log('✅ Roadmap successfully updated in the database!');
  console.log('Updated Document:\n', JSON.stringify(updatedDoc, null, 2));

  process.exit(0);
};

resetRoadmap().catch((err) => {
  console.error('❌ Failed to reset roadmap:', err.message);
  process.exit(1);
});
