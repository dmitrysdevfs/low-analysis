import type {
  CardItem,
  CardsBlock,
  CtaBlock,
  FaqBlock,
  FaqItemData,
  HeroBlock,
  ImageBlock,
  ManagedPagePublicResponse,
  PageBuilderBlock,
  PageBuilderBlockStyle,
  PageBuilderBlockType,
  PageBuilderSnapshot,
  QuoteBlock,
  RadioGroupBlock,
  RadioOptionItem,
  RichTextBlock,
  StatsGridBlock,
  StatsGridItem,
  StepItem,
  StepsBlock,
} from "@/types";

const DEFAULT_STYLE: PageBuilderBlockStyle = {
  theme: "default",
  alignment: "left",
  spacingTop: "md",
  spacingBottom: "md",
  background: "",
  accent: "",
  columns: "",
  hideOnMobile: false,
};

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface BlockDefinition {
  type: PageBuilderBlockType;
  label: string;
  description: string;
  create: () => PageBuilderBlock;
}

function createHeroBlock(): HeroBlock {
  return {
    id: createId("hero"),
    type: "hero",
    enabled: true,
    variant: "split",
    style: { ...DEFAULT_STYLE, theme: "navy-gold", spacingTop: "xl" },
    data: {
      eyebrow: "Low Analysis",
      title: "Новий hero-блок",
      subtitle: "Короткий опис секції для відвідувача.",
      primaryButtonLabel: "Основна дія",
      primaryButtonHref: "/search",
      secondaryButtonLabel: "Детальніше",
      secondaryButtonHref: "/help",
    },
  };
}

function createRichTextBlock(): RichTextBlock {
  return {
    id: createId("text"),
    type: "richText",
    enabled: true,
    variant: "article",
    style: { ...DEFAULT_STYLE, theme: "surface" },
    data: {
      title: "Текстовий блок",
      body: "Перший абзац.\n\nДругий абзац з додатковим поясненням.",
    },
  };
}

function createStatsGridBlock(): StatsGridBlock {
  return {
    id: createId("stats"),
    type: "statsGrid",
    enabled: true,
    variant: "four-up",
    style: { ...DEFAULT_STYLE, theme: "glass" },
    data: {
      title: "Сітка показників",
      items: [
        { label: "Показник", value: "12", caption: "Пояснення метрики" },
        { label: "Показник", value: "34", caption: "Пояснення метрики" },
      ],
    },
  };
}

function createCardsBlock(): CardsBlock {
  return {
    id: createId("cards"),
    type: "cards",
    enabled: true,
    variant: "three-up",
    style: { ...DEFAULT_STYLE, theme: "surface" },
    data: {
      title: "Картки переваг",
      items: [
        {
          badge: "Feature",
          title: "Назва картки",
          body: "Короткий опис картки.",
          linkLabel: "Посилання",
          linkHref: "/analysis",
        },
      ],
    },
  };
}

function createStepsBlock(): StepsBlock {
  return {
    id: createId("steps"),
    type: "steps",
    enabled: true,
    variant: "timeline",
    style: { ...DEFAULT_STYLE, theme: "muted" },
    data: {
      title: "Покроковий сценарій",
      items: [{ title: "Крок 1", body: "Опис кроку." }],
    },
  };
}

function createFaqBlock(): FaqBlock {
  return {
    id: createId("faq"),
    type: "faq",
    enabled: true,
    variant: "accordion",
    style: { ...DEFAULT_STYLE, theme: "surface" },
    data: {
      title: "FAQ",
      items: [{ question: "Питання?", answer: "Відповідь." }],
    },
  };
}

function createCtaBlock(): CtaBlock {
  return {
    id: createId("cta"),
    type: "cta",
    enabled: true,
    variant: "banner",
    style: { ...DEFAULT_STYLE, theme: "gold", spacingTop: "lg" },
    data: {
      title: "Заклик до дії",
      body: "Пояснення, чому користувачу варто перейти далі.",
      buttonLabel: "Відкрити",
      buttonHref: "/laws",
      secondaryButtonLabel: "Деталі",
      secondaryButtonHref: "/help",
    },
  };
}

function createRadioGroupBlock(): RadioGroupBlock {
  return {
    id: createId("radio"),
    type: "radioGroup",
    enabled: true,
    variant: "stacked",
    style: { ...DEFAULT_STYLE, theme: "surface" },
    data: {
      title: "Radio-група",
      question: "Оберіть опцію:",
      options: [
        {
          label: "Опція 1",
          value: "option-1",
          description: "Коментар до опції",
        },
      ],
    },
  };
}

function createQuoteBlock(): QuoteBlock {
  return {
    id: createId("quote"),
    type: "quote",
    enabled: true,
    variant: "highlight",
    style: { ...DEFAULT_STYLE, theme: "gold" },
    data: {
      quote: "Це цитата або ключове повідомлення сторінки.",
      author: "Команда проєкту",
      role: "Editorial note",
    },
  };
}

