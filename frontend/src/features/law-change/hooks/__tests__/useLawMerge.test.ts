import { describe, expect, it } from "vitest";
import { mergeLawWithChanges, type LawElement } from "../useLawMerge";
import type { ApprovedChange } from "@/types/law-change.types";

const makeEl = (id: string, text = "text", sortOrder = 0): LawElement => ({
  _id: id,
  parent_element_id: null,
  sort_order: sortOrder,
  text,
  element_type: "clause",
});

const makeChange = (
  overrides: Partial<ApprovedChange> & { change_type: ApprovedChange["change_type"] },
): ApprovedChange => ({
  _id: "c1",
  law_id: "law1",
  element_id: null,
  winning_proposal_id: "p1",
  element_type: "clause",
  new_text: null,
  move_after_element_id: null,
  votes_for_weighted: 1,
  iteration: 1,
  supersedes_id: null,
  is_current: true,
  status: "active",
  parent_element_id: null,
  sort_order: 1,
  approved_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

describe("mergeLawWithChanges", () => {
  it("returns elements unchanged when no approved changes", () => {
    const el1 = makeEl("1", "a");
    const el2 = makeEl("2", "b");
    expect(mergeLawWithChanges([el1, el2], [])).toEqual([el1, el2]);
  });

  it("applies edit: replaces element text", () => {
    const el1 = makeEl("1", "old");
    const change = makeChange({ change_type: "edit", element_id: "1", new_text: "new" });
    const result = mergeLawWithChanges([el1], [change]);
    expect(result[0].text).toBe("new");
  });

  it("applies delete: removes element", () => {
    const el1 = makeEl("1");
    const el2 = makeEl("2");
    const change = makeChange({ change_type: "delete", element_id: "1" });
    const result = mergeLawWithChanges([el1, el2], [change]);
    expect(result).toHaveLength(1);
    expect(result[0]._id).toBe("2");
  });

  it("applies add: inserts element after move_after_element_id", () => {
    const el1 = makeEl("1");
    const el2 = makeEl("2");
    const change = makeChange({
      change_type: "add",
      move_after_element_id: "1",
      new_text: "added",
      sort_order: 1.5,
    });
    const result = mergeLawWithChanges([el1, el2], [change]);
    expect(result).toHaveLength(3);
    expect(result[0]._id).toBe("1");
    expect(result[1].text).toBe("added");
    expect(result[2]._id).toBe("2");
  });

  it("applies add: appends to end if no move_after_element_id", () => {
    const el1 = makeEl("1");
    const change = makeChange({
      change_type: "add",
      move_after_element_id: null,
      new_text: "appended",
    });
    const result = mergeLawWithChanges([el1], [change]);
    expect(result).toHaveLength(2);
    expect(result[1].text).toBe("appended");
  });

  it("applies move: relocates element", () => {
    const el1 = makeEl("1");
    const el2 = makeEl("2");
    const el3 = makeEl("3");
    const change = makeChange({
      change_type: "move",
      element_id: "3",
      move_after_element_id: "1",
    });
    const result = mergeLawWithChanges([el1, el2, el3], [change]);
    expect(result.map((e) => e._id)).toEqual(["1", "3", "2"]);
  });

  it("skips non-current changes", () => {
    const el1 = makeEl("1", "original");
    const change = makeChange({ change_type: "edit", element_id: "1", new_text: "new", is_current: false });
    const result = mergeLawWithChanges([el1], [change]);
    expect(result[0].text).toBe("original");
  });

  it("skips archived changes", () => {
    const el1 = makeEl("1", "original");
    const change = makeChange({ change_type: "edit", element_id: "1", new_text: "new", status: "archived" });
    const result = mergeLawWithChanges([el1], [change]);
    expect(result[0].text).toBe("original");
  });

  it("applies multiple changes in sort_order sequence", () => {
    const el1 = makeEl("1", "old");
    const el2 = makeEl("2");
    const edit = makeChange({ _id: "c1", change_type: "edit", element_id: "1", new_text: "new", sort_order: 1 });
    const del = makeChange({ _id: "c2", change_type: "delete", element_id: "2", sort_order: 2 });
    const result = mergeLawWithChanges([el1, el2], [del, edit]); // intentionally out of order
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("new");
  });
});
