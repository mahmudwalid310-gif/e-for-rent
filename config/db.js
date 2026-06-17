// ── LowDB Setup — stores everything in db.json ──────────
const low      = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path     = require('path');
const fs       = require('fs');

// Vercel serverless functions have a read-only filesystem except for /tmp.
const isVercel = process.env.VERCEL === '1';
let dbFile = path.join(__dirname, '..', 'db.json');

if (isVercel) {
  dbFile = '/tmp/db.json';
  // If /tmp/db.json doesn't exist yet in this instance, copy our initial db.json so we have starting data.
  const sourceDb = path.join(__dirname, '..', 'db.json');
  if (!fs.existsSync(dbFile) && fs.existsSync(sourceDb)) {
    fs.copyFileSync(sourceDb, dbFile);
  }
}

const adapter = new FileSync(dbFile);
const db      = low(adapter);

// Default empty collections
db.defaults({
  users:      [],
  properties: [],
  payments:   []
}).write();

module.exports = db;
