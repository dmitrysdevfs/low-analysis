"use client";

import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { SearchForm } from "@/components/SearchForm";
import { SearchResults } from "@/components/SearchResults";
import { useSearch } from "@/hooks/useSearch";
import styles from "./page.module.scss";

export default function SearchPage() {
  const { results, loading, error, searched, params, search, reset } =
    useSearch();

  return (
    <Layout>
      <div className={styles.wrapper}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className={styles.formWrap}
        >
          <SearchForm onSearch={search} onReset={reset} loading={loading} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <SearchResults
            results={results}
            loading={loading}
            error={error}
            searched={searched}
            query={params.q}
          />
        </motion.div>
      </div>
    </Layout>
  );
}
