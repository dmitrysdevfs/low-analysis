"use client";

import { type ReactNode, useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROUTES } from "@/constants/routes";
import { AdminSidebarNav } from "@/admin/layout/AdminSidebarNav";
import { AdminTopbar } from "@/admin/layout/AdminTopbar";
import styles from "./AdminShell.module.scss";

export function AdminShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [refreshKey, setRefreshKey] = useState(0);
  const isWideCanvasRoute =
    pathname.startsWith(ROUTES.adminProjectPage) ||
    pathname.startsWith(ROUTES.adminApiCenter);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className={styles.shell} data-refresh-key={refreshKey}>
      <AdminSidebarNav userDisplayName={user?.displayName} />
      <div className={styles.contentArea}>
        <AdminTopbar
          userDisplayName={user?.displayName}
          userEmail={user?.email}
          onRefresh={handleRefresh}
        />
        <main
          className={`${styles.main} ${isWideCanvasRoute ? styles.mainWide : ""}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
