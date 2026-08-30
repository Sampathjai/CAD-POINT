const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticate } = require('../middleware/auth');

// GET /api/reports/students - Branch-scoped student report
router.get('/students', authenticate, async (req, res) => {
  try {
    const { branchId, courseId, certificateStatus, fromDate, toDate } = req.query;

    const where = {};
    if (branchId && branchId !== 'all') {
      const b = await prisma.branch.findFirst({
        where: { OR: [{ id: branchId }, { code: branchId.toLowerCase() }] }
      });
      if (b) where.branchId = b.id;
    }
    if (courseId && courseId !== 'all') where.courseId = courseId;
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    let admissions = await prisma.admission.findMany({
      where,
      include: {
        student: true,
        course: true,
        batch: true,
        payments: true,
        certificate: true,
        branch: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (certificateStatus && certificateStatus !== 'all') {
      admissions = admissions.filter((a) => {
        const status = a.certificate?.status || 'NOT_STARTED';
        return status === certificateStatus;
      });
    }

    res.json({ success: true, data: admissions });
  } catch (err) {
    console.error('reports.students', err);
    res.status(500).json({ success: false, message: 'Server error generating report' });
  }
});

// GET /api/reports/students/export - Export CSV
router.get('/students/export', authenticate, async (req, res) => {
  try {
    const { branchId, courseId, certificateStatus } = req.query;

    let branchName = 'Coimbatore-All-Branches';
    const where = {};
    if (branchId && branchId !== 'all') {
      const b = await prisma.branch.findFirst({
        where: { OR: [{ id: branchId }, { code: branchId.toLowerCase() }] }
      });
      if (b) {
        where.branchId = b.id;
        branchName = b.name.replace(/\s+/g, '-');
      }
    }
    if (courseId && courseId !== 'all') where.courseId = courseId;

    let admissions = await prisma.admission.findMany({
      where,
      include: {
        student: true,
        course: true,
        batch: true,
        payments: true,
        certificate: true,
        branch: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (certificateStatus && certificateStatus !== 'all') {
      admissions = admissions.filter((a) => {
        const status = a.certificate?.status || 'NOT_STARTED';
        return status === certificateStatus;
      });
    }

    let csvContent = 'Student Code,Student Name,Phone,Email,Branch,Course,Start Date,End Date,Completion %,Agreed Fee,Total Paid,Balance,Certificate Status\n';

    admissions.forEach((a) => {
      const s = a.student;
      const c = a.course;
      const b = a.branch?.name || 'Gandhipuram';
      const totalPaid = (a.payments || []).reduce((acc, p) => acc + Number(p.amount || 0), 0);
      const balance = Number(a.finalFee || a.agreedFee || 0) - totalPaid;
      const certStatus = a.certificate?.status || 'NOT_STARTED';
      const sDate = a.startDate ? new Date(a.startDate).toLocaleDateString() : 'N/A';
      const eDate = a.endDate ? new Date(a.endDate).toLocaleDateString() : 'N/A';

      csvContent += `"${s?.studentCode || ''}","${s?.firstName || ''} ${s?.lastName || ''}","${s?.phone || ''}","${s?.email || ''}","${b}","${c?.name || ''}","${sDate}","${eDate}","${a.completionPct || 0}%","${a.agreedFee || 0}","${totalPaid}","${balance}","${certStatus}"\n`;
    });

    const filename = `CADPOINT-${branchName}-Student-Report.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (err) {
    console.error('reports.export', err);
    res.status(500).json({ success: false, message: 'Server error exporting report' });
  }
});

module.exports = router;
