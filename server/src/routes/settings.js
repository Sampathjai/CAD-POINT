const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const { z } = require('zod');
const prisma = new PrismaClient();

// In-memory / DB backed system settings store (for Institute profile & integrations)
let systemSettings = {
  instituteName: 'CAD Point Training Institute',
  tagline: 'Premier CAD & BIM Training CRM',
  contactEmail: 'admin@cadpoint.com',
  contactPhone: '+91 98765 43210',
  address: '123 Tech Park, CAD Point Road',
  city: 'Kochi',
  state: 'Kerala',
  pincode: '682001',
  gstin: '32AAAAA0000A1Z5',
  currency: 'INR (₹)',
  whatsappEnabled: false,
  whatsappApiUrl: 'https://graph.facebook.com/v18.0/',
  whatsappPhoneNumberId: '1092837465',
  whatsappAccessToken: '••••••••••••••••••••',
  autoAssignLeads: true,
  defaultCounsellorId: '',
  storageLocation: process.env.STORAGE_PATH || './storage',
  backupDir: process.env.BACKUP_PATH || './storage/backups',
  maxStorageLimitMB: 10240,
  autoBackupEnabled: true,
  backupFrequency: 'DAILY',
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: '5432',
  dbName: 'cadpoint_crm',
  dbUser: 'postgres'
};

