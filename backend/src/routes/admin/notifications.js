import { Router } from 'express';
import { protect, authorize } from '../../middleware/authMiddleware.js';
import AdminNotificationDismiss from '../../models/AdminNotificationDismiss.js';

const router = Router();
router.use(protect, authorize('admin'));

// GET /api/admin/notifications/dismissed
// Returns dismissed sourceIds for the current admin
router.get('/dismissed', async (req, res, next) => {
  try {
    const adminId = req.user._id.toString();
    const records = await AdminNotificationDismiss.find({ adminId })
      .select('sourceId -_id')
      .lean();
    res.json({ dismissedIds: records.map((r) => r.sourceId) });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/notifications/dismiss
// Body: { items: [{ sourceType, sourceId }] }
// Bulk-upserts dismiss records (idempotent)
router.post('/dismiss', async (req, res, next) => {
  try {
    const adminId = req.user._id.toString();
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'items array is required' });
    }

    const ops = items.map(({ sourceType, sourceId }) => ({
      updateOne: {
        filter: { adminId, sourceId },
        update: {
          $setOnInsert: {
            adminId,
            sourceType,
            sourceId,
            dismissedAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    await AdminNotificationDismiss.bulkWrite(ops);
    res.json({ ok: true, dismissed: items.length });
  } catch (err) {
    next(err);
  }
});

export default router;
