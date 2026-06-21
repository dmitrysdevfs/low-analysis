export function ScalesIcon({ size = 64, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      {/* Center pole */}
      <line x1="32" y1="8" x2="32" y2="54" stroke="#D8A735" strokeWidth="2" strokeLinecap="round"/>
      {/* Top crossbar */}
      <line x1="10" y1="16" x2="54" y2="16" stroke="#D8A735" strokeWidth="2" strokeLinecap="round"/>
      {/* Center fulcrum diamond */}
      <rect x="29" y="5" width="6" height="6" rx="1" transform="rotate(45 32 8)" stroke="#D8A735" strokeWidth="1.5"/>
      {/* Left chain */}
      <line x1="10" y1="16" x2="10" y2="32" stroke="#D8A735" strokeWidth="1.5" strokeDasharray="2 2"/>
      {/* Right chain */}
      <line x1="54" y1="16" x2="54" y2="32" stroke="#D8A735" strokeWidth="1.5" strokeDasharray="2 2"/>
      {/* Left bowl */}
      <path d="M4 32 Q10 42 16 32" stroke="#D8A735" strokeWidth="2" strokeLinecap="round"/>
      <line x1="4" y1="32" x2="16" y2="32" stroke="#D8A735" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Right bowl (slightly lower - balanced feel) */}
      <path d="M48 33 Q54 43 60 33" stroke="#D8A735" strokeWidth="2" strokeLinecap="round"/>
      <line x1="48" y1="33" x2="60" y2="33" stroke="#D8A735" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Base */}
      <path d="M24 54h16" stroke="#D8A735" strokeWidth="2" strokeLinecap="round"/>
      <path d="M28 54l-4 4h16l-4-4" stroke="#D8A735" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}
