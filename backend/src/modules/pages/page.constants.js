export const PAGE_SLUGS = {
  projectInfo: 'project-info',
  rolesGuest: 'roles-guest',
  rolesUser: 'roles-user',
  rolesLawmaker: 'roles-lawmaker',
  rolesSupervisor: 'roles-supervisor',
  rolesAdmin: 'roles-admin',
  support: 'support',
  docs: 'docs',
};

export const ALLOWED_PAGE_SLUGS = Object.values(PAGE_SLUGS);

export const PAGE_BLOCK_TYPES = [
  'hero',
  'richText',
  'statsGrid',
  'cards',
  'steps',
  'faq',
  'cta',
  'radioGroup',
  'quote',
  'image',
];

export const PAGE_STATUS = {
  draft: 'draft',
  published: 'published',
};

export const PAGE_VERSION_KINDS = {
  seed: 'seed',
  save: 'save',
  publish: 'publish',
  restore: 'restore',
  unpublish: 'unpublish',
};

export const MAX_PAGE_VERSIONS = 30;
