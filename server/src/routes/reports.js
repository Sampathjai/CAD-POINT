const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticate, authorize } = require('../middleware/auth');

// Allowed Roles for Reports: SUPER_ADMIN, ADMIN, ACCOUNTS, ACCOUNTANT
const REPORT_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'ACCOUNTANT'];

// GET /api/reports/students - Branch-scoped student report
router.get('/students', authenticate, authorize(...REPORT_ROLES), async (req, res) => {
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
router.get('/students/export', authenticate, authorize(...REPORT_ROLES), async (req, res) => {
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
      const code = a.student?.studentCode || 'N/A';
      const name = `"${(a.student?.firstName || '') + ' ' + (a.student?.lastName || '')}"`.trim();
      const phone = a.student?.phone || 'N/A';
      const email = a.student?.email || 'N/A';
      const b = a.branch?.name || 'Gandhipuram';
      const course = `"${a.course?.name || 'N/A'}"`;
      const sDate = a.startDate ? new Date(a.startDate).toISOString().split('T')[0] : 'N/A';
      const eDate = a.endDate ? new Date(a.endDate).toISOString().split('T')[0] : 'N/A';
      const pct = a.certificate?.completionPct || 0;
      const agreed = Number(a.finalFee) || 0;
      const totalPaid = (a.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const balance = Math.max(0, agreed - totalPaid);
      const certStatus = a.certificate?.status || 'NOT_STARTED';

      csvContent += `${code},${name},${phone},${email},${b},${course},${sDate},${eDate},${pct}%,${agreed},${totalPaid},${balance},${certStatus}\n`;
    });

    const filename = `CADPOINT-${branchName}-Student-Report.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    console.error('reports.students.export', err);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

module.exports = router;
