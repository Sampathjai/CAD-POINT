const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { z } = require('zod');
const prisma = new PrismaClient();

// POST /api/courses
router.post('/', authenticate, authorize('SUPER_ADMIN','ADMIN'), async (req, res) => {
  try {
    const schema = z.object({ courseCode: z.string().min(1), name: z.string().min(1), description: z.string().optional(), standardFee: z.number() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: parsed.error.message });
    const { courseCode, name, description, standardFee } = parsed.data;
    const created = await prisma.course.create({ data: { courseCode, name, description: description || null, standardFee } });
    res.json({ success: true, data: created });
  } catch (err) {
    console.error('courses.create', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
