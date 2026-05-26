export type HelpAudience = "user" | "admin" | "both";

export interface HelpStep {
  heading: string;
  body: string;
  screenshot?: string; // path relative to /public/help/screenshots/
  tip?: string;
  warning?: string;
}

export interface HelpArticle {
  slug: string;
  title: string;
  summary: string;
  category: string;
  audience: HelpAudience;
  steps: HelpStep[];
  relatedSlugs?: string[];
  updatedAt: string;
}

export interface FaqItem {
  question: string;
  slug: string;
  category: string;
  summary: string;
}
