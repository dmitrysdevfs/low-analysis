"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import { useParseLaw } from "@/hooks/useParseLaw";
import styles from "./LawParseForm.module.scss";

interface Props {
  onSuccess?: () => void;
}

export function LawParseForm({ onSuccess }: Props) {
  const [url, setUrl] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const { submit, loading, error } = useParseLaw(() => {
    setUrl("");
    onSuccess?.();
  });

  const isValidUrl = (value: string) => {
    try {
      const parsed = new URL(value);

      return parsed.hostname.includes("zakon.rada.gov.ua");
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setValidationError("Вставте посилання на закон");
      return;
    }

    if (!isValidUrl(trimmedUrl)) {
      setValidationError("Введіть коректне посилання на zakon.rada.gov.ua");
      return;
    }

    setValidationError(null);

    await submit(trimmedUrl);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.4 }}
      className={styles.wrapper}
    >
      <div className={styles.content}>
        <div className={styles.textBlock}>
          <p className={styles.title}>Не знайшли закон?</p>
          <p className={styles.description}>
            Додайте його за посиланням з zakon.rada.gov.ua
          </p>
        </div>

        <div className={styles.controls}>
          <input
            type="text"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);

              if (validationError) {
                setValidationError(null);
              }
            }}
            placeholder="https://zakon.rada.gov.ua/laws/show/..."
            className={`form-control ${styles.input}`}
          />

          <button
            onClick={handleSubmit}
            className={styles.button}
            disabled={loading || !url.trim()}
          >
            {loading ? "Додаємо..." : "Додати"}
          </button>
        </div>

        {validationError ? (
          <p className={styles.validationError}>{validationError}</p>
        ) : null}

        {error ? <p className={styles.error}>{error}</p> : null}

        {loading ? (
          <p className={styles.loadingText}>
            Парсимо закон. Це може зайняти кілька секунд...
          </p>
        ) : null}
      </div>
    </motion.div>
  );
}
