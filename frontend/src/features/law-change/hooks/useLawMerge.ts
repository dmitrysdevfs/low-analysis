// Pure utility — no hooks, no "use client"
import type { ApprovedChange, LawChangeType } from "@/types/law-change.types";

export interface LawElement {
  _id: string;
  parent_element_id: string | null;
  sort_order: number;
  text: string;
  element_type: string;
  [key: string]: unknown;
}

export function mergeLawWithChanges(
  elements: LawElement[],
  approvedChanges: ApprovedChange[],
): LawElement[] {
  // Only apply current active changes, sorted by sort_order
  const active = [...approvedChanges]
    .filter((c) => c.is_current && c.status === "active")
    .sort((a, b) => a.sort_order - b.sort_order);

  let result = [...elements];

  for (const change of active) {
    result = applyChange(result, change);
  }

  return result;
}

function applyChange(
  elements: LawElement[],
  change: ApprovedChange,
): LawElement[] {
  const { change_type } = change;

  if (change_type === "edit") {
    return elements.map((el) =>
      el._id === change.element_id
        ? { ...el, text: change.new_text ?? el.text }
        : el,
    );
  }

  if (change_type === "delete") {
    return elements.filter((el) => el._id !== change.element_id);
  }

  if (change_type === "add") {
    const newEl: LawElement = {
      _id: `approved-${change._id}`,
      parent_element_id: change.parent_element_id,
      sort_order: change.sort_order,
      text: change.new_text ?? "",
      element_type: change.element_type ?? "clause",
    };

    if (change.move_after_element_id) {
      const idx = elements.findIndex(
        (el) => el._id === change.move_after_element_id,
      );
      if (idx !== -1) {
        const next = [...elements];
        next.splice(idx + 1, 0, newEl);
        return next;
      }
    }

    return [...elements, newEl];
  }

  if (change_type === "move") {
    const moved = elements.find((el) => el._id === change.element_id);
    if (!moved) return elements;

    const without = elements.filter((el) => el._id !== change.element_id);
    const afterIdx = without.findIndex(
      (el) => el._id === change.move_after_element_id,
    );

    if (afterIdx !== -1) {
      const next = [...without];
      next.splice(afterIdx + 1, 0, moved);
      return next;
    }

    return [...without, moved];
  }

  return elements;
}
