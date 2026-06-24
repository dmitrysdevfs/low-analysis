import { Router } from 'express';
import { protect } from '../../middleware/authMiddleware.js';
import * as groupChatController from './groupChat.controller.js';

const router = Router();

router.use(protect);

/**
 * @swagger
 * /api/group-chats/my-rooms:
 *   get:
 *     summary: List chat rooms available to the current user
 *     tags: [GroupChat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Group chat rooms
 */
router.get('/my-rooms', groupChatController.getMyRooms);

/**
 * @swagger
 * /api/group-chats/{groupId}/messages:
 *   get:
 *     summary: Get messages for a group chat
 *     tags: [GroupChat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: before
 *         schema: { type: string }
 *         description: Cursor or message timestamp for backward pagination
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Message page for the selected room
 */
router.get('/:groupId/messages', groupChatController.getMessages);

/**
 * @swagger
 * /api/group-chats/{groupId}/read:
 *   post:
 *     summary: Mark all visible messages as read in a group room
 *     tags: [GroupChat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Read state updated
 */
router.post('/:groupId/read', groupChatController.markRead);

export default router;
