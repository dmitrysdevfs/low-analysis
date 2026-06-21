export function LexAiIcon({
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
        x="10"
        y="10"
        width="16"
        height="16"
        rx="4"
        stroke="#D8A735"
        strokeWidth="1.5"
      />
      <path
        d="M14 14h8M14 18h8M14 22h4"
        stroke="#D8A735"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M10 14H6M10 18H4M10 22H6"
        stroke="#D8A735"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M26 14h4M26 18h4M26 22h2"
        stroke="#D8A735"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="18" cy="5" r="2" stroke="#D8A735" strokeWidth="1.5" />
      <path
        d="M18 7v3"
        stroke="#D8A735"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="18" cy="31" r="2" stroke="#D8A735" strokeWidth="1.5" />
      <path
        d="M18 26v3"
        stroke="#D8A735"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
