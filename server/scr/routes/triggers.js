const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { queryOne, runSql } = require('../db');

const router = express.Router();

/**
 * POST /triggers/invite
 * Simulates a "new team member invited" event.
 * Creates a tenant-wide notification (userId: null).
 */
router.post('/invite', async (req, res) => {
  const { tenantId } = req;
  const memberName = req.body.memberName || 'Alex Chen';
  const orgName = req.body.orgName || 'Nova Talent';

  const id = uuidv4();
  const now = new Date().toISOString();

  try {
    await runSql(
      `INSERT INTO notifications (id, tenant_id, user_id, type, title, body, read, created_at, read_at)
       VALUES (?, ?, NULL, 'member_invited', 'New team member', ?, 0, ?, NULL)`,
      [id, tenantId, `${memberName} was invited to ${orgName}`, now]
    );

    const notification = await queryOne('SELECT * FROM notifications WHERE id = ?', [id]);

    res.status(201).json({
      message: `Trigger fired: "${memberName}" invited to "${orgName}"`,
      notification: formatNotification(notification),
    });
  } catch (err) {
    console.error('Error in invite trigger:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /triggers/reply
 * Simulates a "creator replied to outreach" event.
 * Creates a user-specific notification (addressed to the calling user).
 */
router.post('/reply', async (req, res) => {
  const { tenantId, userId } = req;
  const creatorName = req.body.creatorName || 'Marcus Johnson';

  const id = uuidv4();
  const now = new Date().toISOString();

  try {
    await runSql(
      `INSERT INTO notifications (id, tenant_id, user_id, type, title, body, read, created_at, read_at)
       VALUES (?, ?, ?, 'new_reply', 'Creator replied', ?, 0, ?, NULL)`,
      [id, tenantId, userId, `${creatorName} replied to your campaign pitch`, now]
    );

    const notification = await queryOne('SELECT * FROM notifications WHERE id = ?', [id]);

    res.status(201).json({
      message: `Trigger fired: "${creatorName}" replied to outreach`,
      notification: formatNotification(notification),
    });
  } catch (err) {
    console.error('Error in reply trigger:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
