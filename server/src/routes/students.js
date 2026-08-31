const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticate, authorize } = require('../middleware/auth');
const { z } = require('zod');

// Student Admissions Module Roles: SUPER_ADMIN, ADMIN, COUNSELLOR
const ADMISSION_ROLES = ['SUPER_ADMIN', 'ADMIN', 'COUNSELLOR'];

// GET /api/students
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
router.post('/', authenticate, authorize(...ADMISSION_ROLES), async (req, res) => {
  try {
    const schema = z.object({
      studentCode: z.string().optional().or(z.literal('')),
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().optional().or(z.literal('')).nullable(),
      phone: z.string().min(6, 'Valid phone number is required'),
      email: z.string().email('Invalid email address').optional().or(z.literal('')).nullable(),
      photoUrl: z.string().optional().or(z.literal('')).nullable(),
      branchId: z.string().optional()
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return res.status(400).json({ success: false, message: `${issue.path.join('.')}: ${issue.message}` });
    }

    let { studentCode, firstName, lastName, phone, email, photoUrl, branchId } = parsed.data;

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

    const student = await prisma.student.create({
      data: {
        studentCode,
        firstName,
        lastName: lastName || null,
        phone,
        email: email || null,
        photoUrl: photoUrl || null,
        branchId: finalBranchId
      },
      include: {
        branch: true
      }
    });

    res.status(201).json({ success: true, data: student });
  } catch (err) {
    console.error('students.create', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/students/:id
router.put('/:id', authenticate, authorize(...ADMISSION_ROLES), async (req, res) => {
  try {
    const { id } = req.params;
    const { studentCode, firstName, lastName, phone, email, photoUrl, branchId } = req.body;

    let finalBranchId = branchId;
    if (finalBranchId) {
      const b = await prisma.branch.findFirst({
        where: { OR: [{ id: finalBranchId }, { code: finalBranchId.toLowerCase() }] }
      });
      if (b) finalBranchId = b.id;
    }

    const updated = await prisma.student.update({
      where: { id },
      data: {
        ...(studentCode ? { studentCode: studentCode.trim() } : {}),
        firstName,
        lastName: lastName || null,
        phone,
        email: email || null,
        photoUrl: photoUrl || null,
        ...(finalBranchId ? { branchId: finalBranchId } : {})
      },
      include: { branch: true }
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('students.update', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/students/:id
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.student.delete({ where: { id } });
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (err) {
    console.error('students.delete', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
