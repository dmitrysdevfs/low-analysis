"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";
import styles from "./Dialog.module.scss";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: ReactNode;
  title?: string;
  description?: string;
  children: ReactNode;
  maxWidth?: number;
}

export function Dialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  maxWidth = 640,
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>}

      <AnimatePresence>
        {open && (
          <RadixDialog.Portal forceMount>
            <RadixDialog.Overlay asChild>
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={styles.overlay}
              />
            </RadixDialog.Overlay>

            <RadixDialog.Content asChild>
              <motion.div
                key="content"
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                className={styles.content}
                style={{ width: `min(${maxWidth}px, calc(100vw - 32px))` }}
              >
                <div
                  className={`${styles.header} ${title || description ? styles.headerHasTitle : ""}`}
                >
                  <div>
                    {title && (
                      <RadixDialog.Title className={`display ${styles.title}`}>
                        {title}
                      </RadixDialog.Title>
                    )}
                    {description && (
                      <RadixDialog.Description className={styles.description}>
                        {description}
                      </RadixDialog.Description>
                    )}
                  </div>

                  <RadixDialog.Close
                    className={styles.closeBtn}
                    aria-label="Закрити"
                  >
                    ✕
                  </RadixDialog.Close>
                </div>

                {children}
              </motion.div>
            </RadixDialog.Content>
          </RadixDialog.Portal>
        )}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}
