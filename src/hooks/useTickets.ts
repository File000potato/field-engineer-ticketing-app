import { useState, useEffect } from 'react';
import { supabase, dbHelpers, subscribeToTickets } from '@/lib/supabase';
import { mockDbHelpers } from '@/lib/mock-data';
import { useAuth } from '@/hooks/useAuth';
import { Ticket, Activity, TicketMedia } from '@/types/ticket';
import { toast } from '@/components/ui/use-toast';

export const useTickets = () => {
  const { user, profile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tickets on mount and when user changes
  useEffect(() => {
    if (user && profile) {
      loadTickets();
    } else {
      setTickets([]);
      setLoading(false);
    }
  }, [user, profile]);

  // Subscribe to real-time ticket updates
  useEffect(() => {
    if (!user) return;

    const subscription = subscribeToTickets(
      (payload) => {
        console.log('Real-time ticket update:', payload);
        
        // Reload tickets when changes occur
        loadTickets();
      },
      user.id
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const loadTickets = async () => {
    if (!user || !profile) return;

    try {
      setLoading(true);
      setError(null);
      
      const data = await dbHelpers.getTicketsWithRelations(user.id, profile.role);
      
      // Transform database format to frontend format
      const transformedTickets: Ticket[] = data.map(ticket => ({
        ...ticket,
        created_at: new Date(ticket.created_at),
        updated_at: new Date(ticket.updated_at),
        assigned_at: ticket.assigned_at ? new Date(ticket.assigned_at) : undefined,
        resolved_at: ticket.resolved_at ? new Date(ticket.resolved_at) : undefined,
        verified_at: ticket.verified_at ? new Date(ticket.verified_at) : undefined,
        due_date: ticket.due_date ? new Date(ticket.due_date) : undefined,
      }));
      
      setTickets(transformedTickets);
    } catch (err: any) {
      console.error('Error loading tickets:', err);
      setError(err.message);
      toast({
        title: 'Error loading tickets',
        description: err.message || 'Failed to load tickets',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (ticketData: {
    title: string;
    description: string;
    type?: string;
    priority?: string;
    location: string;
    latitude?: number;
    longitude?: number;
    equipment_id?: string;
    due_date?: Date;
    estimated_hours?: number;
  }) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert({
          ...ticketData,
          created_by: user.id,
          due_date: ticketData.due_date?.toISOString(),
        })
        .select(`
          *,
          equipment(*),
          created_by_profile:user_profiles!tickets_created_by_fkey(*),
          assigned_to_profile:user_profiles!tickets_assigned_to_fkey(*),
          verified_by_profile:user_profiles!tickets_verified_by_fkey(*)
        `)
        .single();

      if (error) throw error;

      const transformedTicket: Ticket = {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        assigned_at: data.assigned_at ? new Date(data.assigned_at) : undefined,
        resolved_at: data.resolved_at ? new Date(data.resolved_at) : undefined,
        verified_at: data.verified_at ? new Date(data.verified_at) : undefined,
        due_date: data.due_date ? new Date(data.due_date) : undefined,
      };

      setTickets(prev => [transformedTicket, ...prev]);
      
      toast({
        title: 'Ticket created',
        description: 'Your ticket has been created successfully.',
      });

      return transformedTicket;
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      toast({
        title: 'Failed to create ticket',
        description: error.message || 'An error occurred while creating the ticket.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const updateTicket = async (ticketId: string, updates: Partial<Ticket>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Transform dates to ISO strings for database
      const dbUpdates: any = { ...updates };
      if (dbUpdates.due_date) {
        dbUpdates.due_date = dbUpdates.due_date.toISOString();
      }
      if (dbUpdates.assigned_at) {
        dbUpdates.assigned_at = dbUpdates.assigned_at.toISOString();
      }
      if (dbUpdates.resolved_at) {
        dbUpdates.resolved_at = dbUpdates.resolved_at.toISOString();
      }
      if (dbUpdates.verified_at) {
        dbUpdates.verified_at = dbUpdates.verified_at.toISOString();
      }

      // Set timestamps for status changes
      if (updates.status === 'assigned' && !updates.assigned_at) {
        dbUpdates.assigned_at = new Date().toISOString();
      }
      if (updates.status === 'resolved' && !updates.resolved_at) {
        dbUpdates.resolved_at = new Date().toISOString();
      }
      if (updates.status === 'verified' && !updates.verified_at) {
        dbUpdates.verified_at = new Date().toISOString();
        dbUpdates.verified_by = user.id;
      }

      const { data, error } = await supabase
        .from('tickets')
        .update(dbUpdates)
        .eq('id', ticketId)
        .select(`
          *,
          equipment(*),
          created_by_profile:user_profiles!tickets_created_by_fkey(*),
          assigned_to_profile:user_profiles!tickets_assigned_to_fkey(*),
          verified_by_profile:user_profiles!tickets_verified_by_fkey(*)
        `)
        .single();

      if (error) throw error;

      const transformedTicket: Ticket = {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        assigned_at: data.assigned_at ? new Date(data.assigned_at) : undefined,
        resolved_at: data.resolved_at ? new Date(data.resolved_at) : undefined,
        verified_at: data.verified_at ? new Date(data.verified_at) : undefined,
        due_date: data.due_date ? new Date(data.due_date) : undefined,
      };

      setTickets(prev => prev.map(t => t.id === ticketId ? transformedTicket : t));
      
      toast({
        title: 'Ticket updated',
        description: 'The ticket has been updated successfully.',
      });

      return transformedTicket;
    } catch (error: any) {
      console.error('Error updating ticket:', error);
      toast({
        title: 'Failed to update ticket',
        description: error.message || 'An error occurred while updating the ticket.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const deleteTicket = async (ticketId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;

      setTickets(prev => prev.filter(t => t.id !== ticketId));
      
      toast({
        title: 'Ticket deleted',
        description: 'The ticket has been deleted successfully.',
      });
    } catch (error: any) {
      console.error('Error deleting ticket:', error);
      toast({
        title: 'Failed to delete ticket',
        description: error.message || 'An error occurred while deleting the ticket.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const assignTicket = async (ticketId: string, assignedTo: string | null) => {
    return updateTicket(ticketId, { 
      assigned_to: assignedTo,
      status: assignedTo ? 'assigned' : 'open',
      assigned_at: assignedTo ? new Date() : undefined
    });
  };

  const addComment = async (ticketId: string, comment: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('ticket_activities')
        .insert({
          ticket_id: ticketId,
          user_id: user.id,
          type: 'comment',
          description: comment,
        });

      if (error) throw error;

      toast({
        title: 'Comment added',
        description: 'Your comment has been added to the ticket.',
      });
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Failed to add comment',
        description: error.message || 'An error occurred while adding the comment.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const getTicketActivities = async (ticketId: string): Promise<Activity[]> => {
    try {
      const data = await dbHelpers.getTicketActivities(ticketId);
      
      return data.map(activity => ({
        ...activity,
        created_at: new Date(activity.created_at),
      }));
    } catch (error: any) {
      console.error('Error loading ticket activities:', error);
      toast({
        title: 'Failed to load activities',
        description: error.message || 'An error occurred while loading ticket activities.',
        variant: 'destructive'
      });
      return [];
    }
  };

  const getTicketMedia = async (ticketId: string): Promise<TicketMedia[]> => {
    try {
      const data = await dbHelpers.getTicketMedia(ticketId);
      
      return data.map(media => ({
        ...media,
        created_at: new Date(media.created_at),
      }));
    } catch (error: any) {
      console.error('Error loading ticket media:', error);
      toast({
        title: 'Failed to load media',
        description: error.message || 'An error occurred while loading ticket media.',
        variant: 'destructive'
      });
      return [];
    }
  };

  // Helper functions for role-based filtering
  const getMyTickets = () => {
    if (!user) return [];
    return tickets.filter(ticket => ticket.created_by === user.id);
  };

  const getAssignedTickets = () => {
    if (!user) return [];
    return tickets.filter(ticket => ticket.assigned_to === user.id);
  };

  const getUnassignedTickets = () => {
    return tickets.filter(ticket => !ticket.assigned_to && ticket.status === 'open');
  };

  const getTicketsByStatus = (status: string) => {
    return tickets.filter(ticket => ticket.status === status);
  };

  const getTicketsByPriority = (priority: string) => {
    return tickets.filter(ticket => ticket.priority === priority);
  };

  const getOverdueTickets = () => {
    const now = new Date();
    return tickets.filter(ticket => 
      ticket.due_date && 
      ticket.due_date < now && 
      !['resolved', 'verified', 'closed'].includes(ticket.status)
    );
  };

  return {
    tickets,
    loading,
    error,
    createTicket,
    updateTicket,
    deleteTicket,
    assignTicket,
    addComment,
    getTicketActivities,
    getTicketMedia,
    loadTickets,
    // Helper functions
    getMyTickets,
    getAssignedTickets,
    getUnassignedTickets,
    getTicketsByStatus,
    getTicketsByPriority,
    getOverdueTickets,
  };
};
