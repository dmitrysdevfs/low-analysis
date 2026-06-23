"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="uk">
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "2rem",
            textAlign: "center",
            fontFamily: "sans-serif",
          }}
        >
          <h2 style={{ marginBottom: "1rem" }}>Щось пішло не так</h2>
          <button
            onClick={reset}
            style={{
              padding: "0.5rem 1.5rem",
              cursor: "pointer",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          >
            Спробувати знову
          </button>
        </div>
      </body>
    </html>
  );
}
