const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const cors = require('cors');
const { initializeDb, seedData, getDb, runSql } = require('../db');
const authMiddleware = require('../middleware/auth');
const notificationRoutes = require('../routes/notifications');

let server;
let baseUrl;

/**
 * Helper to make HTTP requests to the test server.
 */
function request(method, path, { tenantId = 't1', userId = 'u1', body = null } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': tenantId,
        'X-User-Id': userId,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Reset the database to seed state before each test.
 */
async function resetDb() {
  await runSql('DELETE FROM notifications');
  await seedData();
}

describe('Tenant Isolation Tests', () => {
  before(async () => {
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/notifications', authMiddleware, notificationRoutes);

    await initializeDb();
    await seedData();

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const { port } = server.address();
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(() => {
    return new Promise((resolve) => {
      server.close(resolve);
    });
  });

  beforeEach(async () => {
    await resetDb();
  });

  // ─── LIST NOTIFICATIONS ──────────────────────────────────────────

  it('Tenant t1 / User u1 sees notifications n1, n2, n3 (their tenant)', async () => {
    const res = await request('GET', '/notifications', { tenantId: 't1', userId: 'u1' });

    assert.equal(res.status, 200);
    const ids = res.body.data.map((n) => n.id);
    assert.ok(ids.includes('n1'), 'Should see n1 (tenant-wide, same tenant)');
    assert.ok(ids.includes('n2'), 'Should see n2 (addressed to u1)');
    assert.ok(ids.includes('n3'), 'Should see n3 (addressed to u1, read)');
    assert.equal(ids.length, 3, 'Should see exactly 3 notifications');
  });

  it('Tenant t1 / User u1 does NOT see n4 (tenant t2)', async () => {
    const res = await request('GET', '/notifications', { tenantId: 't1', userId: 'u1' });

    assert.equal(res.status, 200);
    const ids = res.body.data.map((n) => n.id);
    assert.ok(!ids.includes('n4'), 'Must NOT see n4 from tenant t2');
  });

  it('Tenant t2 / User u2 sees only n4 (their tenant)', async () => {
    const res = await request('GET', '/notifications', { tenantId: 't2', userId: 'u2' });

    assert.equal(res.status, 200);
    const ids = res.body.data.map((n) => n.id);
    assert.ok(ids.includes('n4'), 'Should see n4 (tenant-wide, same tenant)');
    assert.equal(ids.length, 1, 'Should see exactly 1 notification');
  });

  it('Tenant t1 / User u2 sees only tenant-wide notification n1 (not u1-specific ones)', async () => {
    const res = await request('GET', '/notifications', { tenantId: 't1', userId: 'u2' });

    assert.equal(res.status, 200);
    const ids = res.body.data.map((n) => n.id);
    assert.ok(ids.includes('n1'), 'Should see n1 (tenant-wide)');
    assert.ok(!ids.includes('n2'), 'Should NOT see n2 (addressed to u1 only)');
    assert.ok(!ids.includes('n3'), 'Should NOT see n3 (addressed to u1 only)');
    assert.equal(ids.length, 1, 'Should see exactly 1 notification');
  });

  // ─── UNREAD COUNT ────────────────────────────────────────────────

  it('Unread count for t1/u1 is 2 (n1 and n2 are unread, n3 is read)', async () => {
    const res = await request('GET', '/notifications/unread-count', { tenantId: 't1', userId: 'u1' });

    assert.equal(res.status, 200);
    assert.equal(res.body.count, 2, 'Unread count should be 2');
  });

  it('Unread count for t2/u2 is 1 (only n4)', async () => {
    const res = await request('GET', '/notifications/unread-count', { tenantId: 't2', userId: 'u2' });

    assert.equal(res.status, 200);
    assert.equal(res.body.count, 1, 'Unread count should be 1');
  });

  it('Unread count does NOT include notifications from other tenants', async () => {
    const res = await request('GET', '/notifications/unread-count', { tenantId: 't1', userId: 'u1' });

    // t1/u1 should count n1, n2 as unread (not n4 from t2)
    assert.equal(res.body.count, 2, 'Must not count cross-tenant notifications');
  });

  // ─── MARK SINGLE AS READ ────────────────────────────────────────

  it('Tenant t1 can mark their own notification n1 as read', async () => {
    const res = await request('PATCH', '/notifications/n1/read', { tenantId: 't1', userId: 'u1' });

    assert.equal(res.status, 200);
    assert.equal(res.body.read, true);
    assert.ok(res.body.readAt, 'readAt should be set');
  });

  it('Tenant t1 CANNOT mark n4 (tenant t2) as read — returns 404', async () => {
    const res = await request('PATCH', '/notifications/n4/read', { tenantId: 't1', userId: 'u1' });

    assert.equal(res.status, 404, 'Must return 404 for cross-tenant notification');
  });

  it('Tenant t2 CANNOT mark n1 (tenant t1) as read — returns 404', async () => {
    const res = await request('PATCH', '/notifications/n1/read', { tenantId: 't2', userId: 'u2' });

    assert.equal(res.status, 404, 'Must return 404 for cross-tenant notification');
  });

  it('Non-existent notification returns 404', async () => {
    const res = await request('PATCH', '/notifications/does-not-exist/read', { tenantId: 't1', userId: 'u1' });

    assert.equal(res.status, 404);
  });

  // ─── MARK ALL AS READ ────────────────────────────────────────────

  it('Mark-all-read for t1/u1 only affects their visible notifications', async () => {
    const res = await request('PATCH', '/notifications/read-all', { tenantId: 't1', userId: 'u1' });

    assert.equal(res.status, 200);
    assert.equal(res.body.updated, 2, 'Should update n1 and n2 (the 2 unread ones)');

    // Verify n4 (t2) is still unread
    const t2Res = await request('GET', '/notifications/unread-count', { tenantId: 't2', userId: 'u2' });
    assert.equal(t2Res.body.count, 1, 'Tenant t2 notification must still be unread');
  });

  it('Mark-all-read for t2 does NOT affect t1 notifications', async () => {
    const res = await request('PATCH', '/notifications/read-all', { tenantId: 't2', userId: 'u2' });

    assert.equal(res.status, 200);
    assert.equal(res.body.updated, 1, 'Should update 1 notification (n4)');

    // Verify t1 unread count is unchanged
    const t1Res = await request('GET', '/notifications/unread-count', { tenantId: 't1', userId: 'u1' });
    assert.equal(t1Res.body.count, 2, 'Tenant t1 unread count must be unchanged');
  });

  // ─── ORDERING ────────────────────────────────────────────────────

  it('Notifications are ordered: unread first, then newest first', async () => {
    const res = await request('GET', '/notifications', { tenantId: 't1', userId: 'u1' });

    assert.equal(res.status, 200);
    const notifications = res.body.data;

    // First two should be unread (n2 newer than n1)
    assert.equal(notifications[0].read, false);
    assert.equal(notifications[1].read, false);
    assert.equal(notifications[0].id, 'n2', 'Newest unread first');
    assert.equal(notifications[1].id, 'n1', 'Older unread second');

    // Last should be read
    assert.equal(notifications[2].read, true);
    assert.equal(notifications[2].id, 'n3', 'Read notification last');
  });

  // ─── AUTH HEADER VALIDATION ──────────────────────────────────────

  it('Missing auth headers returns 401', async () => {
    const res = await new Promise((resolve, reject) => {
      const url = new URL('/notifications', baseUrl);
      const req = http.request(
        { method: 'GET', hostname: url.hostname, port: url.port, path: url.pathname },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
        }
      );
      req.on('error', reject);
      req.end();
    });

    assert.equal(res.status, 401);
  });
});
