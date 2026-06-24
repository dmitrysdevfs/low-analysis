import { Router } from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import LegislatorAccessRequest from '../models/LegislatorAccessRequest.js';
import User from '../models/User.js';

const router = Router();
router.use(protect);

/**
 * @swagger
 * /api/legislator-requests/me:
 *   get:
 *     summary: Get latest access request for current user
 *     tags: [LegislatorRequests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Latest request or null
 */
router.get('/me', async (req, res, next) => {
  try {
    const request = await LegislatorAccessRequest.findOne({
      userId: req.user._id,
    })
      .sort({ createdAt: -1 })
      .lean();
    res.json(request ?? null);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/legislator-requests:
 *   post:
 *     summary: Submit legislator access request
 *     tags: [LegislatorRequests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message: { type: string }
 *     responses:
 *       201:
 *         description: Request submitted
 *       409:
 *         description: Request already pending
 *   get:
 *     summary: List pending access requests as admin
 *     tags: [LegislatorRequests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending requests
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', async (req, res, next) => {
  try {
    const existing = await LegislatorAccessRequest.findOne({
      userId: req.user._id,
      status: 'pending',
    });
    if (existing)
      return res.status(409).json({ message: 'Request already pending' });
    const request = await LegislatorAccessRequest.create({
      userId: req.user._id,
      message: req.body?.message ?? '',
    });
    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
});

router.get('/', authorize('admin'), async (req, res, next) => {
  try {
    const requests = await LegislatorAccessRequest.find({ status: 'pending' })
      .populate('userId', 'fullName email role')
      .sort({ createdAt: 1 })
      .lean();
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/legislator-requests/{id}:
 *   patch:
 *     summary: Approve or reject legislator access request as admin
 *     tags: [LegislatorRequests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *               adminNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reviewed request
 *       400:
 *         description: Invalid action
 *       404:
 *         description: Request not found
 */
router.patch('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const { action, adminNote } = req.body ?? {};
    if (!['approve', 'reject'].includes(action)) {
      return res
        .status(400)
        .json({ message: 'action must be approve or reject' });
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
  } catch (err) {
    next(err);
  }
});

export default router;
