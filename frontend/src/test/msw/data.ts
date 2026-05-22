import type {
  ArticleResponse,
  Law,
  LawStats,
  LawTreeResponse,
  Subject,
  SubjectElements,
  TreeNode,
} from "@/types";

export const mswLaws: Law[] = [
  {
    _id: "law-1",
    title: "КОНСТИТУЦІЯ УКРАЇНИ",
    code: "254к/96-вр",
    preamble: "Конституція України",
    signatory: "Верховна Рада України",
    status: "чинний",
    totalSections: 1,
    totalArticles: 3,
    totalParagraphs: 7,
    createdAt: "2026-05-20T10:00:00.000Z",
  },
  {
    _id: "law-2",
    title: "Про захист прав споживачів",
    code: "1023-12",
    preamble: "Закон України",
    signatory: "Верховна Рада України",
    status: "чинний",
    totalSections: 2,
    totalArticles: 4,
    totalParagraphs: 11,
    createdAt: "2026-05-19T10:00:00.000Z",
  },
  {
    _id: "law-3",
    title: "Про освіту",
    code: "2145-19",
    preamble: "Закон України",
    signatory: "Президент України",
    status: "чинний",
    totalSections: 3,
    totalArticles: 5,
    totalParagraphs: 13,
    createdAt: "2026-05-18T10:00:00.000Z",
  },
];

const law1Section: TreeNode = {
  _id: "section-1",
  lawId: "law-1",
  type: "section",
  code: "rz1",
  title: "Розділ I",
  depth: 0,
  order: 1,
};

const law1Article1: TreeNode = {
  _id: "article-1",
  lawId: "law-1",
  parentId: "section-1",
  type: "article",
  code: "rz1.st1",
  title: "Стаття 1.",
  number: "1",
  text: "Загальні засади конституційного ладу",
  depth: 1,
  order: 1,
};

const law1Article2: TreeNode = {
  _id: "article-2",
  lawId: "law-1",
  parentId: "section-1",
  type: "article",
  code: "rz1.st2",
  title: "Стаття 2.",
  number: "2",
  text: "Суверенітет і територіальна цілісність",
  depth: 1,
  order: 2,
};

const law1Article3: TreeNode = {
  _id: "article-3",
  lawId: "law-1",
  parentId: "section-1",
  type: "article",
  code: "rz1.st3",
  title: "Стаття 3.",
  number: "3",
  text: "Права і свободи людини",
  depth: 1,
  order: 3,
};

const law1Part1: TreeNode = {
  _id: "part-1",
  lawId: "law-1",
  parentId: "article-1",
  type: "part",
  code: "rz1.st1.ch1",
  text: "Україна є суверенна і незалежна, демократична, соціальна, правова держава.",
  depth: 2,
  order: 1,
  subjects: [
    { subject_id: "subject-1", role: "subject" },
    { subject_id: "subject-2", role: "protected_party" },
  ],
};

const law1Point1: TreeNode = {
  _id: "point-1",
  lawId: "law-1",
  parentId: "part-1",
  type: "point",
  code: "rz1.st1.ch1.p1",
  number: "1",
  text: "Держава гарантує верховенство Конституції на всій території України.",
  depth: 3,
  order: 1,
  subjects: [{ subject_id: "subject-2", role: "regulator" }],
};

export const mswLawTrees: Record<string, LawTreeResponse> = {
  "law-1": {
    law: mswLaws[0],
    elements: [
      law1Section,
      law1Article1,
      law1Article2,
      law1Article3,
      law1Part1,
      law1Point1,
    ],
  },
  "law-2": {
    law: mswLaws[1],
    elements: [
      {
        _id: "law-2-section-1",
        lawId: "law-2",
        type: "section",
        code: "rz1",
        title: "Розділ I",
        depth: 0,
        order: 1,
      },
      {
        _id: "law-2-article-1",
        lawId: "law-2",
        parentId: "law-2-section-1",
        type: "article",
        code: "rz1.st1",
        title: "Стаття 1.",
        number: "1",
        text: "Права споживачів",
        depth: 1,
        order: 1,
      },
    ],
  },
  "law-3": {
    law: mswLaws[2],
    elements: [
      {
        _id: "law-3-section-1",
        lawId: "law-3",
        type: "section",
        code: "rz1",
        title: "Розділ I",
        depth: 0,
        order: 1,
      },
      {
        _id: "law-3-article-1",
        lawId: "law-3",
        parentId: "law-3-section-1",
        type: "article",
        code: "rz1.st1",
        title: "Стаття 1.",
        number: "1",
        text: "Освітня діяльність",
        depth: 1,
        order: 1,
      },
    ],
  },
};

export const mswLawStats: Record<string, LawStats> = {
  "law-1": {
    totalElements: 6,
    meanChars: 86,
    standardDeviation: 12,
    riskLevels: {
      green: 4,
      yellow: 1,
      red: 1,
      null: 0,
    },
  },
  "law-2": {
    totalElements: 2,
    meanChars: 54,
    standardDeviation: 8,
    riskLevels: {
      green: 2,
      yellow: 0,
      red: 0,
      null: 0,
    },
  },
  "law-3": {
    totalElements: 2,
    meanChars: 48,
    standardDeviation: 6,
    riskLevels: {
      green: 1,
      yellow: 1,
      red: 0,
      null: 0,
    },
  },
};

export const mswSubjects: Subject[] = [
  {
    _id: "subject-1",
    canonical_name: "держава",
    legal_status: "public_authority",
    aliases: ["Україна"],
    description: "Публічний суб'єкт конституційного регулювання.",
    laws_count: 2,
    elements_count: 4,
    createdAt: "2026-05-18T10:00:00.000Z",
  },
  {
    _id: "subject-2",
    canonical_name: "Конституція України",
    legal_status: "regulator",
    aliases: ["конституція"],
    description: "Регуляторна основа для базових норм і принципів.",
    laws_count: 1,
    elements_count: 3,
    createdAt: "2026-05-17T10:00:00.000Z",
  },
  {
    _id: "subject-3",
    canonical_name: "споживач",
    legal_status: "protected_party",
    aliases: ["покупець"],
    description: "Захищена сторона у відносинах із постачальниками.",
    laws_count: 1,
    elements_count: 2,
    createdAt: "2026-05-16T10:00:00.000Z",
  },
];

export const mswArticleResponses: Record<string, ArticleResponse> = {
  "law-1:1": {
    article: law1Article1,
    children: [law1Part1, law1Point1],
  },
};

export const mswSubjectElements: Record<string, SubjectElements> = {
  "subject-1": {
    subject: mswSubjects[0],
    elements: [law1Article1, law1Part1],
  },
  "subject-2": {
    subject: mswSubjects[1],
    elements: [law1Part1, law1Point1],
  },
};

export const mswParseResponse = {
  ok: true,
  sourceUrl: "https://zakon.rada.gov.ua/laws/show/254к/96-вр",
  law: mswLaws[0],
  elements: mswLawTrees["law-1"].elements,
};

export function searchLaws(query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return mswLaws;
  }

  return mswLaws.filter((law) => {
    const haystack = [
      law.title,
      law.code,
      law.preamble ?? "",
      law.signatory ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });
}
