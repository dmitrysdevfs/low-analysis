"use client";

import { type TreeBranch } from "@/lib/tree";
import { SectionBlock } from "./LawStructureListSection";
import { AnimatePresence, motion } from "framer-motion";
import type { Subject } from "@/types";

export function LawStructureList({
  sections,
  lawId,
  lawTitle,
  highlightSubjectId,
  subjectsMap,
}: {
  sections: TreeBranch[];
  lawId: string;
  lawTitle?: string;
  highlightSubjectId?: string | null;
  subjectsMap?: Map<string, Subject>;
}) {
  const sectionsToRender = sections.filter((section) =>
    section.children.length > 0,
  );

  return (
    <motion.div layout className="law-structure-list">
      <AnimatePresence mode="popLayout">
        {sectionsToRender.map((section, index) => (
          <SectionBlock
            key={section.key}
            section={section}
            lawId={lawId}
            lawTitle={lawTitle}
            index={index}
            highlightSubjectId={highlightSubjectId}
            subjectsMap={subjectsMap}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
