export function ShieldCheckIcon({
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
      <path
        d="M18 3L6 8v9c0 8.284 5.373 15.502 12 18C24.627 32.502 30 25.284 30 17V8L18 3Z"
        stroke="#D8A735"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M13 18l3.5 3.5L23 14"
        stroke="#D8A735"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
