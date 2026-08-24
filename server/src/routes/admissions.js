const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { z } = require('zod');
const prisma = new PrismaClient();

// POST /api/admissions
router.post('/', authenticate, authorize('SUPER_ADMIN','ADMIN','COUNSELLOR'), async (req, res) => {
  try {
    const schema = z.object({ admissionNumber: z.string().min(1), studentId: z.string().uuid(), courseId: z.string().uuid(), batchId: z.string().uuid().optional(), agreedFee: z.number().optional(), finalFee: z.number(), counsellorId: z.string().uuid().optional() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: parsed.error.message });
    const { admissionNumber, studentId, courseId, batchId, agreedFee, finalFee, counsellorId } = parsed.data;
    const created = await prisma.admission.create({ data: { admissionNumber, studentId, courseId, batchId: batchId||null, agreedFee: agreedFee||finalFee, finalFee, counsellorId: counsellorId||null } });
    res.json({ success: true, data: created });
  } catch (err) {
    console.error('admissions.create', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
