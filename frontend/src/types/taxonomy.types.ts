export interface Taxonomy {
  _id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
}

export interface TaxonomyTreeNode extends Taxonomy {
  children: TaxonomyTreeNode[];
}
