const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticate, authorize } = require('../middleware/auth');
const { z } = require('zod');


// GET /api/payments
router.get('/', authenticate, async (req, res) => {
  try {
    const { branchId } = req.query;
    const where = {};
    if (branchId && branchId !== 'all') {
      const b = await prisma.branch.findFirst({
        where: { OR: [{ id: branchId }, { code: branchId.toLowerCase() }] }
      });
      if (b) where.branchId = b.id;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        admission: { include: { student: true, course: true } },
        branch: true,
        createdBy: { select: { id: true, name: true } }
      },
      orderBy: { paymentDate: 'desc' }
    });
    res.json({ success: true, data: payments });
  } catch (err) {
    console.error('payments.list', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/payments
router.post('/', authenticate, authorize('SUPER_ADMIN','ADMIN','ACCOUNTS','COUNSELLOR','RECEPTIONIST'), async (req, res) => {
  try {
    const schema = z.object({
      admissionId: z.string().uuid(),
      receiptNumber: z.string().min(1),
      amount: z.number(),
      paymentMethod: z.string().min(1),
      transactionReference: z.string().optional(),
      remarks: z.string().optional(),
      status: z.string().optional(),
      branchId: z.string().optional()
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: parsed.error.message });

    const { admissionId, receiptNumber, amount, paymentMethod, transactionReference, remarks, status, branchId } = parsed.data;

    const admission = await prisma.admission.findUnique({ where: { id: admissionId } });
    let finalBranchId = branchId || admission?.branchId;
    if (finalBranchId) {
      const b = await prisma.branch.findFirst({
        where: { OR: [{ id: finalBranchId }, { code: finalBranchId.toLowerCase() }] }
      });
      if (b) finalBranchId = b.id;
    }

    const created = await prisma.payment.create({
      data: {
        admissionId,
        receiptNumber,
        amount,
        paymentMethod,
        transactionReference: transactionReference || null,
        remarks: remarks || null,
        status: status || 'SUCCESS',
        branchId: finalBranchId || null,
        createdById: req.user.id
      },
      include: { admission: { include: { student: true, course: true } }, branch: true }
    });

    res.json({ success: true, data: created });
  } catch (err) {
    console.error('payments.create', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
