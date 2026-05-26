import { SkeletonCard } from "@/components/ui/SkeletonCard";

export default function SearchResultsLoading() {
  return (
    <div style={{ padding: "2rem" }}>
      <div
        style={{
          height: "1.5rem",
          width: "30%",
          background: "var(--color-surface-2, #1a2a4a)",
          borderRadius: "4px",
          marginBottom: "1.5rem",
        }}
      />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
