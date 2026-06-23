import { Router } from 'express';
import { protect, authorize } from '../../middleware/authMiddleware.js';
import { renderEmailTemplate } from './email.renderer.js';
import { sendBulkEmails } from './email.service.js';
import { buildAudience, previewAudienceCount } from './email.audience.js';
import EmailCampaign from '../../models/EmailCampaign.js';
import EmailLog from '../../models/EmailLog.js';
import { THEMES } from './themes.js';

const router = Router();
router.use(protect, authorize('admin'));

/**
 * @swagger
 * /api/admin/email/themes:
 *   get:
 *     summary: List available email themes
 *     tags: [AdminEmail]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available theme slugs and labels
 */
router.get('/themes', (_req, res) => {
  res.json(Object.entries(THEMES).map(([slug, t]) => ({ slug, name: t.name })));
});

/**
 * @swagger
 * /api/admin/email/preview:
 *   post:
 *     summary: Render email HTML preview
 *     tags: [AdminEmail]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               templateSlug: { type: string, example: password-reset }
 *               theme: { type: string, example: default }
 *               subject: { type: string, example: Welcome to Law Analysis }
 *               previewText: { type: string, example: Preview text for inbox snippets }
 *               props:
 *                 type: object
 *                 additionalProperties: true
 *     responses:
 *       200:
 *         description: Rendered HTML preview
 *       400:
 *         description: Invalid template payload
 */
router.post('/preview', (req, res) => {
  try {
    const html = renderEmailTemplate(req.body);
    res.json({ html });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/admin/email/audience-preview:
 *   post:
 *     summary: Preview recipient count for selected audience
 *     tags: [AdminEmail]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [all, role, billing, custom]
 *               roles:
 *                 type: array
 *                 items: { type: string }
 *               billingPlans:
 *                 type: array
 *                 items: { type: string }
 *               customEmails:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *     responses:
 *       200:
 *         description: Audience size preview
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/audience-preview', async (req, res) => {
  try {
    const count = await previewAudienceCount(req.body);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/admin/email/campaigns:
 *   get:
 *     summary: List email campaigns
 *     tags: [AdminEmail]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent campaigns
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   post:
 *     summary: Save campaign draft
 *     tags: [AdminEmail]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, templateSlug, theme, audience]
 *             properties:
 *               subject: { type: string }
 *               previewText: { type: string }
 *               templateSlug: { type: string }
 *               theme: { type: string }
 *               props:
 *                 type: object
 *                 additionalProperties: true
 *               audience:
 *                 type: object
 *                 additionalProperties: true
 *     responses:
 *       201:
 *         description: Campaign draft created
 *       400:
 *         description: Invalid campaign payload
 */
router.get('/campaigns', async (_req, res) => {
  try {
    const campaigns = await EmailCampaign.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/campaigns', async (req, res) => {
  try {
    const { subject, previewText, templateSlug, theme, props, audience } =
      req.body;
    const body = renderEmailTemplate({
      templateSlug,
      theme,
      subject,
      previewText,
      props,
    });
    const campaign = await EmailCampaign.create({
      subject,
      previewText,
      templateSlug,
      theme,
      body,
      audience,
      status: 'draft',
      sentBy: req.user._id,
    });
    res.status(201).json(campaign);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/admin/email/campaigns/{id}/send:
 *   post:
 *     summary: Send a saved campaign
 *     tags: [AdminEmail]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Campaign send result
 *       400:
 *         description: Campaign already sent or invalid
 *       404:
 *         description: Campaign not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/campaigns/:id/send', async (req, res) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (campaign.status === 'sent')
      return res.status(400).json({ error: 'Already sent' });

    campaign.status = 'sending';
    await campaign.save();

    const recipients = await buildAudience(campaign.audience);
    campaign.recipientCount = recipients.length;

    const results = await sendBulkEmails({
      recipients,
      subject: campaign.subject,
      htmlContent: campaign.body,
    });

    const logs = results.map((r) => ({
      campaignId: campaign._id,
      recipientEmail: r.email,
      status: r.success ? 'sent' : 'failed',
      brevoMessageId: r.messageId,
      error: r.error,
    }));
    await EmailLog.insertMany(logs);

    campaign.deliveredCount = results.filter((r) => r.success).length;
    campaign.status = 'sent';
    campaign.sentAt = new Date();
    campaign.sentBy = req.user._id;
    await campaign.save();

    res.json({
      ok: true,
      sent: campaign.deliveredCount,
      total: campaign.recipientCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/admin/email/send:
 *   post:
 *     summary: Compose and send campaign in one step
 *     tags: [AdminEmail]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, templateSlug, theme, audience]
 *             properties:
 *               subject: { type: string }
 *               previewText: { type: string }
 *               templateSlug: { type: string }
 *               theme: { type: string }
 *               props:
 *                 type: object
 *                 additionalProperties: true
 *               audience:
 *                 type: object
 *                 additionalProperties: true
 *     responses:
 *       200:
 *         description: Campaign created and sent
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/send', async (req, res) => {
  try {
    const { subject, previewText, templateSlug, theme, props, audience } =
      req.body;
    const body = renderEmailTemplate({
      templateSlug,
      theme,
      subject,
      previewText,
      props,
    });

    const recipients = await buildAudience(audience);

    const campaign = await EmailCampaign.create({
      subject,
      previewText,
      templateSlug,
      theme,
      body,
      audience,
      status: 'sending',
      sentBy: req.user._id,
      recipientCount: recipients.length,
    });

    const results = await sendBulkEmails({
      recipients,
      subject,
      htmlContent: body,
    });

    const logs = results.map((r) => ({
      campaignId: campaign._id,
      recipientEmail: r.email,
      status: r.success ? 'sent' : 'failed',
      brevoMessageId: r.messageId,
      error: r.error,
    }));
    await EmailLog.insertMany(logs);

    campaign.deliveredCount = results.filter((r) => r.success).length;
    campaign.status = 'sent';
    campaign.sentAt = new Date();
    await campaign.save();

    res.json({
      ok: true,
      campaignId: campaign._id,
      sent: campaign.deliveredCount,
      total: campaign.recipientCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/admin/email/campaigns/{id}/logs:
 *   get:
 *     summary: Get delivery logs for a campaign
 *     tags: [AdminEmail]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Delivery logs for the campaign
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/campaigns/:id/logs', async (req, res) => {
  try {
    const logs = await EmailLog.find({ campaignId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
