import express from 'express';
import * as groupsController from '../controllers/groups.controller.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /api/groups:
 *   get:
 *     summary: List public groups
 *     tags: [Groups]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: supervisorId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Public groups with pagination
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               course: { type: string }
 *               trackedLaws:
 *                 type: array
 *                 items: { type: string }
 *               maxMembers: { type: integer }
 *               visibility:
 *                 type: string
 *                 enum: [public, private]
 *     responses:
 *       201:
 *         description: Group created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', groupsController.listPublicGroups);

// Authenticated; static paths must come before parameterised /:id
router.post('/', protect, authorize('supervisor', 'admin'), groupsController.createGroup);

/**
 * @swagger
 * /api/groups/my:
 *   get:
 *     summary: Get groups for the current user
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user's groups
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/my', protect, groupsController.getMyGroups);

/**
 * @swagger
 * /api/groups/my-requests:
 *   get:
 *     summary: Get join requests created by the current user
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user's join requests
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/my-requests', protect, groupsController.getMyRequests);

/**
 * @swagger
 * /api/groups/{id}:
 *   get:
 *     summary: Get one group by id
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Group details
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Group not found
 *   patch:
 *     summary: Update a group
 *     tags: [Groups]
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
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Updated group
 *   delete:
 *     summary: Archive a group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Archived group
 */
router.get('/:id', protect, groupsController.getGroupById);
router.patch('/:id', protect, groupsController.updateGroup);
router.delete('/:id', protect, groupsController.archiveGroup);

/**
 * @swagger
 * /api/groups/{id}/requests:
 *   post:
 *     summary: Create join request for a group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
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
 *         description: Join request created
 *   get:
 *     summary: Get join requests for a group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Join requests for the group
 */
router.post('/:id/requests', protect, groupsController.createRequest);
router.get('/:id/requests', protect, groupsController.getGroupRequests);

/**
 * @swagger
 * /api/groups/{id}/requests/{reqId}:
 *   patch:
 *     summary: Review join request
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: reqId
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
 *     responses:
 *       200:
 *         description: Request reviewed
 *   delete:
 *     summary: Cancel own join request
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: reqId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Request cancelled
 */
router.patch('/:id/requests/:reqId', protect, groupsController.reviewRequest);
router.delete('/:id/requests/:reqId', protect, groupsController.cancelRequest);

/**
 * @swagger
 * /api/groups/{id}/members/{userId}:
 *   delete:
 *     summary: Remove member from a group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Member removed
 */
router.delete('/:id/members/:userId', protect, groupsController.removeMember);

/**
 * @swagger
 * /api/groups/{id}/activity:
 *   get:
 *     summary: Get activity feed for a group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Group activity feed
 */
router.get('/:id/activity', protect, groupsController.getGroupActivity);

export default router;
