/**
 * @fileoverview Firebase-based notifications hook for real-time notifications
 * @author Field Engineer Portal Team
 */

import { useState, useEffect, useCallback } from 'react';
import { dbService } from '@/lib/firebase';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { Notification, NotificationFactory } from '@/models/Notification';
import { Ticket } from '@/models/Ticket';
import { envLog } from '@/config/environment';

/**
 * Hook for managing Firebase-based notifications
 * @returns {Object} Notification system functions and state
 */
export function useFirebaseNotifications() {
  const { user, profile } = useFirebaseAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load notifications with real-time updates
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);

    // Set up real-time listener for notifications
    const unsubscribe = dbService.getNotificationsRealtime(
      user.uid,
      (firebaseNotifications) => {
        try {
          // Convert Firebase data to Notification models
          const notificationModels = firebaseNotifications.map(notifData => 
            Notification.fromDatabaseRecord({
              id: notifData.id,
              user_id: notifData.userId,
              type: notifData.type,
              title: notifData.title,
              message: notifData.message,
              priority: notifData.priority,
              is_read: notifData.isRead || false,
              ticket_id: notifData.ticketId,
              triggered_by: notifData.triggeredBy,
              metadata: notifData.metadata,
              created_at: notifData.createdAt?.toISOString() || new Date().toISOString(),
              read_at: notifData.readAt?.toISOString(),
              expires_at: notifData.expiresAt?.toISOString()
            })
          );

          // Filter out expired notifications
          const activeNotifications = notificationModels.filter(notif => !notif.isExpired());
          
          setNotifications(activeNotifications);
          setUnreadCount(activeNotifications.filter(notif => !notif.isRead).length);
          setLoading(false);
          
          envLog('log', `Loaded ${activeNotifications.length} notifications in real-time`);
        } catch (error) {
          envLog('error', 'Error processing notifications data:', error);
          setLoading(false);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user]);

  /**
   * Creates and sends notification when a ticket is created
   * @param {Ticket} ticket - The created ticket
   */
  const notifyTicketCreated = useCallback(async (ticket: Ticket) => {
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
    try {
      // Update in Firebase (this would require implementing update in dbService)
      // For now, we'll update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true, readAt: new Date() } as Notification
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      envLog('error', 'Error marking notification as read:', error);
    }
  }, []);

  /**
   * Marks all notifications as read for the current user
   */
  const markAllAsRead = useCallback(async () => {
    try {
      // Update all unread notifications
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true, readAt: new Date() } as Notification))
      );
      setUnreadCount(0);
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
