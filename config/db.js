// ── LowDB Setup — stores everything in db.json ──────────
const low      = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path     = require('path');

const adapter = new FileSync(path.join(__dirname, '..', 'db.json'));
const db      = low(adapter);

// Default empty collections
db.defaults({
  users:      [],
  properties: [],
  payments:   []
}).write();

module.exports = db;
