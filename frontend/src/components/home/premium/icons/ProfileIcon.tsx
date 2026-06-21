export function ProfileIcon({
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
      <circle cx="18" cy="12" r="6" stroke="#D8A735" strokeWidth="1.5" />
      <path
        d="M6 30C6 24.477 11.373 20 18 20C24.627 20 30 24.477 30 30"
        stroke="#D8A735"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
