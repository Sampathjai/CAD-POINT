const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const MAX_DEVICES_PER_BRANCH = 10;

// GET /api/devices - List primary device and all authorized devices (filterable by branchId)
router.get('/', authenticate, async (req, res) => {
  try {
    const { branchId } = req.query;
    let targetBranchId = null;

    if (branchId && branchId !== 'all') {
      const b = await prisma.branch.findFirst({
        where: { OR: [{ id: branchId }, { code: branchId.toLowerCase() }] }
      });
      if (b) targetBranchId = b.id;
    }

    const whereClause = targetBranchId ? { branchId: targetBranchId } : {};

    const devices = await prisma.device.findMany({
      where: whereClause,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const activeDevices = devices.filter(d => d.status === 'ACTIVE');
    const primaryDevice = devices.find(d => d.deviceRole === 'PRIMARY' && d.status === 'ACTIVE') || null;
    const authorizedDevices = devices.filter(d => d.id !== primaryDevice?.id);

    res.json({
      success: true,
      data: {
        primaryDevice,
        authorizedDevices,
        activeCount: activeDevices.length,
        maxLimit: MAX_DEVICES_PER_BRANCH,
        totalRegistered: devices.length
      }
    });
  } catch (err) {
    console.error('devices.get', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/devices/primary - Fetch current Primary Device for active branch
router.get('/primary', authenticate, async (req, res) => {
  try {
    const { branchId } = req.query;
    let targetBranchId = null;
    if (branchId && branchId !== 'all') {
      const b = await prisma.branch.findFirst({
        where: { OR: [{ id: branchId }, { code: branchId.toLowerCase() }] }
      });
      if (b) targetBranchId = b.id;
    }

    const whereClause = { deviceRole: 'PRIMARY', status: 'ACTIVE' };
    if (targetBranchId) whereClause.branchId = targetBranchId;

    const primaryDevice = await prisma.device.findFirst({
      where: whereClause,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        user: { select: { id: true, name: true, email: true } }
      }
    });

    res.json({
      success: true,
      data: primaryDevice
    });
  } catch (err) {
    console.error('devices.primary.get', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/devices/register - Register a new device with 10 Device Limit per Branch
router.post('/register', authenticate, async (req, res) => {
  try {
    const { deviceId, deviceName, deviceType, deviceRole, branchId, forceReplace } = req.body;

    if (!deviceId || !deviceName) {
      return res.status(400).json({ success: false, message: 'Device ID and Device Name are required.' });
    }

    const role = (deviceRole || 'AUTHORIZED').toUpperCase();
    const type = (deviceType || 'LAPTOP').toUpperCase();

    // Resolve branch ID
    let resolvedBranchId = branchId || null;
    if (branchId) {
      const branchRecord = await prisma.branch.findFirst({
        where: { OR: [{ id: branchId }, { code: branchId.toLowerCase() }] }
      });
      if (branchRecord) resolvedBranchId = branchRecord.id;
    }

    if (!resolvedBranchId) {
      const defaultBranch = await prisma.branch.findFirst({ where: { code: 'gandhipuram' } });
      if (defaultBranch) resolvedBranchId = defaultBranch.id;
    }

    // Check if device is already registered by deviceId
    let existingDev = await prisma.device.findUnique({ where: { deviceId } });
    if (existingDev) {
      existingDev = await prisma.device.update({
        where: { deviceId },
        data: {
          deviceName: deviceName.trim(),
          deviceType: type,
          deviceRole: role,
          branchId: resolvedBranchId,
          lastActiveAt: new Date(),
          status: existingDev.status === 'REVOKED' ? 'ACTIVE' : existingDev.status
        }
      });
      return res.json({
        success: true,
        message: 'Device registration updated.',
        data: existingDev
      });
    }

    // Enforce Hard Limit: Maximum 10 Registered Devices per Branch
    const activeDeviceCount = await prisma.device.count({
      where: {
        branchId: resolvedBranchId,
        status: 'ACTIVE'
      }
    });

    if (activeDeviceCount >= MAX_DEVICES_PER_BRANCH) {
      const targetBranch = await prisma.branch.findUnique({ where: { id: resolvedBranchId } });
      const branchName = targetBranch?.name || 'this';
      return res.status(400).json({
        success: false,
        limitReached: true,
        message: `Maximum device limit reached for ${branchName} branch. This branch already has 10 registered devices. Please remove an existing device before registering a new one.`
      });
    }

    // Enforce 1 Primary Device per Branch
    if (role === 'PRIMARY') {
      const activePrimary = await prisma.device.findFirst({
        where: { branchId: resolvedBranchId, deviceRole: 'PRIMARY', status: 'ACTIVE' }
      });

      if (activePrimary) {
        if (!forceReplace) {
          return res.status(400).json({
            success: false,
            primaryExists: true,
            existingPrimary: activePrimary,
            message: `Primary device already exists for this branch (${activePrimary.deviceName}). You cannot register multiple Primary devices simultaneously for the same branch.`
          });
        }

        // Downgrade existing primary device for this branch to AUTHORIZED
        await prisma.device.update({
          where: { id: activePrimary.id },
          data: { deviceRole: 'AUTHORIZED' }
        });
      }
    }

    const newDevice = await prisma.device.create({
      data: {
        deviceId,
        deviceName: deviceName.trim(),
        deviceType: type,
        deviceRole: role,
        branchId: resolvedBranchId,
        userId: req.user?.id || null,
        status: 'ACTIVE',
        lastActiveAt: new Date()
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        user: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(201).json({
      success: true,
      message: `✅ ${role === 'PRIMARY' ? 'Primary Device (Master)' : 'Authorized Device'} registered successfully!`,
      data: newDevice
    });
  } catch (err) {
    console.error('devices.register', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/devices/:id/verify - Verify device and set status to ACTIVE
router.post('/:id/verify', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const updated = await prisma.device.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE', lastActiveAt: new Date() }
    });
    res.json({ success: true, message: 'Device verified and marked ACTIVE.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/devices/:id/revoke - Revoke device access (marks REVOKED)
router.post('/:id/revoke', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const updated = await prisma.device.update({
      where: { id: req.params.id },
      data: { status: 'REVOKED', revokedAt: new Date() }
    });
    res.json({ success: true, message: 'Device access revoked successfully.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/devices/:id/block - Block device
router.post('/:id/block', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const updated = await prisma.device.update({
      where: { id: req.params.id },
      data: { status: 'BLOCKED' }
    });
    res.json({ success: true, message: 'Device blocked.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/devices/:id/replace-primary - Replace Primary Device role
router.post('/:id/replace-primary', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const targetDev = await prisma.device.findUnique({ where: { id: req.params.id } });
    if (!targetDev) return res.status(404).json({ success: false, message: 'Device not found' });

    // Demote current primary for this branch
    if (targetDev.branchId) {
      await prisma.device.updateMany({
        where: { branchId: targetDev.branchId, deviceRole: 'PRIMARY' },
        data: { deviceRole: 'AUTHORIZED' }
      });
    }

    // Promote requested device
    const updated = await prisma.device.update({
      where: { id: req.params.id },
      data: { deviceRole: 'PRIMARY', status: 'ACTIVE' }
    });

    res.json({ success: true, message: 'Primary device updated for branch.', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/devices/cleanup-all - Remove ALL registered devices (Data Cleanup Task)
router.delete('/cleanup-all', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    const deleteCount = await prisma.device.deleteMany({});
    res.json({
      success: true,
      message: `Cleaned up ${deleteCount.count} registered device records. Database now contains 0 devices.`,
      count: deleteCount.count
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
