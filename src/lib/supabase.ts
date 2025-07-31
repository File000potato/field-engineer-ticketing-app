import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wfvdepgdajlvlnlueltk.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmdmRlcGdkYWpsdmxubHVlbHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2MzUzNzUsImV4cCI6MjA1MTIxMTM3NX0.hNVvvz8R3jTpLhLxGnB8Q-tqZgqhfCX5rZ0j7cxhUjU';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not found, using defaults');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Helper function to get current user profile
export const getCurrentUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
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
  }
};

export default supabase;
