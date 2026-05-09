"use client";

import { motion } from "framer-motion";

export function SkeletonCard() {
  return (
    <div
      className="panel"
      style={{
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {[72, 48, 60].map((width, index) => (
        <motion.div
          key={width}
          animate={{ opacity: [0.3, 0.65, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.12 }}
          style={{
            width: `${width}%`,
            height: index === 0 ? 22 : 12,
            borderRadius: 999,
            background: "#1C3260",
          }}
        />
      ))}
    </div>
  );
}
