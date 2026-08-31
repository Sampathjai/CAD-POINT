const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticate, authorize } = require('../middleware/auth');
const { z } = require('zod');

// Batches Module Roles: SUPER_ADMIN, ADMIN, COUNSELLOR, TRAINER, RECEPTIONIST
const BATCH_ROLES = ['SUPER_ADMIN', 'ADMIN', 'COUNSELLOR', 'TRAINER', 'RECEPTIONIST'];

// GET /api/batches
router.get('/', authenticate, authorize(...BATCH_ROLES), async (req, res) => {
  try {
    const batches = await prisma.batch.findMany({
      include: { course: true, trainer: { select: { id: true, name: true } } },
      orderBy: { startDate: 'desc' }
    });
    res.json({ success: true, data: batches });
  } catch (err) {
    console.error('batches.list', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/batches
router.post('/', authenticate, authorize(...BATCH_ROLES), async (req, res) => {
  try {
    const schema = z.object({ batchCode: z.string().min(1), name: z.string().min(1), courseId: z.string().uuid(), startDate: z.string().min(1), endDate: z.string().optional(), capacity: z.number().optional() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: parsed.error.message });
    const { batchCode, name, courseId, startDate, endDate, capacity } = parsed.data;
    const created = await prisma.batch.create({ data: { batchCode, name, courseId, startDate: new Date(startDate), endDate: endDate?new Date(endDate):null, capacity: capacity||25 } });
    res.json({ success: true, data: created });
  } catch (err) {
    console.error('batches.create', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/batches/:id - Update batch details
router.put('/:id', authenticate, authorize(...BATCH_ROLES), async (req, res) => {
  try {
    const { id } = req.params;
    const { batchCode, name, courseId, startDate, endDate, capacity, status } = req.body;

    const existing = await prisma.batch.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const updated = await prisma.batch.update({
      where: { id },
      data: {
        ...(batchCode ? { batchCode: batchCode.trim() } : {}),
        ...(name ? { name: name.trim() } : {}),
        ...(courseId ? { courseId } : {}),
        ...(startDate ? { startDate: new Date(startDate) } : {}),
        ...(endDate ? { endDate: new Date(endDate) } : {}),
        ...(capacity ? { capacity: Number(capacity) || 25 } : {}),
        ...(status ? { status } : {})
      },
      include: { course: true, trainer: { select: { id: true, name: true } } }
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('batches.update', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/batches/:id
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.batch.delete({ where: { id } });
    res.json({ success: true, message: 'Batch deleted successfully' });
  } catch (err) {
    console.error('batches.delete', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