// GET /api/settings - Fetch all settings & enquiry sources
router.get('/', authenticate, async (req, res) => {
  try {
    const sources = await prisma.enquirySource.findMany({ orderBy: { name: 'asc' } });
    const leadCount = await prisma.lead.count();
    const studentCount = await prisma.student.count();
    const paymentCount = await prisma.payment.count();

    res.json({
      success: true,
      data: {
        profile: systemSettings,
        sources,
        system: {
          nodeVersion: process.version,
          environment: process.env.NODE_ENV || 'development',
          database: 'PostgreSQL (cadpoint_crm)',
          port: process.env.PORT || 5001,
          metrics: {
            leadCount,
            studentCount,
            paymentCount,
            dbHealth: 'Healthy & Connected'
          }
        }
      }
    });
  } catch (err) {
    console.error('settings.get', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/settings - Update institute profile & settings (SUPER_ADMIN, ADMIN)
router.patch('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const schema = z.object({
      instituteName: z.string().optional(),
      tagline: z.string().optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
      gstin: z.string().optional(),
      whatsappEnabled: z.boolean().optional(),
      whatsappApiUrl: z.string().optional(),
      whatsappPhoneNumberId: z.string().optional(),
      whatsappAccessToken: z.string().optional(),
      autoAssignLeads: z.boolean().optional(),
      storageLocation: z.string().optional(),
      backupDir: z.string().optional(),
      maxStorageLimitMB: z.union([z.number(), z.string()]).optional(),
      autoBackupEnabled: z.boolean().optional(),
      backupFrequency: z.string().optional(),
      dbHost: z.string().optional(),
      dbPort: z.union([z.number(), z.string()]).optional(),
      dbName: z.string().optional(),
      dbUser: z.string().optional()
    });
    const parsed = schema.parse(req.body);
    systemSettings = { ...systemSettings, ...parsed };
    res.json({ success: true, data: systemSettings });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, message: err.errors });
    console.error('settings.patch', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/settings/sources - Add a new enquiry source (SUPER_ADMIN, ADMIN)
router.post('/sources', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Source name required' });
    const created = await prisma.enquirySource.upsert({
      where: { name: name.trim() },
      update: { isActive: true },
      create: { name: name.trim() }
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error('settings.sources.add', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/settings/whatsapp/send - Send WhatsApp message via Cloud API or fallback web link
router.post('/whatsapp/send', authenticate, async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ success: false, message: 'Phone number and message required' });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;

    if (systemSettings.whatsappEnabled && systemSettings.whatsappAccessToken && systemSettings.whatsappPhoneNumberId) {
      try {
        const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
        const apiUrl = `${systemSettings.whatsappApiUrl.replace(/\/$/, '')}/${systemSettings.whatsappPhoneNumberId}/messages`;

        const apiRes = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${systemSettings.whatsappAccessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: fullPhone,
            type: 'text',
            text: { body: message }
          })
        });

        const apiJson = await apiRes.json();
        if (apiRes.ok) {
          return res.json({ success: true, message: 'WhatsApp message sent via Cloud API', data: apiJson });
        }
      } catch (apiErr) {
        console.error('WhatsApp API request error:', apiErr);
      }
    }

    const waUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
    res.json({
      success: true,
      message: 'WhatsApp link generated',
      data: { waUrl }
    });
  } catch (err) {
    console.error('settings.whatsapp.send', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/settings/backup/trigger - Trigger database & storage backup snapshot
router.post('/backup/trigger', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const targetDir = systemSettings.backupDir || './backups';

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `cadpoint_crm_backup_${timestamp}.json`;
    const backupFilePath = path.join(targetDir, backupFileName);

    const leads = await prisma.lead.findMany();
    const students = await prisma.student.findMany();
    const courses = await prisma.course.findMany();
    const admissions = await prisma.admission.findMany();
    const payments = await prisma.payment.findMany();

    const dumpData = {
      timestamp: new Date(),
      systemSettings,
      summary: {
        leads: leads.length,
        students: students.length,
        courses: courses.length,
        admissions: admissions.length,
        payments: payments.length
      },
      data: { leads, students, courses, admissions, payments }
    };

    fs.writeFileSync(backupFilePath, JSON.stringify(dumpData, null, 2));
    const stats = fs.statSync(backupFilePath);

    res.json({
      success: true,
      message: 'Database & Storage backup snapshot successfully created!',
      data: {
        fileName: backupFileName,
        filePath: backupFilePath,
        fileSizeBytes: stats.size,
        fileSizeFormatted: (stats.size / 1024).toFixed(2) + ' KB',
        createdAt: new Date()
      }
    });
  } catch (err) {
    console.error('settings.backup.trigger', err);
    res.status(500).json({ success: false, message: 'Backup creation failed: ' + err.message });
  }
});

// GET /api/settings/storage/drives - Detect available local disk drives/volumes on system
router.get('/storage/drives', authenticate, async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const drives = [];

    // 1. Root System Drive
    drives.push({
      id: 'root',
      label: '💾 Primary System Disk (/)',
      path: '/var/cadpoint/storage',
      description: 'System root drive volume'
    });

    // 2. User Home Directory Drive
    const userHome = os.homedir();
    drives.push({
      id: 'user_home',
      label: `📁 User Home Directory (${userHome})`,
      path: path.join(userHome, 'cadpoint_storage'),
      description: 'User home directory storage'
    });

    // 3. Application Local Directory
    drives.push({
      id: 'app_local',
      label: '💽 Project Local Workspace (./storage)',
      path: './storage',
      description: 'Default project workspace storage folder'
    });

    // 4. macOS / Linux Mounted External Volumes (/Volumes or /mnt or /media)
    if (process.platform === 'darwin' && fs.existsSync('/Volumes')) {
      try {
        const vols = fs.readdirSync('/Volumes');
        for (const vol of vols) {
          if (!vol.startsWith('.')) {
            const volPath = path.join('/Volumes', vol);
            drives.push({
              id: 'vol_' + vol.toLowerCase().replace(/[^a-z0-9]/g, '_'),
              label: `🔌 External Volume (${vol})`,
              path: path.join(volPath, 'cadpoint_data'),
              description: `Mounted local drive volume at ${volPath}`
            });
          }
        }
      } catch (e) {
        console.warn('Error reading /Volumes:', e);
      }
    } else if (process.platform === 'win32') {
      const winDrives = ['C', 'D', 'E', 'F', 'G', 'H'];
      for (const letter of winDrives) {
        const drivePath = `${letter}:\\`;
        if (fs.existsSync(drivePath)) {
          drives.push({
            id: 'win_' + letter.toLowerCase(),
            label: `💽 Local Disk (${letter}:)`,
            path: `${letter}:\\CADPoint_Storage`,
            description: `Windows Local Disk ${letter}:`
          });
        }
      }
    }

    res.json({ success: true, data: drives });
  } catch (err) {
    console.error('settings.storage.drives', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

