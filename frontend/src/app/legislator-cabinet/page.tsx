"use client";

import { useProposals } from "@/hooks/useProposals";
import Link from "next/link";
import styles from "./page.module.scss";

export default function LegislatorCabinetPage() {
  const { data: proposals, isLoading } = useProposals();

  if (isLoading) return <div>Завантаження...</div>;

  return (
    <div className={styles.container}>
      <h1>Кабінет законотворця</h1>
      <section className={styles.section}>
        <h2>Мої пропозиції</h2>
        <div className={styles.grid}>
          {proposals?.map((proposal) => (
            <Link
              key={proposal._id}
              href={`/legislator-cabinet/${proposal._id}`}
              className={styles.card}
            >
              <h3>{proposal.title}</h3>
              <p>{proposal.description}</p>
              <div className={styles.footer}>
                <span className={styles.status}>{proposal.status}</span>
                <span className={styles.count}>
                  {proposal.amendments_count} поправок
                </span>
              </div>
            </Link>
          ))}
          {proposals?.length === 0 && (
            <p>У вас ще немає створених пропозицій.</p>
          )}
        </div>
      </section>
    </div>
  );
}
