const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { z } = require('zod');
const prisma = new PrismaClient();

// In-memory / DB backed system settings store (for Institute profile & integrations)
let systemSettings = {
  instituteName: 'CAD Point Training Institute',
  tagline: 'Premier CAD & BIM Training CRM',
  contactEmail: 'admin@cadpoint.com',
  contactPhone: '+91 98765 43210',
  address: '123 Tech Park, CAD Point Road',
  city: 'Kochi',
  state: 'Kerala',
  pincode: '682001',
  gstin: '32AAAAA0000A1Z5',
  currency: 'INR (₹)',
  whatsappEnabled: false,
  whatsappApiUrl: 'https://graph.facebook.com/v18.0/',
  whatsappPhoneNumberId: '1092837465',
  whatsappAccessToken: '••••••••••••••••••••',
  autoAssignLeads: true,
  defaultCounsellorId: ''
};

// GET /api/settings - Fetch all settings & enquiry sources
router.get('/', authenticate, async (req, res) => {
  try {
    const sources = await prisma.enquirySource.findMany({ orderBy: { name: 'asc' } });
    res.json({
      success: true,
      data: {
        profile: systemSettings,
        sources,
        system: {
          nodeVersion: process.version,
          environment: process.env.NODE_ENV || 'development',
          database: 'PostgreSQL (cadpoint_crm)',
          port: process.env.PORT || 5001
        }
      }
    });
  } catch (err) {
    console.error('settings.get', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/settings - Update institute profile & settings (SUPER_ADMIN, ADMIN)
router.patch('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const schema = z.object({
      instituteName: z.string().optional(),
      tagline: z.string().optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
      gstin: z.string().optional(),
      whatsappEnabled: z.boolean().optional(),
      whatsappApiUrl: z.string().optional(),
      whatsappPhoneNumberId: z.string().optional(),
      whatsappAccessToken: z.string().optional(),
      autoAssignLeads: z.boolean().optional()
    });
    const parsed = schema.parse(req.body);
    systemSettings = { ...systemSettings, ...parsed };
    res.json({ success: true, data: systemSettings });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, message: err.errors });
    console.error('settings.patch', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/settings/sources - Add a new enquiry source (SUPER_ADMIN, ADMIN)
router.post('/sources', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Source name required' });
    const created = await prisma.enquirySource.upsert({
      where: { name: name.trim() },
      update: { isActive: true },
      create: { name: name.trim() }
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error('settings.sources.add', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/settings/whatsapp/send - Send WhatsApp message via Cloud API or fallback web link
router.post('/whatsapp/send', authenticate, async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ success: false, message: 'Phone number and message required' });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;

    if (systemSettings.whatsappEnabled && systemSettings.whatsappAccessToken && systemSettings.whatsappPhoneNumberId) {
      try {
        const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
        const apiUrl = `${systemSettings.whatsappApiUrl.replace(/\/$/, '')}/${systemSettings.whatsappPhoneNumberId}/messages`;

        const apiRes = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${systemSettings.whatsappAccessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: fullPhone,
            type: 'text',
            text: { body: message }
          })
        });

        const apiJson = await apiRes.json();
        if (apiRes.ok) {
          return res.json({ success: true, message: 'WhatsApp message sent via Cloud API', data: apiJson });
        }
      } catch (apiErr) {
        console.error('WhatsApp API request error:', apiErr);
      }
    }

    const waUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
    res.json({
      success: true,
      message: 'WhatsApp link generated',
      data: { waUrl }
    });
  } catch (err) {
    console.error('settings.whatsapp.send', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/settings/sources/:id - Delete an enquiry source (SUPER_ADMIN, ADMIN)
router.delete('/sources/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.enquirySource.delete({ where: { id } });
    res.json({ success: true, message: 'Source deleted' });
  } catch (err) {
    console.error('settings.sources.delete', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

