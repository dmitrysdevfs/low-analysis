"use client";

import type { Law } from "@/types";
import styles from "./GraphListFallback.module.scss";

interface GraphListFallbackProps {
  laws: Law[];
}

export function GraphListFallback({ laws }: GraphListFallbackProps) {
  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Список законів (текстовий режим)</h2>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Назва</th>
              <th>Тип</th>
              <th>Статей</th>
              <th>Рік</th>
            </tr>
          </thead>
          <tbody>
            {laws.map((law) => {
              const year = law.adoptedDate
                ? new Date(law.adoptedDate).getFullYear()
                : "—";
              const lawType = law.documentType?.[0] ?? "закон";

              return (
                <tr key={law._id}>
                  <td>{law.title}</td>
                  <td>{lawType}</td>
                  <td>{law.totalArticles}</td>
                  <td>{year}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
