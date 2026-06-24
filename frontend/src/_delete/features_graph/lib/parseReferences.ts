export interface ParsedReference {
  fromArticle: string;
  toLawTitle: string;
  toLawId: string | null;
  type: string;
}

interface ArticleInput {
  text?: string;
  number?: string;
}

interface KnownLaw {
  _id: string;
  title: string;
}

const REFERENCE_PATTERNS = [
  /Закону\s+України\s+[«"](.*?)[»"]/gi,
  /(?:Цивільного|Кримінального|Господарського|Сімейного)\s+кодексу/gi,
  /відповідно до\s+(?:статті\s+\d+\s+)?(?:цього\s+)?(?:Закону|Кодексу)/gi,
];

function fuzzyMatchLaw(title: string, knownLaws: KnownLaw[]): string | null {
  const normalized = title.toLowerCase().trim();
  const match = knownLaws.find(
    (law) =>
      law.title.toLowerCase().includes(normalized) ||
      normalized.includes(law.title.toLowerCase()),
  );
  return match?._id ?? null;
}

export function parseClientReferences(
  articles: ArticleInput[],
  knownLaws: KnownLaw[],
): ParsedReference[] {
  const results: ParsedReference[] = [];

  for (const article of articles) {
    const text = article.text ?? "";
    const articleNum = article.number ?? "";

    for (const pattern of REFERENCE_PATTERNS) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = pattern.exec(text)) !== null) {
        const toLawTitle = match[1] ?? match[0];
        const toLawId = fuzzyMatchLaw(toLawTitle, knownLaws);

        results.push({
          fromArticle: articleNum,
          toLawTitle,
          toLawId,
          type: "reference",
        });
      }
    }
  }

  return results;
}
