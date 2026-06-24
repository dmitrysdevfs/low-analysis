export function ExpertsIcon({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="20" cy="13" r="5" stroke="#D8A735" strokeWidth="1.5" />
      <path
        d="M10 32C10 26.477 14.477 22 20 22C25.523 22 30 26.477 30 32"
        stroke="#D8A735"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="8" cy="14" r="3.5" stroke="#D8A735" strokeWidth="1.2" />
      <path
        d="M2 30c0-3.866 2.686-7 6-7"
        stroke="#D8A735"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="32" cy="14" r="3.5" stroke="#D8A735" strokeWidth="1.2" />
      <path
        d="M38 30c0-3.866-2.686-7-6-7"
        stroke="#D8A735"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
