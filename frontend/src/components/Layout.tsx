import type { ReactNode } from "react";

export function Layout({
  children,
  fullHeight = false,
}: {
  children: ReactNode;
  fullHeight?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: fullHeight ? "calc(100vh - 164px)" : undefined,
      }}
    >
      {children}
    </div>
  );
}
