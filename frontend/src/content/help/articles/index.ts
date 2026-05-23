import type { HelpArticle } from "../types";

import howToSearch from "./how-to-search";
import howToLawsPage from "./how-to-laws-page";
import howToRiskFilter from "./how-to-risk-filter";
import howToSubjects from "./how-to-subjects";
import howToArticlePage from "./how-to-article-page";
import howToCopy from "./how-to-copy";
import howToNotes from "./how-to-notes";
import howToAccount from "./how-to-account";
import howToGuestLimits from "./how-to-guest-limits";
import adminUsers from "./admin-users";
import adminAnalytics from "./admin-analytics";
import adminAudit from "./admin-audit";
import adminCodes from "./admin-codes";

export const ALL_ARTICLES: HelpArticle[] = [
  howToSearch,
  howToLawsPage,
  howToRiskFilter,
  howToSubjects,
  howToArticlePage,
  howToCopy,
  howToNotes,
  howToAccount,
  howToGuestLimits,
  adminUsers,
  adminAnalytics,
  adminAudit,
  adminCodes,
];

export function getArticleBySlug(slug: string): HelpArticle | undefined {
  return ALL_ARTICLES.find((a) => a.slug === slug);
}

export function getArticlesByAudience(
  audience: "user" | "admin",
): HelpArticle[] {
  return ALL_ARTICLES.filter(
    (a) => a.audience === audience || a.audience === "both",
  );
}
