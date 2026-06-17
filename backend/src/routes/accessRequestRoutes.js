import { Router } from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import LegislatorAccessRequest from '../models/LegislatorAccessRequest.js';
import User from '../models/User.js';

const router = Router();
router.use(protect);

// User: get own request status
router.get('/me', async (req, res, next) => {
  try {
    const request = await LegislatorAccessRequest.findOne({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json(request ?? null);
  } catch (err) { next(err); }
});

// User: submit request
router.post('/', async (req, res, next) => {
  try {
    const existing = await LegislatorAccessRequest.findOne({ userId: req.user._id, status: 'pending' });
    if (existing) return res.status(409).json({ message: 'Request already pending' });
    const request = await LegislatorAccessRequest.create({
      userId: req.user._id,
      message: req.body?.message ?? '',
    });
    res.status(201).json(request);
  } catch (err) { next(err); }
});

// Admin: list all pending requests
router.get('/', authorize('admin'), async (req, res, next) => {
  try {
    const requests = await LegislatorAccessRequest.find({ status: 'pending' })
      .populate('userId', 'fullName email role')
      .sort({ createdAt: 1 })
      .lean();
    res.json(requests);
  } catch (err) { next(err); }
});

// Admin: approve or reject
router.patch('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const { action, adminNote } = req.body ?? {};
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'action must be approve or reject' });
    }
    const request = await LegislatorAccessRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    request.status = action === 'approve' ? 'approved' : 'rejected';
    request.adminNote = adminNote ?? '';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();
    if (action === 'approve') {
      await User.findByIdAndUpdate(request.userId, { role: 'legislator' });
    }
    res.json(request);
  } catch (err) { next(err); }
});

export default router;
