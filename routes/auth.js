const express   = require('express');
const jwt       = require('jsonwebtoken');
const bcrypt    = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db        = require('../config/db');
const { protect } = require('../middleware/auth');

const router = express.Router();
const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ── POST /api/auth/register ──────────────────────────────
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Min 6 chars'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const { name, email, password, phone, role } = req.body;
    const existing = db.get('users').find({ email }).value();
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    const isFirst = db.get('users').size().value() === 0;
    const hashed  = await bcrypt.hash(password, 12);
    const newUser = {
      _id:      uuidv4(),
      name, email, phone: phone || '',
      password: hashed,
      role:     isFirst ? 'admin' : (role === 'landlord' ? 'landlord' : 'user'),
      isActive: true,
      createdAt: new Date().toISOString()
    };
    db.get('users').push(newUser).write();

    const token = signToken(newUser._id);
    const { password: _, ...safeUser } = newUser;
    res.status(201).json({ success: true, token, user: safeUser });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── POST /api/auth/login ─────────────────────────────────
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const { email, password } = req.body;
    const user = db.get('users').find({ email }).value();
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const token = signToken(user._id);
    const { password: _, ...safeUser } = user;
    res.json({ success: true, token, user: safeUser });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── GET /api/auth/me ─────────────────────────────────────
router.get('/me', protect, (req, res) => {
  const { password: _, ...safeUser } = req.user;
  res.json({ success: true, user: safeUser });
});

// ── PUT /api/auth/profile ────────────────────────────────
router.put('/profile', protect, (req, res) => {
  const { name, phone } = req.body;
  db.get('users').find({ _id: req.user._id }).assign({ name, phone }).write();
  const updated = db.get('users').find({ _id: req.user._id }).value();
  const { password: _, ...safe } = updated;
  res.json({ success: true, user: safe });
});

module.exports = router;
