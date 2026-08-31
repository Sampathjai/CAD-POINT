const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticate, authorize } = require('../middleware/auth');
const { z } = require('zod');

// Batches Module Roles: SUPER_ADMIN, ADMIN, COUNSELLOR, TRAINER, RECEPTIONIST
const BATCH_ROLES = ['SUPER_ADMIN', 'ADMIN', 'COUNSELLOR', 'TRAINER', 'RECEPTIONIST'];

// GET /api/batches
router.get('/', authenticate, authorize(...BATCH_ROLES), async (req, res) => {
  try {
    const batches = await prisma.batch.findMany({
      include: {
        course: true,
        trainer: { select: { id: true, name: true } },
        admissions: { include: { student: true, certificate: true } }
      },
      orderBy: { startDate: 'desc' }
    });
    res.json({ success: true, data: batches });
  } catch (err) {
    console.error('batches.list', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/batches
router.post('/', authenticate, authorize(...BATCH_ROLES), async (req, res) => {
  try {
    const schema = z.object({
      batchCode: z.string().min(1),
      name: z.string().min(1),
      courseId: z.string().uuid(),
      trainerId: z.string().optional().or(z.literal('')).nullable(),
      startDate: z.string().min(1),
      endDate: z.string().optional().or(z.literal('')).nullable(),
      capacity: z.number().optional(),
      progress: z.string().optional(),
      syllabusProgress: z.number().optional(),
      certificateStatus: z.string().optional()
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, message: parsed.error.message });
    const { batchCode, name, courseId, trainerId, startDate, endDate, capacity, progress, syllabusProgress, certificateStatus } = parsed.data;

    const created = await prisma.batch.create({
      data: {
        batchCode,
        name,
        courseId,
        trainerId: trainerId || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        capacity: capacity || 25,
        progress: progress || 'In Progress',
        syllabusProgress: typeof syllabusProgress === 'number' ? syllabusProgress : 0,
        certificateStatus: certificateStatus || 'IN_PROGRESS'
      },
      include: {
        course: true,
        trainer: { select: { id: true, name: true } },
        admissions: { include: { student: true, certificate: true } }
      }
    });
    res.json({ success: true, data: created, message: 'Batch created successfully.' });
  } catch (err) {
    console.error('batches.create', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/batches/:id - Update batch details and cascade sync to admissions
router.put('/:id', authenticate, authorize(...BATCH_ROLES), async (req, res) => {
  try {
    const { id } = req.params;
    const { batchCode, name, courseId, trainerId, startDate, endDate, capacity, status, progress, syllabusProgress, certificateStatus } = req.body;

    const existing = await prisma.batch.findUnique({ where: { id }, include: { admissions: true } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const newSyllabusPct = typeof syllabusProgress === 'number' ? Math.min(100, Math.max(0, syllabusProgress)) : existing.syllabusProgress;
    const newProgress = progress || existing.progress;
    const newCertStatus = certificateStatus || existing.certificateStatus;

    const updated = await prisma.batch.update({
      where: { id },
      data: {
        ...(batchCode ? { batchCode: batchCode.trim() } : {}),
        ...(name ? { name: name.trim() } : {}),
        ...(courseId ? { courseId } : {}),
        trainerId: trainerId !== undefined ? (trainerId || null) : existing.trainerId,
        ...(startDate ? { startDate: new Date(startDate) } : {}),
        ...(endDate ? { endDate: new Date(endDate) } : {}),
        ...(capacity ? { capacity: Number(capacity) || 25 } : {}),
        ...(status ? { status } : {}),
        progress: newProgress,
        syllabusProgress: newSyllabusPct,
        certificateStatus: newCertStatus
      },
      include: {
        course: true,
        trainer: { select: { id: true, name: true } },
        admissions: { include: { student: true, certificate: true } }
      }
    });

    // Cascade update linked admissions
    if (existing.admissions.length > 0) {
      await prisma.admission.updateMany({
        where: { batchId: id },
        data: { completionPct: newSyllabusPct }
      });

      // Update certificate status for all admissions in batch if requested
      if (newCertStatus) {
        const batchAdmissions = await prisma.admission.findMany({ where: { batchId: id }, select: { id: true } });
        const admissionIds = batchAdmissions.map((a) => a.id);
        if (admissionIds.length > 0) {
          await prisma.certificate.updateMany({
            where: { admissionId: { in: admissionIds } },
            data: { status: newCertStatus }
          });
        }
      }
    }

    res.json({ success: true, data: updated, message: 'Batch updated and synchronized successfully.' });
  } catch (err) {
    console.error('batches.update', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/batches/:id/assign - Assign students to batch with capacity validation
router.post('/:id/assign', authenticate, authorize(...BATCH_ROLES), async (req, res) => {
  try {
    const { id } = req.params;
    const { studentIds, admissionIds } = req.body;

    const batch = await prisma.batch.findUnique({
      where: { id },
      include: { admissions: true }
    });

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const currentAssignedCount = batch.admissions.length;
    const capacity = batch.capacity || 25;
    const availableSeats = Math.max(0, capacity - currentAssignedCount);

    let targetAdmissionIds = [];

    if (Array.isArray(studentIds) && studentIds.length > 0) {
      const admissions = await prisma.admission.findMany({
        where: { studentId: { in: studentIds } },
        select: { id: true }
      });
      targetAdmissionIds = admissions.map((a) => a.id);
    } else if (Array.isArray(admissionIds) && admissionIds.length > 0) {
      targetAdmissionIds = admissionIds;
    }

    if (targetAdmissionIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid students selected for batch assignment.' });
    }

    // Exclude admissions already assigned to this batch
    const newAdmissionsToAssign = targetAdmissionIds.filter(
      (admId) => !batch.admissions.some((existing) => existing.id === admId)
    );

    if (newAdmissionsToAssign.length > availableSeats) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableSeats} seat${availableSeats === 1 ? '' : 's'} available in this batch (${batch.name}). Cannot assign ${newAdmissionsToAssign.length} student(s).`
      });
    }

    // Update batchId and sync syllabus progress to newly assigned admissions
    await prisma.admission.updateMany({
      where: { id: { in: targetAdmissionIds } },
      data: {
        batchId: id,
        completionPct: batch.syllabusProgress
      }
    });

    const updatedBatch = await prisma.batch.findUnique({
      where: { id },
      include: {
        course: true,
        trainer: { select: { id: true, name: true } },
        admissions: { include: { student: true, certificate: true } }
      }
    });

    res.json({ success: true, data: updatedBatch, message: 'Students assigned to batch successfully.' });
  } catch (err) {
    console.error('batches.assign', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/batches/:id/unassign - Remove student from batch
router.post('/:id/unassign', authenticate, authorize(...BATCH_ROLES), async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, admissionId } = req.body;

    const where = { batchId: id };
    if (studentId) where.studentId = studentId;
    else if (admissionId) where.id = admissionId;
    else return res.status(400).json({ success: false, message: 'Student ID or Admission ID is required.' });

    await prisma.admission.updateMany({
      where,
      data: { batchId: null }
    });

    const updatedBatch = await prisma.batch.findUnique({
      where: { id },
      include: {
        course: true,
        trainer: { select: { id: true, name: true } },
        admissions: { include: { student: true, certificate: true } }
      }
    });

    res.json({ success: true, data: updatedBatch, message: 'Student removed from batch successfully.' });
  } catch (err) {
    console.error('batches.unassign', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/batches/:id
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.batch.delete({ where: { id } });
    res.json({ success: true, message: 'Batch deleted successfully' });
  } catch (err) {
    console.error('batches.delete', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
