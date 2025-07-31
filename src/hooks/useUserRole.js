import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export function useUserRole() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState('user');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // First try to get existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingProfile) {
        setProfile(existingProfile);
        setUserRole(existingProfile.is_admin ? 'admin' : 'user');
      } else {
        // Create profile if it doesn't exist
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user?.id,
            email: user?.email,
            is_admin: false
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        setProfile(newProfile);
        setUserRole('user');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message);
      // Default to user role on error
      setUserRole('user');
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = () => {
    if (user) {
      fetchUserProfile();
    }
  };

  return {
    userRole,
    profile,
    loading,
    error,
    refreshProfile,
    isAdmin: userRole === 'admin'
  };
}