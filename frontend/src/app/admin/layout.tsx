import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminQueryProvider } from "@/admin/query/AdminQueryProvider";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminQueryProvider>
      <AdminShell>{children}</AdminShell>
    </AdminQueryProvider>
  );
}
