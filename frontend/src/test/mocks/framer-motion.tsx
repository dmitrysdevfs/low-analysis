import React from "react";

const MOTION_PROP_NAMES = new Set([
  "animate",
  "initial",
  "exit",
  "transition",
  "whileHover",
  "whileTap",
  "whileFocus",
  "whileInView",
  "variants",
  "layout",
  "layoutId",
  "drag",
  "dragConstraints",
  "dragElastic",
]);

function filterMotionProps(props: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(props).filter(([key]) => !MOTION_PROP_NAMES.has(key)),
  );
}

function createMotionComponent(tag: string) {
  const MotionComponent = React.forwardRef<
    HTMLElement,
    Record<string, unknown> & { children?: React.ReactNode }
  >(({ children, ...props }, ref) =>
    React.createElement(
      tag,
      { ref, ...filterMotionProps(props) },
      children as React.ReactNode,
    ),
  );

  MotionComponent.displayName = `MockMotion(${tag})`;

  return MotionComponent;
}

export const motion = new Proxy(
  {},
  {
    get(_target, tag: string) {
      return createMotionComponent(tag);
    },
  },
) as Record<string, React.ComponentType<Record<string, unknown>>>;

export function AnimatePresence({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useInView() {
  return true;
}

export function useMotionValue(initial = 0) {
  let current = initial;

  return {
    get: () => current,
    set: (value: number) => {
      current = value;
    },
  };
}

export function useSpring(value: unknown) {
  if (typeof value === "object" && value && "get" in value) {
    return (value as { get: () => unknown }).get();
  }

  return value;
}

export function useTransform() {
  return 0;
}
