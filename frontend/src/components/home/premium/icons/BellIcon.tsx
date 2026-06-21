export function BellIcon({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
      <path d="M18 4C18 4 10 8 10 18v6H8v2h20v-2h-2v-6C26 8 18 4 18 4Z" stroke="#D8A735" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M15 28a3 3 0 006 0" stroke="#D8A735" strokeWidth="1.5"/>
      <path d="M18 4V2" stroke="#D8A735" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
