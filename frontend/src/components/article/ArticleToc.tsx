"use client";

import { useEffect, useRef, useState } from "react";
import { sanitizeAnchor, type TreeBranch } from "@/lib/tree";
import styles from "./ArticleToc.module.scss";

interface TocEntry {
  id: string;
  label: string;
  depth: number;
}

function collectEntries(nodes: TreeBranch[], depth = 0): TocEntry[] {
  const result: TocEntry[] = [];
  for (const node of nodes) {
    if (node.code) {
      const label =
        node.title ??
        (node.number ? `${node.type ?? ""} ${node.number}`.trim() : node.code);
      result.push({ id: sanitizeAnchor(node.code), label, depth });
    }
    if (node.children?.length) {
      result.push(...collectEntries(node.children, depth + 1));
    }
  }
  return result;
}

export function ArticleToc({ nodes }: { nodes: TreeBranch[] }) {
  const entries = collectEntries(nodes);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!entries.length) return;

    observerRef.current?.disconnect();

    const ids = entries.map((e) => e.id);
    const visible = new Map<string, number>();

    observerRef.current = new IntersectionObserver(
      (obs) => {
        for (const entry of obs) {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry.boundingClientRect.top);
          } else {
            visible.delete(entry.target.id);
          }
        }
        if (visible.size > 0) {
          const topmost = [...visible.entries()].sort((a, b) => a[1] - b[1])[0];
          setActiveId(topmost[0]);
        }
      },
      { rootMargin: "-10% 0px -70% 0px", threshold: 0 },
    );

    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observerRef.current.observe(el);
    }

    return () => observerRef.current?.disconnect();
  }, [entries.map((e) => e.id).join(",")]);

  if (!entries.length) return null;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setOpen(false);
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        className={styles.mobileToggle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="mono">§ Зміст</span>
        <span className={styles.mobileToggleArrow}>{open ? "▲" : "▼"}</span>
      </button>

      {/* TOC list */}
      <nav
        className={`${styles.toc} ${open ? styles.tocOpen : ""}`}
        aria-label="Зміст статті"
      >
        <div className={`mono ${styles.tocHeading}`}>ЗМІСТ</div>
        <ul className={styles.tocList}>
          {entries.map((entry) => (
            <li key={entry.id} className={styles.tocItem} style={{ paddingLeft: entry.depth * 10 }}>
              <button
                type="button"
                className={`${styles.tocLink} ${activeId === entry.id ? styles.tocLinkActive : ""}`}
                onClick={() => scrollTo(entry.id)}
                title={entry.label}
              >
                {entry.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
