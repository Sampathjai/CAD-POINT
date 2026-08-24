const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { z } = require('zod');
const prisma = new PrismaClient();

// GET /api/notifications - list for current user (admins can view all)
router.get('/', authenticate, async (req, res) => {
  try {
    const where = {}; 
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
      where.userId = req.user.id;
    }
    const items = await prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
    res.json({ success: true, data: items });
  } catch (err) {
    console.error('notifications.list', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/notifications - create notification (admins/system)
router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const bodySchema = z.object({ userId: z.string().uuid().optional(), type: z.string().min(1), title: z.string().min(1), message: z.string().min(1), referenceType: z.string().optional(), referenceId: z.string().optional(), scheduledAt: z.string().optional() });
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: parsed.error.message });
    const { userId, type, title, message, referenceType, referenceId, scheduledAt } = parsed.data;
    const data = await prisma.notification.create({ data: { userId: userId || null, type, title, message, referenceType: referenceType || null, referenceId: referenceId || null, scheduledAt: scheduledAt ? new Date(scheduledAt) : null } });
    res.json({ success: true, data });
  } catch (err) {
    console.error('notifications.create', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/notifications/:id/read - mark read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const id = req.params.id;
    const n = await prisma.notification.findUnique({ where: { id } });
    if (!n) return res.status(404).json({ success: false, message: 'Notification not found' });
    if (n.userId && n.userId !== req.user.id && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') return res.status(403).json({ success: false, message: 'Not allowed' });
    const updated = await prisma.notification.update({ where: { id }, data: { isRead: true } });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('notifications.read', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
