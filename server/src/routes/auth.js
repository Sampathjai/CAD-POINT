const express = require('express');
const router = express.Router();
const { z } = require('zod');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ success: false, message: 'User is inactive' });
    const ok = await bcrypt.compare(data.password, user.passwordHash);
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '8h' });
    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive };
    res.json({ success: true, data: { token, user: safeUser } });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, message: err.errors });
    console.error('Login error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Logout is client-driven for stateless JWT; provide endpoint for compatibility
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

const { authenticate } = require('../middleware/auth');
router.get('/me', authenticate, async (req, res) => {
  const u = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, name: true, email: true, role: true, isActive: true, phone: true, createdAt: true } });
  res.json({ success: true, data: u });
});

module.exports = router;
