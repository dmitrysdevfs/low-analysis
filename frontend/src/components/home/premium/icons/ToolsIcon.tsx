export function ToolsIcon({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
      <path d="M22 8C24.8 8 27.2 9.6 28.4 12L25 15.4L26.6 17L30 13.6C30.6 15 30.8 16.6 30.4 18.2C29.6 21.2 26.8 23.4 23.6 23.4C22.4 23.4 21.2 23 20.2 22.4L10.6 32C9.8 32.8 8.6 33 7.6 32.4C6.4 31.8 6 30.4 6.6 29.2C6.8 28.8 7.2 28.4 7.6 28L17.2 18.4C16.4 17.2 16 15.8 16 14.2C16 10.8 18.2 7.8 21.4 7C21.6 7 21.8 7 22 7V8Z" stroke="#D8A735" strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="9" cy="9" r="4" stroke="#D8A735" strokeWidth="1.5"/>
    </svg>
  );
}
