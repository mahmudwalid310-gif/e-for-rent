const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// ── Multer image upload ───────────────────────────────────
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    cb(null, `prop_${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ── GET /api/properties ───────────────────────────────────
router.get('/', optionalAuth, (req, res) => {
  try {
    const { search = '', category = '', minPrice, maxPrice, area, page = 1, limit = 12 } = req.query;
    let items = db.get('properties').filter({ isApproved: true, isAvailable: true }).value();

    if (search)   items = items.filter(p => p.title.includes(search) || p.address.includes(search));
    if (category) items = items.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
    if (area)     items = items.filter(p => (p.area || '').includes(area));
    if (minPrice) items = items.filter(p => p.price >= Number(minPrice));
    if (maxPrice) items = items.filter(p => p.price <= Number(maxPrice));

    // Sort newest first
    items = items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = items.length;
    const start = (Number(page) - 1) * Number(limit);
    const paged = items.slice(start, start + Number(limit));

    // Attach owner info
    const withOwner = paged.map(p => {
      const owner = db.get('users').find({ _id: p.ownerId }).value();
      return { ...p, owner: owner ? { name: owner.name, phone: owner.phone } : null };
    });

    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), properties: withOwner });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── GET /api/properties/:id ───────────────────────────────
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const property = db.get('properties').find({ _id: req.params.id }).value();
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

    // Increment views
    db.get('properties').find({ _id: req.params.id }).assign({ views: (property.views || 0) + 1 }).write();

    const owner = db.get('users').find({ _id: property.ownerId }).value();
    res.json({ success: true, property: { ...property, owner: owner ? { name: owner.name, phone: owner.phone, email: owner.email } : null } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── POST /api/properties ──────────────────────────────────
router.post('/', protect, upload.array('images', 6), [
  body('title').trim().notEmpty(),
  body('price').isNumeric(),
  body('address').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('phone').trim().notEmpty(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const { title, category, price, address, area, bedrooms, bathrooms, advance, description, phone, amenities, lat, lng } = req.body;
    const images = req.files?.map(f => `/uploads/${f.filename}`) || [];
    const numPrice = Number(price);

    const newProp = {
      _id:         uuidv4(),
      title, category, price: numPrice, address,
      area:        area || address.split('،')[0].trim(),
      bedrooms:    Number(bedrooms) || 1,
      bathrooms:   Number(bathrooms) || 1,
      advance:     advance || '১ মাসের',
      description, phone,
      amenities:   amenities ? JSON.parse(amenities) : [],
      images,
      location:    { lat: Number(lat) || 0, lng: Number(lng) || 0 },
      ownerId:     req.user._id,
      isApproved:  req.user.role === 'admin',
      isAvailable: true,
      views:       0,
      bills: {
        rent:    { name: 'রুম ভাড়া',    amount: numPrice, status: 'Unpaid' },
        current: { name: 'বিদ্যুৎ বিল',  amount: 1200,    status: 'Unpaid' },
        wifi:    { name: 'ওয়াইফাই বিল', amount: 500,     status: 'Unpaid' },
        gas:     { name: 'গ্যাস বিল',    amount: 1080,    status: 'Unpaid' }
      },
      createdAt: new Date().toISOString()
    };

    db.get('properties').push(newProp).write();
    res.status(201).json({ success: true, property: newProp });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── DELETE /api/properties/:id ────────────────────────────
router.delete('/:id', protect, (req, res) => {
  try {
    const prop = db.get('properties').find({ _id: req.params.id }).value();
    if (!prop) return res.status(404).json({ success: false, message: 'Not found' });
    if (prop.ownerId !== req.user._id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized' });

    db.get('properties').remove({ _id: req.params.id }).write();
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
