const express = require('express');
const db = require('../config/db');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(protect, adminOnly);

// ── GET /api/admin/stats ──────────────────────────────────
router.get('/stats', (req, res) => {
  try {
    const users       = db.get('users').size().value();
    const properties  = db.get('properties').size().value();
    const pending     = db.get('properties').filter({ isApproved: false }).size().value();
    const allPayments = db.get('payments').value();
    const totalPaid   = allPayments.reduce((s, p) => s + (p.amount || 0), 0);

    res.json({ success: true, stats: {
      totalUsers: users,
      totalProperties: properties,
      pendingProperties: pending,
      totalPayments: allPayments.length,
      totalRevenue: totalPaid
    }});
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── GET /api/admin/users ──────────────────────────────────
router.get('/users', (req, res) => {
  const users = db.get('users').map(u => { const { password, ...s } = u; return s; }).value()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ success: true, users });
});

// ── PUT /api/admin/users/:id ──────────────────────────────
router.put('/users/:id', (req, res) => {
  const { role, isActive } = req.body;
  const user = db.get('users').find({ _id: req.params.id }).value();
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const updates = {};
  if (role !== undefined)     updates.role = role;
  if (isActive !== undefined) updates.isActive = isActive;
  db.get('users').find({ _id: req.params.id }).assign(updates).write();
  const updated = db.get('users').find({ _id: req.params.id }).value();
  const { password, ...safe } = updated;
  res.json({ success: true, user: safe });
});

// ── DELETE /api/admin/users/:id ───────────────────────────
router.delete('/users/:id', (req, res) => {
  if (req.params.id === req.user._id)
    return res.status(400).json({ success: false, message: "Can't delete yourself" });
  db.get('users').remove({ _id: req.params.id }).write();
  res.json({ success: true, message: 'User deleted' });
});

// ── GET /api/admin/properties ─────────────────────────────
router.get('/properties', (req, res) => {
  const { status } = req.query;
  let items = db.get('properties').value();
  if (status === 'pending')  items = items.filter(p => !p.isApproved);
  if (status === 'approved') items = items.filter(p => p.isApproved);

  const withOwner = items.map(p => {
    const owner = db.get('users').find({ _id: p.ownerId }).value();
    return { ...p, owner: owner ? { name: owner.name, email: owner.email, phone: owner.phone } : null };
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ success: true, properties: withOwner });
});

// ── PUT /api/admin/properties/:id/approve ─────────────────
router.put('/properties/:id/approve', (req, res) => {
  const prop = db.get('properties').find({ _id: req.params.id }).value();
  if (!prop) return res.status(404).json({ success: false, message: 'Not found' });
  db.get('properties').find({ _id: req.params.id }).assign({ isApproved: true }).write();
  res.json({ success: true, property: db.get('properties').find({ _id: req.params.id }).value() });
});

// ── DELETE /api/admin/properties/:id ─────────────────────
router.delete('/properties/:id', (req, res) => {
  db.get('properties').remove({ _id: req.params.id }).write();
  res.json({ success: true, message: 'Deleted' });
});

// ── GET /api/admin/payments ───────────────────────────────
router.get('/payments', (req, res) => {
  const payments = db.get('payments').value()
    .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt))
    .slice(0, 100);
  res.json({ success: true, payments });
});

module.exports = router;
