const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticate } = require('../middleware/auth');


// GET /api/search?q=term
router.get('/', authenticate, async (req, res) => {
  try {
    const { z } = require('zod');
    const schema = z.object({ q: z.string().min(1).max(100).optional() });
    const parsed = schema.safeParse({ q: req.query.q });
    if (!parsed.success) return res.status(400).json({ success: false, message: parsed.error.message });
    const q = (req.query.q || '').toString().trim();
    if (!q) return res.json({ success: true, data: { leads: [], students: [], courses: [] } });

    const leads = await prisma.lead.findMany({ where: { OR: [{ firstName: { contains: q, mode: 'insensitive' } }, { lastName: { contains: q, mode: 'insensitive' } }, { phone: { contains: q } }, { email: { contains: q, mode: 'insensitive' } }] }, take: 20 });
    const students = await prisma.student.findMany({ where: { OR: [{ firstName: { contains: q, mode: 'insensitive' } }, { lastName: { contains: q, mode: 'insensitive' } }, { phone: { contains: q } }, { email: { contains: q, mode: 'insensitive' } }] }, take: 20 });
    const courses = await prisma.course.findMany({ where: { OR: [{ name: { contains: q, mode: 'insensitive' } }, { courseCode: { contains: q, mode: 'insensitive' } }] }, take: 20 });

    res.json({ success: true, data: { leads, students, courses } });
  } catch (err) {
    console.error('search error', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
