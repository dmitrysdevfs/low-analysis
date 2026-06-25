"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { features } from "@/constants/homeContent";
import styles from "./FeaturesSection.module.scss";

export function FeaturesSection() {
  return (
    <section className={`container section ${styles.section}`}>
      <div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45 }}
          className={styles.header}
        >
          <div className={`mono ${styles.label}`}>Можливості</div>
          <h2 className={`subtitle ${styles.h2}`}>Що вміє платформа</h2>
          <p className={styles.sub}>
            Від сирого HTML до структурованих даних — з аналітикою, пошуком і AI
            прямо в інтерфейсі.
          </p>
        </motion.div>

        <div className={styles.grid}>
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.08 }}
              transition={{
                delay: index * 0.09,
                duration: 0.5,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              whileHover={{ y: -8, transition: { duration: 0.22 } }}
              className={styles.card}
            >
              <div className={styles.cardGlow} />
              <div className={`mono ${styles.icon}`}>{feature.icon}</div>
              <h3 className={styles.title}>{feature.title}</h3>
              <p className={styles.desc}>{feature.desc}</p>
              <Link href={feature.href} className={styles.link}>
                Відкрити{" "}
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  →
                </motion.span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
