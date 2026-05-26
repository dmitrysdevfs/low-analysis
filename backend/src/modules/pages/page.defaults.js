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
          description: 'Швидкий доступ до структури норм і пов’язаних суб’єктів.',
        },
        {
          label: 'Аналітик / дослідник',
          value: 'analyst',
          description: 'Огляд ризикових елементів, heatmap і статистичних відхилень.',
        },
        {
          label: 'Адміністратор платформи',
          value: 'admin',
          description: 'Керування контентом, доступами та операційними метриками.',
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

export function buildDefaultPageSnapshot(slug) {
  if (slug !== PAGE_SLUGS.projectInfo) {
    return {
      title: slug,
      description: '',
      seo: {
        title: slug,
        description: '',
        ogImage: '',
      },
      blocks: [],
    };
  }

  return {
    title: 'Інформація про проєкт',
    description:
      'Керована сторінка про платформу Low Analysis з блоковою структурою та публічним renderer-ом.',
    seo: {
      title: 'Інформація про проєкт | Low Analysis',
      description:
        'Опис платформи, ключових модулів, аналітичних сценаріїв та керованого builder-модуля.',
      ogImage: '',
    },
    blocks: PROJECT_INFO_BLOCKS,
  };
}
