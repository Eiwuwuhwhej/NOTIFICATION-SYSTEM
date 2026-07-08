const { createClient } = require('@libsql/client');
require('dotenv').config();

let db;

async function initializeDb() {
  // Fallback to local SQLite file if Turso environment variables are not set
  const url = process.env.TURSO_DATABASE_URL || 'file:./data/notifications.db';
  const authToken = process.env.TURSO_AUTH_TOKEN;

  db = createClient({
    url,
    authToken,
  });

  await db.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      user_id TEXT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      read_at TEXT
    )
  `);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_notifications_tenant_user ON notifications(tenant_id, user_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_notifications_tenant_read ON notifications(tenant_id, read)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)`);
  
  // Optimal composite index for pagination and sorting
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_notifications_optimal ON notifications(tenant_id, read ASC, created_at DESC)`);

  return db;
}

async function seedData() {
  const seedNotifications = [
    {
      id: "n1",
      tenant_id: "t1",
      user_id: null,
      type: "member_invited",
      title: "New team member",
      body: "Sarah joined Nova Talent",
      read: 0,
      created_at: "2026-07-01T09:00:00Z",
      read_at: null,
    },
    {
      id: "n2",
      tenant_id: "t1",
      user_id: "u1",
      type: "new_reply",
      title: "Creator replied",
      body: "Priya Sharma replied to your outreach message",
      read: 0,
      created_at: "2026-07-02T14:30:00Z",
      read_at: null,
    },
    {
      id: "n3",
      tenant_id: "t1",
      user_id: "u1",
      type: "report_ready",
      title: "Report ready",
      body: "Your July campaign report is ready to view",
      read: 1,
      created_at: "2026-06-28T08:00:00Z",
      read_at: "2026-06-28T10:00:00Z",
    },
    {
      id: "n4",
      tenant_id: "t2",
      user_id: null,
      type: "member_invited",
      title: "New team member",
      body: "James joined Bright Star Agency",
      read: 0,
      created_at: "2026-07-01T09:05:00Z",
      read_at: null,
    },
  ];

  for (const n of seedNotifications) {
    const existing = await db.execute({
      sql: `SELECT id FROM notifications WHERE id = ?`,
      args: [n.id]
    });
    
    if (existing.rows.length === 0) {
      await db.execute({
        sql: `INSERT INTO notifications (id, tenant_id, user_id, type, title, body, read, created_at, read_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          n.id,
          n.tenant_id,
          n.user_id,
          n.type,
          n.title,
          n.body,
          n.read,
          n.created_at,
          n.read_at,
        ]
      });
    }
  }

  console.log("✓ Seed data loaded");
}

function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call initializeDb() first.");
  }
  return db;
}

// Map the old sql.js wrapper functions to @libsql/client async calls
async function queryAll(sql, args = []) {
  const result = await db.execute({ sql, args });
  return result.rows;
}

async function queryOne(sql, args = []) {
  const result = await db.execute({ sql, args });
  return result.rows.length > 0 ? result.rows[0] : null;
}

async function runSql(sql, args = []) {
  const result = await db.execute({ sql, args });
  return { changes: result.rowsAffected };
}

// We don't need saveDb anymore for remote database
function saveDb() {
  // no-op
}

module.exports = {
  initializeDb,
  seedData,
  getDb,
  queryAll,
  queryOne,
  runSql,
  saveDb,
};
