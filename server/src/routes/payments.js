const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticate, authorize } = require('../middleware/auth');
const { z } = require('zod');

// Allowed Roles for Payments: SUPER_ADMIN, ADMIN, ACCOUNTS, ACCOUNTANT
const PAYMENT_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'ACCOUNTANT'];

// GET /api/payments with branch, date range, and month filtering
router.get('/', authenticate, authorize(...PAYMENT_ROLES), async (req, res) => {
  try {
    const { branchId, fromDate, toDate, month } = req.query;
    const where = {};

    if (branchId && branchId !== 'all') {
      const b = await prisma.branch.findFirst({
        where: { OR: [{ id: branchId }, { code: branchId.toLowerCase() }] }
      });
      if (b) where.branchId = b.id;
    }

    // Filter by paymentDate timestamp
    if (fromDate || toDate) {
      where.paymentDate = {};
      if (fromDate) where.paymentDate.gte = new Date(fromDate);
      if (toDate) where.paymentDate.lte = new Date(toDate + 'T23:59:59.999Z');
    } else if (month && month !== 'ALL') {
      const parts = month.split('-');
      if (parts.length === 2) {
        const year = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const start = new Date(year, m - 1, 1);
        const end = new Date(year, m, 0, 23, 59, 59, 999);
        where.paymentDate = { gte: start, lte: end };
      }
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

// POST /api/payments - Record payment against an installment
router.post('/', authenticate, authorize(...PAYMENT_ROLES), async (req, res) => {
  try {
    const schema = z.object({
      admissionId: z.string().uuid(),
      receiptNumber: z.string().optional().or(z.literal('')),
      amount: z.number().min(1, 'Payment amount must be greater than 0'),
      paymentMethod: z.string().min(1, 'Payment method is required'),
      installmentNumber: z.number().int().min(1).max(3).optional().default(1),
      transactionReference: z.string().optional().or(z.literal('')).nullable(),
      notes: z.string().optional().or(z.literal('')).nullable(),
      branchId: z.string().optional()
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return res.status(400).json({ success: false, message: `${issue.path.join('.')}: ${issue.message}` });
    }

    let { admissionId, receiptNumber, amount, paymentMethod, installmentNumber, transactionReference, notes, branchId } = parsed.data;

    // Fetch admission to validate overpayment
    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      include: { payments: true, course: true, student: true }
    });

    if (!admission) {
      return res.status(404).json({ success: false, message: 'Admission record not found' });
    }

    const finalFee = Number(admission.finalFee) || 0;
    const existingTotalPaid = admission.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const remainingAdmissionFee = Math.max(0, finalFee - existingTotalPaid);

    if (amount > remainingAdmissionFee) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (₹${amount.toLocaleString()}) cannot exceed the remaining admission fee (₹${remainingAdmissionFee.toLocaleString()}).`
      });
    }

    // Generate receiptNumber if missing
    if (!receiptNumber || !receiptNumber.trim()) {
      receiptNumber = `REC-${Date.now().toString(36).toUpperCase()}`;
    }

    // Resolve branch ID if provided
    let finalBranchId = branchId || admission.branchId;
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

    const payment = await prisma.payment.create({
      data: {
        admissionId,
        receiptNumber,
        amount,
        paymentMethod: paymentMethod.toUpperCase(),
        installmentNumber: installmentNumber || 1,
        transactionReference: transactionReference || null,
        notes: notes || null,
        branchId: finalBranchId,
        createdById: req.user?.id || null
      },
      include: {
        admission: { include: { student: true, course: true, payments: true } },
        branch: true
      }
    });

    res.status(201).json({ success: true, data: payment, message: 'Payment recorded successfully' });
  } catch (err) {
    console.error('payments.create', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/payments/:id - Edit payment record
router.put('/:id', authenticate, authorize(...PAYMENT_ROLES), async (req, res) => {
  try {
    const { id } = req.params;
    const schema = z.object({
      receiptNumber: z.string().optional(),
      amount: z.number().min(1, 'Payment amount must be greater than 0'),
      paymentMethod: z.string().min(1, 'Payment method is required'),
      installmentNumber: z.number().int().min(1).max(3).optional(),
      transactionReference: z.string().optional().or(z.literal('')).nullable(),
      notes: z.string().optional().or(z.literal('')).nullable(),
      remarks: z.string().optional().or(z.literal('')).nullable()
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return res.status(400).json({ success: false, message: `${issue.path.join('.')}: ${issue.message}` });
    }

    const { receiptNumber, amount, paymentMethod, installmentNumber, transactionReference, notes, remarks } = parsed.data;

    const existingPayment = await prisma.payment.findUnique({
      where: { id },
      include: { admission: { include: { payments: true, student: true, course: true } } }
    });

    if (!existingPayment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    // Overpayment validation excluding this payment's current amount
    if (existingPayment.admission) {
      const finalFee = Number(existingPayment.admission.finalFee) || 0;
      const otherPaymentsTotal = existingPayment.admission.payments
        .filter((p) => p.id !== id)
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const remainingFee = Math.max(0, finalFee - otherPaymentsTotal);

      if (amount > remainingFee) {
        return res.status(400).json({
          success: false,
          message: `Updated amount (₹${amount.toLocaleString()}) exceeds the maximum allowable fee (₹${remainingFee.toLocaleString()}).`
        });
      }
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        ...(receiptNumber ? { receiptNumber: receiptNumber.trim() } : {}),
        amount,
        paymentMethod: paymentMethod.toUpperCase(),
        ...(installmentNumber ? { installmentNumber } : {}),
        transactionReference: transactionReference || null,
        notes: notes || remarks || null,
        remarks: remarks || notes || null
      },
      include: {
        admission: { include: { student: true, course: true, payments: true } },
        branch: true
      }
    });

    res.json({ success: true, data: updatedPayment, message: 'Payment updated successfully' });
  } catch (err) {
    console.error('payments.update', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/payments/:id - Delete payment record
router.delete('/:id', authenticate, authorize(...PAYMENT_ROLES), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.payment.delete({ where: { id } });
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (err) {
    console.error('payments.delete', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
