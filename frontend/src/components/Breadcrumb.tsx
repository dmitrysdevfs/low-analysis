"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label="breadcrumb"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        alignItems: "center",
      }}
    >
      {items.map((item, index) => (
        <motion.span
          key={`${item.label}-${index}`}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: index * 0.04 }}
          style={{ display: "inline-flex", gap: 6, alignItems: "center" }}
        >
          {index > 0 ? (
            <span
              className="mono"
              style={{ fontSize: "0.7rem", color: "#1C3260" }}
            >
              /
            </span>
          ) : null}
          {item.href ? (
            <Link
              href={item.href}
              className="mono"
              style={{
                fontSize: "0.72rem",
                color: "#7A98C0",
                textDecoration: "none",
              }}
            >
              {item.label}
            </Link>
          ) : (
            <span
              className="mono"
              style={{ fontSize: "0.72rem", color: "#D6E0F0" }}
            >
              {item.label}
            </span>
          )}
        </motion.span>
      ))}
    </nav>
  );
}
