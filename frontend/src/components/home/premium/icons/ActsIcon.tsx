export function ActsIcon({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <rect x="8" y="4" width="20" height="28" rx="2" stroke="#D8A735" strokeWidth="1.5"/>
      <rect x="12" y="8" width="20" height="28" rx="2" stroke="#D8A735" strokeWidth="1.2" strokeDasharray="1 0"/>
      <path d="M12 12h12M12 17h12M12 22h8" stroke="#D8A735" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}
