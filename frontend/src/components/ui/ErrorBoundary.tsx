"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || "Невідома помилка" };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          role="alert"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "40vh",
            gap: "16px",
            padding: "32px",
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontSize: "2.5rem",
              color: "#c85a5a",
              fontFamily: "var(--font-mono)",
            }}
          >
            !
          </span>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.9rem",
              color: "#7a98c0",
              maxWidth: "480px",
            }}
          >
            {this.state.message}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              background: "transparent",
              border: "1px solid #1c3260",
              borderRadius: "8px",
              color: "#d6e0f0",
              fontFamily: "var(--font-mono)",
              fontSize: "0.82rem",
              padding: "8px 20px",
              cursor: "pointer",
            }}
          >
            Спробувати знову
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
