"use client";

import { type ReactNode, useCallback, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AdminSidebarNav } from "@/admin/layout/AdminSidebarNav";
import { AdminTopbar } from "@/admin/layout/AdminTopbar";
import styles from "./AdminShell.module.scss";

export function AdminShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

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
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
