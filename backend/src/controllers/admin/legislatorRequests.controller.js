import * as legislatorRequestService from '../../services/lawChange/legislatorRequest.service.js';

export const patchLegislatorRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, note } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'action must be approve or reject' });
    }
    if (action === 'approve') {
      const request = await legislatorRequestService.approveRequest(id, req.user._id);
      return res.json({ success: true, userId: request.user_id, newRole: 'legislator' });
    } else {
      await legislatorRequestService.rejectRequest(id, req.user._id, note || '');
      return res.json({ success: true });
    }
  } catch (err) {
    next(err);
  }
};
