"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./SelectionTooltip.module.scss";

interface SelectionTooltipProps {
  containerRef: React.RefObject<HTMLElement | null>;
  lawId: string;
  lawTitle: string;
  articleNum: string;
  articleTitle: string;
  onRequestNote: (draft: import("@/lib/notes/types").NoteDraft) => void;
}

interface TooltipState {
  visible: boolean;
  position: { top: number; left: number } | null;
  selectedText: string;
}

export default function SelectionTooltip({
  containerRef,
  lawId,
  lawTitle,
  articleNum,
  articleTitle,
  onRequestNote,
}: SelectionTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<TooltipState>({
    visible: false,
    position: null,
    selectedText: "",
  });

  useEffect(() => {
    function handleMouseUp(e: MouseEvent) {
      const selection = window.getSelection();
      const text = selection?.toString().trim() ?? "";

      if (!text || !selection || !containerRef.current) {
        return;
      }

      const range = selection.getRangeAt(0);
      const isInsideContainer = containerRef.current.contains(
        range.commonAncestorContainer
      );

      if (!isInsideContainer) {
        return;
      }

      // Position near the mouse cursor, not the selection rect top
      // This handles large selections correctly
      const tooltipHeight = 44;
      const mouseY = e.clientY;
      const mouseX = e.clientX;
      const top = mouseY > tooltipHeight + 8
        ? mouseY - tooltipHeight - 8
        : mouseY + 16;
      const left = Math.min(Math.max(mouseX, 80), window.innerWidth - 80);

      setState({
        visible: true,
        position: { top, left },
        selectedText: text,
      });
    }

    function handleMouseDown(e: MouseEvent) {
      if (tooltipRef.current && tooltipRef.current.contains(e.target as Node)) {
        return;
      }
      setState((prev) => ({ ...prev, visible: false }));
    }

    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, [containerRef]);

  function handleTooltipClick() {
    onRequestNote({
      type: "selection",
      color: "gold",
      noteText: "",
      selectedText: state.selectedText.slice(0, 500),
      pageUrl: window.location.pathname,
      pageTitle: document.title,
      lawId,
      lawTitle,
      articleNum,
      articleTitle,
    });

    setState({ visible: false, position: null, selectedText: "" });
    window.getSelection()?.removeAllRanges();
  }

  return (
    <AnimatePresence>
      {state.visible && state.position && (
        <motion.div
          ref={tooltipRef}
          className={styles.tooltip}
          style={{
            top: state.position.top,
            left: state.position.left,
          }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={handleTooltipClick}
        >
          <span className={styles.icon}>📝</span>
          Зберегти в нотатки
        </motion.div>
      )}
    </AnimatePresence>
  );
}
