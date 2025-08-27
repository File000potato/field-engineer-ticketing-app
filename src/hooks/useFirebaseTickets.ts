/**
 * @fileoverview Firebase-based tickets hook that uses centralized data context
 * @author Field Engineer Portal Team
 */

import { useCallback } from 'react';
import { dbService, isFirebaseConfigured } from '@/lib/firebase';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useFirebaseData } from '@/contexts/FirebaseDataContext';
import { Ticket } from '@/models/Ticket';
import { toast } from '@/components/ui/use-toast';
import { envLog } from '@/config/environment';

export const useFirebaseTickets = () => {
  const { user, profile } = useFirebaseAuth();
  const { tickets, ticketsLoading: loading, ticketsError: error, engineers } = useFirebaseData();

  /**
   * Create a new ticket
   * @param {Object} ticketData - Ticket data
   * @returns {Promise<string>} New ticket ID
   */
  const createTicket = async (ticketData: any): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      if (!isFirebaseConfigured()) {
        throw new Error('Firebase is not properly configured');
      }

      const newTicketData = {
        ticketNumber: `TKT-${Date.now().toString().slice(-6)}`,
        title: ticketData.title,
        description: ticketData.description,
        type: ticketData.type || 'maintenance',
        priority: ticketData.priority || 'medium',
        status: 'open',
        createdBy: user.uid,
        assignedTo: ticketData.assignedTo || null,
        equipmentId: ticketData.equipmentId || null,
        location: ticketData.location,
        dueDate: ticketData.dueDate || null,
        estimatedHours: ticketData.estimatedHours || null,
        notes: ticketData.notes || null
      };

      const ticketId = await dbService.createTicket(newTicketData);
      
      toast({
        title: 'Ticket created',
        description: 'Your ticket has been created successfully.',
      });

      envLog('log', 'Ticket created:', ticketId);
      return ticketId;
    } catch (error: any) {
      envLog('error', 'Error creating ticket:', error);
      
      toast({
        title: 'Failed to create ticket',
        description: error.message || 'An error occurred while creating the ticket.',
        variant: 'destructive'
      });
      
      throw error;
    }
  };

  /**
   * Update a ticket
   * @param {string} ticketId - Ticket ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<void>}
   */
  const updateTicket = async (ticketId: string, updates: any): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      if (!isFirebaseConfigured()) {
        throw new Error('Firebase is not properly configured');
      }

      // Convert updates to Firebase format
      const firebaseUpdates: any = {};
      
      if (updates.title) firebaseUpdates.title = updates.title;
      if (updates.description) firebaseUpdates.description = updates.description;
      if (updates.status) firebaseUpdates.status = updates.status;
      if (updates.priority) firebaseUpdates.priority = updates.priority;
      if (updates.assignedTo !== undefined) firebaseUpdates.assignedTo = updates.assignedTo;
      if (updates.location) firebaseUpdates.location = updates.location;
      if (updates.notes !== undefined) firebaseUpdates.notes = updates.notes;
      if (updates.dueDate) firebaseUpdates.dueDate = new Date(updates.dueDate);
      if (updates.estimatedHours) firebaseUpdates.estimatedHours = updates.estimatedHours;
      if (updates.actualHours) firebaseUpdates.actualHours = updates.actualHours;

      // Set resolved timestamp if status is resolved
      if (updates.status === 'resolved' && !updates.resolvedAt) {
        firebaseUpdates.resolvedAt = new Date();
        firebaseUpdates.resolvedBy = user.uid;
      }

      await dbService.updateTicket(ticketId, firebaseUpdates);
      
      toast({
        title: 'Ticket updated',
        description: 'The ticket has been updated successfully.',
      });

      envLog('log', 'Ticket updated:', ticketId);
    } catch (error: any) {
      envLog('error', 'Error updating ticket:', error);
      
      toast({
        title: 'Failed to update ticket',
        description: error.message || 'An error occurred while updating the ticket.',
        variant: 'destructive'
      });
      
      throw error;
    }
  };

  /**
   * Delete a ticket
   * @param {string} ticketId - Ticket ID
   * @returns {Promise<void>}
   */
  const deleteTicket = async (ticketId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      if (!isFirebaseConfigured()) {
        throw new Error('Firebase is not properly configured');
      }

      await dbService.deleteTicket(ticketId);
      
      toast({
        title: 'Ticket deleted',
        description: 'The ticket has been deleted successfully.',
      });

      envLog('log', 'Ticket deleted:', ticketId);
    } catch (error: any) {
      envLog('error', 'Error deleting ticket:', error);
      
      toast({
        title: 'Failed to delete ticket',
        description: error.message || 'An error occurred while deleting the ticket.',
        variant: 'destructive'
      });
      
      throw error;
    }
  };

  /**
   * Assign a ticket to a user
   * @param {string} ticketId - Ticket ID
   * @param {string} userId - User ID to assign to
   * @returns {Promise<void>}
   */
  const assignTicket = async (ticketId: string, userId: string): Promise<void> => {
    await updateTicket(ticketId, { 
      assignedTo: userId,
      status: 'assigned'
    });
  };

  /**
   * Add a comment to a ticket (placeholder - would need comments collection)
   * @param {string} ticketId - Ticket ID
   * @param {string} comment - Comment text
   * @returns {Promise<void>}
   */
  const addComment = async (ticketId: string, comment: string): Promise<void> => {
    // This would require a separate comments collection in Firebase
    // For now, we'll add it as a note update
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      const existingNotes = ticket.notes || '';
      const newNotes = existingNotes 
        ? `${existingNotes}\n\n[${new Date().toLocaleString()}] ${profile?.getDisplayName()}: ${comment}`
        : `[${new Date().toLocaleString()}] ${profile?.getDisplayName()}: ${comment}`;
      
      await updateTicket(ticketId, { notes: newNotes });
    }
  };

  /**
   * Get ticket by ID
   * @param {string} ticketId - Ticket ID
   * @returns {Ticket|undefined} Ticket if found
   */
  const getTicketById = useCallback((ticketId: string): Ticket | undefined => {
    return tickets.find(ticket => ticket.id === ticketId);
  }, [tickets]);

  /**
   * Get tickets by status
   * @param {string[]} statuses - Array of statuses to filter by
   * @returns {Ticket[]} Filtered tickets
   */
  const getTicketsByStatus = useCallback((statuses: string[]): Ticket[] => {
    return tickets.filter(ticket => statuses.includes(ticket.status));
  }, [tickets]);

  /**
   * Get tickets assigned to current user
   * @returns {Ticket[]} Assigned tickets
   */
  const getAssignedTickets = useCallback((): Ticket[] => {
    return tickets.filter(ticket => ticket.assignedTo === user?.uid);
  }, [tickets, user]);

  /**
   * Get tickets created by current user
   * @returns {Ticket[]} Created tickets
   */
  const getCreatedTickets = useCallback((): Ticket[] => {
    return tickets.filter(ticket => ticket.createdBy === user?.uid);
  }, [tickets, user]);

  /**
   * Get overdue tickets
   * @returns {Ticket[]} Overdue tickets
   */
  const getOverdueTickets = useCallback((): Ticket[] => {
    return tickets.filter(ticket => ticket.isOverdue());
  }, [tickets]);

  return {
    tickets,
    loading,
    error,
    users: engineers, // Alias for backward compatibility
    engineers, // Direct access to engineers
    createTicket,
    updateTicket,
    deleteTicket,
    assignTicket,
    addComment,
    getTicketById,
    getTicketsByStatus,
    getAssignedTickets,
    getCreatedTickets,
    getOverdueTickets
  };
};
