import { Layout } from "@/components/Layout";
import { AdminControlCenter } from "@/components/admin/AdminControlCenter";
import styles from "./page.module.scss";

export default function AdminPage() {
  return (
    <Layout fullHeight>
      <div className={styles.wrap}>
        <AdminControlCenter />
      </div>
    </Layout>
  );
}
