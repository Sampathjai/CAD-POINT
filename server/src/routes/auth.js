const express = require('express');
const router = express.Router();
const { z } = require('zod');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

router.post('/login', async (req, res) => {
  const tStart = Date.now();
  console.log(`[LOGIN] 🚀 Request received at ${new Date().toISOString()}`);

  try {
    const data = loginSchema.parse(req.body);
    console.log(`[LOGIN] 🔍 User lookup started for: ${data.email}`);

    const tDbStart = Date.now();
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true, name: true, email: true, role: true, isActive: true, customPermissions: true, passwordHash: true }
    });
    const tDbEnd = Date.now();
    console.log(`[LOGIN] 👤 User lookup completed in ${tDbEnd - tDbStart}ms`);

    if (!user) {
      console.log(`[LOGIN ERROR] ❌ User not found`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      console.log(`[LOGIN ERROR] ❌ User inactive`);
      return res.status(403).json({ success: false, message: 'User account is inactive' });
    }

    console.log(`[LOGIN] 🔐 Password verification started`);
    const tBcryptStart = Date.now();
    const ok = await bcrypt.compare(data.password, user.passwordHash);
    const tBcryptEnd = Date.now();
    console.log(`[LOGIN] 🔐 Password verification completed in ${tBcryptEnd - tBcryptStart}ms`);

    if (!ok) {
      console.log(`[LOGIN ERROR] ❌ Password mismatch`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const secret = process.env.JWT_SECRET || 'cadpoint_super_secret_jwt_key_2026_coimbatore';
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, name: user.name, customPermissions: user.customPermissions || [] },
      secret,
      { expiresIn: '8h' }
    );

    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive, customPermissions: user.customPermissions || [] };
    const tTotal = Date.now() - tStart;
    console.log(`[LOGIN SUCCESS] ✅ Authenticated user ${user.id} (${user.role}) in ${tTotal}ms`);

    res.json({ success: true, data: { token, user: safeUser }, _perf: { totalMs: tTotal, dbMs: tDbEnd - tDbStart, bcryptMs: tBcryptEnd - tBcryptStart } });
  } catch (err) {
    if (err.name === 'ZodError') {
      const msg = err.errors.map((e) => e.message || 'Invalid input').join(', ');
      console.log(`[LOGIN ERROR] ⚠️ Input validation failed: ${msg}`);
      return res.status(400).json({ success: false, message: msg || 'Please enter valid email and password' });
    }
    console.error('[LOGIN ERROR] 💥 Unhandled authentication error:', err);
    res.status(500).json({ success: false, message: 'Server error during authentication' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

const { authenticate } = require('../middleware/auth');
router.get('/me', authenticate, async (req, res) => {
  const tStart = Date.now();
  const u = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, role: true, isActive: true, phone: true, createdAt: true }
  });
  console.log(`[PERF BACKEND] GET /auth/me served in ${Date.now() - tStart}ms`);
  res.json({ success: true, data: u });
});

module.exports = router;
