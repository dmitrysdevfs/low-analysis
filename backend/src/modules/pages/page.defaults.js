import { PAGE_SLUGS } from './page.constants.js';

const PROJECT_INFO_BLOCKS = [
  {
    id: 'hero-project-info',
    type: 'hero',
    enabled: true,
    variant: 'split',
    data: {
      eyebrow: 'Low Analysis',
      title: 'Інформація про проєкт',
      subtitle:
        'Це цифрова платформа для структурування, пошуку та аналітики законодавства України. Сторінка керується з адмінки без редагування React-коду.',
      primaryButtonLabel: 'Відкрити аналізатор',
      primaryButtonHref: '/analysis',
      secondaryButtonLabel: 'Перейти до пошуку',
      secondaryButtonHref: '/search',
    },
    style: {
      theme: 'navy-gold',
      alignment: 'left',
      spacingTop: 'xl',
      spacingBottom: 'lg',
      background: 'gradient-hero',
    },
  },
  {
    id: 'stats-project-info',
    type: 'statsGrid',
    enabled: true,
    variant: 'four-up',
    data: {
      title: 'Що вже вміє платформа',
      items: [
        {
          value: '11+',
          label: 'законів у базі',
          caption: 'З реальним деревом елементів і навігацією по статтях.',
        },
        {
          value: '4',
          label: 'публічні режими',
          caption: 'Закони, суб’єкти, пошук і аналітичний модуль.',
        },
        {
          value: '3',
          label: 'ролі доступу',
          caption: 'Гість, клієнт і адміністратор у межах єдиного UI.',
        },
        {
          value: '1',
          label: 'керована сторінка',
          caption: 'Оновлюється з адмінки як block-based CMS.',
        },
      ],
    },
    style: {
      theme: 'glass',
      spacingTop: 'md',
      spacingBottom: 'md',
    },
  },
  {
    id: 'cards-project-info',
    type: 'cards',
    enabled: true,
    variant: 'three-up',
    data: {
      title: 'Ключові модулі',
      items: [
        {
          badge: 'Corpus',
          title: 'Структура законів',
          body: 'Дерево елементів, перехід до статті, копіювання юридичних посилань і швидкий огляд ризику по нормам.',
          linkLabel: 'Перейти до законів',
          linkHref: '/laws',
        },
        {
          badge: 'Search',
          title: 'Параметричний пошук',
          body: 'Форма пошуку з фільтрами, окремим results-route та потенціалом для повнотекстового backend-search.',
          linkLabel: 'Відкрити пошук',
          linkHref: '/search',
        },
        {
          badge: 'Insights',
          title: 'Аналізатор',
          body: 'Окремий аналітичний режим для огляду всієї бази та deep-dive по конкретному закону.',
          linkLabel: 'Дивитися аналіз',
          linkHref: '/analysis',
        },
      ],
    },
    style: {
      theme: 'surface',
      spacingTop: 'md',
      spacingBottom: 'md',
    },
  },
  {
    id: 'steps-project-info',
    type: 'steps',
    enabled: true,
    variant: 'timeline',
    data: {
      title: 'Як це працює',
      items: [
        {
          title: '1. Парсинг закону',
          body: 'Бекенд завантажує нормативний акт, зберігає метадані та розбиває текст на атомарні елементи.',
        },
        {
          title: '2. Аналітика елементів',
          body: 'Для кожного елемента підраховуються символи, суб’єкти, Z-score, рівень ризику та таксономічні ознаки.',
        },
        {
          title: '3. Візуалізація на фронті',
          body: 'Користувач отримує law-tree, heatmap, реєстр норм, нотатки та допоміжні режими для дослідження.',
        },
      ],
    },
    style: {
      theme: 'muted',
      spacingTop: 'md',
      spacingBottom: 'md',
    },
  },
  {
    id: 'quote-project-info',
    type: 'quote',
    enabled: true,
    variant: 'highlight',
    data: {
      quote:
        'Ми не редагуємо React-верстку руками для кожної зміни. Адмінка керує блоками, а публічна сторінка збирається з перевіреного JSON-конфігу.',
      author: 'Архітектурний принцип модуля',
      role: 'Page Builder / CMS layer',
    },
    style: {
      theme: 'gold',
      spacingTop: 'md',
      spacingBottom: 'md',
    },
  },
  {
    id: 'radio-project-info',
    type: 'radioGroup',
    enabled: true,
    variant: 'stacked',
    data: {
      title: 'Кому це корисно',
      question: 'Оберіть перспективу перегляду сторінки:',
      options: [
        {
          label: 'Юрист / консультант',
          value: 'lawyer',
          description:
            'Швидкий доступ до структури норм і пов’язаних суб’єктів.',
        },
        {
          label: 'Аналітик / дослідник',
          value: 'analyst',
          description:
            'Огляд ризикових елементів, heatmap і статистичних відхилень.',
        },
        {
          label: 'Адміністратор платформи',
          value: 'admin',
          description:
            'Керування контентом, доступами та операційними метриками.',
        },
      ],
    },
    style: {
      theme: 'surface',
      spacingTop: 'md',
      spacingBottom: 'md',
    },
  },
  {
    id: 'faq-project-info',
    type: 'faq',
    enabled: true,
    variant: 'accordion',
    data: {
      title: 'Поширені питання',
      items: [
        {
          question: 'Чи потрібно деплоїти фронт для зміни цієї сторінки?',
          answer:
            'Ні. Адміністратор змінює блоки в builder-модулі, зберігає draft і публікує сторінку з адмінки.',
        },
        {
          question: 'Чи можна приховувати блоки без видалення?',
          answer:
            'Так. Кожен блок має enabled-state та залишається у конфігурації сторінки, навіть якщо не показується публічно.',
        },
        {
          question: 'Чи буде історія змін?',
          answer:
            'Так. Кожне збереження, публікація та відновлення версії формує окремий snapshot у version history.',
        },
      ],
    },
    style: {
      theme: 'surface',
      spacingTop: 'md',
      spacingBottom: 'md',
    },
  },
  {
    id: 'cta-project-info',
    type: 'cta',
    enabled: true,
    variant: 'banner',
    data: {
      title: 'Хочете адаптувати цю сторінку без коду?',
      body: 'Використайте конструктор у адмінці: додавайте блоки, міняйте тексти, керуйте порядком і публікуйте результат у кілька кліків.',
      buttonLabel: 'Відкрити адмін-конструктор',
      buttonHref: '/admin/project-page',
      secondaryButtonLabel: 'Читати довідку',
      secondaryButtonHref: '/help',
    },
    style: {
      theme: 'gold',
      spacingTop: 'lg',
      spacingBottom: 'xl',
      background: 'gradient-cta',
    },
  },
];

