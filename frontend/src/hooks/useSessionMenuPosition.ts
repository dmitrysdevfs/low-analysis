import { useEffect, useRef, useState } from "react";

interface MenuPosition {
  top: number;
  right: number;
}

/**
 * Tracks the position of a dropdown menu relative to a trigger button,
 * updating on scroll and resize. Returns refs for the header, trigger button,
 * and menu container, plus the computed position object.
 */
export function useSessionMenuPosition(open: boolean) {
  const headerRef = useRef<HTMLElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<MenuPosition | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function updatePosition() {
      if (!buttonRef.current || !headerRef.current) {
        return;
      }

      const buttonRect = buttonRef.current.getBoundingClientRect();
      const headerRect = headerRef.current.getBoundingClientRect();

      setPosition({
        top: headerRect.bottom + 10,
        right: Math.max(16, window.innerWidth - buttonRect.right),
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setPosition(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPosition(null);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return { headerRef, buttonRef, menuRef, position };
}
