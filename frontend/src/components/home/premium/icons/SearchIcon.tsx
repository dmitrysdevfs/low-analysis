export function SearchIcon({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="9" stroke="#D8A735" strokeWidth="1.5"/>
      <path d="M23 23L30 30" stroke="#D8A735" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
