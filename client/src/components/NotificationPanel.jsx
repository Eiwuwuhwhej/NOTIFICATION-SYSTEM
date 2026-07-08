import React, { useEffect, useRef } from 'react';
import NotificationItem from './NotificationItem';

/**
 * NotificationPanel — Clean dropdown listing notifications.
 * On mobile: full-screen slide-up sheet with backdrop overlay.
 */
export default function NotificationPanel({
  notifications,
  loading,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onClose,
}) {
  const panelRef = useRef(null);

  // Close on click/touch outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        !e.target.closest('#notification-bell') &&
        !e.target.closest('.panel-overlay')
      ) {
        onClose();
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when panel is open on mobile
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const isMobile = window.innerWidth <= 480;
    if (isMobile) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <>
      {/* Backdrop overlay — visible only on mobile via CSS */}
      <div className="panel-overlay" onClick={onClose} />

      <div className="notification-panel" ref={panelRef} id="notification-panel" role="dialog">
        <div className="panel-header">
          <h2>Notifications</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="mark-all-btn"
              onClick={onMarkAllRead}
              disabled={unreadCount === 0}
              id="mark-all-read-btn"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Clear All
            </button>
            <button
              className="panel-close-btn"
              onClick={onClose}
              aria-label="Close notifications"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
        <div className="panel-body">
          {loading && notifications.length === 0 ? (
            <div className="empty-state">
              <div className="loading-spinner" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="empty-state">
              <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
              <div className="empty-state-title">All caught up! 🎉</div>
              <div className="empty-state-body">
                No notifications yet. Click one of the cards below to send one.
              </div>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={onMarkRead}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}

