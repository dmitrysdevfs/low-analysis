"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TreeNode as TreeNodeModel } from "@/types";

interface Props {
  node: TreeNodeModel;
  children?: TreeNodeModel[];
  activeCode: string | null;
  onSelect: (node: TreeNodeModel) => void;
}

export function TreeNode({ node, children = [], activeCode, onSelect }: Props) {
  const [open, setOpen] = useState(true);

  if (node.type === "section") {
    return (
      <div>
        <button
          onClick={() => setOpen((value) => !value)}
          style={{
            width: "100%",
            textAlign: "left",
            background: "transparent",
            border: "none",
            borderBottom: "1px solid #1C3260",
            cursor: "pointer",
            padding: "12px 14px",
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <motion.span
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="mono"
            style={{ fontSize: "0.62rem", color: "#C8A843" }}
          >
            ▶
          </motion.span>
          <span
            className="display"
            style={{ fontSize: "1rem", color: "#C8A843" }}
          >
            {node.title}
          </span>
        </button>

        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: "hidden" }}
            >
              {children.map((child) => (
                <LeafNode
                  key={child.code}
                  node={child}
                  activeCode={activeCode}
                  onSelect={onSelect}
                />
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }

  return <LeafNode node={node} activeCode={activeCode} onSelect={onSelect} />;
}

function LeafNode({
  node,
  activeCode,
  onSelect,
}: {
  node: TreeNodeModel;
  activeCode: string | null;
  onSelect: (node: TreeNodeModel) => void;
}) {
  const isActive = activeCode === node.code;

  return (
    <button
      onClick={() => onSelect(node)}
      style={{
        width: "100%",
        textAlign: "left",
        background: isActive ? "rgba(74,128,212,0.14)" : "transparent",
        border: "none",
        borderLeft: isActive ? "2px solid #4A80D4" : "2px solid transparent",
        padding: "10px 14px 10px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        cursor: "pointer",
      }}
    >
      <span className="mono" style={{ fontSize: "0.62rem", color: "#4A80D4" }}>
        {node.code}
      </span>
      <span
        style={{ fontSize: "0.82rem", color: isActive ? "#FFFFFF" : "#A8BEDD" }}
      >
        {node.title ?? node.text ?? node.code}
      </span>
    </button>
  );
}
