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
  console.log(`[PERF BACKEND] 🚀 Login request received at ${new Date().toISOString()}`);

  try {
    const tZodStart = Date.now();
    const data = loginSchema.parse(req.body);
    const tZodEnd = Date.now();

    const tDbStart = Date.now();
    // Select ONLY fields required for authentication
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true, name: true, email: true, role: true, isActive: true, passwordHash: true }
    });
    const tDbEnd = Date.now();

    if (!user) {
      console.log(`[PERF BACKEND] ❌ User not found (${tDbEnd - tDbStart}ms)`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      console.log(`[PERF BACKEND] ❌ User inactive`);
      return res.status(403).json({ success: false, message: 'User is inactive' });
    }

    const tBcryptStart = Date.now();
    const ok = await bcrypt.compare(data.password, user.passwordHash);
    const tBcryptEnd = Date.now();

    if (!ok) {
      console.log(`[PERF BACKEND] ❌ Password mismatch (${tBcryptEnd - tBcryptStart}ms)`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const tJwtStart = Date.now();
    const secret = process.env.JWT_SECRET || 'cadpoint_super_secret_jwt_key_2026_coimbatore';
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, name: user.name },
      secret,
      { expiresIn: '8h' }
    );
    const tJwtEnd = Date.now();

    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive };
    const tTotal = Date.now() - tStart;

    console.log(`[PERF BACKEND] ✅ LOGIN SUCCESS TIMINGS:
- Zod Validation: ${tZodEnd - tZodStart}ms
- Prisma DB Query: ${tDbEnd - tDbStart}ms
- Bcrypt Compare: ${tBcryptEnd - tBcryptStart}ms
- JWT Signing: ${tJwtEnd - tJwtStart}ms
- TOTAL BACKEND TIME: ${tTotal}ms`);

    res.json({ success: true, data: { token, user: safeUser }, _perf: { totalMs: tTotal, dbMs: tDbEnd - tDbStart, bcryptMs: tBcryptEnd - tBcryptStart } });
  } catch (err) {
    if (err.name === 'ZodError') {
      const msg = err.errors.map((e) => e.message || 'Invalid input').join(', ');
      return res.status(400).json({ success: false, message: msg || 'Please enter valid email and password' });
    }
    console.error('Login error', err);
    res.status(500).json({ success: false, message: 'Server error' });
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
