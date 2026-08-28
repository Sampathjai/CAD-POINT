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

const storageService = require('../services/storageService');

// GET /api/settings - Fetch all settings & enquiry sources
router.get('/', authenticate, async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const organizationId = req.user?.organizationId || 'org_default';
    const sources = await prisma.enquirySource.findMany({ orderBy: { name: 'asc' } });
    const leadCount = await prisma.lead.count();
    const studentCount = await prisma.student.count();
    const paymentCount = await prisma.payment.count();

    const storageUsage = await storageService.getStorageUsage(organizationId);
    const storageTest = await storageService.testStorageConnection();

    // Sanitize profile object for production security
    const sanitizedProfile = { ...systemSettings };
    if (isProduction) {
      sanitizedProfile.storageLocation = 'Cloud Object Storage (Supabase / S3)';
      sanitizedProfile.backupDir = 'Cloud Vault (organizations/' + organizationId + '/backups)';
      sanitizedProfile.dbHost = 'PostgreSQL Cloud Database';
      sanitizedProfile.dbUser = 'cadpoint_db_user';
    }

    res.json({
      success: true,
      data: {
        profile: sanitizedProfile,
        sources,
        isProduction,
        storage: {
          provider: storageUsage.provider,
          bucket: storageUsage.bucket,
          sizeInMB: storageUsage.sizeInMB,
          sizeInGB: storageUsage.sizeInGB,
          totalFiles: storageUsage.totalFiles,
          status: storageTest.status,
          details: storageTest.details
        },
        system: {
          nodeVersion: process.version,
          environment: process.env.NODE_ENV || 'development',
          database: 'PostgreSQL (Cloud Hosted)',
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

// POST /api/settings/storage/test-connection - Test DB and Cloud Storage connections
router.post('/storage/test-connection', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    let dbStatus = 'Connected';
    let dbDetails = 'PostgreSQL Connection Active';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      dbStatus = 'Disconnected';
      dbDetails = 'Database connection failed: ' + e.message;
    }

    const storageTest = await storageService.testStorageConnection();

    res.json({
      success: true,
      data: {
        database: {
          status: dbStatus,
          details: dbDetails,
          engine: 'PostgreSQL'
        },
        storage: storageTest,
        timestamp: new Date()
      }
    });
  } catch (err) {
    console.error('settings.storage.test', err);
    res.status(500).json({ success: false, message: 'Connection test failed: ' + err.message });
  }
});

// POST /api/settings/backup/trigger - Trigger database & storage backup snapshot
router.post('/backup/trigger', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 'org_default';
    const backupResult = await storageService.triggerCloudBackup(organizationId);

    res.json({
      success: true,
      message: 'Cloud Database backup snapshot successfully created and stored!',
      data: backupResult
    });
  } catch (err) {
    console.error('settings.backup.trigger', err);
    res.status(500).json({ success: false, message: 'Backup creation failed: ' + err.message });
  }
});

// GET /api/settings/storage/drives - Detect available local disk drives/volumes on system (DEV ONLY)
router.get('/storage/drives', authenticate, async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      return res.json({
        success: true,
        isProduction: true,
        data: [],
        message: 'Physical drive scanning is disabled in production environment.'
      });
    }

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

    res.json({ success: true, isProduction: false, data: drives });
  } catch (err) {
    console.error('settings.storage.drives', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

