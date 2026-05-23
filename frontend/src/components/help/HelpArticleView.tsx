import Link from "next/link";
import type { HelpArticle } from "@/content/help/types";
import { HelpStep } from "./HelpStep";
import { HelpRelated } from "./HelpRelated";
import styles from "./help.module.scss";

interface HelpArticleViewProps {
  article: HelpArticle;
  backHref: string;
  backLabel: string;
  buildRelatedHref: (slug: string) => string;
}

export function HelpArticleView({
  article,
  backHref,
  backLabel,
  buildRelatedHref,
}: HelpArticleViewProps) {
  return (
    <div className={styles.articlePage}>
      <Link href={backHref} className={styles.backLink}>
        ← {backLabel}
      </Link>

      <div className={styles.articleHeader}>
        <span className={styles.articleCategory}>{article.category}</span>
        <h1 className={styles.articleTitle}>{article.title}</h1>
        <span className={styles.articleMeta}>
          Оновлено: {article.updatedAt}
        </span>
      </div>

      <div className={styles.steps}>
        {article.steps.map((step, i) => (
          <HelpStep
            key={i}
            step={step}
            index={i}
            isLast={i === article.steps.length - 1}
          />
        ))}
      </div>

      {article.relatedSlugs && article.relatedSlugs.length > 0 && (
        <HelpRelated
          slugs={article.relatedSlugs}
          buildHref={buildRelatedHref}
        />
      )}
    </div>
  );
}
