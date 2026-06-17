'use strict';

const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const path    = require('path');
const fs      = require('fs');
require('dotenv').config();

const app = express();

// ── Middleware ──────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// suppress morgan during tests to keep output clean
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname), { index: false }));

// ── API Routes ──────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/payments',   require('./routes/payments'));
app.use('/api/admin',      require('./routes/admin'));

// ── Inject Google Maps key into HTML ───────────────────
const MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
function serveHtml(filePath, res) {
  let html = fs.readFileSync(filePath, 'utf8');
  html = html.replace('</head>', `<script>window.GOOGLE_MAPS_KEY="${MAPS_KEY}";</script>\n</head>`);
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
}

const pages = ['index', 'details', 'add-property', 'admin', 'receipt', 'setup'];
pages.forEach(p => {
  const route = p === 'index' ? '/' : `/${p}`;
  app.get(route, (req, res) => {
    const file = path.join(__dirname, `${p}.html`);
    fs.existsSync(file) ? serveHtml(file, res) : res.status(404).send('Not found');
  });
  app.get(`/${p}.html`, (req, res) => {
    const file = path.join(__dirname, `${p}.html`);
    fs.existsSync(file) ? serveHtml(file, res) : res.status(404).send('Not found');
  });
});

// ── Error Handler ───────────────────────────────────────
app.use((err, req, res, next) => {
  res.status(500).json({ success: false, message: err.message });
});

module.exports = app;
