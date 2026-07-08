import React from 'react';

/**
 * NotificationBell — Bell icon with animated unread count badge.
 * Pulses when the count changes to draw attention.
 */
export default function NotificationBell({ unreadCount, isOpen, onClick, countChanged, bellAttention }) {
  return (
    <div className="bell-container">
      {/* Pulsing ring when there are unread notifications */}
      {unreadCount > 0 && !isOpen && (
        <span className={`bell-ring ${bellAttention ? 'attention' : ''}`} />
      )}
      <button
        id="notification-bell"
        className={`bell-button ${isOpen ? 'active' : ''} ${bellAttention ? 'shake' : ''}`}
        onClick={onClick}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        title="Click here to view your notifications"
      >
      <svg
        className="bell-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unreadCount > 0 && (
        <span
          className={`bell-badge ${countChanged ? 'pulse' : ''}`}
          key={unreadCount} // Re-triggers pop animation on count change
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      </button>
      {!isOpen && (
        <div className="bell-tooltip">
          🔔 Your notifications appear here
        </div>
      )}
    </div>
  );
}
