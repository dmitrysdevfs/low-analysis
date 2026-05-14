"use client";

import { useEffect, useState } from "react";

export function useCountUp(target: number, duration = 1400, active = false) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active || target === 0) return;

    let start: number | null = null;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [target, duration, active]);

  return active ? value : 0;
}
