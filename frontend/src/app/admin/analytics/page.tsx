import { Layout } from "@/components/layout/Layout";
import { AdminAnalyticsView } from "@/components/admin/AdminAnalyticsView";
import styles from "../page.module.scss";

export default function AdminAnalyticsPage() {
  return (
    <Layout fullHeight>
      <div className={styles.wrap}>
        <AdminAnalyticsView />
      </div>
    </Layout>
  );
}
