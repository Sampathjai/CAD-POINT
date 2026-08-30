const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticate, authorize } = require('../middleware/auth');
const { z } = require('zod');


// GET /api/students
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

    const students = await prisma.student.findMany({
      where,
      include: {
        branch: true,
        admissions: { include: { course: true, batch: true, payments: true, certificate: true } },
        certificates: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: students });
  } catch (err) {
    console.error('students.list', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/students
router.post('/', authenticate, authorize('SUPER_ADMIN','ADMIN','COUNSELLOR','RECEPTIONIST'), async (req, res) => {
  try {
    const schema = z.object({
      studentCode: z.string().optional().or(z.literal('')),
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().optional().or(z.literal('')).nullable(),
      phone: z.string().min(6, 'Valid phone number is required'),
      email: z.string().email('Invalid email address').optional().or(z.literal('')).nullable(),
      branchId: z.string().optional()
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return res.status(400).json({ success: false, message: `${issue.path.join('.')}: ${issue.message}` });
    }

    let { studentCode, firstName, lastName, phone, email, branchId } = parsed.data;

    if (!studentCode || !studentCode.trim()) {
      const count = await prisma.student.count();
      studentCode = `STU-${1001 + count}`;
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

    const created = await prisma.student.create({
      data: {
        studentCode: studentCode.trim(),
        firstName: firstName.trim(),
        lastName: lastName && lastName.trim() ? lastName.trim() : null,
        phone: phone.trim(),
        email: email && email.trim() ? email.trim() : null,
        branchId: finalBranchId
      },
      include: { branch: true }
    });

    res.json({ success: true, data: created });
  } catch (err) {
    console.error('students.create', err);
    if (err.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Student code or phone number already exists' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/students/:id
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.$transaction(async (tx) => {
      const admissions = await tx.admission.findMany({ where: { studentId: id }, select: { id: true } });
      const admissionIds = admissions.map((a) => a.id);

      if (admissionIds.length > 0) {
        await tx.payment.deleteMany({ where: { admissionId: { in: admissionIds } } });
        await tx.admission.deleteMany({ where: { studentId: id } });
      }

      await tx.student.delete({ where: { id } });
    });

    res.json({ success: true, message: 'Student and related records deleted successfully' });
  } catch (err) {
    console.error('students.delete', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
