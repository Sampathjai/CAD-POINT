const express = require('express');
const router = express.Router();
const { z } = require('zod');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticate, authorize } = require('../middleware/auth');

const Roles = ['SUPER_ADMIN','ADMIN','COUNSELLOR','TRAINER','ACCOUNTS','RECEPTIONIST'];
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  role: z.enum(Roles).optional(),
  isActive: z.boolean().optional()
});

// List users (requires authentication, admin roles recommended)
router.get('/', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true } });
  res.json({ success: true, data: users });
});

// Create user
router.post('/', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const data = createUserSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return res.status(409).json({ success: false, message: 'Email already in use' });
    const hash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({ data: { name: data.name, email: data.email, phone: data.phone, passwordHash: hash, role: data.role || 'COUNSELLOR', isActive: data.isActive ?? true } });
    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive };
    res.status(201).json({ success: true, data: safeUser });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, message: err.errors });
    console.error('Create user error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user
const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  password: z.string().min(8).optional().or(z.literal('')),
  role: z.enum(Roles).optional(),
  isActive: z.boolean().optional()
});

router.patch('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    const data = updateUserSchema.parse(req.body);
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) {
      const exists = await prisma.user.findFirst({ where: { email: data.email, NOT: { id } } });
      if (exists) return res.status(409).json({ success: false, message: 'Email already in use' });
      updateData.email = data.email;
    }
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.password && data.password.trim().length >= 8) {
      updateData.passwordHash = await bcrypt.hash(data.password, 12);
    }
    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true }
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, message: err.errors });
    console.error('Update user error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete user
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  const { id } = req.params;
  if (req.user.id === id) {
    return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
  }
  try {
    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error', err);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

// Activate / Deactivate user
router.patch('/:id/activate', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  const { id } = req.params;
  if (req.user.id === id) return res.status(400).json({ success: false, message: 'Cannot change own activation status' });
  const user = await prisma.user.update({ where: { id }, data: { isActive: true } });
  res.json({ success: true, data: { id: user.id, isActive: user.isActive } });
});

router.patch('/:id/deactivate', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  const { id } = req.params;
  if (req.user.id === id) return res.status(400).json({ success: false, message: 'Cannot change own activation status' });
  const user = await prisma.user.update({ where: { id }, data: { isActive: false } });
  res.json({ success: true, data: { id: user.id, isActive: user.isActive } });
});

// Reset password
router.post('/:id/reset-password', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  const { id } = req.params;
  const newPassword = Math.random().toString(36).slice(-10) + 'A1!';
  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id }, data: { passwordHash: hash } });
  res.json({ success: true, data: { id, tempPassword: newPassword } });
});

module.exports = router;
