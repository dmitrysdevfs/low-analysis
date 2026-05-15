"use client";

export function BurgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {open ? (
        <>
          <line
            x1="4"
            y1="4"
            x2="16"
            y2="16"
            stroke="#C8A843"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <line
            x1="16"
            y1="4"
            x2="4"
            y2="16"
            stroke="#C8A843"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <line
            x1="3"
            y1="5"
            x2="17"
            y2="5"
            stroke="#C8A843"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <line
            x1="3"
            y1="10"
            x2="17"
            y2="10"
            stroke="#C8A843"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <line
            x1="3"
            y1="15"
            x2="17"
            y2="15"
            stroke="#C8A843"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
