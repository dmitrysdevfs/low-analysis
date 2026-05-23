import { FAQ_ADMIN } from "@/content/help/faq-admin";
import { HelpFaqGrid } from "@/components/help/HelpFaqGrid";
import styles from "@/components/help/help.module.scss";

export const metadata = { title: "Довідка адміна | Low Analysis" };

export default function AdminHelpPage() {
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <span className={styles.eyebrow}>Адмін · Довідка</span>
        <h1 className={styles.pageTitle}>Часті питання</h1>
        <p className={styles.pageSubtitle}>
          Керівництво для адміністраторів платформи.
        </p>
      </div>

      <HelpFaqGrid items={FAQ_ADMIN} articleBasePath="/admin/help" />
    </div>
  );
}
