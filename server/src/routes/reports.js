const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticate, authorize } = require('../middleware/auth');

// Allowed Roles for Financial Student Reports: SUPER_ADMIN, ADMIN, ACCOUNTS, ACCOUNTANT
const REPORT_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS', 'ACCOUNTANT'];

// GET /api/reports/counsellor-dashboard - Dedicated non-financial analytics API for Counsellor role
router.get('/counsellor-dashboard', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'COUNSELLOR'), async (req, res) => {
  try {
    const { branchId, period = '6_months' } = req.query;

    const whereLead = {};
    const whereAdmission = {};

    if (branchId && branchId !== 'all') {
      const b = await prisma.branch.findFirst({
        where: { OR: [{ id: branchId }, { code: branchId.toLowerCase() }] }
      });
      if (b) {
        whereLead.branchId = b.id;
        whereAdmission.branchId = b.id;
      }
    }

    // Determine month count
    const numMonths = period === '12_months' || period === 'this_year' ? 12 : 6;
    const now = new Date();

    // Generate chronological month slots (oldest -> newest)
    const monthSlots = [];
    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${y}-${m}`;
      const monthLabel = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      const shortMonth = d.toLocaleString('default', { month: 'short' });
      monthSlots.push({ key, year: y, monthIndex: d.getMonth(), monthLabel, shortMonth, enquiries: 0, admissions: 0 });
    }

    // Fetch leads & admissions
    const [allLeads, allAdmissions, followUpsCount] = await Promise.all([
      prisma.lead.findMany({ where: whereLead, select: { id: true, status: true, createdAt: true } }),
      prisma.admission.findMany({ where: whereAdmission, select: { id: true, createdAt: true, startDate: true } }),
      prisma.followUp.count({ where: { status: 'PENDING' } })
    ]);

    const totalLeads = allLeads.length;
    const newLeads = allLeads.filter((l) => (l.status || '').toUpperCase() === 'NEW').length;
    const convertedLeads = allLeads.filter((l) => (l.status || '').toUpperCase() === 'CONVERTED' || (l.status || '').toUpperCase() === 'ENROLLED').length;
    const totalAdmissions = allAdmissions.length;

    const convRatio = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
    const conversionRate = `${convRatio}%`;

    // Map counts to month slots
    const monthlyEnquiriesMap = {};
    const monthlyAdmissionsMap = {};

    allLeads.forEach((l) => {
      if (!l.createdAt) return;
      const d = new Date(l.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyEnquiriesMap[key] = (monthlyEnquiriesMap[key] || 0) + 1;
    });

    allAdmissions.forEach((a) => {
      const d = new Date(a.createdAt || a.startDate);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyAdmissionsMap[key] = (monthlyAdmissionsMap[key] || 0) + 1;
    });

    const monthlyEnquiries = monthSlots.map((slot) => ({
      month: slot.monthLabel,
      shortMonth: slot.shortMonth,
      key: slot.key,
      count: monthlyEnquiriesMap[slot.key] || 0
    }));

    const monthlyAdmissions = monthSlots.map((slot) => ({
      month: slot.monthLabel,
      shortMonth: slot.shortMonth,
      key: slot.key,
      count: monthlyAdmissionsMap[slot.key] || 0
    }));

    // Strictly non-financial response
    return res.json({
      success: true,
      data: {
        totalLeads,
        newLeads,
        followUps: followUpsCount,
        convertedLeads,
        totalAdmissions,
        conversionRate,
        monthlyEnquiries,
        monthlyAdmissions
      }
    });
  } catch (err) {
    console.error('reports.counsellor-dashboard', err);
    res.status(500).json({ success: false, message: 'Server error loading counsellor dashboard' });
  }
});

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
