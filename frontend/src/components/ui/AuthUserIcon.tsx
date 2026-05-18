interface AuthUserIconProps {
  size?: number;
  className?: string;
}

export function AuthUserIcon({ size = 20, className }: AuthUserIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 12.75C14.8995 12.75 17.25 10.3995 17.25 7.5C17.25 4.6005 14.8995 2.25 12 2.25C9.1005 2.25 6.75 4.6005 6.75 7.5C6.75 10.3995 9.1005 12.75 12 12.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M3.75 20.25C4.64119 16.9844 7.62471 14.75 11.0098 14.75H12.9902C16.3753 14.75 19.3588 16.9844 20.25 20.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M18.5 7.25L19.375 8.125L21.5 6"
        stroke="#C8A843"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
