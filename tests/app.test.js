/**
 * E-FOR-RENT — TDD Test Suite
 * Red → Green → Refactor
 *
 * Run: npm test
 */

'use strict';

const request = require('supertest');
const path    = require('path');
const fs      = require('fs');

// ── Point lowdb at a throw-away test database ─────────────
// Stored inside tests/ so nodemon never sees it and won't loop.
// Jest mock factories cannot reference outer-scope vars —
// __dirname inside the factory resolves to tests/ already.
const TEST_DB = path.join(__dirname, 'test_db.json');
jest.mock('../config/db', () => {
  const path2    = require('path');
  const low      = require('lowdb');
  const FileSync = require('lowdb/adapters/FileSync');
  // __dirname here = the tests/ directory (where this file lives)
  const mockDb   = path2.join(__dirname, 'test_db.json');
  const db       = low(new FileSync(mockDb));
  db.defaults({ users: [], properties: [], payments: [] }).write();
  return db;
});

// Load the express app (not the listening server)
const app = require('../server_app'); // we'll export the express app separately

// ── Helpers ───────────────────────────────────────────────
let adminToken, userToken, propId, receiptId;

async function login(email, password) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return res.body.token;
}

// ══════════════════════════════════════════════════════════
// AUTH TESTS
// ══════════════════════════════════════════════════════════
describe('POST /api/auth/register', () => {
  test('registers first user as admin', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Admin', email: 'admin@test.com', password: 'admin123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('admin');   // first user = admin
    expect(res.body.user.password).toBeUndefined(); // password must NOT be returned
    adminToken = res.body.token;
  });

  test('registers second user as regular user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Tenant', email: 'tenant@test.com', password: 'user123' });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('user');
    userToken = res.body.token;
  });

  test('rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Dup', email: 'admin@test.com', password: 'pass123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('rejects weak password (< 6 chars)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Weak', email: 'weak@test.com', password: '123' });

    expect(res.status).toBe(400);
  });

  test('rejects missing name', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'noname@test.com', password: 'pass123' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  test('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'admin123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.password).toBeUndefined();
  });

  test('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'wrongpass' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('rejects unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'pass123' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  test('returns current user with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('admin@test.com');
    expect(res.body.user.password).toBeUndefined();
  });

  test('returns 401 with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('returns 401 with malformed token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer bad.token.here');
    expect(res.status).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════
// PROPERTY TESTS
// ══════════════════════════════════════════════════════════
describe('POST /api/properties', () => {
  test('creates property when authenticated', async () => {
    const res = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('title', 'Test Flat Mirpur')
      .field('category', 'Family Rent (ফ্যামিলি)')
      .field('price', '8000')
      .field('address', 'Mirpur-10, Dhaka')
      .field('description', 'Nice 2-bed flat')
      .field('phone', '01700000000')
      .field('bedrooms', '2')
      .field('bathrooms', '1');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.property._id).toBeDefined();
    // Admin-posted property should be auto-approved
    expect(res.body.property.isApproved).toBe(true);
    // Bills should be initialised
    expect(res.body.property.bills.rent.status).toBe('Unpaid');
    expect(res.body.property.bills.rent.amount).toBe(8000);
    propId = res.body.property._id;
  });

  test('rejects unauthenticated property creation', async () => {
    const res = await request(app)
      .post('/api/properties')
      .field('title', 'No Auth Flat')
      .field('price', '5000')
      .field('address', 'Dhaka')
      .field('description', 'test')
      .field('phone', '01700000001');

    expect(res.status).toBe(401);
  });

  test('rejects property missing required title', async () => {
    const res = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('price', '5000')
      .field('address', 'Dhaka')
      .field('description', 'test')
      .field('phone', '01700000001');

    expect(res.status).toBe(400);
  });
});

