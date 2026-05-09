"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { SearchParams } from "@/hooks/useSearch";
import styles from "./SearchForm.module.scss";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(p);
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
          {/* Слова */}
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
                <option value="text">в тексті</option>
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

          {/* Тип документа */}
          <div className={styles.row}>
            <span className={styles.label}>Тип документа</span>
            <select
              value={p.docType}
              onChange={(e) => set("docType", e.target.value)}
              className={`form-control form-select ${styles.selectFull}`}
            >
              <option value="">Всі</option>
              <option value="ua">Конституція (UA)</option>
              <option value="z">Закон (Z)</option>
              <option value="uk">Кодекс (UK)</option>
              <option value="n">Нормативний акт (N)</option>
              <option value="p">Постанова (P)</option>
            </select>
          </div>

          {/* Дата документа */}
          <div className={styles.row}>
            <span className={styles.label}>Дата документа</span>
            <div className={styles.dateGroup}>
              <span className={styles.dateLabel}>з</span>
              <input
                type="date"
                value={p.dateFrom}
                onChange={(e) => set("dateFrom", e.target.value)}
                className={`form-control ${styles.inputDate}`}
              />
              <span className={styles.dateLabel}>по</span>
              <input
                type="date"
                value={p.dateTo}
                onChange={(e) => set("dateTo", e.target.value)}
                className={`form-control ${styles.inputDate}`}
              />
            </div>
          </div>

          {/* Номер документа */}
          <div className={styles.row}>
            <span className={styles.label}>Номер документа</span>
            <div className={styles.fieldGroup}>
              <select
                value={p.numberType}
                onChange={(e) =>
                  set(
                    "numberType",
                    e.target.value as SearchParams["numberType"],
                  )
                }
                className={`form-control form-select ${styles.selectMedium}`}
              >
                <option value="starts">починається</option>
                <option value="contains">містить</option>
                <option value="exact">рівно</option>
              </select>
              <input
                type="text"
                value={p.number}
                onChange={(e) => set("number", e.target.value)}
                placeholder="Код або номер..."
                className={`form-control ${styles.inputFlex}`}
              />
            </div>
          </div>

          {/* Стан документа */}
          <div className={styles.row}>
            <span className={styles.label}>Стан документа</span>
            <select
              value={p.status}
              onChange={(e) => set("status", e.target.value)}
              className={`form-control form-select ${styles.selectFull}`}
            >
              <option value=""></option>
              <option value="active">Чинний</option>
              <option value="inactive">Втратив чинність</option>
              <option value="pending">Не набрав чинності</option>
            </select>
          </div>

          {/* Сортування */}
          <div className={styles.row}>
            <span className={styles.label}>Сортування</span>
            <select
              value={p.sort}
              onChange={(e) =>
                set("sort", e.target.value as SearchParams["sort"])
              }
              className={`form-control form-select ${styles.selectFull}`}
            >
              <option value="date">за датою</option>
              <option value="title">за назвою</option>
              <option value="relevance">за релевантністю</option>
            </select>
          </div>
        </div>

        {/* Кнопки */}
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
