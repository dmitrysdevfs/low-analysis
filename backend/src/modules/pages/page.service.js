import ManagedPage from './page.model.js';
import {
  MAX_PAGE_VERSIONS,
  PAGE_SLUGS,
  PAGE_STATUS,
  PAGE_VERSION_KINDS,
} from './page.constants.js';
import { buildDefaultPageSnapshot } from './page.defaults.js';
import { assertPageSlug, normalizePageSnapshot } from './page.validation.js';

function cloneSnapshot(snapshot) {
  return JSON.parse(JSON.stringify(snapshot));
}

function toPublicPayload(page) {
  const snapshot = page.published ?? page.draft;

  return {
    slug: page.slug,
    status: page.status,
    title: snapshot.title,
    description: snapshot.description,
    seo: snapshot.seo,
    blocks: snapshot.blocks,
    updatedAt: page.updatedAt,
    publishedAt: page.publishedAt,
  };
}

function toAdminPayload(page) {
  return {
    slug: page.slug,
    title: page.title,
    status: page.status,
    draft: page.draft,
    published: page.published,
    updatedAt: page.updatedAt,
    publishedAt: page.publishedAt,
    versions: [...page.versions]
      .sort((left, right) => right.version - left.version)
      .map((version) => ({
        version: version.version,
        kind: version.kind,
        savedAt: version.savedAt,
        savedBy: version.savedBy ?? null,
        title: version.snapshot.title,
        blockCount: version.snapshot.blocks.length,
      })),
  };
}

function appendVersion(page, kind, snapshot, userId = null) {
  const nextVersion = (page.lastVersion ?? 0) + 1;
  page.lastVersion = nextVersion;
  page.versions = [
    {
      version: nextVersion,
      kind,
      savedAt: new Date(),
      savedBy: userId,
      snapshot: cloneSnapshot(snapshot),
    },
    ...page.versions,
  ].slice(0, MAX_PAGE_VERSIONS);
}

async function getOrCreateManagedPage(slug) {
  const normalizedSlug = assertPageSlug(slug);
  let page = await ManagedPage.findOne({ slug: normalizedSlug });

  if (!page) {
    const defaultSnapshot = buildDefaultPageSnapshot(normalizedSlug);
    page = await ManagedPage.create({
      slug: normalizedSlug,
      title: defaultSnapshot.title,
      status: PAGE_STATUS.published,
      draft: defaultSnapshot,
      published: defaultSnapshot,
      publishedAt: new Date(),
      lastVersion: 1,
      versions: [
        {
          version: 1,
          kind: PAGE_VERSION_KINDS.seed,
          savedAt: new Date(),
          savedBy: null,
          snapshot: defaultSnapshot,
        },
      ],
    });
  }

  return page;
}

export async function getPublicPage(slug) {
  const page = await getOrCreateManagedPage(slug);

  if (page.status !== PAGE_STATUS.published || !page.published) {
    return null;
  }

  return toPublicPayload(page);
}

export async function getAdminPage(slug) {
  const page = await getOrCreateManagedPage(slug);
  return toAdminPayload(page);
}

export async function saveDraftPage(slug, payload, userId) {
  const page = await getOrCreateManagedPage(slug);
  const normalizedDraft = normalizePageSnapshot(payload);

  page.title = normalizedDraft.title;
  page.draft = normalizedDraft;
  page.updatedBy = userId ?? null;
  appendVersion(page, PAGE_VERSION_KINDS.save, normalizedDraft, userId ?? null);
  await page.save();

  return toAdminPayload(page);
}

export async function publishPage(slug, userId) {
  const page = await getOrCreateManagedPage(slug);

  if (!page.draft) {
    const error = new Error('Draft page is missing');
    error.statusCode = 400;
    throw error;
  }

  page.status = PAGE_STATUS.published;
  page.published = cloneSnapshot(page.draft);
  page.publishedAt = new Date();
  page.publishedBy = userId ?? null;
  page.updatedBy = userId ?? null;
  appendVersion(
    page,
    PAGE_VERSION_KINDS.publish,
    page.published,
    userId ?? null,
  );
  await page.save();

  return toAdminPayload(page);
}

export async function unpublishPage(slug, userId) {
  const page = await getOrCreateManagedPage(slug);

  page.status = PAGE_STATUS.draft;
  page.updatedBy = userId ?? null;
  appendVersion(page, PAGE_VERSION_KINDS.unpublish, page.draft, userId ?? null);
  await page.save();

  return toAdminPayload(page);
}

export async function restorePageVersion(slug, versionNumber, userId) {
  const page = await getOrCreateManagedPage(slug);
  const numericVersion = Number(versionNumber);
  const matchedVersion = page.versions.find(
    (item) => item.version === numericVersion,
  );

  if (!matchedVersion) {
    const error = new Error(`Version ${versionNumber} not found`);
    error.statusCode = 404;
    throw error;
  }

  page.draft = cloneSnapshot(matchedVersion.snapshot);
  page.title = matchedVersion.snapshot.title;
  page.updatedBy = userId ?? null;
  appendVersion(page, PAGE_VERSION_KINDS.restore, page.draft, userId ?? null);
  await page.save();

  return toAdminPayload(page);
}

export async function getPageVersions(slug) {
  const page = await getOrCreateManagedPage(slug);
  return toAdminPayload(page).versions;
}

export function getKnownPageSlugs() {
  return [
    {
      slug: PAGE_SLUGS.projectInfo,
      label: 'Інформація про проєкт',
    },
  ];
}
