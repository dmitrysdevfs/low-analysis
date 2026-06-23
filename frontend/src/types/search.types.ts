export interface SearchParams {
  q: string;
  wordField: "title" | "text" | "code";
  docType: string;
  dateFrom: string;
  dateTo: string;
  numberType: "starts" | "contains" | "exact";
  number: string;
  status: string;
  subjectId: string;
  subjectName: string;
  sort: "date" | "title" | "relevance";
}
