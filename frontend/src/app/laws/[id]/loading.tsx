export default function LawLoading() {
  return (
    <div style={{ padding: "2rem" }}>
      <div
        style={{
          height: "2rem",
          width: "60%",
          background: "var(--color-surface-2, #1a2a4a)",
          borderRadius: "4px",
          marginBottom: "1rem",
        }}
      />
      <div
        style={{
          height: "1rem",
          width: "40%",
          background: "var(--color-surface-2, #1a2a4a)",
          borderRadius: "4px",
          marginBottom: "2rem",
        }}
      />
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: "3rem",
            background: "var(--color-surface-2, #1a2a4a)",
            borderRadius: "4px",
            marginBottom: "0.5rem",
            opacity: 1 - i * 0.12,
          }}
        />
      ))}
    </div>
  );
}
