import { Router } from 'express';
import { protect, authorize } from '../../middleware/authMiddleware.js';
import AdminNotificationDismiss from '../../models/AdminNotificationDismiss.js';

const router = Router();
router.use(protect, authorize('admin'));

/**
 * @swagger
 * /api/admin/notifications/dismissed:
 *   get:
 *     summary: Список відхилених сповіщень для поточного адміна
 *     description: Повертає масив sourceId сповіщень, які адмін вже відхилив (щоб не показувати повторно).
 *     tags: [AdminNotifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Масив відхилених sourceId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dismissedIds: { type: array, items: { type: string } }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
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

/**
 * @swagger
 * /api/admin/notifications/dismiss:
 *   post:
 *     summary: Масово відхилити сповіщення
 *     description: >
 *       Bulk-upsert: для кожного item зберігає запис dismiss (ідемпотентно).
 *       Використовується коли адмін закриває банер або читає сповіщення.
 *     tags: [AdminNotifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [sourceType, sourceId]
 *                   properties:
 *                     sourceType: { type: string }
 *                     sourceId: { type: string }
 *     responses:
 *       200:
 *         description: Відхилено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean }
 *                 dismissed: { type: integer }
 *       400:
 *         description: items масив відсутній або порожній
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
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
