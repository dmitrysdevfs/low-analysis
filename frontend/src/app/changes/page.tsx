"use client";

import dynamic from "next/dynamic";
import { Layout } from "@/components/layout/Layout";
import styles from "./page.module.scss";

const ChangeFeed = dynamic(
  () =>
    import("@/features/law-change/components/ChangeFeed/ChangeFeed").then(
      (m) => ({ default: m.ChangeFeed }),
    ),
  {
    ssr: false,
    loading: () => (
      <p style={{ padding: "24px", opacity: 0.5 }}>Завантаження...</p>
    ),
  },
);

export default function ChangesPage() {
  return (
    <Layout>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Зміни до законів</h1>
          <p className={styles.subtitle}>
            Лента затверджених змін до законодавства
          </p>
        </header>
        <ChangeFeed />
      </div>
    </Layout>
  );
}
