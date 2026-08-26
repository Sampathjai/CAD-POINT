const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { z } = require('zod');
const prisma = new PrismaClient();

// GET /api/students
router.get('/', authenticate, async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: { admissions: { include: { course: true, batch: true, payments: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: students });
  } catch (err) {
    console.error('students.list', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/students
router.post('/', authenticate, authorize('SUPER_ADMIN','ADMIN','COUNSELLOR'), async (req, res) => {
  try {
    const schema = z.object({
      studentCode: z.string().optional().or(z.literal('')),
      firstName: z.string().min(1, 'First name is required'),
      lastName: z.string().optional().or(z.literal('')).nullable(),
      phone: z.string().min(6, 'Valid phone number is required'),
      email: z.string().email('Invalid email address').optional().or(z.literal('')).nullable()
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return res.status(400).json({ success: false, message: `${issue.path.join('.')}: ${issue.message}` });
    }

    let { studentCode, firstName, lastName, phone, email } = parsed.data;

    if (!studentCode || !studentCode.trim()) {
      const count = await prisma.student.count();
      studentCode = `STU-${1001 + count}`;
    }

    const created = await prisma.student.create({
      data: {
        studentCode: studentCode.trim(),
        firstName: firstName.trim(),
        lastName: lastName && lastName.trim() ? lastName.trim() : null,
        phone: phone.trim(),
        email: email && email.trim() ? email.trim() : null
      }
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

module.exports = router;
