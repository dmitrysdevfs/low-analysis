"use client";

import { toast, type ToastOptions } from "react-toastify";

const base: ToastOptions = {
  position: "bottom-right",
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: false,
  style: {
    background: "#0d1c3a",
    border: "1px solid #1c3260",
    borderRadius: "10px",
    color: "#d6e0f0",
    fontFamily: "var(--font-mono)",
    fontSize: "0.82rem",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    padding: "12px 16px",
  },
};

export const notify = {
  success: (msg: string) =>
    toast.success(msg, {
      ...base,
      progressStyle: { background: "#c8a843" },
    }),
  error: (msg: string) =>
    toast.error(msg, {
      ...base,
      autoClose: 6000,
      progressStyle: { background: "#c85a5a" },
    }),
  warning: (msg: string) =>
    toast.warning(msg, {
      ...base,
      progressStyle: { background: "#c8a843" },
    }),
  info: (msg: string) =>
    toast.info(msg, {
      ...base,
      progressStyle: { background: "#4a80d4" },
    }),
};
