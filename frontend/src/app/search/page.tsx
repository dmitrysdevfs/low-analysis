"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { SearchForm } from "@/components/search/SearchForm";
import { SearchParams } from "@/hooks/useSearch";
import styles from "./page.module.scss";

export default function SearchPage() {
  const router = useRouter();

  const handleSearch = (params: SearchParams) => {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value) query.set(key, String(value));
    });

    router.push(`/search/results?${query.toString()}`);
  };

  return (
    <Layout>
      <div className={styles.wrapper}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className={styles.formWrap}
        >
          <SearchForm onSearch={handleSearch} loading={false} />
        </motion.div>
      </div>
    </Layout>
  );
}