const ROLE_PAGE_DEFAULT_BLOCKS = {
  [PAGE_SLUGS.rolesGuest]: {
    title: 'Гість',
    description: 'Ви відкрили платформу Law Analysis. Ось що вам доступно без реєстрації.',
    blocks: [
      {
        id: 'hero-roles-guest',
        type: 'hero',
        enabled: true,
        variant: 'default',
        data: {
          eyebrow: 'Роль: Гість',
          title: 'Досліджуйте законодавство України',
          subtitle: "Без реєстрації ви можете переглядати закони, суб'єкти, аналіз та пошук у публічних розділах платформи.",
          primaryButtonLabel: 'Зареєструватися',
          primaryButtonHref: '/auth/register',
          secondaryButtonLabel: 'Переглянути закони',
          secondaryButtonHref: '/laws',
        },
        style: { theme: 'navy-gold', alignment: 'left', spacingTop: 'xl', spacingBottom: 'lg', background: 'gradient-hero' },
      },
      {
        id: 'cards-roles-guest',
        type: 'cards',
        enabled: true,
        variant: 'three-up',
        data: {
          title: 'Що доступно гостю',
          items: [
            { badge: '✓', title: 'Перегляд законів', body: 'Повна структура законодавства, дерево статей та елементів.', linkLabel: 'Закони', linkHref: '/laws' },
            { badge: '✓', title: 'Пошук', body: 'Параметричний пошук за назвою, датою, типом документа та статусом.', linkLabel: 'Пошук', linkHref: '/search' },
            { badge: '✓', title: "Суб'єкти та аналіз", body: "Реєстр суб'єктів норм і аналітичний модуль у відкритому доступі.", linkLabel: "Суб'єкти", linkHref: '/subjects' },
          ],
        },
        style: { theme: 'surface', spacingTop: 'md', spacingBottom: 'md' },
      },
      {
        id: 'cta-roles-guest',
        type: 'cta',
        enabled: true,
        variant: 'banner',
        data: {
          title: 'Хочете більше можливостей?',
          body: 'Після реєстрації ви отримаєте особисті нотатки, безліміт пошуку та доступ до кабінету законотворця.',
          buttonLabel: 'Створити акаунт',
          buttonHref: '/auth/register',
          secondaryButtonLabel: 'Дізнатися про ролі',
          secondaryButtonHref: '/roles/user',
        },
        style: { theme: 'gold', spacingTop: 'lg', spacingBottom: 'xl' },
      },
    ],
  },
  [PAGE_SLUGS.rolesUser]: {
    title: 'Користувач',
    description: 'Активний громадянин або експерт, який пропонує зміни до законодавства.',
    blocks: [
      {
        id: 'hero-roles-user',
        type: 'hero',
        enabled: true,
        variant: 'default',
        data: {
          eyebrow: 'Роль: Користувач',
          title: 'Пропонуйте зміни до законів',
          subtitle: 'Як зареєстрований користувач ви можете пропонувати точкові зміни до статей та голосувати за пропозиції інших.',
          primaryButtonLabel: 'Розпочати',
          primaryButtonHref: '/auth/register',
          secondaryButtonLabel: 'Переглянути закони',
          secondaryButtonHref: '/laws',
        },
        style: { theme: 'navy-gold', alignment: 'left', spacingTop: 'xl', spacingBottom: 'lg', background: 'gradient-hero' },
      },
      {
        id: 'steps-roles-user',
        type: 'steps',
        enabled: true,
        variant: 'timeline',
        data: {
          title: 'Як це працює',
          items: [
            { title: '1. Знайдіть закон', body: 'Скористайтеся пошуком або навігацією по законах.' },
            { title: '2. Запропонуйте зміну', body: 'Відкрийте потрібну статтю та натисніть "Запропонувати зміну".' },
            { title: '3. Голосуйте', body: 'Ваша пропозиція виходить на голосування спільноти.' },
          ],
        },
        style: { theme: 'muted', spacingTop: 'md', spacingBottom: 'md' },
      },
      {
        id: 'cta-roles-user',
        type: 'cta',
        enabled: true,
        variant: 'banner',
        data: {
          title: 'Готові стати законотворцем?',
          body: 'Законотворці мають повний доступ до форків законопроєктів та детальних поправок.',
          buttonLabel: 'Дізнатися про роль Законотворця',
          buttonHref: '/roles/lawmaker',
          secondaryButtonLabel: '',
          secondaryButtonHref: '',
        },
        style: { theme: 'gold', spacingTop: 'lg', spacingBottom: 'xl' },
      },
    ],
  },
  [PAGE_SLUGS.rolesLawmaker]: {
    title: 'Законотворець',
    description: 'Студент права, юрист або аналітик — ви створюєте форки та поправки.',
    blocks: [
      {
        id: 'hero-roles-lawmaker',
        type: 'hero',
        enabled: true,
        variant: 'default',
        data: {
          eyebrow: 'Роль: Законотворець',
          title: 'Створюйте форки та поправки',
          subtitle: 'Законотворець — це студент права, юрист або аналітик, який може створювати повноцінні форки законопроєктів і вносити детальні поправки до конкретних статей.',
          primaryButtonLabel: 'Кабінет законотворця',
          primaryButtonHref: '/legislator-cabinet',
          secondaryButtonLabel: 'Зареєструватися',
          secondaryButtonHref: '/auth/register',
        },
        style: { theme: 'navy-gold', alignment: 'left', spacingTop: 'xl', spacingBottom: 'lg', background: 'gradient-hero' },
      },
      {
        id: 'cards-roles-lawmaker',
        type: 'cards',
        enabled: true,
        variant: 'three-up',
        data: {
          title: 'Можливості законотворця',
          items: [
            { badge: 'Fork', title: 'Форки законопроєктів', body: 'Створіть власну версію закону з набором поправок у статусі draft → review → approved.', linkLabel: '', linkHref: '' },
            { badge: 'Diff', title: 'Порівняння версій', body: 'Система показує було/стало для кожної поправки з точним diff-переглядом.', linkLabel: '', linkHref: '' },
            { badge: 'Submit', title: 'Подання на розгляд', body: 'Після завершення форк передається супервайзеру або на публічне голосування.', linkLabel: '', linkHref: '' },
          ],
        },
        style: { theme: 'surface', spacingTop: 'md', spacingBottom: 'md' },
      },
      {
        id: 'cta-roles-lawmaker',
        type: 'cta',
        enabled: true,
        variant: 'banner',
        data: {
          title: 'Хочете навчати або керувати групою?',
          body: 'Роль Супервайзера дозволяє моніторити роботу групи студентів і порівнювати їх форки.',
          buttonLabel: 'Про роль Супервайзера',
          buttonHref: '/roles/supervisor',
          secondaryButtonLabel: '',
          secondaryButtonHref: '',
        },
        style: { theme: 'gold', spacingTop: 'lg', spacingBottom: 'xl' },
      },
    ],
  },
  [PAGE_SLUGS.rolesSupervisor]: {
    title: 'Супервайзер',
    description: 'Викладач або керівник робочої групи — ви моніторите роботу студентів.',
    blocks: [
      {
        id: 'hero-roles-supervisor',
        type: 'hero',
        enabled: true,
        variant: 'default',
        data: {
          eyebrow: 'Роль: Супервайзер',
          title: 'Контролюйте роботу вашої групи',
          subtitle: 'Супервайзер — це викладач або керівник робочої групи, який бачить активність своїх студентів-законотворців та може моніторити роботу над конкретними законами.',
          primaryButtonLabel: 'Дашборд супервайзера',
          primaryButtonHref: '/supervisor/dashboard',
          secondaryButtonLabel: "Зв'язатися з адміном",
          secondaryButtonHref: '/help',
        },
        style: { theme: 'navy-gold', alignment: 'left', spacingTop: 'xl', spacingBottom: 'lg', background: 'gradient-hero' },
      },
      {
        id: 'cards-roles-supervisor',
        type: 'cards',
        enabled: true,
        variant: 'three-up',
        data: {
          title: 'Можливості супервайзера',
          items: [
            { badge: 'Groups', title: 'Мої групи', body: "Створюйте групи студентів і прив'язуйте до них конкретні закони для роботи.", linkLabel: '', linkHref: '' },
            { badge: 'Monitor', title: 'Моніторинг активності', body: 'Бачите хто і що змінював: форки, поправки, пропозиції — в реальному часі.', linkLabel: '', linkHref: '' },
            { badge: 'Compare', title: 'Порівняння версій', body: 'Дашборд показує diff між оригіналом і форком кожного студента.', linkLabel: '', linkHref: '' },
          ],
        },
        style: { theme: 'surface', spacingTop: 'md', spacingBottom: 'md' },
      },
      {
        id: 'faq-roles-supervisor',
        type: 'faq',
        enabled: true,
        variant: 'accordion',
        data: {
          title: 'Питання та відповіді',
          items: [
            { question: 'Як стати супервайзером?', answer: 'Зверніться до адміністратора платформи — він призначить вам роль Supervisor і ви отримаєте доступ до дашборду.' },
            { question: 'Скільки груп можна створити?', answer: 'На поточному MVP обмеження встановлюється адміністратором. За замовчуванням до 10 груп.' },
            { question: 'Чи бачать студенти мій моніторинг?', answer: 'Студенти бачать свою роботу, але не знають про моніторинг супервайзера.' },
          ],
        },
        style: { theme: 'surface', spacingTop: 'md', spacingBottom: 'md' },
      },
    ],
  },
  [PAGE_SLUGS.rolesAdmin]: {
    title: 'Адміністратор',
    description: 'Повний контроль над системою, користувачами та контентом.',
    blocks: [
      {
        id: 'hero-roles-admin',
        type: 'hero',
        enabled: true,
        variant: 'default',
        data: {
          eyebrow: 'Роль: Адміністратор',
          title: 'Управляйте платформою',
          subtitle: 'Адміністратор має повний доступ до всіх функцій: управління користувачами, модерація пропозицій, налаштування системи та аналітика.',
          primaryButtonLabel: 'Адмін-панель',
          primaryButtonHref: '/admin',
          secondaryButtonLabel: '',
          secondaryButtonHref: '',
        },
        style: { theme: 'navy-gold', alignment: 'left', spacingTop: 'xl', spacingBottom: 'lg', background: 'gradient-hero' },
      },
      {
        id: 'cards-roles-admin',
        type: 'cards',
        enabled: true,
        variant: 'three-up',
        data: {
          title: 'Функції адміністратора',
          items: [
            { badge: 'Users', title: 'Управління користувачами', body: 'Список, ролі, статуси, призначення прав і призупинення акаунтів.', linkLabel: 'Користувачі', linkHref: '/admin/users' },
            { badge: 'Laws', title: 'Управління законами', body: 'Додавання, редагування та парсинг нових законодавчих актів.', linkLabel: 'Закони', linkHref: '/admin' },
            { badge: 'Moderation', title: 'Модерація', body: 'Черга пропозицій і поправок на розгляд, скарги та аудит дій.', linkLabel: 'Аудит', linkHref: '/admin/audit' },
          ],
        },
        style: { theme: 'surface', spacingTop: 'md', spacingBottom: 'xl' },
      },
    ],
  },
  [PAGE_SLUGS.support]: {
    title: 'Підтримати проєкт',
    description: 'Law Analysis — відкрита платформа. Підтримайте розвиток через Patreon.',
    blocks: [
      {
        id: 'hero-support',
        type: 'hero',
        enabled: true,
        variant: 'default',
        data: {
          eyebrow: '♥ Підтримка',
          title: 'Підтримайте Law Analysis',
          subtitle: 'Проєкт розвивається силами ентузіастів. Ваша підтримка допоможе розвивати платформу, додавати нові закони та покращувати інструменти аналізу.',
          primaryButtonLabel: '♥ Підтримати на Patreon',
          primaryButtonHref: 'https://www.patreon.com/LawAnalysis',
          secondaryButtonLabel: 'Дізнатися більше',
          secondaryButtonHref: '/project-info',
        },
        style: { theme: 'navy-gold', alignment: 'left', spacingTop: 'xl', spacingBottom: 'lg', background: 'gradient-hero' },
      },
      {
        id: 'cards-support',
        type: 'cards',
        enabled: true,
        variant: 'three-up',
        data: {
          title: 'Рівні підтримки',
          items: [
            { badge: '$3/міс', title: 'Supporter', body: "Базова підтримка проєкту. Ваше ім'я в списку меценатів платформи.", linkLabel: 'Підтримати', linkHref: 'https://www.patreon.com/LawAnalysis' },
            { badge: '$15/міс', title: 'Professional', body: 'Розширений доступ до аналітики та пріоритетна підтримка.', linkLabel: 'Підтримати', linkHref: 'https://www.patreon.com/LawAnalysis' },
            { badge: '$100/міс', title: 'Organization', body: 'Для університетів і команд. Логотип організації на сторінці проєкту.', linkLabel: "Зв'язатися", linkHref: 'https://www.patreon.com/LawAnalysis' },
          ],
        },
        style: { theme: 'surface', spacingTop: 'md', spacingBottom: 'md' },
      },
      {
        id: 'richtext-support',
        type: 'richText',
        enabled: true,
        variant: 'default',
        data: {
          title: 'Куди йдуть кошти',
          body: "Серверна інфраструктура та база даних.\n\nРозвиток нових модулів: аналітика суб'єктів, supervisor dashboard, система голосування.\n\nДодавання нових законів до бази та підтримка актуальності даних.",
        },
        style: { theme: 'muted', spacingTop: 'md', spacingBottom: 'xl' },
      },
    ],
  },
  [PAGE_SLUGS.docs]: {
    title: 'Документація',
    description: 'Технічна документація для розробників і аналітиків платформи.',
    blocks: [
      {
        id: 'hero-docs',
        type: 'hero',
        enabled: true,
        variant: 'default',
        data: {
          eyebrow: 'Developer Docs',
          title: 'Документація платформи',
          subtitle: 'Все необхідне для швидкого старту: архітектура, API, структура фронту та покроковий onboarding для нових розробників.',
          primaryButtonLabel: 'Start Here',
          primaryButtonHref: '/docs',
          secondaryButtonLabel: 'API Docs',
          secondaryButtonHref: '/api-docs',
        },
        style: { theme: 'navy-gold', alignment: 'left', spacingTop: 'xl', spacingBottom: 'lg', background: 'gradient-hero' },
      },
      {
        id: 'steps-docs',
        type: 'steps',
        enabled: true,
        variant: 'timeline',
        data: {
          title: 'Start Here: підняти проєкт за 1 день',
          items: [
            { title: '1. Prerequisites', body: 'Node.js 20+, MongoDB 7+, Redis. Встановіть залежності: npm install з кореня монорепо.' },
            { title: '2. Налаштування env', body: 'Скопіюйте backend/.env.example → backend/.env та frontend/.env.example → frontend/.env.local.' },
            { title: '3. Запуск', body: 'npm run dev запускає backend (порт 3000) та frontend (порт 3001) через concurrently.' },
            { title: '4. Перша фіча', body: 'Backend: новий роут у src/routes/, Frontend: нова сторінка у src/app/. Дивіться AGENTS.md.' },
          ],
        },
        style: { theme: 'muted', spacingTop: 'md', spacingBottom: 'md' },
      },
      {
        id: 'cards-docs',
        type: 'cards',
        enabled: true,
        variant: 'three-up',
        data: {
          title: 'Розділи документації',
          items: [
            { badge: 'Frontend', title: 'Структура фронту', body: 'App Router, компоненти, хуки, стан, API-клієнт, types та constants.', linkLabel: '', linkHref: '' },
            { badge: 'Backend', title: 'API та моделі', body: 'Express роути, Mongoose моделі, middleware, BullMQ черга та auth flow.', linkLabel: 'Swagger', linkHref: '/api-docs' },
            { badge: 'QA', title: 'Тестування', body: 'Vitest unit тести (backend + frontend), Playwright E2E, CI pipeline.', linkLabel: '', linkHref: '' },
          ],
        },
        style: { theme: 'surface', spacingTop: 'md', spacingBottom: 'xl' },
      },
    ],
  },
};

export function buildDefaultPageSnapshot(slug) {
  if (slug === PAGE_SLUGS.projectInfo) {
    return {
      title: 'Інформація про проєкт',
      description:
        'Керована сторінка про платформу Low Analysis з блоковою структурою та публічним renderer-ом.',
      seo: {
        title: 'Інформація про проєкт | Law Analysis',
        description:
          'Опис платформи, ключових модулів, аналітичних сценаріїв та керованого builder-модуля.',
        ogImage: '',
      },
      blocks: PROJECT_INFO_BLOCKS,
    };
  }

  if (ROLE_PAGE_DEFAULT_BLOCKS[slug]) {
    const def = ROLE_PAGE_DEFAULT_BLOCKS[slug];
    return {
      title: def.title,
      description: def.description,
      seo: { title: `${def.title} | Law Analysis`, description: def.description, ogImage: '' },
      blocks: def.blocks,
    };
  }

  return {
    title: slug,
    description: '',
    seo: { title: slug, description: '', ogImage: '' },
    blocks: [],
  };
}
