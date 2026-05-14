import styles from "@/app/not-found.module.scss";

export function GridBackground() {
  return (
    <div className={styles.gridBackground}>
      <svg
        className={styles.gridSvg}
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid404"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="#4A80D4"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid404)" />
      </svg>

      <div className={styles.gridGlowLarge} />
      <div className={styles.gridGlowSmall} />
    </div>
  );
}
