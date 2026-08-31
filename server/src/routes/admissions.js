const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticate, authorize } = require('../middleware/auth');
const { z } = require('zod');

// Student Admissions Module Roles: SUPER_ADMIN, ADMIN, COUNSELLOR
const ADMISSION_ROLES = ['SUPER_ADMIN', 'ADMIN', 'COUNSELLOR'];

// GET /api/admissions
router.get('/', authenticate, authorize(...ADMISSION_ROLES), async (req, res) => {
  try {
    const { branchId } = req.query;
    const where = {};
    if (branchId && branchId !== 'all') {
      const b = await prisma.branch.findFirst({
        where: { OR: [{ id: branchId }, { code: branchId.toLowerCase() }] }
      });
      if (b) where.branchId = b.id;
    }

    const admissions = await prisma.admission.findMany({
      where,
      include: {
        student: true,
        course: true,
        batch: true,
        payments: true,
        certificate: true,
        branch: true,
        counsellor: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: admissions });
  } catch (err) {
    console.error('admissions.list', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admissions
router.post('/', authenticate, authorize(...ADMISSION_ROLES), async (req, res) => {
  try {
    const schema = z.object({
      admissionNumber: z.string().optional().or(z.literal('')),
      studentId: z.string().uuid('Please select a valid student'),
      courseId: z.string().uuid('Please select a valid course'),
      batchId: z.string().uuid().optional().or(z.literal('')).nullable(),
      agreedFee: z.number().optional().or(z.literal(0)),
      finalFee: z.number().min(0, 'Fee cannot be negative'),
      counsellorId: z.string().uuid().optional().or(z.literal('')).nullable(),
      branchId: z.string().optional(),
      startDate: z.string().optional().or(z.literal('')).nullable(),
      endDate: z.string().optional().or(z.literal('')).nullable(),
      installmentPlan: z.array(z.object({ number: z.number(), planned: z.number() })).optional()
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return res.status(400).json({ success: false, message: `${issue.path.join('.')}: ${issue.message}` });
    }

    let { admissionNumber, studentId, courseId, batchId, agreedFee, finalFee, counsellorId, branchId, startDate, endDate, installmentPlan } = parsed.data;

    if (!admissionNumber || !admissionNumber.trim()) {
      const count = await prisma.admission.count();
      admissionNumber = `ADM-${1001 + count}`;
    }

    let finalBranchId = branchId;
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

    let planJson = null;
    if (Array.isArray(installmentPlan) && installmentPlan.length > 0) {
      if (installmentPlan.length > 3) {
        return res.status(400).json({ success: false, message: 'Maximum 3 installments allowed per admission.' });
      }
      const sumPlanned = installmentPlan.reduce((sum, item) => sum + (Number(item.planned) || 0), 0);
      if (sumPlanned > finalFee) {
        return res.status(400).json({ success: false, message: `Sum of planned installments (₹${sumPlanned.toLocaleString()}) cannot exceed total course fee (₹${finalFee.toLocaleString()}).` });
      }
      planJson = JSON.stringify(installmentPlan);
    }

    const admission = await prisma.admission.create({
      data: {
        admissionNumber,
        studentId,
        courseId,
        batchId: batchId || null,
        agreedFee: agreedFee || finalFee,
        finalFee,
        counsellorId: counsellorId || req.user?.id || null,
        branchId: finalBranchId,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        status: 'CONFIRMED',
        installmentPlan: planJson
      },
      include: {
        student: true,
        course: true,
        batch: true,
        payments: true,
        branch: true
      }
    });

    res.status(201).json({ success: true, data: admission });
  } catch (err) {
    console.error('admissions.create', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/admissions/:id/installments - Configure custom installment plan
router.patch('/:id/installments', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'COUNSELLOR', 'ACCOUNTS', 'ACCOUNTANT'), async (req, res) => {
  try {
    const { id } = req.params;
    const { installmentPlan } = req.body;

    const admission = await prisma.admission.findUnique({ where: { id }, include: { payments: true } });
    if (!admission) return res.status(404).json({ success: false, message: 'Admission record not found' });

    if (!Array.isArray(installmentPlan)) {
      return res.status(400).json({ success: false, message: 'installmentPlan must be an array' });
    }

    if (installmentPlan.length > 3) {
      return res.status(400).json({ success: false, message: 'Maximum 3 installments allowed per admission.' });
    }

    const finalFee = Number(admission.finalFee) || 0;
    const sumPlanned = installmentPlan.reduce((sum, item) => sum + (Number(item.planned) || 0), 0);

    if (sumPlanned > finalFee) {
      return res.status(400).json({
        success: false,
        message: `Sum of planned installments (₹${sumPlanned.toLocaleString()}) cannot exceed total course fee (₹${finalFee.toLocaleString()}).`
      });
    }

    // Payment-aware validation: planned amount cannot be less than already paid amount
    const instPayments = { 1: 0, 2: 0, 3: 0 };
    admission.payments.forEach(p => {
      const num = p.installmentNumber && [1, 2, 3].includes(p.installmentNumber) ? p.installmentNumber : 1;
      instPayments[num] += Number(p.amount) || 0;
    });

    for (const item of installmentPlan) {
      const num = item.number;
      const planned = Number(item.planned) || 0;
      const paid = instPayments[num] || 0;
      if (planned < paid) {
        return res.status(400).json({
          success: false,
          message: `Installment ${num} planned amount (₹${planned.toLocaleString()}) cannot be less than already paid amount (₹${paid.toLocaleString()}).`
        });
      }
    }

    const updated = await prisma.admission.update({
      where: { id },
      data: {
        installmentPlan: JSON.stringify(installmentPlan)
      },
      include: { student: true, course: true, batch: true, payments: true, branch: true }
    });

    res.json({ success: true, data: updated, message: 'Installment plan configured successfully' });
  } catch (err) {
    console.error('admissions.installments.update', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/admissions/:id/progress - Update progress & certificate info (Trainers, Counsellors, Admins)
router.patch('/:id/progress', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'COUNSELLOR', 'TRAINER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, completionPct, certificateStatus, issueDate } = req.body;

    const admission = await prisma.admission.findUnique({ where: { id } });
    if (!admission) return res.status(404).json({ success: false, message: 'Admission record not found' });

    if (startDate || endDate) {
      await prisma.admission.update({
        where: { id },
        data: {
          ...(startDate ? { startDate: new Date(startDate) } : {}),
          ...(endDate ? { endDate: new Date(endDate) } : {})
        }
      });
    }

    const certificate = await prisma.certificate.upsert({
      where: { admissionId: id },
      create: {
        admissionId: id,
        studentId: admission.studentId,
        courseId: admission.courseId,
        certificateNumber: `CERT-${Date.now().toString(36).toUpperCase()}`,
        completionPct: Number(completionPct) || 0,
        status: certificateStatus || 'NOT_STARTED',
        issueDate: issueDate ? new Date(issueDate) : null
      },
      update: {
        completionPct: Number(completionPct) || 0,
        status: certificateStatus || 'NOT_STARTED',
        issueDate: issueDate ? new Date(issueDate) : null
      }
    });

    const updatedAdmission = await prisma.admission.findUnique({
      where: { id },
      include: { student: true, course: true, certificate: true, branch: true }
    });

    res.json({ success: true, data: updatedAdmission });
  } catch (err) {
    console.error('admissions.progress.update', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admissions/:id
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.admission.delete({ where: { id } });
    res.json({ success: true, message: 'Admission deleted successfully' });
  } catch (err) {
    console.error('admissions.delete', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
