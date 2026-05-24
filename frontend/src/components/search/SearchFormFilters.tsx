"use client";

import type { SearchParams } from "@/types/search.types";
import styles from "./SearchForm.module.scss";
import { DATE_PLACEHOLDER, formatDateInput } from "@/lib/utils/dateInput";

interface SearchFormFiltersProps {
  params: SearchParams;
  onChange: (patch: Partial<SearchParams>) => void;
}

export function SearchFormFilters({
  params,
  onChange,
}: SearchFormFiltersProps) {
  return (
    <>
      <div className={styles.row}>
        <span className={styles.label}>Тип документа</span>
        <select
          value={params.docType}
          onChange={(e) => onChange({ docType: e.target.value })}
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
              value={params.dateFrom}
              onChange={(e) =>
                onChange({ dateFrom: formatDateInput(e.target.value) })
              }
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
              value={params.dateTo}
              onChange={(e) =>
                onChange({ dateTo: formatDateInput(e.target.value) })
              }
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
            value={params.numberType}
            onChange={(e) =>
              onChange({
                numberType: e.target.value as SearchParams["numberType"],
              })
            }
            className={`form-control form-select ${styles.selectMedium}`}
          >
            <option value="starts">починається</option>
            <option value="contains">містить</option>
            <option value="exact">рівно</option>
          </select>
          <input
            type="text"
            value={params.number}
            onChange={(e) => onChange({ number: e.target.value })}
            placeholder="Код або номер акта..."
            className={`form-control ${styles.inputFlex}`}
          />
        </div>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Стан документа</span>
        <select
          value={params.status}
          onChange={(e) => onChange({ status: e.target.value })}
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
          value={params.sort}
          onChange={(e) =>
            onChange({ sort: e.target.value as SearchParams["sort"] })
          }
          className={`form-control form-select ${styles.selectFull}`}
        >
          <option value="date">за датою</option>
          <option value="title">за назвою</option>
          <option value="relevance">за релевантністю</option>
        </select>
      </div>
    </>
  );
}
