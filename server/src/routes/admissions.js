const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { z } = require('zod');
const prisma = new PrismaClient();

// GET /api/admissions
router.get('/', authenticate, async (req, res) => {
  try {
    const admissions = await prisma.admission.findMany({
      include: { student: true, course: true, batch: true, payments: true, counsellor: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: admissions });
  } catch (err) {
    console.error('admissions.list', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admissions
router.post('/', authenticate, authorize('SUPER_ADMIN','ADMIN','COUNSELLOR'), async (req, res) => {
  try {
    const schema = z.object({
      admissionNumber: z.string().optional().or(z.literal('')),
      studentId: z.string().uuid('Please select a valid student'),
      courseId: z.string().uuid('Please select a valid course'),
      batchId: z.string().uuid().optional().or(z.literal('')).nullable(),
      agreedFee: z.number().optional(),
      finalFee: z.number({ invalid_type_error: 'Final fee must be a number' }),
      counsellorId: z.string().uuid().optional().or(z.literal('')).nullable()
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return res.status(400).json({ success: false, message: `${issue.path.join('.')}: ${issue.message}` });
    }

    let { admissionNumber, studentId, courseId, batchId, agreedFee, finalFee, counsellorId } = parsed.data;

    if (!admissionNumber || !admissionNumber.trim()) {
      const count = await prisma.admission.count();
      admissionNumber = `ADM-${1001 + count}`;
    }

    const created = await prisma.admission.create({
      data: {
        admissionNumber: admissionNumber.trim(),
        studentId,
        courseId,
        batchId: batchId && batchId.trim() ? batchId.trim() : null,
        agreedFee: agreedFee || finalFee,
        finalFee,
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

// DELETE /api/admissions/:id
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.$transaction(async (tx) => {
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
