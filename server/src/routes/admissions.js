const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticate, authorize } = require('../middleware/auth');
const { z } = require('zod');


// GET /api/admissions
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
router.post('/', authenticate, authorize('SUPER_ADMIN','ADMIN','COUNSELLOR','RECEPTIONIST'), async (req, res) => {
  try {
    const schema = z.object({
      admissionNumber: z.string().optional().or(z.literal('')),
      studentId: z.string().uuid('Please select a valid student'),
      courseId: z.string().uuid('Please select a valid course'),
      batchId: z.string().uuid().optional().or(z.literal('')).nullable(),
      agreedFee: z.number().optional(),
      finalFee: z.number({ invalid_type_error: 'Final fee must be a number' }),
      counsellorId: z.string().uuid().optional().or(z.literal('')).nullable(),
      branchId: z.string().optional(),
      startDate: z.string().optional().nullable(),
      endDate: z.string().optional().nullable()
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return res.status(400).json({ success: false, message: `${issue.path.join('.')}: ${issue.message}` });
    }

    let { admissionNumber, studentId, courseId, batchId, agreedFee, finalFee, counsellorId, branchId, startDate, endDate } = parsed.data;

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

    const created = await prisma.admission.create({
      data: {
        admissionNumber: admissionNumber.trim(),
        studentId,
        courseId,
        batchId: batchId && batchId.trim() ? batchId.trim() : null,
        agreedFee: agreedFee || finalFee,
        finalFee,
        branchId: finalBranchId,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        counsellorId: counsellorId && counsellorId.trim() ? counsellorId.trim() : null
      }
    });

    res.json({ success: true, data: created });
  } catch (err) {
    console.error('admissions.create', err);
    if (err.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Admission number already exists' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/admissions/:id/progress - Update course dates, completion % & certificate status
router.patch('/:id/progress', authenticate, authorize('SUPER_ADMIN','ADMIN','COUNSELLOR','TRAINER'), async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate, completionPct, certificateStatus, issueDate } = req.body;

  try {
    const admission = await prisma.admission.findUnique({ where: { id }, include: { certificate: true, student: true } });
    if (!admission) return res.status(404).json({ success: false, message: 'Admission not found' });

    const updateData = {};
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (completionPct !== undefined) {
      updateData.completionPct = Math.min(100, Math.max(0, Number(completionPct) || 0));
    }

    const updated = await prisma.admission.update({
      where: { id },
      data: updateData,
      include: { student: true, course: true, certificate: true, branch: true }
    });

    // Sync or update Certificate record if certificateStatus passed
    if (certificateStatus) {
      const certCode = 'CERT-' + Date.now().toString(36).toUpperCase();
      const certData = {
        status: certificateStatus,
        issueDate: issueDate ? new Date(issueDate) : (certificateStatus === 'ISSUED' ? new Date() : null)
      };

      if (admission.certificate) {
        await prisma.certificate.update({ where: { id: admission.certificate.id }, data: certData });
      } else {
        await prisma.certificate.create({
          data: {
            studentId: admission.studentId,
            admissionId: admission.id,
            certificateNumber: certCode,
            ...certData
          }
        });
      }
    }

    const finalResult = await prisma.admission.findUnique({
      where: { id },
      include: { student: true, course: true, certificate: true, branch: true }
    });

    res.json({ success: true, data: finalResult });
  } catch (err) {
    console.error('admissions.progress', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admissions/:id
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.certificate.deleteMany({ where: { admissionId: id } });
      await tx.payment.deleteMany({ where: { admissionId: id } });
      await tx.admission.delete({ where: { id } });
    });
    res.json({ success: true, message: 'Admission deleted successfully' });
  } catch (err) {
    console.error('admissions.delete', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
