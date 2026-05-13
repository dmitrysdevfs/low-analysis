'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { SearchParams } from '@/hooks/useSearch';
import styles from './SearchForm.module.scss';

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  onReset?: () => void;
  loading?: boolean;
}

const DEFAULT: SearchParams = {
  q: '',
  wordField: 'title',
  docType: '',
  dateFrom: '',
  dateTo: '',
  numberType: 'starts',
  number: '',
  status: '',
  sort: 'date',
};

const DATE_PLACEHOLDER = 'дд.мм.рррр';

function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;

  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

function toIsoDate(value: string) {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value.trim());

  if (!match) return '';

  const [, day, month, year] = match;
  const normalized = `${year}-${month}-${day}`;
  const parsed = new Date(`${normalized}T00:00:00Z`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCDate() !== Number(day) ||
    parsed.getUTCMonth() + 1 !== Number(month) ||
    parsed.getUTCFullYear() !== Number(year)
  ) {
    return '';
  }

  return normalized;
}

export function SearchForm({ onSearch, onReset, loading }: SearchFormProps) {
  const [p, setP] = useState<SearchParams>(DEFAULT);

  const set = <K extends keyof SearchParams>(key: K, value: SearchParams[K]) =>
    setP(prev => ({ ...prev, [key]: value }));

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
                onChange={e => set('wordField', e.target.value as SearchParams['wordField'])}
                className={`form-control form-select ${styles.selectSmall}`}
              >
                <option value="title">в назві</option>
                <option value="text">у тексті</option>
                <option value="code">за кодом</option>
              </select>
              <input
                type="text"
                value={p.q}
                onChange={e => set('q', e.target.value)}
                placeholder="Введіть ключові слова..."
                className={`form-control ${styles.inputFlex}`}
              />
            </div>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Тип документа</span>
            <select
              value={p.docType}
              onChange={e => set('docType', e.target.value)}
              className={`form-control form-select ${styles.selectFull}`}
            >
              <option value="">Всі</option>
              <option value="КОНСТИТУЦІЯ УКРАЇНИ">Конституція України</option>
              <option value="ЗАКОН УКРАЇНИ">Закон України</option>
              <option value="КОДЕКС">Кодекс</option>
              <option value="ПОСТАНОВА">Постанова</option>
              <option value="НАКАЗ">Наказ</option>
            </select>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Дата документа</span>
            <div className={styles.dateGroup}>
              <label className={styles.dateField}>
                <span className={styles.dateLabel}>Від</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={10}
                  value={p.dateFrom}
                  onChange={e => set('dateFrom', formatDateInput(e.target.value))}
                  placeholder={DATE_PLACEHOLDER}
                  className={`form-control ${styles.inputDate}`}
                />
              </label>
              <label className={styles.dateField}>
                <span className={styles.dateLabel}>До</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={10}
                  value={p.dateTo}
                  onChange={e => set('dateTo', formatDateInput(e.target.value))}
                  placeholder={DATE_PLACEHOLDER}
                  className={`form-control ${styles.inputDate}`}
                />
              </label>
            </div>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Номер документа</span>
            <div className={styles.fieldGroup}>
              <select
                value={p.numberType}
                onChange={e => set('numberType', e.target.value as SearchParams['numberType'])}
                className={`form-control form-select ${styles.selectMedium}`}
              >
                <option value="starts">починається</option>
                <option value="contains">містить</option>
                <option value="exact">рівно</option>
              </select>
              <input
                type="text"
                value={p.number}
                onChange={e => set('number', e.target.value)}
                placeholder="Код або номер акта..."
                className={`form-control ${styles.inputFlex}`}
              />
            </div>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Стан документа</span>
            <select
              value={p.status}
              onChange={e => set('status', e.target.value)}
              className={`form-control form-select ${styles.selectFull}`}
            >
              <option value=""></option>
              <option value="чинний">Чинний</option>
              <option value="втратив чинність">Втратив чинність</option>
              <option value="не набрав чинності">Не набрав чинності</option>
            </select>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Сортування</span>
            <select
              value={p.sort}
              onChange={e => set('sort', e.target.value as SearchParams['sort'])}
              className={`form-control form-select ${styles.selectFull}`}
            >
              <option value="date">за датою</option>
              <option value="title">за назвою</option>
              <option value="relevance">за релевантністю</option>
            </select>
          </div>
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
                    ease: 'linear',
                  }}
                  className={styles.spinnerChar}
                >
                  ◌
                </motion.span>
                Шукаємо...
              </>
            ) : (
              'Шукати'
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
