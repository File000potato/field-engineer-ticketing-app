import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wfvdepgdajlvlnlueltk.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmdmRlcGdkYWpsdmxubHVlbHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2MzUzNzUsImV4cCI6MjA1MTIxMTM3NX0.hNVvvz8R3jTpLhLxGnB8Q-tqZgqhfCX5rZ0j7cxhUjU';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not found, using defaults');
}

// Create a minimal auth-only client to avoid response conflicts
export const authClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'field-engineer-portal-auth'
    }
  }
});

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  }
});

// Helper function to get current user profile
export const getCurrentUserProfile = async (existingUser?: any) => {
  try {
    // Use existing user if provided to avoid redundant API calls
    let user = existingUser;

    if (!user) {
      const { data: { user: fetchedUser }, error } = await supabase.auth.getUser();
      if (error) {
        console.warn('Error fetching user:', error.message);
        return null;
      }
      user = fetchedUser;
    }

    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.warn('Error fetching profile:', error.message);
      return null;
    }

    return profile;
  } catch (error) {
    console.warn('Error in getCurrentUserProfile:', error);
    return null;
  }
};

// Helper function to check if user has required role
export const checkUserRole = async (requiredRoles: string[]) => {
  const profile = await getCurrentUserProfile();
  return profile && requiredRoles.includes(profile.role);
};

// Upload file to Supabase Storage
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File,
  options?: { upsert?: boolean }
) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: options?.upsert || false,
    });

  if (error) throw error;
  return data;
};

// Get public URL for file
export const getFileUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
};

// Delete file from storage
export const deleteFile = async (bucket: string, path: string) => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) throw error;
};

// Subscribe to real-time changes
export const subscribeToTickets = (
  callback: (payload: any) => void,
  userId?: string
) => {
  let query = supabase
    .channel('tickets')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'tickets' 
      }, 
      callback
    );

  return query.subscribe();
};

// Subscribe to notifications
export const subscribeToNotifications = (
  userId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel('notifications')
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, 
      callback
    )
    .subscribe();
};

// Database helper functions
export const dbHelpers = {
  // Get tickets with full relations
  async getTicketsWithRelations(userId?: string, role?: string) {
    let query = supabase
      .from('tickets')
      .select(`
        *,
        equipment(*),
        created_by_profile:user_profiles!tickets_created_by_fkey(*),
        assigned_to_profile:user_profiles!tickets_assigned_to_fkey(*),
        verified_by_profile:user_profiles!tickets_verified_by_fkey(*)
      `)
      .order('created_at', { ascending: false });

    // Apply role-based filtering (RLS will also apply)
    if (role === 'field_engineer' && userId) {
      query = query.or(`created_by.eq.${userId},assigned_to.eq.${userId}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get ticket activities
  async getTicketActivities(ticketId: string) {
    const { data, error } = await supabase
      .from('ticket_activities')
      .select(`
        *,
        user_profile:user_profiles(*)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get ticket media
  async getTicketMedia(ticketId: string) {
    const { data, error } = await supabase
      .from('ticket_media')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get user notifications
  async getUserNotifications(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        ticket:tickets(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Get dashboard stats
  async getDashboardStats(userId: string) {
    const { data, error } = await supabase
      .rpc('get_dashboard_stats', { user_uuid: userId });

    if (error) throw error;
    return data?.[0];
  },

  // Get equipment list
  async getEquipment() {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data;
  },

  // Get users for assignment
  async getUsers(role?: string) {
    let query = supabase
      .from('user_profiles')
      .select('*')
      .eq('is_active', true)
      .order('full_name');

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get user profile by ID
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<any>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update user role
  async updateUserRole(userId: string, role: 'admin' | 'supervisor' | 'field_engineer') {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deactivate user
  async deactivateUser(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get user statistics
  async getUserStats(userId: string) {
    try {
      // Get tickets data
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .or(`created_by.eq.${userId},assigned_to.eq.${userId}`);

      if (ticketsError) throw ticketsError;

      const totalTickets = tickets?.length || 0;
      const completedTickets = tickets?.filter(t =>
        ['resolved', 'verified', 'closed'].includes(t.status)
      ).length || 0;

      // Calculate average resolution time
      const resolvedTickets = tickets?.filter(t => t.resolved_at) || [];
      const avgResolutionTime = resolvedTickets.length > 0
        ? resolvedTickets.reduce((acc, ticket) => {
            const resolutionTime = new Date(ticket.resolved_at!).getTime() - new Date(ticket.created_at).getTime();
            return acc + (resolutionTime / (1000 * 60 * 60)); // Convert to hours
          }, 0) / resolvedTickets.length
        : 0;

      // Get last activity
      const { data: activities, error: activitiesError } = await supabase
        .from('ticket_activities')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      const lastActivity = activities?.[0]?.created_at || new Date().toISOString();

      return {
        totalTickets,
        completedTickets,
        avgResolutionTime,
        lastActivity
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        totalTickets: 0,
        completedTickets: 0,
        avgResolutionTime: 0,
        lastActivity: new Date().toISOString()
      };
    }
  }
};

export default supabase;
