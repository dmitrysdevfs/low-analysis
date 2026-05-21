interface IconArrowProps {
  size?: number;
  className?: string;
}

export function IconArrow({ size = 14, className }: IconArrowProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  );
}
