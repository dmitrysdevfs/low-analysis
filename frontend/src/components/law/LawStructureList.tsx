"use client";

import { type TreeBranch } from "@/lib/tree";
import { SectionBlock } from "./LawStructureListSection";
import { AnimatePresence, motion } from "framer-motion";

export function LawStructureList({
  sections,
  lawId,
  highlightSubjectId,
}: {
  sections: TreeBranch[];
  lawId: string;
  highlightSubjectId?: string | null;
}) {
  const sectionsWithArticles = sections.filter((section) =>
    section.children.some((node) => node.type === "article"),
  );

  return (
    <motion.div layout className="law-structure-list">
      <AnimatePresence mode="popLayout">
        {sectionsWithArticles.map((section, index) => (
          <SectionBlock
            key={section.key}
            section={section}
            lawId={lawId}
            index={index}
            highlightSubjectId={highlightSubjectId}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
