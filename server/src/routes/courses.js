const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { z } = require('zod');
const prisma = new PrismaClient();

// GET /api/courses
router.get('/', authenticate, async (req, res) => {
  try {
    const courses = await prisma.course.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, data: courses });
  } catch (err) {
    console.error('courses.list', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

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

// PATCH /api/courses/:id
router.patch('/:id', authenticate, authorize('SUPER_ADMIN','ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    const schema = z.object({
      courseCode: z.string().min(1).optional(),
      name: z.string().min(1).optional(),
      description: z.string().optional().nullable(),
      standardFee: z.number().optional(),
      isActive: z.boolean().optional()
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: parsed.error.message });
    
    const updated = await prisma.course.update({
      where: { id },
      data: parsed.data
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('courses.update', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/courses/:id - Complete permanent deletion
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Hard delete all dependent items and the course in a single transaction
    await prisma.$transaction([
      prisma.payment.deleteMany({ where: { admission: { courseId: id } } }),
      prisma.admission.deleteMany({ where: { courseId: id } }),
      prisma.batch.deleteMany({ where: { courseId: id } }),
      prisma.course.delete({ where: { id } })
    ]);

    res.json({ success: true, message: `Course "${existing.name}" deleted completely from database` });
  } catch (err) {
    console.error('courses.delete', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
