import * as approvedChangeService from '../../services/lawChange/approvedChange.service.js';

export const getLawView = async (req, res, next) => {
  try {
    const data = await approvedChangeService.getLawView(req.params.id);
    res.json(data);
  } catch (err) { next(err); }
};

export const getApprovedChanges = async (req, res, next) => {
  try {
    const { law_id } = req.query;
    if (!law_id) return res.status(400).json({ message: 'law_id query param is required' });
    const changes = await approvedChangeService.getApprovedChangesForLaw(law_id);
    res.json(changes);
  } catch (err) { next(err); }
};

export const getChangeFeed = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await approvedChangeService.getChangeFeed({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
    res.json(result);
  } catch (err) { next(err); }
};

export const rollbackChange = async (req, res, next) => {
  try {
    const change = await approvedChangeService.rollbackChange(req.params.id, req.user._id);
    res.json(change);
  } catch (err) { next(err); }
};

export const archiveChange = async (req, res, next) => {
  try {
    const change = await approvedChangeService.archiveChange(req.params.id, req.user._id);
    res.json(change);
  } catch (err) { next(err); }
};
