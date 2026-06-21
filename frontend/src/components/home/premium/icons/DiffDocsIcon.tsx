export function DiffDocsIcon({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
      <rect x="4" y="6" width="18" height="24" rx="2" stroke="#D8A735" strokeWidth="1.5"/>
      <path d="M14 6h8a2 2 0 012 2v20a2 2 0 01-2 2H14" stroke="#D8A735" strokeWidth="1.5"/>
      <path d="M8 12h10M8 17h10M8 22h6" stroke="#D8A735" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M28 10v16" stroke="#D8A735" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
    </svg>
  );
}
