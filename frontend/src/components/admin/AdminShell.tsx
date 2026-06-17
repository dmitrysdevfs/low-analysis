"use client";

import { type ReactNode, useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROUTES } from "@/constants/routes";
import { AdminSidebarNav } from "@/admin/layout/AdminSidebarNav";
import { AdminTopbar } from "@/admin/layout/AdminTopbar";
import { AdminWorkspaceProvider } from "./AdminWorkspaceContext";
import styles from "./AdminShell.module.scss";

type AdminContentMode = "default" | "expanded" | "full";

function matchesRoutePrefix(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function isNestedRoute(pathname: string, route: string) {
  return pathname.startsWith(`${route}/`);
}

function getAdminContentMode(
  pathname: string,
  sidebarCollapsed: boolean,
): AdminContentMode {
  const isWideCanvasRoute =
    matchesRoutePrefix(pathname, ROUTES.adminProjectPage) ||
    matchesRoutePrefix(pathname, ROUTES.adminApiCenter);

  if (isWideCanvasRoute) {
    return "full";
  }

  const isConstrainedRoute =
    matchesRoutePrefix(pathname, ROUTES.adminArchitecture) ||
    matchesRoutePrefix(pathname, ROUTES.adminHelp) ||
    matchesRoutePrefix(pathname, ROUTES.adminEmailSettings);

  if (sidebarCollapsed && !isConstrainedRoute) {
    return "expanded";
  }

  return "default";
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const contentMode = getAdminContentMode(pathname, sidebarCollapsed);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((value) => !value);
  }, []);

  return (
    <AdminWorkspaceProvider>
      <div
        className={styles.shell}
        data-refresh-key={refreshKey}
        data-sidebar-collapsed={sidebarCollapsed ? "true" : "false"}
      >
        <AdminSidebarNav
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          userDisplayName={user?.displayName}
        />
        <div className={styles.contentArea}>
          <AdminTopbar
            userDisplayName={user?.displayName}
            userEmail={user?.email}
            onRefresh={handleRefresh}
          />
          <main
            className={`${styles.main} ${
              contentMode === "expanded" ? styles.mainExpanded : ""
            } ${contentMode === "full" ? styles.mainWide : ""}`}
            data-content-mode={contentMode}
          >
            {children}
          </main>
        </div>
      </div>
    </AdminWorkspaceProvider>
  );
}
