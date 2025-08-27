/**
 * @fileoverview Firebase Data Context to manage single real-time listeners
 * Prevents multiple listeners on the same Firestore collections
 * @author Field Engineer Portal Team
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { dbService, isFirebaseConfigured } from '@/lib/firebase';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { Ticket } from '@/models/Ticket';
import { Notification } from '@/models/Notification';
import { envLog } from '@/config/environment';

interface FirebaseDataContextType {
  // Tickets
  tickets: Ticket[];
  ticketsLoading: boolean;
  ticketsError: string | null;
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  notificationsLoading: boolean;
  
  // Engineers/Users
  engineers: any[];
  engineersLoading: boolean;
  
  // Methods
  refreshData: () => void;
}

const FirebaseDataContext = createContext<FirebaseDataContextType | undefined>(undefined);

export function FirebaseDataProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useFirebaseAuth();
  
  // Tickets state
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  
  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  
  // Engineers state
  const [engineers, setEngineers] = useState<any[]>([]);
  const [engineersLoading, setEngineersLoading] = useState(true);
  
  // Refs to track unsubscribe functions
  const ticketsUnsubscribeRef = useRef<(() => void) | null>(null);
  const notificationsUnsubscribeRef = useRef<(() => void) | null>(null);

  // Load engineers (one-time fetch)
  const loadEngineers = useCallback(async () => {
    if (!user || !profile) return;

    try {
      setEngineersLoading(true);
      
      if (!isFirebaseConfigured()) {
        // Use mock data when Firebase is not configured
        const mockEngineers = [
          { id: '1', full_name: 'Admin User', email: 'admin@test.com', role: 'admin', is_active: true },
          { id: '2', full_name: 'Supervisor User', email: 'supervisor@test.com', role: 'supervisor', is_active: true },
          { id: '3', full_name: 'Field Engineer', email: 'engineer@test.com', role: 'field_engineer', is_active: true }
        ];
        setEngineers(mockEngineers);
      } else {
        const engineersData = await dbService.getUsersByRole();
        setEngineers(engineersData);
      }
      
      setEngineersLoading(false);
    } catch (error) {
      envLog('error', 'Error loading engineers:', error);
      setEngineersLoading(false);
    }
  }, [user, profile]);

  // Set up tickets real-time listener (single instance)
  useEffect(() => {
    if (!user || !profile) {
      setTickets([]);
      setTicketsLoading(false);
      return;
    }

    // Cleanup previous listener
    if (ticketsUnsubscribeRef.current) {
      ticketsUnsubscribeRef.current();
      ticketsUnsubscribeRef.current = null;
    }

    setTicketsLoading(true);
    setTicketsError(null);

    if (!isFirebaseConfigured()) {
      // Use mock data when Firebase is not configured
      envLog('log', 'Using mock tickets data');
      const mockTickets = [
        {
          id: '1',
          ticketNumber: 'TKT-001',
          title: 'Demo Maintenance Task',
          description: 'This is a demo maintenance ticket',
          type: 'maintenance',
          priority: 'medium',
          status: 'open',
          createdBy: user.uid,
          assignedTo: null,
          location: 'Demo Location',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const ticketModels = mockTickets.map(ticketData => 
        Ticket.fromDatabaseRecord({
          id: ticketData.id,
          ticket_number: ticketData.ticketNumber,
          title: ticketData.title,
          description: ticketData.description,
          type: ticketData.type,
          priority: ticketData.priority,
          status: ticketData.status,
          created_by: ticketData.createdBy,
          assigned_to: ticketData.assignedTo,
          location: ticketData.location,
          created_at: ticketData.createdAt.toISOString(),
          updated_at: ticketData.updatedAt.toISOString()
        })
      );
      
      setTickets(ticketModels);
      setTicketsLoading(false);
      return;
    }

    try {
      // Set up single real-time listener for tickets
      const unsubscribe = dbService.getTicketsRealtime(
        user.uid,
        profile.role,
        (firebaseTickets) => {
          try {
            const ticketModels = firebaseTickets.map(ticketData => 
              Ticket.fromDatabaseRecord({
                id: ticketData.id,
                ticket_number: ticketData.ticketNumber || `TKT-${ticketData.id.slice(-6)}`,
                title: ticketData.title,
                description: ticketData.description,
                type: ticketData.type || 'maintenance',
                priority: ticketData.priority || 'medium',
                status: ticketData.status || 'open',
                created_by: ticketData.createdBy,
                assigned_to: ticketData.assignedTo,
                verified_by: ticketData.verifiedBy,
                equipment_id: ticketData.equipmentId,
                location: ticketData.location,
                created_at: ticketData.createdAt?.toISOString() || new Date().toISOString(),
                updated_at: ticketData.updatedAt?.toISOString() || new Date().toISOString(),
                due_date: ticketData.dueDate?.toISOString(),
                resolved_at: ticketData.resolvedAt?.toISOString(),
                estimated_hours: ticketData.estimatedHours,
                actual_hours: ticketData.actualHours || 0,
                notes: ticketData.notes,
                created_by_profile: ticketData.createdByProfile,
                assigned_to_profile: ticketData.assignedToProfile,
                verified_by_profile: ticketData.verifiedByProfile,
                equipment: ticketData.equipment
              })
            );

            setTickets(ticketModels);
            setTicketsLoading(false);
            envLog('log', `Loaded ${ticketModels.length} tickets via context`);
          } catch (error) {
            envLog('error', 'Error processing tickets data:', error);
            setTicketsError('Failed to process tickets data');
            setTicketsLoading(false);
          }
        }
      );

      ticketsUnsubscribeRef.current = unsubscribe;
    } catch (error) {
      envLog('error', 'Error setting up tickets listener:', error);
      setTicketsError('Failed to load tickets');
      setTicketsLoading(false);
    }

    return () => {
      if (ticketsUnsubscribeRef.current) {
        ticketsUnsubscribeRef.current();
        ticketsUnsubscribeRef.current = null;
      }
    };
  }, [user, profile]);

  // Set up notifications real-time listener (single instance)
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setNotificationsLoading(false);
      return;
    }

    // Cleanup previous listener
    if (notificationsUnsubscribeRef.current) {
      notificationsUnsubscribeRef.current();
      notificationsUnsubscribeRef.current = null;
    }

    setNotificationsLoading(true);

    if (!isFirebaseConfigured()) {
      // Use mock data when Firebase is not configured
      envLog('log', 'Using mock notifications data');
      setNotifications([]);
      setUnreadCount(0);
      setNotificationsLoading(false);
      return;
    }

    try {
      // Set up single real-time listener for notifications
      const unsubscribe = dbService.getNotificationsRealtime(
        user.uid,
        (firebaseNotifications) => {
          try {
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

            const activeNotifications = notificationModels.filter(notif => !notif.isExpired());
            
            setNotifications(activeNotifications);
            setUnreadCount(activeNotifications.filter(notif => !notif.isRead).length);
            setNotificationsLoading(false);
            
            envLog('log', `Loaded ${activeNotifications.length} notifications via context`);
          } catch (error) {
            envLog('error', 'Error processing notifications data:', error);
            setNotificationsLoading(false);
          }
        }
      );

      notificationsUnsubscribeRef.current = unsubscribe;
    } catch (error) {
      envLog('error', 'Error setting up notifications listener:', error);
      setNotificationsLoading(false);
    }

    return () => {
      if (notificationsUnsubscribeRef.current) {
        notificationsUnsubscribeRef.current();
        notificationsUnsubscribeRef.current = null;
      }
    };
  }, [user]);

  // Load engineers when user/profile changes
  useEffect(() => {
    loadEngineers();
  }, [loadEngineers]);

  // Manual refresh function
  const refreshData = useCallback(() => {
    loadEngineers();
    // Listeners will automatically refresh real-time data
  }, [loadEngineers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ticketsUnsubscribeRef.current) {
        ticketsUnsubscribeRef.current();
      }
      if (notificationsUnsubscribeRef.current) {
        notificationsUnsubscribeRef.current();
      }
    };
  }, []);

  const value: FirebaseDataContextType = {
    tickets,
    ticketsLoading,
    ticketsError,
    notifications,
    unreadCount,
    notificationsLoading,
    engineers,
    engineersLoading,
    refreshData
  };

  return (
    <FirebaseDataContext.Provider value={value}>
      {children}
    </FirebaseDataContext.Provider>
  );
}

export function useFirebaseData() {
  const context = useContext(FirebaseDataContext);
  if (context === undefined) {
    throw new Error('useFirebaseData must be used within a FirebaseDataProvider');
  }
  return context;
}
