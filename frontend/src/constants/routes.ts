export const ROUTES = {
  home: "/",
  laws: "/laws",
  subjects: "/subjects",
  search: "/search",
  law: (id: string) => `/laws/${id}`,
  article: (id: string, num: string) => `/laws/${id}/articles/${num}`,
  subject: (id: string) => `/subjects/${id}`,
} as const;
