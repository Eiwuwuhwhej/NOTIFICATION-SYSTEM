import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchNotifications,
  fetchUnreadCount,
  markRead as apiMarkRead,
  markAllRead as apiMarkAllRead,
} from "../api/notifications";

const POLL_INTERVAL = 300000; // 5 minutes

/**
 * Custom hook for managing notification state.
 * Handles fetching, polling, marking as read, and state management.
 */
export function useNotifications(tenantId, userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);
  const prevCountRef = useRef(0);
  const [countChanged, setCountChanged] = useState(false);

  // Fetch unread count
  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await fetchUnreadCount(tenantId, userId);
      setUnreadCount((prev) => {
        if (count !== prev && prev !== 0) {
          setCountChanged(true);
          setTimeout(() => setCountChanged(false), 2000);
        }
        return count;
      });
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  }, [tenantId, userId]);

  // Fetch notification list
  const refreshList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotifications(tenantId, userId);
      setNotifications(data.data || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tenantId, userId]);

  // Refresh both
  const refresh = useCallback(async () => {
    await Promise.all([refreshList(), refreshUnreadCount()]);
  }, [refreshList, refreshUnreadCount]);

  // Mark single notification as read
  const markRead = useCallback(
    async (notificationId) => {
      try {
        await apiMarkRead(tenantId, userId, notificationId);
        // Optimistically update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, read: true, readAt: new Date().toISOString() }
              : n,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Error marking as read:", err);
        // Revert on error
        refresh();
      }
    },
    [tenantId, userId, refresh],
  );

  // Mark all notifications as read
  const markAllRead = useCallback(async () => {
    try {
      await apiMarkAllRead(tenantId, userId);
      // Optimistically update local state
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read: true,
          readAt: n.readAt || new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all as read:", err);
      refresh();
    }
  }, [tenantId, userId, refresh]);

  // Initial fetch
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Polling for unread count every 15 seconds
  useEffect(() => {
    pollRef.current = setInterval(refreshUnreadCount, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [refreshUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    countChanged,
    markRead,
    markAllRead,
    refresh,
  };
}
