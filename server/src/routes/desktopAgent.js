const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticate, authorize } = require('../middleware/auth');
const storageService = require('../services/storageService');

const JWT_SECRET = process.env.JWT_SECRET || 'cadpoint-secret';

// POST /api/desktop-agent/auth - Device Registration & Desktop Authentication
router.post('/auth', async (req, res) => {
  try {
    const { email, password, agentId, deviceName, platform, appVersion, storagePath } = req.body;

    if (!email || !password || !agentId) {
      return res.status(400).json({ success: false, message: 'Email, password, and agentId required' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or inactive account' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const organizationId = user.organizationId || 'org_default';

    // Upsert DesktopAgent device registration
    const agent = await prisma.desktopAgent.upsert({
      where: { agentId },
      update: {
        userId: user.id,
        deviceName: deviceName || 'Client PC',
        platform: platform || 'windows',
        appVersion: appVersion || '1.0.0',
        storagePath: storagePath || null,
        status: 'ACTIVE',
        lastSeenAt: new Date()
      },
      create: {
        agentId,
        organizationId,
        userId: user.id,
        deviceName: deviceName || 'Client PC',
        platform: platform || 'windows',
        appVersion: appVersion || '1.0.0',
        storagePath: storagePath || null,
        status: 'ACTIVE'
      }
    });

    const accessToken = jwt.sign(
      { id: user.id, role: user.role, email: user.email, agentId, organizationId },
      JWT_SECRET,
      { expiresIn: '30d' } // Long-lived token for desktop agent
    );

    res.json({
      success: true,
      data: {
        token: accessToken,
        agent: {
          id: agent.id,
          agentId: agent.agentId,
          deviceName: agent.deviceName,
          platform: agent.platform,
          appVersion: agent.appVersion,
          status: agent.status
        },
        organization: {
          id: organizationId,
          name: 'CADPOINT Main Center',
          code: 'CADPOINT'
        },
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (err) {
    console.error('desktopAgent.auth', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/desktop-agent/status - Agent status & version check
router.get('/status', authenticate, async (req, res) => {
  try {
    const agentId = req.user?.agentId;
    const organizationId = req.user?.organizationId || 'org_default';

    let agentRecord = null;
    if (agentId) {
      agentRecord = await prisma.desktopAgent.findUnique({ where: { agentId } });
      if (agentRecord) {
        await prisma.desktopAgent.update({
          where: { agentId },
          data: { lastSeenAt: new Date() }
        });
      }
    }

    if (agentRecord && agentRecord.status === 'REVOKED') {
      return res.status(403).json({ success: false, message: 'Access revoked for this desktop agent device', revoked: true });
    }

    const storageUsage = await storageService.getStorageUsage(organizationId);

    res.json({
      success: true,
      data: {
        status: 'ACTIVE',
        serverVersion: '1.0.0',
        organizationId,
        agent: agentRecord,
        storageUsage,
        timestamp: new Date()
      }
    });
  } catch (err) {
    console.error('desktopAgent.status', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/desktop-agent/sync - File synchronization manifest
router.get('/sync', authenticate, async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 'org_default';
    const files = await prisma.fileMetadata.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: {
        organizationId,
        fileCount: files.length,
        files: files.map(f => ({
          id: f.id,
          originalFilename: f.originalFilename,
          storageKey: f.storageKey,
          category: f.category,
          mimeType: f.mimeType,
          fileSize: f.fileSize,
          publicUrl: f.publicUrl,
          createdAt: f.createdAt
        }))
      }
    });
  } catch (err) {
    console.error('desktopAgent.sync', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/desktop-agent/backup/request - Generate & package full DB snapshot
router.get('/backup/request', authenticate, async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 'org_default';

    const leads = await prisma.lead.findMany();
    const students = await prisma.student.findMany();
    const courses = await prisma.course.findMany();
    const admissions = await prisma.admission.findMany();
    const payments = await prisma.payment.findMany();
    const files = await prisma.fileMetadata.findMany({ where: { organizationId } });

    const crypto = require('crypto');
    const backupData = {
      manifest: {
        backupId: `cadpoint_backup_${Date.now()}`,
        organizationId,
        createdAt: new Date(),
        appVersion: '1.0.0',
        schemaVersion: '1.0.0',
        fileCount: files.length,
        recordCount: leads.length + students.length + courses.length + admissions.length + payments.length,
        backupType: 'FULL'
      },
      data: { leads, students, courses, admissions, payments, files }
    };

    const dumpJson = JSON.stringify(backupData, null, 2);
    const sha256 = crypto.createHash('sha256').update(dumpJson).digest('hex');

    backupData.manifest.sha256 = sha256;

    res.json({
      success: true,
      data: backupData
    });
  } catch (err) {
    console.error('desktopAgent.backup.request', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/desktop-agent/devices - List registered desktop devices (Web CRM Admin Settings)
router.get('/devices', authenticate, async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 'org_default';
    const devices = await prisma.desktopAgent.findMany({
      where: { organizationId },
      include: {
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { lastSeenAt: 'desc' }
    });

    res.json({ success: true, data: devices });
  } catch (err) {
    console.error('desktopAgent.devices', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/desktop-agent/devices/:id/revoke - Revoke a desktop device access
router.post('/devices/:id/revoke', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const device = await prisma.desktopAgent.update({
      where: { id },
      data: { status: 'REVOKED' }
    });

    res.json({ success: true, message: 'Desktop device access revoked successfully', data: device });
  } catch (err) {
    console.error('desktopAgent.devices.revoke', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/desktop-agent/devices/register - Register a new device directly from Web CRM Admin Settings
router.post('/devices/register', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const { deviceName, platform, appVersion } = req.body;
    if (!deviceName || !deviceName.trim()) {
      return res.status(400).json({ success: false, message: 'Device name is required' });
    }

    const organizationId = req.user?.organizationId || 'org_default';
    const crypto = require('crypto');
    const agentId = `agent_${crypto.randomBytes(6).toString('hex')}`;

    const device = await prisma.desktopAgent.create({
      data: {
        agentId,
        organizationId,
        userId: req.user.id,
        deviceName: deviceName.trim(),
        platform: platform || 'macOS',
        appVersion: appVersion || '1.0.0',
        status: 'ACTIVE',
        lastSeenAt: new Date()
      }
    });

    res.json({ success: true, message: 'New desktop device registered successfully', data: device });
  } catch (err) {
    console.error('desktopAgent.devices.register', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

