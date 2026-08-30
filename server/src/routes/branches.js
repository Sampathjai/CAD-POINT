const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: branches });
  } catch (err) {
    console.error('Fetch branches error:', err);
    res.status(500).json({ success: false, message: 'Server error fetching branches' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, code, address, phone } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Branch name and code are required' });
    }
    const branch = await prisma.branch.create({
      data: {
        name: name.trim(),
        code: code.trim().toLowerCase(),
        address: address?.trim() || null,
        phone: phone?.trim() || null
      }
    });
    res.json({ success: true, data: branch });
  } catch (err) {
    console.error('Create branch error:', err);
    res.status(500).json({ success: false, message: 'Failed to create branch' });
  }
});

module.exports = router;
