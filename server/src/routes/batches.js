const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { z } = require('zod');
const prisma = new PrismaClient();

// POST /api/batches
router.post('/', authenticate, authorize('SUPER_ADMIN','ADMIN'), async (req, res) => {
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

module.exports = router;
