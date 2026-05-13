"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import styles from "./Breadcrumb.module.scss";

interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="breadcrumb" className={styles.nav}>
      {items.map((item, index) => (
        <motion.span
          key={`${item.label}-${index}`}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: index * 0.04 }}
          className={styles.crumb}
        >
          {index > 0 ? (
            <span className={`mono ${styles.separator}`}>/</span>
          ) : null}
          {item.href ? (
            <Link href={item.href} className={`mono ${styles.link}`}>
              {item.label}
            </Link>
          ) : (
            <span className={`mono ${styles.current}`}>{item.label}</span>
          )}
        </motion.span>
      ))}
    </nav>
  );
}
