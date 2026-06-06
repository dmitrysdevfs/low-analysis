export interface RadiantNode {
  id: string;
  name: string;
  code: string;
  lawType: string;
  totalArticles: number;
  adoptedYear?: number;
  color: string;
  size: number;
  cluster: string;
  x?: number;
  y?: number;
  z?: number;
}

export interface RadiantLink {
  source: string;
  target: string;
  strength: number;
  linkType: "type_cluster" | "subject";
}

export interface RadiantGraph {
  nodes: RadiantNode[];
  links: RadiantLink[];
}
