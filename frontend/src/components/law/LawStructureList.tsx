"use client";

import { type TreeBranch } from "@/lib/lawTree";
import { SectionBlock } from "./LawStructureListSection";

export function LawStructureList({
  sections,
  lawId,
}: {
  sections: TreeBranch[];
  lawId: string;
}) {
  const sectionsWithArticles = sections.filter((section) =>
    section.children.some((node) => node.type === "article"),
  );

  return (
    <div className="law-structure-list">
      {sectionsWithArticles.map((section, index) => (
        <SectionBlock
          key={section.key}
          section={section}
          lawId={lawId}
          index={index}
        />
      ))}
    </div>
  );
}
