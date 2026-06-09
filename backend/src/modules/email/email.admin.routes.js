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

// GET /api/admin/email/themes
router.get('/themes', (_req, res) => {
  res.json(Object.entries(THEMES).map(([slug, t]) => ({ slug, name: t.name })));
});

// POST /api/admin/email/preview
// Body: { templateSlug, theme, subject, previewText, props }
router.post('/preview', (req, res) => {
  try {
    const html = renderEmailTemplate(req.body);
    res.json({ html });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/admin/email/audience-preview
// Body: { type, roles, billingPlans, customEmails }
router.post('/audience-preview', async (req, res) => {
  try {
    const count = await previewAudienceCount(req.body);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/email/campaigns
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

// POST /api/admin/email/campaigns (save draft)
router.post('/campaigns', async (req, res) => {
  try {
    const { subject, previewText, templateSlug, theme, props, audience } = req.body;
    const body = renderEmailTemplate({ templateSlug, theme, subject, previewText, props });
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

// POST /api/admin/email/campaigns/:id/send
router.post('/campaigns/:id/send', async (req, res) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (campaign.status === 'sent') return res.status(400).json({ error: 'Already sent' });

    campaign.status = 'sending';
    await campaign.save();

    const recipients = await buildAudience(campaign.audience);
    campaign.recipientCount = recipients.length;

    const results = await sendBulkEmails({
      recipients,
      subject: campaign.subject,
      htmlContent: campaign.body,
    });

    const logs = results.map(r => ({
      campaignId: campaign._id,
      recipientEmail: r.email,
      status: r.success ? 'sent' : 'failed',
      brevoMessageId: r.messageId,
      error: r.error,
    }));
    await EmailLog.insertMany(logs);

    campaign.deliveredCount = results.filter(r => r.success).length;
    campaign.status = 'sent';
    campaign.sentAt = new Date();
    campaign.sentBy = req.user._id;
    await campaign.save();

    res.json({ ok: true, sent: campaign.deliveredCount, total: campaign.recipientCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/email/send (compose + send in one step)
router.post('/send', async (req, res) => {
  try {
    const { subject, previewText, templateSlug, theme, props, audience } = req.body;
    const body = renderEmailTemplate({ templateSlug, theme, subject, previewText, props });

    const recipients = await buildAudience(audience);

    const campaign = await EmailCampaign.create({
      subject, previewText, templateSlug, theme, body, audience,
      status: 'sending',
      sentBy: req.user._id,
      recipientCount: recipients.length,
    });

    const results = await sendBulkEmails({ recipients, subject, htmlContent: body });

    const logs = results.map(r => ({
      campaignId: campaign._id,
      recipientEmail: r.email,
      status: r.success ? 'sent' : 'failed',
      brevoMessageId: r.messageId,
      error: r.error,
    }));
    await EmailLog.insertMany(logs);

    campaign.deliveredCount = results.filter(r => r.success).length;
    campaign.status = 'sent';
    campaign.sentAt = new Date();
    await campaign.save();

    res.json({ ok: true, campaignId: campaign._id, sent: campaign.deliveredCount, total: campaign.recipientCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/email/campaigns/:id/logs
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
