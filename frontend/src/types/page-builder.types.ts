export type PageBuilderSlug = "project-info";

export type PageBuilderStatus = "draft" | "published";

export type PageBuilderBlockType =
  | "hero"
  | "richText"
  | "statsGrid"
  | "cards"
  | "steps"
  | "faq"
  | "cta"
  | "radioGroup"
  | "quote"
  | "image";

export interface PageBuilderSeo {
  title: string;
  description: string;
  ogImage: string;
}

export interface HeroBlockData {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryButtonLabel: string;
  primaryButtonHref: string;
  secondaryButtonLabel: string;
  secondaryButtonHref: string;
}

export interface RichTextBlockData {
  title: string;
  body: string;
}

export interface StatsGridItem {
  label: string;
  value: string;
  caption: string;
}

export interface StatsGridBlockData {
  title: string;
  items: StatsGridItem[];
}

export interface CardItem {
  badge: string;
  title: string;
  body: string;
  linkLabel: string;
  linkHref: string;
}

export interface CardsBlockData {
  title: string;
  items: CardItem[];
}

export interface StepItem {
  title: string;
  body: string;
}

export interface StepsBlockData {
  title: string;
  items: StepItem[];
}

export interface FaqItemData {
  question: string;
  answer: string;
}

export interface FaqBlockData {
  title: string;
  items: FaqItemData[];
}

export interface CtaBlockData {
  title: string;
  body: string;
  buttonLabel: string;
  buttonHref: string;
  secondaryButtonLabel: string;
  secondaryButtonHref: string;
}

export interface RadioOptionItem {
  label: string;
  value: string;
  description: string;
}

export interface RadioGroupBlockData {
  title: string;
  question: string;
  options: RadioOptionItem[];
}

export interface QuoteBlockData {
  quote: string;
  author: string;
  role: string;
}

export interface ImageBlockData {
  title: string;
  src: string;
  alt: string;
  caption: string;
}

export interface PageBuilderBlockStyle {
  theme: string;
  alignment: string;
  spacingTop: string;
  spacingBottom: string;
  background: string;
  accent: string;
  columns: string;
  hideOnMobile: boolean;
}

interface PageBuilderBlockBase<TType extends PageBuilderBlockType, TData> {
  id: string;
  type: TType;
  enabled: boolean;
  variant: string;
  data: TData;
  style: PageBuilderBlockStyle;
}

export type HeroBlock = PageBuilderBlockBase<"hero", HeroBlockData>;
export type RichTextBlock = PageBuilderBlockBase<"richText", RichTextBlockData>;
export type StatsGridBlock = PageBuilderBlockBase<"statsGrid", StatsGridBlockData>;
export type CardsBlock = PageBuilderBlockBase<"cards", CardsBlockData>;
export type StepsBlock = PageBuilderBlockBase<"steps", StepsBlockData>;
export type FaqBlock = PageBuilderBlockBase<"faq", FaqBlockData>;
export type CtaBlock = PageBuilderBlockBase<"cta", CtaBlockData>;
export type RadioGroupBlock = PageBuilderBlockBase<
  "radioGroup",
  RadioGroupBlockData
>;
export type QuoteBlock = PageBuilderBlockBase<"quote", QuoteBlockData>;
export type ImageBlock = PageBuilderBlockBase<"image", ImageBlockData>;

export type PageBuilderBlock =
  | HeroBlock
  | RichTextBlock
  | StatsGridBlock
  | CardsBlock
  | StepsBlock
  | FaqBlock
  | CtaBlock
  | RadioGroupBlock
  | QuoteBlock
  | ImageBlock;

export interface PageBuilderSnapshot {
  title: string;
  description: string;
  seo: PageBuilderSeo;
  blocks: PageBuilderBlock[];
}

export interface PageBuilderVersionMeta {
  version: number;
  kind: "seed" | "save" | "publish" | "restore" | "unpublish";
  savedAt: string;
  savedBy: string | null;
  title: string;
  blockCount: number;
}

export interface ManagedPageAdminResponse {
  slug: PageBuilderSlug | string;
  title: string;
  status: PageBuilderStatus;
  draft: PageBuilderSnapshot;
  published: PageBuilderSnapshot | null;
  updatedAt: string;
  publishedAt: string | null;
  versions: PageBuilderVersionMeta[];
}

export interface ManagedPagePublicResponse extends PageBuilderSnapshot {
  slug: PageBuilderSlug | string;
  status: "published";
  updatedAt: string;
  publishedAt: string | null;
}

export interface PageCatalogItem {
  slug: PageBuilderSlug | string;
  label: string;
}
