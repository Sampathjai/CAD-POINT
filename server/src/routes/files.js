const express = require('express');
const router = express.Router();
const storageService = require('../services/storageService');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB max limit
});

// POST /api/files/upload - Upload file to cloud object storage
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided in upload request' });
    }

    const { category, recordId } = req.body;
    const organizationId = req.user?.organizationId || 'org_default';

    const metadata = await storageService.uploadFile({
      buffer: req.file.buffer,
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      category: category || 'documents',
      organizationId,
      userId: req.user?.id,
      recordId
    });

    res.status(201).json({ success: true, data: metadata });
  } catch (err) {
    console.error('files.upload', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/files/download/:id - Get signed download URL with access control
router.get('/download/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = require('../config/prisma');
    

    const file = await prisma.fileMetadata.findUnique({ where: { id } });
    if (!file) {
      return res.status(404).json({ success: false, message: 'File record not found' });
    }

    const userOrg = req.user?.organizationId || 'org_default';
    if (file.organizationId !== userOrg && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: Access denied to this file' });
    }

    const signedUrl = await storageService.getSignedUrl(file.storageKey);
    res.json({ success: true, data: { ...file, signedUrl } });
  } catch (err) {
    console.error('files.download', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/files/usage - Storage usage summary for current organization
router.get('/usage', authenticate, async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 'org_default';
    const usage = await storageService.getStorageUsage(organizationId);
    res.json({ success: true, data: usage });
  } catch (err) {
    console.error('files.usage', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

