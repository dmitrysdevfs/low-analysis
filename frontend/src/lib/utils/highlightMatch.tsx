import type { ReactNode } from "react";

export function highlightMatch(
  text: string,
  terms: string[],
  color = "#c8a843",
): ReactNode {
  const validTerms = terms.filter((t) => t.trim().length > 0);
  if (validTerms.length === 0) return text;

  const escaped = validTerms.map((t) =>
    t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  // Без `g` флагу для тесту — щоб уникнути stateful lastIndex при повторних .test() викликах
  const splitRegex = new RegExp(`(${escaped.join("|")})`, "gi");
  const matchRegex = new RegExp(`^(${escaped.join("|")})$`, "i");
  const parts = text.split(splitRegex);

  return parts.map((part, i) =>
    matchRegex.test(part) ? (
      <mark
        key={`mark-${i}-${part.slice(0, 8)}`}
        style={{
          background: `${color}38`,
          color,
          borderRadius: "2px",
          padding: "0 2px",
          fontWeight: 600,
        }}
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}
