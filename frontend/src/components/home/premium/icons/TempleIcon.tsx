export function TempleIcon({
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
        y="28"
        width="28"
        height="3"
        rx="1"
        stroke="#D8A735"
        strokeWidth="1.5"
      />
      <rect
        x="2"
        y="24"
        width="32"
        height="3"
        rx="1"
        stroke="#D8A735"
        strokeWidth="1.5"
      />
      <rect
        x="8"
        y="8"
        width="3"
        height="16"
        rx="1"
        stroke="#D8A735"
        strokeWidth="1.5"
      />
      <rect
        x="16.5"
        y="8"
        width="3"
        height="16"
        rx="1"
        stroke="#D8A735"
        strokeWidth="1.5"
      />
      <rect
        x="25"
        y="8"
        width="3"
        height="16"
        rx="1"
        stroke="#D8A735"
        strokeWidth="1.5"
      />
      <path
        d="M4 8L18 3L32 8H4Z"
        stroke="#D8A735"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
