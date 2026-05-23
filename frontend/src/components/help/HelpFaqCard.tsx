import Link from "next/link";
import type { FaqItem } from "@/content/help/types";
import styles from "./help.module.scss";

interface HelpFaqCardProps {
  item: FaqItem;
  articleHref: string;
}

export function HelpFaqCard({ item, articleHref }: HelpFaqCardProps) {
  return (
    <Link href={articleHref} className={styles.faqCard}>
      <span className={styles.faqCardCategory}>{item.category}</span>
      <span className={styles.faqCardQuestion}>{item.question}</span>
      <span className={styles.faqCardSummary}>{item.summary}</span>
    </Link>
  );
}
