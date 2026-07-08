const API_URL = import.meta.env.VITE_API_URL || "";
const API_BASE = `${API_URL}/notifications`;
const TRIGGER_BASE = `${API_URL}/triggers`;
function authHeaders(tenantId, userId) {
  return {
    "Content-Type": "application/json",
    "X-Tenant-Id": tenantId,
    "X-User-Id": userId,
  };
}
export async function fetchNotifications(
  tenantId,
  userId,
  page = 1,
  limit = 20,
) {
  const res = await fetch(`${API_BASE}?page=${page}&limit=${limit}`, {
    headers: authHeaders(tenantId, userId),
  });

  if (!res.ok) throw new Error(`Failed to fetch notifications: ${res.status}`);
  return res.json();
}
export async function fetchUnreadCount(tenantId, userId) {
  const res = await fetch(`${API_BASE}/unread-count`, {
    headers: authHeaders(tenantId, userId),
  });

  if (!res.ok) throw new Error(`Failed to fetch unread count: ${res.status}`);
  const data = await res.json();
  return data.count;
}

export async function markRead(tenantId, userId, notificationId) {
  const res = await fetch(`${API_BASE}/${notificationId}/read`, {
    method: "PATCH",
    headers: authHeaders(tenantId, userId),
  });

  if (!res.ok)
    throw new Error(`Failed to mark notification as read: ${res.status}`);
  return res.json();
}

/**
 * Mark all visible notifications as read.
 */
export async function markAllRead(tenantId, userId) {
  const res = await fetch(`${API_BASE}/read-all`, {
    method: "PATCH",
    headers: authHeaders(tenantId, userId),
  });

  if (!res.ok) throw new Error(`Failed to mark all as read: ${res.status}`);
  return res.json();
}

/**
 * Fire a trigger event (invite or reply).
 */
export async function fireTrigger(tenantId, userId, type, payload = {}) {
  const res = await fetch(`${TRIGGER_BASE}/${type}`, {
    method: "POST",
    headers: authHeaders(tenantId, userId),
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Failed to fire trigger: ${res.status}`);
  return res.json();
}
