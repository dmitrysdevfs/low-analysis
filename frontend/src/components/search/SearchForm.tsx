"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { SearchParams } from "@/types/search.types";
import styles from "./SearchForm.module.scss";
import { toIsoDate } from "@/lib/utils/dateUtils";
import { SearchFormFilters } from "./SearchFormFilters";

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  onReset?: () => void;
  loading?: boolean;
}

const DEFAULT: SearchParams = {
  q: "",
  wordField: "title",
  docType: "",
  dateFrom: "",
  dateTo: "",
  numberType: "starts",
  number: "",
  status: "",
  sort: "date",
};

export function SearchForm({ onSearch, onReset, loading }: SearchFormProps) {
  const [p, setP] = useState<SearchParams>(DEFAULT);

  const set = <K extends keyof SearchParams>(key: K, value: SearchParams[K]) =>
    setP((prev) => ({ ...prev, [key]: value }));

  const handleChange = (patch: Partial<SearchParams>) =>
    setP((prev) => ({ ...prev, ...patch }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      ...p,
      dateFrom: toIsoDate(p.dateFrom),
      dateTo: toIsoDate(p.dateTo),
    });
  };

  const handleReset = () => {
    setP(DEFAULT);
    onReset?.();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>Параметри пошуку</div>

      <form onSubmit={handleSubmit}>
        <div className={styles.fields}>
          <div className={styles.row}>
            <span className={styles.label}>Слова</span>
            <div className={styles.fieldGroup}>
              <select
                value={p.wordField}
                onChange={(e) =>
                  set("wordField", e.target.value as SearchParams["wordField"])
                }
                className={`form-control form-select ${styles.selectSmall}`}
              >
                <option value="title">в назві</option>
                <option value="text">у тексті</option>
                <option value="code">за кодом</option>
              </select>
              <input
                type="text"
                value={p.q}
                onChange={(e) => set("q", e.target.value)}
                placeholder="Введіть ключові слова..."
                className={`form-control ${styles.inputFlex}`}
              />
            </div>
          </div>

          <SearchFormFilters params={p} onChange={handleChange} />
        </div>

        <div className={styles.actions}>
          <motion.button
            type="button"
            onClick={handleReset}
            className={`btn btn-ghost ${styles.btnReset}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            Очистити
          </motion.button>

          <motion.button
            type="submit"
            disabled={loading}
            className={`btn btn-primary ${styles.btnSubmit}`}
            whileHover={loading ? {} : { scale: 1.02 }}
            whileTap={loading ? {} : { scale: 0.97 }}
          >
            {loading ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className={styles.spinnerChar}
                >
                  ◌
                </motion.span>
                Шукаємо...
              </>
            ) : (
              "Шукати"
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
