export const LAW_CLUSTERS: Record<string, string> = {
  кодекс: "Кодекс",
  кримінальний: "Кримінальний",
  цивільний: "Цивільний",
  адміністративний: "Адміністративний",
  трудовий: "Трудовий",
  господарський: "Господарський",
  земельний: "Земельний",
  сімейний: "Сімейний",
  податковий: "Податковий",
  конституція: "Конституція",
  other: "Інші",
  закон: "Закони",
};

// 12-color vibrant palette — used as fallback when no keyword matches
const HASH_PALETTE = [
  "#c8a843", // gold
  "#e05252", // red
  "#4a80d4", // blue
  "#52b788", // green
  "#e91e9a", // pink
  "#f4a261", // orange
  "#8bc34a", // lime
  "#ff9800", // amber
  "#7c4dff", // violet
  "#00bcd4", // cyan
  "#ff5722", // deep-orange
  "#26c6da", // teal
];

function hashColor(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return HASH_PALETTE[h % HASH_PALETTE.length];
}

// Detects law category from title (works regardless of documentType value)
function detectFromTitle(title: string): string | null {
  const t = title.toLowerCase();
  if (t.includes("конституц")) return "#c8a843";
  if (t.includes("кримінальн")) return "#e05252";
  if (t.includes("цивільн")) return "#4a80d4";
  if (t.includes("сімейн")) return "#e91e9a";
  if (t.includes("трудов")) return "#52b788";
  if (t.includes("господарськ")) return "#f4a261";
  if (t.includes("земельн")) return "#8bc34a";
  if (t.includes("податков")) return "#ff9800";
  if (t.includes("адміністратив")) return "#7a98c0";
  if (t.includes("кодекс") || t.includes("кодек")) return "#00bcd4";
  return null;
}

// Primary entry: tries title keywords first, falls back to hash palette
export function getLawColor(lawTypeOrTitle: string, id?: string): string {
  const fromTitle = detectFromTitle(lawTypeOrTitle);
  if (fromTitle) return fromTitle;
  // Hash by id for stable unique color per law
  return hashColor(id ?? lawTypeOrTitle);
}

export function getLawSize(totalArticles: number): number {
  if (totalArticles <= 0) return 6;
  if (totalArticles <= 10) return 6;
  if (totalArticles <= 50) return 8;
  if (totalArticles <= 200) return 12;
  if (totalArticles <= 500) return 16;
  return 22;
}

export function getLawCluster(documentType: string[]): string {
  const first = documentType[0] || "other";
  return first.toLowerCase();
}
