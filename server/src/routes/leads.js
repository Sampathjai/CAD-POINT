const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticate, authorize } = require('../middleware/auth');

const createLeadSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  phone: z.string().min(6),
  whatsappNumber: z.string().optional(),
  email: z.string().email().optional(),
  qualification: z.string().optional(),
  city: z.string().optional(),
  interestedCourse: z.string().optional(),
  sourceId: z.string().optional(),
  estimatedValue: z.string().optional(),
  branchId: z.string().optional(),
  leadType: z.string().optional(),
  assignedCounsellorId: z.string().optional()
});

// Create lead
router.post('/', authenticate, authorize('SUPER_ADMIN','ADMIN','COUNSELLOR','RECEPTIONIST'), async (req, res) => {
  try {
    const data = createLeadSchema.parse(req.body);
    const leadNumber = 'LD-' + Date.now().toString(36).toUpperCase();

    // Resolve branch ID if code is passed
    let finalBranchId = data.branchId;
    if (finalBranchId) {
      const b = await prisma.branch.findFirst({
        where: { OR: [{ id: finalBranchId }, { code: finalBranchId.toLowerCase() }] }
      });
      if (b) finalBranchId = b.id;
    }
    if (!finalBranchId) {
      const defaultBranch = await prisma.branch.findFirst({ where: { code: 'gandhipuram' } });
      if (defaultBranch) finalBranchId = defaultBranch.id;
    }

    const lead = await prisma.lead.create({
      data: {
        leadNumber,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        whatsappNumber: data.whatsappNumber,
        email: data.email,
        qualification: data.qualification,
        city: data.city,
        interestedCourse: data.interestedCourse,
        sourceId: data.sourceId,
        branchId: finalBranchId,
        leadType: data.leadType || 'STANDARD',
        assignedCounsellorId: data.assignedCounsellorId || null,
        estimatedValue: data.estimatedValue ? data.estimatedValue : null
      },
      include: { source: true, branch: true, assignedCounsellor: { select: { id: true, name: true, email: true } } }
    });
    res.status(201).json({ success: true, data: lead });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, message: err.errors });
    console.error('Create lead error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// List leads with branchId, leadType & source filtering
router.get('/', authenticate, authorize('SUPER_ADMIN','ADMIN','COUNSELLOR','RECEPTIONIST'), async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const take = Math.min(250, Number(req.query.take) || 250);
  const { branchId, leadType, sourceId, status } = req.query;

  const where = {};
  if (branchId && branchId !== 'all') {
    const b = await prisma.branch.findFirst({
      where: { OR: [{ id: branchId }, { code: branchId.toLowerCase() }] }
    });
    if (b) where.branchId = b.id;
  }
  if (leadType) where.leadType = leadType;
  if (sourceId) where.sourceId = sourceId;
  if (status) where.status = status;

  const leads = await prisma.lead.findMany({
    where,
    skip: (page - 1) * take,
    take,
    orderBy: { createdAt: 'desc' },
    include: { source: true, branch: true, assignedCounsellor: { select: { id: true, name: true, email: true } } }
  });
  res.json({ success: true, data: leads });
});

// Get lead by id
router.get('/:id', authenticate, authorize('SUPER_ADMIN','ADMIN','COUNSELLOR'), async (req, res) => {
  const { id } = req.params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
  res.json({ success: true, data: lead });
});

// Update lead
router.patch('/:id', authenticate, authorize('SUPER_ADMIN','ADMIN','COUNSELLOR'), async (req, res) => {
  const { id } = req.params;
  try {
    const data = req.body;
    const lead = await prisma.lead.update({ where: { id }, data });
    res.json({ success: true, data: lead });
  } catch (err) { console.error(err); res.status(400).json({ success: false, message: 'Update failed' }); }
});

// Assign counsellor
router.patch('/:id/assign', authenticate, authorize('SUPER_ADMIN','ADMIN'), async (req, res) => {
  const { id } = req.params;
  const { counsellorId } = req.body;
  try {
    const lead = await prisma.lead.update({ where: { id }, data: { assignedCounsellorId: counsellorId } });
    res.json({ success: true, data: lead });
  } catch (err) { console.error(err); res.status(400).json({ success: false, message: 'Assign failed' }); }
});

// Change status
router.patch('/:id/status', authenticate, authorize('SUPER_ADMIN','ADMIN','COUNSELLOR'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const lead = await prisma.lead.update({ where: { id }, data: { status } });
    await prisma.leadStatusHistory.create({ data: { leadId: id, oldStatus: null, newStatus: status, changedBy: req.user.id } });
    res.json({ success: true, data: lead });
  } catch (err) { console.error(err); res.status(400).json({ success: false, message: 'Status update failed' }); }
});

module.exports = router;
