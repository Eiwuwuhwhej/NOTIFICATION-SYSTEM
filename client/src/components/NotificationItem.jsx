import React, { useState } from 'react';
import { timeAgo } from '../utils/timeAgo';

/**
 * SVG icons per notification type — clean, minimal line icons.
 */
const TYPE_ICONS = {
  member_invited: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  new_reply: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  report_ready: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  default: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
};

/**
 * NotificationItem — Single notification row.
 * Minimal: icon, title, body, time. Click to mark read.
 */
export default function NotificationItem({ notification, onMarkRead }) {
  const [markingRead, setMarkingRead] = useState(false);
  const { id, type, title, body, read, createdAt } = notification;
  const icon = TYPE_ICONS[type] || TYPE_ICONS.default;

  const handleClick = async () => {
    if (read || markingRead) return;
    setMarkingRead(true);
    await onMarkRead(id);
    setTimeout(() => setMarkingRead(false), 300);
  };

  return (
    <div
      id={`notification-${id}`}
      className={`notification-item ${read ? 'read' : 'unread'} ${markingRead ? 'marking-read' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <div className="notification-icon">
        {icon}
      </div>
      <div className="notification-content">
        <div className="notification-title">{title}</div>
        <div className="notification-body">{body}</div>
        <div className="notification-meta">
          <span className="notification-time">{timeAgo(createdAt)}</span>
          {!read && !markingRead && (
            <span className="notification-mark-hint">Click to mark as read</span>
          )}
        </div>
      </div>
      {!read && <span className="unread-dot" />}
    </div>
  );
}
