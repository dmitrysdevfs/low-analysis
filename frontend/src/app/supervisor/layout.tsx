import type { ReactNode } from "react";
import { SupervisorMobileNav } from "@/components/supervisor/SupervisorMobileNav";

export default function SupervisorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      {children}
      <SupervisorMobileNav />
    </>
  );
}
