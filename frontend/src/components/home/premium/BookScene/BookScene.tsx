"use client";

import { useRef, useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { TempleIcon } from "@/components/home/premium/icons";
import styles from "./BookScene.module.scss";

// Loaded only when in viewport AND no reduced-motion preference
const BookCanvas = dynamic(() => import("./BookCanvas"), {
  ssr: false,
  loading: () => <Poster />,
});

function Poster() {
  return (
    <div className={styles.poster}>
      <TempleIcon size={56} />
    </div>
  );
}

export function BookScene({ className }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [canLoad, setCanLoad] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCanLoad(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 },
    );
    if (wrapRef.current) observer.observe(wrapRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className={`${styles.wrap} ${className ?? ""}`}>
      {canLoad && !reducedMotion ? (
        <Suspense fallback={<Poster />}>
          <BookCanvas />
        </Suspense>
      ) : (
        <Poster />
      )}
    </div>
  );
}
