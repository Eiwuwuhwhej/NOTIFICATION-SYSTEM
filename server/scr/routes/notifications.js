const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { queryAll, queryOne, runSql } = require('../db');

const router = express.Router();

/**
 * POST /notifications
 * Create a new notification.
 * Called by backend trigger logic (or directly for testing).
 */
router.post('/', async (req, res) => {
  const { tenantId, userId, type, title, body } = req.body;

  // Validate required fields
  if (!tenantId || !type || !title || !body) {
    return res.status(400).json({
      error: 'Missing required fields: tenantId, type, title, body',
    });
  }

  const id = req.body.id || uuidv4();
  const now = new Date().toISOString();

  try {
    await runSql(
      `INSERT INTO notifications (id, tenant_id, user_id, type, title, body, read, created_at, read_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, NULL)`,
      [id, tenantId, userId || null, type, title, body, now]
    );

    const notification = await queryOne('SELECT * FROM notifications WHERE id = ?', [id]);
    res.status(201).json(formatNotification(notification));
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'Notification with this id already exists' });
    }
    console.error('Error creating notification:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /notifications
 * List notifications visible to the calling user:
 *   - Tenant-wide notifications (user_id IS NULL) for their tenant
 *   - Notifications specifically addressed to them (user_id = their id)
 *
 * Sorted: unread first, then newest first.
 * Paginated via ?page=1&limit=20
 */
router.get('/', async (req, res) => {
  const { tenantId, userId } = req;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  try {
    // Count total visible notifications for pagination metadata
    const countResult = await queryOne(
      `SELECT COUNT(*) as total
       FROM notifications
       WHERE tenant_id = ? AND (user_id IS NULL OR user_id = ?)`,
      [tenantId, userId]
    );

    // Fetch paginated results: unread first, then newest first
    const notifications = await queryAll(
      `SELECT *
       FROM notifications
       WHERE tenant_id = ? AND (user_id IS NULL OR user_id = ?)
       ORDER BY read ASC, created_at DESC
       LIMIT ? OFFSET ?`,
      [tenantId, userId, limit, offset]
    );

    res.json({
      data: notifications.map(formatNotification),
      pagination: {
        page,
        limit,
        total: Number(countResult.total),
        totalPages: Math.ceil(Number(countResult.total) / limit),
      },
    });
  } catch (err) {
    console.error('Error listing notifications:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /notifications/unread-count
 * Returns just the unread count for the calling user (for badge display).
 */
router.get('/unread-count', async (req, res) => {
  const { tenantId, userId } = req;

  try {
    const result = await queryOne(
      `SELECT COUNT(*) as count
       FROM notifications
       WHERE tenant_id = ? AND (user_id IS NULL OR user_id = ?) AND read = 0`,
      [tenantId, userId]
    );

    res.json({ count: Number(result['COUNT(*)'] ?? result.count) });
  } catch (err) {
    console.error('Error getting unread count:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /notifications/:id/read
 * Mark a single notification as read.
 * Must belong to the caller's tenant — returns 404 otherwise (tenant isolation).
 */
router.patch('/:id/read', async (req, res) => {
  const { tenantId, userId } = req;
  const { id } = req.params;

  try {
    // Look up the notification scoped to this tenant
    // This ensures tenant isolation: even if you guess an id from another tenant, you get 404
    const notification = await queryOne(
      `SELECT *
       FROM notifications
       WHERE id = ? AND tenant_id = ? AND (user_id IS NULL OR user_id = ?)`,
      [id, tenantId, userId]
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.read) {
      // Already read — return it as-is
      return res.json(formatNotification(notification));
    }

    const now = new Date().toISOString();
    await runSql('UPDATE notifications SET read = 1, read_at = ? WHERE id = ?', [now, id]);

    const updated = await queryOne('SELECT * FROM notifications WHERE id = ?', [id]);
    res.json(formatNotification(updated));
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /notifications/read-all
 * Mark all of the caller's visible notifications as read.
 */
router.patch('/read-all', async (req, res) => {
  const { tenantId, userId } = req;

  try {
    const now = new Date().toISOString();
    const result = await runSql(
      `UPDATE notifications
       SET read = 1, read_at = ?
       WHERE tenant_id = ? AND (user_id IS NULL OR user_id = ?) AND read = 0`,
      [now, tenantId, userId]
    );

    res.json({
      message: 'All notifications marked as read',
      updated: result.changes,
    });
  } catch (err) {
    console.error('Error marking all as read:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Format a database row to the API response shape.
 * sql.js returns column names exactly as defined in the query.
 */
function formatNotification(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    read: Boolean(row.read),
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

module.exports = router;
