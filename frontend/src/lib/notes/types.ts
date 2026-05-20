export type NoteColor = "gold" | "blue" | "green";
export type NoteType = "article" | "selection";

export interface Note {
  id: string;
  createdAt: string;
  updatedAt: string;
  type: NoteType;
  color: NoteColor;
  noteText: string;
  // for article-type notes
  lawId?: string;
  lawTitle?: string;
  articleNum?: string;
  articleTitle?: string;
  // for text-selection notes
  selectedText?: string;
  pageUrl?: string;
  pageTitle?: string;
}

export type NoteDraft = Omit<Note, "id" | "createdAt" | "updatedAt">;
