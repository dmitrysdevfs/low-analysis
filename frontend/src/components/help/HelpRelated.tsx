import Link from "next/link";
import type { HelpArticle } from "@/content/help/types";
import { getArticleBySlug } from "@/content/help/articles";
import styles from "./help.module.scss";

interface HelpRelatedProps {
  slugs: string[];
  buildHref: (slug: string) => string;
}

export function HelpRelated({ slugs, buildHref }: HelpRelatedProps) {
  const articles = slugs
    .map((s) => getArticleBySlug(s))
    .filter((a): a is HelpArticle => a !== undefined);

  if (articles.length === 0) return null;

  return (
    <div className={styles.related}>
      <p className={styles.relatedTitle}>Пов&apos;язані статті</p>
      <div className={styles.relatedList}>
        {articles.map((a) => (
          <Link
            key={a.slug}
            href={buildHref(a.slug)}
            className={styles.relatedLink}
          >
            <span>{a.title}</span>
            <span className={styles.relatedArrow}>→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
