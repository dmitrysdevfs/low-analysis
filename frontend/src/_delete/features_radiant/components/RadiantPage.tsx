"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { useWebGLSupport } from "../hooks/useWebGLSupport";
import { useRadiantData } from "../hooks/useRadiantData";
import { RadiantFallback } from "./fallback/RadiantFallback";
import { RadiantCanvas } from "./RadiantCanvas";
import { RadiantHUD } from "./RadiantHUD";
import { RadiantNodePanel } from "./RadiantNodePanel";
import styles from "./RadiantPage.module.scss";

export function RadiantPage() {
  const router = useRouter();
  const webglSupported = useWebGLSupport();
  const resetCameraRef = useRef<(() => void) | null>(null);

  const {
    graph,
    isLoading,
    error,
    totalLaws,
    selectedNode,
    setSelectedNode,
    searchQuery,
    setSearchQuery,
    highlightedIds,
  } = useRadiantData();

  if (webglSupported === false) {
    return <RadiantFallback />;
  }

  if (webglSupported === null || isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingDots}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
        <p className={styles.loadingText}>
          Завантаження законодавчого всесвіту...
        </p>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.loading}>
        <p className={styles.loadingText} style={{ color: "#e05252" }}>
          Помилка завантаження: {error}
        </p>
      </div>
    );
  }

  if (!graph) return null;

  return (
    <div className={styles.page}>
      <RadiantCanvas
        graph={graph}
        highlightedIds={highlightedIds}
        selectedNodeId={selectedNode?.id ?? null}
        onNodeClick={(node) => setSelectedNode(node)}
        onResetCamera={(fn) => {
          resetCameraRef.current = fn;
        }}
      />
      <RadiantHUD
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalLaws={totalLaws}
        totalLinks={graph.links.length}
        onResetCamera={() => resetCameraRef.current?.()}
        onBack={() => router.back()}
      />
      <RadiantNodePanel
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        onNavigate={(id) => router.push(ROUTES.law(id))}
      />
    </div>
  );
}
