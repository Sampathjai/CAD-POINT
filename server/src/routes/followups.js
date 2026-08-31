const express = require('express');
const router = express.Router();
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const createFollowUpSchema = z.object({
  leadId: z.string().min(1),
  scheduledAt: z.string().min(1),
  type: z.string().optional(),
  notes: z.string().optional()
});

router.post('/', authenticate, authorize('SUPER_ADMIN','ADMIN','COUNSELLOR'), async (req, res) => {
  try {
    const data = createFollowUpSchema.parse(req.body);
    const scheduledAt = new Date(data.scheduledAt);
    const fu = await prisma.followUp.create({ data: { leadId: data.leadId, counsellorId: req.user.id, scheduledAt, type: data.type || 'CALL', notes: data.notes } });
    res.status(201).json({ success: true, data: fu });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, message: err.errors });
    console.error('Create follow-up error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/', authenticate, authorize('SUPER_ADMIN','ADMIN','COUNSELLOR'), async (req, res) => {
  const { status } = req.query;
  const where = status === 'all' ? {} : (status ? { status } : { status: 'PENDING' });
  const upcoming = await prisma.followUp.findMany({
    where,
    include: {
      lead: {
        include: { admission: true, branch: true }
      }
    },
    orderBy: { scheduledAt: 'asc' },
    take: 150
  });
  res.json({ success: true, data: upcoming });
});

router.patch('/:id/complete', authenticate, authorize('SUPER_ADMIN','ADMIN','COUNSELLOR'), async (req, res) => {
  const { id } = req.params;
  try {
    const fu = await prisma.followUp.update({ where: { id }, data: { status: 'COMPLETED', completedAt: new Date() } });
    res.json({ success: true, data: fu });
  } catch (err) { console.error(err); res.status(400).json({ success: false, message: 'Complete failed' }); }
});

module.exports = router;
