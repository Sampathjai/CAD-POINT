const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { z } = require('zod');
const prisma = new PrismaClient();

// POST /api/payments
router.post('/', authenticate, authorize('SUPER_ADMIN','ADMIN','ACCOUNTS'), async (req, res) => {
  try {
    const schema = z.object({ admissionId: z.string().uuid(), receiptNumber: z.string().min(1), amount: z.number(), paymentMethod: z.string().min(1), transactionReference: z.string().optional(), status: z.string().optional() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: parsed.error.message });
    const { admissionId, receiptNumber, amount, paymentMethod, transactionReference, status } = parsed.data;
    const created = await prisma.payment.create({ data: { admissionId, receiptNumber, amount, paymentMethod, transactionReference: transactionReference||null, status: status||'SUCCESS', createdById: req.user.id } });
    res.json({ success: true, data: created });
  } catch (err) {
    console.error('payments.create', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