describe('GET /api/properties', () => {
  test('returns approved properties', async () => {
    const res = await request(app).get('/api/properties');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.properties)).toBe(true);
    expect(res.body.properties.length).toBeGreaterThan(0);
    // passwords must never leak via owner info
    res.body.properties.forEach(p => {
      expect(p.owner?.password).toBeUndefined();
    });
  });

  test('filters by category', async () => {
    const res = await request(app)
      .get('/api/properties?category=Family');

    expect(res.status).toBe(200);
    res.body.properties.forEach(p => {
      expect(p.category.toLowerCase()).toContain('family');
    });
  });
});

describe('GET /api/properties/:id', () => {
  test('returns a single property', async () => {
    const res = await request(app).get(`/api/properties/${propId}`);

    expect(res.status).toBe(200);
    expect(res.body.property._id).toBe(propId);
  });

  test('returns 404 for unknown property', async () => {
    const res = await request(app).get('/api/properties/nonexistent-id');
    expect(res.status).toBe(404);
  });
});

// ══════════════════════════════════════════════════════════
// PAYMENT TESTS
// ══════════════════════════════════════════════════════════
describe('POST /api/payments', () => {
  test('processes a bill payment and returns receiptId', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({
        propertyId: propId,
        billType:   'rent',
        payerPhone: '01712345678',
        provider:   'bkash'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.payment.receiptId).toBeDefined();
    expect(res.body.payment.transactionId).toMatch(/^TXN/);
    receiptId = res.body.payment.receiptId;
  });

  test('rejects paying an already-paid bill', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({
        propertyId: propId,
        billType:   'rent',
        payerPhone: '01712345678',
        provider:   'bkash'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already paid/i);
  });

  test('rejects payment for unknown property', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({
        propertyId: 'bad-id',
        billType:   'rent',
        payerPhone: '01712345678',
        provider:   'bkash'
      });

    expect(res.status).toBe(404);
  });

  test('rejects payment for invalid bill type', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({
        propertyId: propId,
        billType:   'electricity',   // invalid
        payerPhone: '01712345678',
        provider:   'bkash'
      });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/payments/receipt/:receiptId', () => {
  test('returns receipt for valid receiptId', async () => {
    const res = await request(app)
      .get(`/api/payments/receipt/${receiptId}`);

    expect(res.status).toBe(200);
    expect(res.body.payment.receiptId).toBe(receiptId);
    expect(res.body.payment.property).toBeDefined();
    expect(res.body.payment.amount).toBe(8000);
  });

  test('returns 404 for unknown receipt', async () => {
    const res = await request(app)
      .get('/api/payments/receipt/nonexistent-receipt');
    expect(res.status).toBe(404);
  });
});

// ══════════════════════════════════════════════════════════
// ADMIN TESTS
// ══════════════════════════════════════════════════════════
describe('GET /api/admin/stats', () => {
  test('returns stats for admin', async () => {
    const token = await login('admin@test.com', 'admin123');
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.stats.totalUsers).toBeGreaterThan(0);
    expect(res.body.stats.totalRevenue).toBeDefined();
  });

  test('blocks non-admin from admin routes', async () => {
    const token = await login('tenant@test.com', 'user123');
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test('blocks unauthenticated access to admin routes', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/admin/properties/:id/approve', () => {
  test('admin can approve a property', async () => {
    // Create unapproved property as regular user
    const token = await login('tenant@test.com', 'user123');
    const createRes = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Pending Flat')
      .field('category', 'Family Rent (ফ্যামিলি)')
      .field('price', '5000')
      .field('address', 'Uttara, Dhaka')
      .field('description', 'pending flat')
      .field('phone', '01799999999');

    const pendingId = createRes.body.property._id;
    expect(createRes.body.property.isApproved).toBe(false); // user-posted = pending

    // Admin approves it
    const adminTok = await login('admin@test.com', 'admin123');
    const approveRes = await request(app)
      .put(`/api/admin/properties/${pendingId}/approve`)
      .set('Authorization', `Bearer ${adminTok}`);

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.property.isApproved).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════
// CLEANUP
// ══════════════════════════════════════════════════════════
afterAll(() => {
  // TEST_DB resolves to tests/test_db.json — clean it up
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});
