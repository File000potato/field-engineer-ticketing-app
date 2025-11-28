/**
 * @fileoverview Firebase-based notifications hook that uses centralized data context
 * @author Field Engineer Portal Team
 */

import { useCallback } from 'react';
import { dbService, isFirebaseConfigured } from '@/lib/firebase';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useFirebaseData } from '@/contexts/FirebaseDataContext';
import { Notification, NotificationFactory } from '@/models/Notification';
import { Ticket } from '@/models/Ticket';
import { envLog } from '@/config/environment';

/**
 * Hook for managing Firebase-based notifications using centralized context
 * @returns {Object} Notification system functions and state
 */
export function useFirebaseNotifications() {
  const { user, profile } = useFirebaseAuth();
  const { notifications, unreadCount, notificationsLoading: loading } = useFirebaseData();

  /**
   * Creates and sends notification when a ticket is created
   * @param {Ticket} ticket - The created ticket
   */
  const notifyTicketCreated = useCallback(async (ticket: Ticket) => {
    if (!isFirebaseConfigured()) {
      envLog('error', 'Firebase not configured, cannot create notification');
      return;
    }

    try {
      // Get all supervisors and admins to notify
      const supervisors = await dbService.getUsersByRole('supervisor');
      const admins = await dbService.getUsersByRole('admin');
      const usersToNotify = [...supervisors, ...admins];

      // Create notifications for each user
      for (const supervisorUser of usersToNotify) {
        const notification = NotificationFactory.createTicketCreatedNotification(ticket, supervisorUser.id);
        
        await dbService.createNotification({
          userId: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          ticketId: notification.ticketId,
          triggeredBy: notification.triggeredBy,
          metadata: notification.metadata
        });
      }

      envLog('log', `Created ${usersToNotify.length} notifications for ticket creation: ${ticket.title}`);
    } catch (error) {
      envLog('error', 'Error creating ticket creation notifications:', error);
    }
  }, []);

  /**
   * Creates and sends notification when a ticket is resolved
   * @param {Ticket} ticket - The resolved ticket
   * @param {string} resolvedByUserId - ID of user who resolved the ticket
   */
  const notifyTicketResolved = useCallback(async (ticket: Ticket, resolvedByUserId: string) => {
    if (!isFirebaseConfigured()) {
      envLog('error', 'Firebase not configured, cannot create notification');
      return;
    }

    try {
      const notification = NotificationFactory.createTicketResolvedNotification(ticket, resolvedByUserId);
      
      await dbService.createNotification({
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        ticketId: notification.ticketId,
        triggeredBy: notification.triggeredBy,
        metadata: notification.metadata
      });

      envLog('log', `Created notification for ticket resolution: ${ticket.title}`);
    } catch (error) {
      envLog('error', 'Error creating ticket resolution notification:', error);
    }
  }, []);

  /**
   * Creates and sends notification when a ticket is assigned
   * @param {Ticket} ticket - The assigned ticket
   * @param {string} assignedUserId - ID of assigned user
   * @param {string} assignedByUserId - ID of user who made assignment
   */
  const notifyTicketAssigned = useCallback(async (ticket: Ticket, assignedUserId: string, assignedByUserId: string) => {
    if (!isFirebaseConfigured()) {
      envLog('error', 'Firebase not configured, cannot create notification');
      return;
    }

    try {
      const notification = NotificationFactory.createTicketAssignedNotification(ticket, assignedUserId, assignedByUserId);
      
      await dbService.createNotification({
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        ticketId: notification.ticketId,
        triggeredBy: notification.triggeredBy,
        metadata: notification.metadata
      });

      envLog('log', `Created notification for ticket assignment: ${ticket.title}`);
    } catch (error) {
      envLog('error', 'Error creating ticket assignment notification:', error);
    }
  }, []);

  /**
   * Marks a notification as read
   * @param {string} notificationId - ID of the notification to mark as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!isFirebaseConfigured()) {
      envLog('error', 'Firebase not configured, cannot mark notification as read');
      return;
    }

    try {
      // This would require implementing an update function in dbService
      // For now, we'll just log it
      envLog('log', 'Marking notification as read:', notificationId);
    } catch (error) {
      envLog('error', 'Error marking notification as read:', error);
    }
  }, []);

  /**
   * Marks all notifications as read for the current user
   */
  const markAllAsRead = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      envLog('error', 'Firebase not configured, cannot mark all notifications as read');
      return;
    }

    try {
      // This would require batch updates in dbService
      envLog('log', 'Marking all notifications as read');
    } catch (error) {
      envLog('error', 'Error marking all notifications as read:', error);
    }
  }, []);

  /**
   * Gets notifications filtered by type
   * @param {string[]} types - Array of notification types to filter by
   * @returns {Notification[]} Filtered notifications
   */
  const getNotificationsByType = useCallback((types: string[]): Notification[] => {
    return notifications.filter(notif => types.includes(notif.type));
  }, [notifications]);

  /**
   * Gets unread notifications
   * @returns {Notification[]} Unread notifications
   */
  const getUnreadNotifications = useCallback((): Notification[] => {
    return notifications.filter(notif => !notif.isRead);
  }, [notifications]);

  /**
   * Gets recent notifications (last 24 hours)
   * @returns {Notification[]} Recent notifications
   */
  const getRecentNotifications = useCallback((): Notification[] => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return notifications.filter(notif => notif.createdAt > yesterday);
  }, [notifications]);

  /**
   * Creates a system notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} [priority] - Notification priority
   */
  const createSystemNotification = useCallback(async (
    title: string, 
    message: string, 
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ) => {
    if (!user) return;

    if (!isFirebaseConfigured()) {
      envLog('error', 'Firebase not configured, cannot create system notification');
      return;
    }

    try {
      await dbService.createNotification({
        userId: user.uid,
        type: 'system',
        title,
        message,
        priority,
        triggeredBy: null,
        metadata: null
      });

      envLog('log', 'Created system notification:', title);
    } catch (error) {
      envLog('error', 'Error creating system notification:', error);
    }
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    notifyTicketCreated,
    notifyTicketResolved,
    notifyTicketAssigned,
    getNotificationsByType,
    getUnreadNotifications,
    getRecentNotifications,
    createSystemNotification
  };
}
