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

// DELETE /api/courses/:id
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    const batchesCount = await prisma.batch.count({ where: { courseId: id } });
    const admissionsCount = await prisma.admission.count({ where: { courseId: id } });

    if (batchesCount > 0 || admissionsCount > 0) {
      const updated = await prisma.course.update({
        where: { id },
        data: { isActive: false }
      });
      return res.json({ success: true, message: 'Course has associated batches or student admissions. Course deactivated.', data: updated });
    }

    await prisma.course.delete({ where: { id } });
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (err) {
    console.error('courses.delete', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
