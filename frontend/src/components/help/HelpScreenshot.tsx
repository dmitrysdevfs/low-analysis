"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./help.module.scss";

interface HelpScreenshotProps {
  filename: string;
  alt?: string;
}

export function HelpScreenshot({ filename, alt }: HelpScreenshotProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={styles.screenshotWrap}>
        <div className={styles.screenshotPlaceholder}>
          [{filename}] — скриншот буде доданий пізніше
        </div>
      </div>
    );
  }

  return (
    <div className={styles.screenshotWrap}>
      <Image
        src={`/help-screenshots/${filename}`}
        alt={alt ?? filename}
        width={900}
        height={500}
        className={styles.screenshotImg}
        onError={() => setFailed(true)}
        unoptimized
      />
    </div>
  );
}
