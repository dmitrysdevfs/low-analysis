"use client";

import { Layout } from "@/components/layout/Layout";
import { ChangeFeed } from "@/features/law-change/components/ChangeFeed/ChangeFeed";
import styles from "./page.module.scss";

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
