import {
  ALLOWED_PAGE_SLUGS,
  PAGE_BLOCK_TYPES,
  PAGE_SLUGS,
} from './page.constants.js';

function asString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function asBoolean(value, fallback = true) {
  return typeof value === 'boolean' ? value : fallback;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeHeroData(data = {}) {
  return {
    eyebrow: asString(data.eyebrow),
    title: asString(data.title),
    subtitle: asString(data.subtitle),
    primaryButtonLabel: asString(data.primaryButtonLabel),
    primaryButtonHref: asString(data.primaryButtonHref),
    secondaryButtonLabel: asString(data.secondaryButtonLabel),
    secondaryButtonHref: asString(data.secondaryButtonHref),
  };
}

function normalizeRichTextData(data = {}) {
  return {
    title: asString(data.title),
    body: asString(data.body),
  };
}

function normalizeStatsGridData(data = {}) {
  return {
    title: asString(data.title),
    items: asArray(data.items).map((item) => ({
      label: asString(item?.label),
      value: asString(item?.value),
      caption: asString(item?.caption),
    })),
  };
}

function normalizeCardsData(data = {}) {
  return {
    title: asString(data.title),
    items: asArray(data.items).map((item) => ({
      badge: asString(item?.badge),
      title: asString(item?.title),
      body: asString(item?.body),
      linkLabel: asString(item?.linkLabel),
      linkHref: asString(item?.linkHref),
    })),
  };
}

function normalizeStepsData(data = {}) {
  return {
    title: asString(data.title),
    items: asArray(data.items).map((item) => ({
      title: asString(item?.title),
      body: asString(item?.body),
    })),
  };
}

function normalizeFaqData(data = {}) {
  return {
    title: asString(data.title),
    items: asArray(data.items).map((item) => ({
      question: asString(item?.question),
      answer: asString(item?.answer),
    })),
  };
}

function normalizeCtaData(data = {}) {
  return {
    title: asString(data.title),
    body: asString(data.body),
    buttonLabel: asString(data.buttonLabel),
    buttonHref: asString(data.buttonHref),
    secondaryButtonLabel: asString(data.secondaryButtonLabel),
    secondaryButtonHref: asString(data.secondaryButtonHref),
  };
}

function normalizeRadioGroupData(data = {}) {
  return {
    title: asString(data.title),
    question: asString(data.question),
    options: asArray(data.options).map((item) => ({
      label: asString(item?.label),
      value: asString(item?.value),
      description: asString(item?.description),
    })),
  };
}

function normalizeQuoteData(data = {}) {
  return {
    quote: asString(data.quote),
    author: asString(data.author),
    role: asString(data.role),
  };
}

function normalizeImageData(data = {}) {
  return {
    title: asString(data.title),
    src: asString(data.src),
    alt: asString(data.alt),
    caption: asString(data.caption),
  };
}

function normalizeStyle(style = {}) {
  return {
    theme: asString(style.theme, 'default'),
    alignment: asString(style.alignment, 'left'),
    spacingTop: asString(style.spacingTop, 'md'),
    spacingBottom: asString(style.spacingBottom, 'md'),
    background: asString(style.background),
    accent: asString(style.accent),
    columns: asString(style.columns),
    hideOnMobile: asBoolean(style.hideOnMobile, false),
  };
}

const BLOCK_NORMALIZERS = {
  hero: normalizeHeroData,
  richText: normalizeRichTextData,
  statsGrid: normalizeStatsGridData,
  cards: normalizeCardsData,
  steps: normalizeStepsData,
  faq: normalizeFaqData,
  cta: normalizeCtaData,
  radioGroup: normalizeRadioGroupData,
  quote: normalizeQuoteData,
  image: normalizeImageData,
};

export function assertPageSlug(slug) {
  const normalized = asString(slug).toLowerCase();
  if (!ALLOWED_PAGE_SLUGS.includes(normalized)) {
    const error = new Error(`Unsupported page slug: ${slug}`);
    error.statusCode = 404;
    throw error;
  }
  return normalized;
}

export function normalizePageSnapshot(input = {}) {
  const title = asString(input.title);
  if (!title) {
    const error = new Error('Page title is required');
    error.statusCode = 400;
    throw error;
  }

  const blocks = asArray(input.blocks).map((block, index) => {
    const type = asString(block?.type);
    if (!PAGE_BLOCK_TYPES.includes(type)) {
      const error = new Error(
        `Unsupported block type at index ${index}: ${type}`,
      );
      error.statusCode = 400;
      throw error;
    }

    const normalizeData = BLOCK_NORMALIZERS[type];
    const normalizedBlock = {
      id: asString(block?.id, `${type}-${index + 1}`),
      type,
      enabled: asBoolean(block?.enabled, true),
      variant: asString(block?.variant, 'default'),
      data: normalizeData(block?.data ?? {}),
      style: normalizeStyle(block?.style ?? {}),
    };

    return normalizedBlock;
  });

  return {
    title,
    description: asString(input.description),
    seo: {
      title: asString(input.seo?.title),
      description: asString(input.seo?.description),
      ogImage: asString(input.seo?.ogImage),
    },
    blocks,
  };
}

const SLUG_TITLES = {
  [PAGE_SLUGS.projectInfo]: 'Інформація про проєкт',
  [PAGE_SLUGS.rolesGuest]: 'Гість',
  [PAGE_SLUGS.rolesUser]: 'Користувач',
  [PAGE_SLUGS.rolesLawmaker]: 'Законотворець',
  [PAGE_SLUGS.rolesSupervisor]: 'Супервайзер',
  [PAGE_SLUGS.rolesAdmin]: 'Адміністратор',
  [PAGE_SLUGS.support]: 'Підтримати проєкт',
  [PAGE_SLUGS.docs]: 'Документація',
};

export function createEmptyDraftTitleForSlug(slug) {
  return SLUG_TITLES[slug] ?? slug;
}
