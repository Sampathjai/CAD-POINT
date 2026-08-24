const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { z } = require('zod');
const prisma = new PrismaClient();

// POST /api/students
router.post('/', authenticate, authorize('SUPER_ADMIN','ADMIN','COUNSELLOR'), async (req, res) => {
  try {
    const schema = z.object({ studentCode: z.string().min(1), firstName: z.string().min(1), lastName: z.string().optional(), phone: z.string().min(6), email: z.string().email().optional() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: parsed.error.message });
    const { studentCode, firstName, lastName, phone, email } = parsed.data;
    const created = await prisma.student.create({ data: { studentCode, firstName, lastName: lastName||null, phone, email: email||null } });
    res.json({ success: true, data: created });
  } catch (err) {
    console.error('students.create', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
