export function LaurelIcon({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <path d="M8 20C8 13.373 13.373 8 20 8" stroke="#D8A735" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M32 20C32 13.373 26.627 8 20 8" stroke="#D8A735" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6 24C6 24 8 20 12 20C12 20 10 24 8 26C8 26 6 26 6 24Z" stroke="#D8A735" strokeWidth="1.2" fill="rgba(216,167,53,0.08)"/>
      <path d="M34 24C34 24 32 20 28 20C28 20 30 24 32 26C32 26 34 26 34 24Z" stroke="#D8A735" strokeWidth="1.2" fill="rgba(216,167,53,0.08)"/>
      <path d="M4 28C4 28 7 24 10 25C10 25 8 29 6 30C6 30 3 30 4 28Z" stroke="#D8A735" strokeWidth="1.2" fill="rgba(216,167,53,0.08)"/>
      <path d="M36 28C36 28 33 24 30 25C30 25 32 29 34 30C34 30 37 30 36 28Z" stroke="#D8A735" strokeWidth="1.2" fill="rgba(216,167,53,0.08)"/>
      <path d="M18 34h4" stroke="#D8A735" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
