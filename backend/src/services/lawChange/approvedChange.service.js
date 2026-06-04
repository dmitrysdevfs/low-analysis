import ApprovedChange from '../../models/ApprovedChange.js';
import LawChangeProposal from '../../models/LawChangeProposal.js';
import Law from '../../models/Law.js';
import Element from '../../models/Element.js';

export const getApprovedChangesForLaw = async (law_id) => {
  return await ApprovedChange.find({
    law_id,
    is_current: true,
    status: 'active',
  })
    .sort({ approved_at: -1 })
    .populate('element_id', 'type number title');
};

export const getChangeFeed = async ({ page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    ApprovedChange.find({ is_current: true, status: 'active' })
      .sort({ approved_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate('law_id', 'title code')
      .populate('element_id', 'type number title'),
    ApprovedChange.countDocuments({ is_current: true, status: 'active' }),
  ]);
  return { items, total, page, pages: Math.ceil(total / limit) };
};

export const getLawView = async (law_id) => {
  const [law, elements, approved_changes, active_proposals] = await Promise.all(
    [
      Law.findById(law_id).lean(),
      Element.find({ lawId: law_id }).sort({ order: 1 }).lean(),
      ApprovedChange.find({
        law_id,
        is_current: true,
        status: 'active',
      }).lean(),
      LawChangeProposal.find({ law_id, status: 'active' })
        .populate('created_by', 'fullName role')
        .lean(),
    ],
  );

  if (!law) throw Object.assign(new Error('Law not found'), { status: 404 });
  return { law, elements, approved_changes, active_proposals };
};

export const rollbackChange = async (id, adminId) => {
  const change = await ApprovedChange.findById(id);
  if (!change)
    throw Object.assign(new Error('ApprovedChange not found'), { status: 404 });

  change.status = 'rolled_back';
  change.is_current = false;
  change.archived_by = adminId;
  change.archived_at = new Date();
  await change.save();

  // Restore previous ApprovedChange for same element (if exists)
  if (change.supersedes_id) {
    await ApprovedChange.findByIdAndUpdate(change.supersedes_id, {
      is_current: true,
      status: 'active',
    });
  }

  // Also mark the winning proposal back to a different status
  await LawChangeProposal.findByIdAndUpdate(change.winning_proposal_id, {
    status: 'archived',
  });

  return change;
};

export const archiveChange = async (id, adminId) => {
  const change = await ApprovedChange.findById(id);
  if (!change)
    throw Object.assign(new Error('ApprovedChange not found'), { status: 404 });

  change.status = 'archived';
  change.is_current = false;
  change.archived_by = adminId;
  change.archived_at = new Date();
  return await change.save();
};
