import * as pageService from './page.service.js';

export async function getPublicPage(req, res, next) {
  try {
    const page = await pageService.getPublicPage(req.params.slug);
    if (!page) {
      return res.status(404).json({ message: 'Published page not found' });
    }
    return res.json(page);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return next(error);
  }
}

export async function getPageCatalog(req, res, next) {
  try {
    return res.json(pageService.getKnownPageSlugs());
  } catch (error) {
    return next(error);
  }
}

export async function getAdminPage(req, res, next) {
  try {
    const page = await pageService.getAdminPage(req.params.slug);
    return res.json(page);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return next(error);
  }
}

export async function saveDraftPage(req, res, next) {
  try {
    const page = await pageService.saveDraftPage(
      req.params.slug,
      req.body,
      req.user?._id ?? null,
    );
    return res.json(page);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return next(error);
  }
}

export async function publishPage(req, res, next) {
  try {
    const page = await pageService.publishPage(
      req.params.slug,
      req.user?._id ?? null,
    );
    return res.json(page);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return next(error);
  }
}

export async function unpublishPage(req, res, next) {
  try {
    const page = await pageService.unpublishPage(
      req.params.slug,
      req.user?._id ?? null,
    );
    return res.json(page);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return next(error);
  }
}

export async function getPageVersions(req, res, next) {
  try {
    const versions = await pageService.getPageVersions(req.params.slug);
    return res.json(versions);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return next(error);
  }
}

export async function restorePageVersion(req, res, next) {
  try {
    const page = await pageService.restorePageVersion(
      req.params.slug,
      req.params.version,
      req.user?._id ?? null,
    );
    return res.json(page);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return next(error);
  }
}
