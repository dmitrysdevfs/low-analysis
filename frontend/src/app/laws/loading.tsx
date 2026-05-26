import { SkeletonCard } from "@/components/ui/SkeletonCard";

export default function LawsLoading() {
  return (
    <div style={{ padding: "2rem" }}>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
