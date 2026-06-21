export function AnalyticsBarsIcon({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
      <path d="M4 28h28" stroke="#D8A735" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="7" y="18" width="5" height="10" rx="1" stroke="#D8A735" strokeWidth="1.5"/>
      <rect x="15.5" y="10" width="5" height="18" rx="1" stroke="#D8A735" strokeWidth="1.5"/>
      <rect x="24" y="14" width="5" height="14" rx="1" stroke="#D8A735" strokeWidth="1.5"/>
    </svg>
  );
}
