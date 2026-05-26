export default function AnalysisLoading() {
  return (
    <div style={{ padding: "2rem" }}>
      <div
        style={{
          height: "3rem",
          width: "50%",
          background: "var(--color-surface-2, #1a2a4a)",
          borderRadius: "4px",
          marginBottom: "1.5rem",
        }}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: "6rem",
              background: "var(--color-surface-2, #1a2a4a)",
              borderRadius: "6px",
            }}
          />
        ))}
      </div>
      <div
        style={{
          height: "16rem",
          background: "var(--color-surface-2, #1a2a4a)",
          borderRadius: "6px",
        }}
      />
    </div>
  );
}
