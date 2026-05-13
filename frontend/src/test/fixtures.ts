import type {
  ArticleResponse,
  Law,
  LawTreeResponse,
  Subject,
  SubjectElements,
  TreeNode,
} from "@/types";

export const LAW_FIXTURE: Law = {
  _id: "law-1",
  title: "КОНСТИТУЦІЯ УКРАЇНИ",
  code: "254к/96-вр",
  preamble: "КОНСТИТУЦІЯ УКРАЇНИ",
  status: "чинний",
  totalSections: 14,
  totalArticles: 166,
  totalParagraphs: 481,
  createdAt: "2026-05-09T10:00:00.000Z",
};

export const LAW_FIXTURE_2: Law = {
  _id: "law-2",
  title: "ЦИВІЛЬНИЙ КОДЕКС УКРАЇНИ",
  code: "435-15",
  preamble: "КОДЕКС",
  status: "чинний",
  totalSections: 6,
  totalArticles: 32,
  totalParagraphs: 80,
  createdAt: "2026-05-08T10:00:00.000Z",
};

export const LAW_FIXTURE_3: Law = {
  _id: "law-3",
  title: "ЗАКОН ПРО ОСВІТУ",
  code: "2145-19",
  preamble: "ЗАКОН УКРАЇНИ",
  status: "чинний",
  totalSections: 3,
  totalArticles: 12,
  totalParagraphs: 24,
  createdAt: "2026-05-10T10:00:00.000Z",
};

export const SECTION_NODE: TreeNode = {
  _id: "section-1",
  lawId: LAW_FIXTURE._id,
  type: "section",
  code: "rz1",
  title: "Розділ I",
  depth: 0,
  order: 1,
};

export const ARTICLE_NODE: TreeNode = {
  _id: "article-1",
  lawId: LAW_FIXTURE._id,
  parentId: SECTION_NODE._id,
  type: "article",
  code: "rz1.st1",
  title: "Стаття 1.",
  number: "1",
  text: "Україна є суверенна і незалежна держава.",
  depth: 1,
  order: 1,
};

export const TREE_ARTICLE_NODE: TreeNode = {
  ...ARTICLE_NODE,
  text: "Загальні засади конституційного ладу",
};

export const PART_NODE: TreeNode = {
  _id: "part-1",
  lawId: LAW_FIXTURE._id,
  parentId: ARTICLE_NODE._id,
  type: "part",
  code: "rz1.st1.ch1",
  text: "Частина перша статті 1.",
  depth: 2,
  order: 1,
};

export const SUBJECT_FIXTURE: Subject = {
  _id: "subject-1",
  canonical_name: "Підприємець",
  legal_status: "individual",
  aliases: ["ФОП", "суб'єкт підприємницької діяльності"],
  createdAt: "2026-05-09T10:00:00.000Z",
};

export const ARTICLE_RESPONSE_FIXTURE: ArticleResponse = {
  article: ARTICLE_NODE,
  children: [PART_NODE],
};

export const LAW_TREE_RESPONSE_FIXTURE: LawTreeResponse = {
  law: LAW_FIXTURE,
  elements: [
    SECTION_NODE,
    TREE_ARTICLE_NODE,
    { ...PART_NODE, parentId: TREE_ARTICLE_NODE._id },
  ],
};

export const SUBJECT_ELEMENTS_FIXTURE: SubjectElements = {
  subject: SUBJECT_FIXTURE,
  elements: [ARTICLE_NODE, PART_NODE],
};