function createImageBlock(): ImageBlock {
  return {
    id: createId("image"),
    type: "image",
    enabled: true,
    variant: "wide",
    style: { ...DEFAULT_STYLE, theme: "surface" },
    data: {
      title: "Зображення",
      src: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1400&q=80",
      alt: "Ілюстрація секції",
      caption: "Підпис до зображення або пояснення.",
    },
  };
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    type: "hero",
    label: "Hero",
    description: "Великий вступний блок із кнопками.",
    create: createHeroBlock,
  },
  {
    type: "richText",
    label: "Text",
    description: "Текстовий блок з абзацами.",
    create: createRichTextBlock,
  },
  {
    type: "statsGrid",
    label: "Stats",
    description: "Сітка коротких метрик або фактів.",
    create: createStatsGridBlock,
  },
  {
    type: "cards",
    label: "Cards",
    description: "Картки з заголовками, описом і посиланням.",
    create: createCardsBlock,
  },
  {
    type: "steps",
    label: "Steps",
    description: "Покроковий або таймлайн-блок.",
    create: createStepsBlock,
  },
  {
    type: "faq",
    label: "FAQ",
    description: "Аккордеон із питаннями та відповідями.",
    create: createFaqBlock,
  },
  {
    type: "cta",
    label: "CTA",
    description: "Заклик до дії з кнопками.",
    create: createCtaBlock,
  },
  {
    type: "radioGroup",
    label: "Radio",
    description: "Інтерактивний вибір опції.",
    create: createRadioGroupBlock,
  },
  {
    type: "quote",
    label: "Quote",
    description: "Цитата або editorial statement.",
    create: createQuoteBlock,
  },
  {
    type: "image",
    label: "Image",
    description: "Зображення з підписом.",
    create: createImageBlock,
  },
];

export function duplicateBlock(block: PageBuilderBlock): PageBuilderBlock {
  return {
    ...block,
    id: createId(block.type),
    data: JSON.parse(JSON.stringify(block.data)),
    style: JSON.parse(JSON.stringify(block.style)),
  } as PageBuilderBlock;
}

export function moveBlock<T extends { id: string }>(
  items: T[],
  draggedId: string,
  targetId: string,
) {
  const fromIndex = items.findIndex((item) => item.id === draggedId);
  const toIndex = items.findIndex((item) => item.id === targetId);

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return items;
  }

  const next = [...items];
  const [dragged] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, dragged);
  return next;
}

export function updateListItem<T>(
  items: T[],
  index: number,
  updater: (item: T) => T,
) {
  return items.map((item, currentIndex) =>
    currentIndex === index ? updater(item) : item,
  );
}

export function createStatsItem(): StatsGridItem {
  return { label: "Новий показник", value: "0", caption: "Пояснення" };
}

export function createCardItem(): CardItem {
  return {
    badge: "Feature",
    title: "Нова картка",
    body: "Опис картки.",
    linkLabel: "Детальніше",
    linkHref: "/",
  };
}

export function createStepItem(): StepItem {
  return { title: "Новий крок", body: "Опис кроку." };
}

export function createFaqItem(): FaqItemData {
  return { question: "Нове питання?", answer: "Нова відповідь." };
}

export function createRadioOption(): RadioOptionItem {
  return {
    label: "Нова опція",
    value: `option-${Math.random().toString(36).slice(2, 6)}`,
    description: "Короткий опис опції.",
  };
}

export const PROJECT_INFO_FALLBACK: ManagedPagePublicResponse = {
  slug: "project-info",
  status: "published",
  title: "Інформація про проєкт",
  description:
    "Керована сторінка про платформу Low Analysis з блоковою структурою та публічним renderer-ом.",
  seo: {
    title: "Інформація про проєкт | Low Analysis",
    description:
      "Опис платформи, її модулів та керованої сторінки для публічного сайту.",
    ogImage: "",
  },
  blocks: [
    {
      id: "hero-project-info",
      type: "hero",
      enabled: true,
      variant: "split",
      style: {
        ...DEFAULT_STYLE,
        theme: "navy-gold",
        spacingTop: "xl",
        spacingBottom: "lg",
        background: "gradient-hero",
      },
      data: {
        eyebrow: "Low Analysis",
        title: "Інформація про проєкт",
        subtitle:
          "Це цифрова платформа для структурування, пошуку та аналітики законодавства України.",
        primaryButtonLabel: "Відкрити аналізатор",
        primaryButtonHref: "/analysis",
        secondaryButtonLabel: "Перейти до пошуку",
        secondaryButtonHref: "/search",
      },
    },
    {
      id: "stats-project-info",
      type: "statsGrid",
      enabled: true,
      variant: "four-up",
      style: {
        ...DEFAULT_STYLE,
        theme: "glass",
      },
      data: {
        title: "Що вже вміє платформа",
        items: [
          {
            value: "11+",
            label: "законів у базі",
            caption: "З реальним деревом елементів і навігацією по статтях.",
          },
          {
            value: "4",
            label: "публічні режими",
            caption: "Закони, суб’єкти, пошук і аналітичний модуль.",
          },
          {
            value: "3",
            label: "ролі доступу",
            caption: "Гість, клієнт і адміністратор у межах єдиного UI.",
          },
          {
            value: "1",
            label: "керована сторінка",
            caption: "Оновлюється з адмінки без редагування JSX.",
          },
        ],
      },
    },
  ],
  updatedAt: new Date().toISOString(),
  publishedAt: new Date().toISOString(),
};

export function cloneSnapshot<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createEmptySnapshot(): PageBuilderSnapshot {
  return {
    title: PROJECT_INFO_FALLBACK.title,
    description: PROJECT_INFO_FALLBACK.description,
    seo: { ...PROJECT_INFO_FALLBACK.seo },
    blocks: cloneSnapshot(PROJECT_INFO_FALLBACK.blocks),
  };
}
