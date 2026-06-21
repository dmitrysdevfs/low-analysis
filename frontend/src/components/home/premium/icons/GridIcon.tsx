export function GridIcon({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="4"
        y="4"
        width="12"
        height="12"
        rx="2"
        stroke="#D8A735"
        strokeWidth="1.5"
      />
      <rect
        x="20"
        y="4"
        width="12"
        height="12"
        rx="2"
        stroke="#D8A735"
        strokeWidth="1.5"
      />
      <rect
        x="4"
        y="20"
        width="12"
        height="12"
        rx="2"
        stroke="#D8A735"
        strokeWidth="1.5"
      />
      <rect
        x="20"
        y="20"
        width="12"
        height="12"
        rx="2"
        stroke="#D8A735"
        strokeWidth="1.5"
      />
    </svg>
  );
}
