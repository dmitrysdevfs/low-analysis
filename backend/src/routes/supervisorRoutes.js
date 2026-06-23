import { Router } from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import * as supervisorController from '../controllers/supervisor.controller.js';

const router = Router();

router.use(protect);
router.use(authorize('supervisor', 'admin'));

/**
 * @swagger
 * /api/supervisor/dashboard:
 *   get:
 *     summary: Get supervisor dashboard summary
 *     tags: [Supervisor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary
 */
router.get('/dashboard', supervisorController.getDashboard);

/**
 * @swagger
 * /api/supervisor/groups:
 *   get:
 *     summary: List groups supervised by current user
 *     tags: [Supervisor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Supervisor groups
 *   post:
 *     summary: Create supervisor group
 *     tags: [Supervisor]
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
 *     responses:
 *       201:
 *         description: Group created
 */
router.get('/groups', supervisorController.getGroups);
router.post('/groups', supervisorController.createGroup);

/**
 * @swagger
 * /api/supervisor/groups/{id}:
 *   get:
 *     summary: Get one supervised group
 *     tags: [Supervisor]
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
 *   put:
 *     summary: Update one supervised group
 *     tags: [Supervisor]
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
 */
router.get('/groups/:id', supervisorController.getGroup);
router.put('/groups/:id', supervisorController.updateGroup);

/**
 * @swagger
 * /api/supervisor/proposals:
 *   get:
 *     summary: Get proposals created by supervised members
 *     tags: [Supervisor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Member proposals
 */
router.get('/proposals', supervisorController.getGroupProposals);

/**
 * @swagger
 * /api/supervisor/amendments:
 *   get:
 *     summary: Get amendments created by supervised members
 *     tags: [Supervisor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Member amendments
 */
router.get('/amendments', supervisorController.getGroupAmendments);

/**
 * @swagger
 * /api/supervisor/forks:
 *   get:
 *     summary: Get forks created by supervised members
 *     tags: [Supervisor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Member forks
 */
router.get('/forks', supervisorController.getGroupForks);

/**
 * @swagger
 * /api/supervisor/forks/{forkId}/review:
 *   patch:
 *     summary: Review a supervised fork
 *     tags: [Supervisor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: forkId
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
 *               reviewNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: Fork review result
 */
router.patch('/forks/:forkId/review', supervisorController.reviewGroupFork);

/**
 * @swagger
 * /api/supervisor/history:
 *   get:
 *     summary: Get supervisor history feed
 *     tags: [Supervisor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated history feed
 */
router.get('/history', supervisorController.getHistory);

/**
 * @swagger
 * /api/supervisor/changes:
 *   get:
 *     summary: Get normalized change feed for supervised members
 *     tags: [Supervisor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Consolidated changes across forks, proposals and amendments
 */
router.get('/changes', supervisorController.getSupervisorChanges);

/**
 * @swagger
 * /api/supervisor/analytics:
 *   get:
 *     summary: Get supervisor analytics
 *     tags: [Supervisor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *           default: month
 *     responses:
 *       200:
 *         description: Supervisor analytics
 */
router.get('/analytics', supervisorController.getAnalytics);

export default router;
