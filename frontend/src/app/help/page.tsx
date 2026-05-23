import { FAQ_USER } from "@/content/help/faq-user";
import { HelpFaqGrid } from "@/components/help/HelpFaqGrid";
import styles from "@/components/help/help.module.scss";

export const metadata = { title: "Довідка | Low Analysis" };

export default function HelpPage() {
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <span className={styles.eyebrow}>Довідка</span>
        <h1 className={styles.pageTitle}>Часті питання</h1>
        <p className={styles.pageSubtitle}>
          Знайдіть відповідь на своє питання або перейдіть до покрокового
          керівництва.
        </p>
      </div>

      <HelpFaqGrid items={FAQ_USER} articleBasePath="/help" />
    </div>
  );
}
