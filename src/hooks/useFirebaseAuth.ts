/**
 * @fileoverview Firebase authentication hook for fast and reliable auth
 * @author Field Engineer Portal Team
 */

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { authService, dbService, isFirebaseConfigured } from '@/lib/firebase';
import { UserProfile } from '@/models/User';
import { toast } from '@/components/ui/use-toast';
import { envLog } from '@/config/environment';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  networkError: string | null;
}

/**
 * Firebase authentication hook with fast sign-in
 * @returns {Object} Authentication state and methods
 */
export function useFirebaseAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    initialized: false,
    networkError: null
  });

  // Listen to authentication state changes
  useEffect(() => {
    let mounted = true;

    // Check if Firebase is configured first
    if (!isFirebaseConfigured()) {
      envLog('error', 'Firebase not configured');
      setState({
        user: null,
        profile: null,
        loading: false,
        initialized: true,
        networkError: 'Firebase is not properly configured. Please check your environment variables.'
      });
      return () => {};
    }

    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      if (!mounted) return;

      try {
        if (user) {
          envLog('log', 'User authenticated:', user.email);

          // Get user profile from Firestore
          const profile = await dbService.getUserProfile(user.uid);

          if (profile) {
            setState({
              user,
              profile: UserProfile.fromDatabaseRecord(profile),
              loading: false,
              initialized: true
            });
          } else {
            // Create default profile if it doesn't exist
            const defaultProfile = {
              id: user.uid,
              email: user.email || '',
              fullName: user.displayName || '',
              role: 'field_engineer',
              department: null,
              phone: null,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            };

            await dbService.updateUserProfile(user.uid, defaultProfile);

            setState({
              user,
              profile: new UserProfile(defaultProfile),
              loading: false,
              initialized: true
            });
          }
        } else {
          setState({
            user: null,
            profile: null,
            loading: false,
            initialized: true
          });
        }
      } catch (error) {
        envLog('error', 'Error in auth state change:', error);

        // Handle Firebase network errors
        const isNetworkError = error && (error as any).message?.includes('network-request-failed');

        setState({
          user: null,
          profile: null,
          loading: false,
          initialized: true,
          networkError: isNetworkError
            ? 'Network connection failed. Please check your internet connection and try again.'
            : `Authentication service error: ${(error as any)?.message || 'Unknown error'}`
        });
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  /**
   * Sign in with email and password (fast)
   * @param {string} email - User email
   * @param {string} password - User password
   */
  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      // Check if Firebase is properly configured
      if (!isFirebaseConfigured()) {
        envLog('warn', 'Firebase not configured, using mock authentication');

        // Use mock authentication as fallback
        const mockUser = await MockAuthService.signIn(email, password);

        setState({
          user: mockUser as any, // Mock user simulating Firebase user
          profile: UserProfile.fromDatabaseRecord({
            id: mockUser.uid,
            email: mockUser.email,
            fullName: mockUser.displayName || 'Test User',
            role: mockUser.role || 'field_engineer',
            department: null,
            phone: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }),
          loading: false,
          initialized: true
        });

        toast({
          title: 'Welcome back! (Demo Mode)',
          description: 'Signed in with demo credentials.',
        });

        return;
      }

      await authService.signInWithEmail(email, password);

      toast({
        title: 'Welcome back!',
        description: 'You have been signed in successfully.',
      });
    } catch (error: any) {
      envLog('error', 'Sign in error:', error);

      // Check if this is a Firebase network error
      if (error.message.includes('network-request-failed') || error.message.includes('auth/network-request-failed')) {
        envLog('warn', 'Firebase network error detected, falling back to mock auth');

        try {
          const mockUser = await MockAuthService.signIn(email, password);

          setState({
            user: mockUser as any,
            profile: UserProfile.fromDatabaseRecord({
              id: mockUser.uid,
              email: mockUser.email,
              fullName: mockUser.displayName || 'Test User',
              role: mockUser.role || 'field_engineer',
              department: null,
              phone: null,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }),
            loading: false,
            initialized: true
          });

          toast({
            title: 'Welcome back! (Demo Mode)',
            description: 'Signed in with demo credentials due to network issues.',
          });

          return;
        } catch (mockError) {
          // If even mock auth fails, show the original error
        }
      }

      let errorMessage = 'Sign in failed. Please try again.';

      if (error.message.includes('user-not-found')) {
        errorMessage = 'No account found with this email address.';
      } else if (error.message.includes('wrong-password')) {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.message.includes('invalid-email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message.includes('too-many-requests')) {
        errorMessage = 'Too many sign-in attempts. Please try again later.';
      } else if (error.message.includes('network-request-failed')) {
        errorMessage = 'Network connection failed. Please check your internet connection and try again.';
      }

      toast({
        title: 'Sign in failed',
        description: errorMessage,
        variant: 'destructive'
      });

      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  /**
   * Sign in with Google (very fast)
   * @returns {Promise<void>}
   */
  const signInWithGoogle = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      // Check if Firebase is properly configured
      if (!isFirebaseConfigured()) {
        envLog('warn', 'Firebase not configured, using mock Google authentication');

        const mockUser = await MockAuthService.signInWithGoogle();

        setState({
          user: mockUser as any,
          profile: UserProfile.fromDatabaseRecord({
            id: mockUser.uid,
            email: mockUser.email,
            fullName: mockUser.displayName || 'Google User',
            role: 'field_engineer',
            department: null,
            phone: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }),
          loading: false,
          initialized: true
        });

        toast({
          title: 'Welcome! (Demo Mode)',
          description: 'Signed in with demo Google account.',
        });

        return;
      }

      await authService.signInWithGoogle();

      toast({
        title: 'Welcome!',
        description: 'You have been signed in with Google.',
      });
    } catch (error: any) {
      envLog('error', 'Google sign in error:', error);

      // Check if this is a Firebase network error
      if (error.message.includes('network-request-failed') || error.message.includes('auth/network-request-failed')) {
        envLog('warn', 'Firebase network error detected, falling back to mock Google auth');

        try {
          const mockUser = await MockAuthService.signInWithGoogle();

          setState({
            user: mockUser as any,
            profile: UserProfile.fromDatabaseRecord({
              id: mockUser.uid,
              email: mockUser.email,
              fullName: mockUser.displayName || 'Google User',
              role: 'field_engineer',
              department: null,
              phone: null,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }),
            loading: false,
            initialized: true
          });

          toast({
            title: 'Welcome! (Demo Mode)',
            description: 'Signed in with demo Google account due to network issues.',
          });

          return;
        } catch (mockError) {
          // If even mock auth fails, show the original error
        }
      }

      let errorMessage = 'Google sign in failed. Please try again.';

      if (error.message.includes('popup-closed-by-user')) {
        errorMessage = 'Sign in was cancelled.';
      } else if (error.message.includes('network-request-failed')) {
        errorMessage = 'Network error. Please check your connection.';
      }

      toast({
        title: 'Google sign in failed',
        description: errorMessage,
        variant: 'destructive'
      });

      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  /**
   * Create new account
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} fullName - User full name
   */
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      // Check if Firebase is properly configured
      if (!isFirebaseConfigured()) {
        envLog('warn', 'Firebase not configured, using mock account creation');

        // Use mock authentication as fallback
        const mockUser = await MockAuthService.createAccount(email, password, fullName);

        setState({
          user: mockUser as any,
          profile: UserProfile.fromDatabaseRecord({
            id: mockUser.uid,
            email: mockUser.email,
            fullName: mockUser.displayName || fullName,
            role: 'field_engineer', // Default role for new accounts
            department: null,
            phone: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }),
          loading: false,
          initialized: true
        });

        toast({
          title: 'Account created! (Demo Mode)',
          description: 'Demo account has been created successfully.',
        });

        return;
      }

      await authService.createAccount(email, password, fullName);

      toast({
        title: 'Account created!',
        description: 'Your account has been created successfully.',
      });
    } catch (error: any) {
      envLog('error', 'Sign up error:', error);

      // Check if this is a Firebase network error
      if (error.message.includes('network-request-failed') || error.message.includes('auth/network-request-failed')) {
        envLog('warn', 'Firebase network error detected during sign up, falling back to mock auth');

        try {
          const mockUser = await MockAuthService.createAccount(email, password, fullName);

          setState({
            user: mockUser as any,
            profile: UserProfile.fromDatabaseRecord({
              id: mockUser.uid,
              email: mockUser.email,
              fullName: mockUser.displayName || fullName,
              role: 'field_engineer',
              department: null,
              phone: null,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }),
            loading: false,
            initialized: true
          });

          toast({
            title: 'Account created! (Demo Mode)',
            description: 'Demo account has been created due to network issues.',
          });

          return;
        } catch (mockError) {
          // If even mock auth fails, show the original error
        }
      }

      let errorMessage = 'Account creation failed. Please try again.';

      if (error.message.includes('email-already-in-use')) {
        errorMessage = 'An account with this email already exists.';
      } else if (error.message.includes('weak-password')) {
        errorMessage = 'Password should be at least 6 characters long.';
      } else if (error.message.includes('invalid-email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message.includes('network-request-failed')) {
        errorMessage = 'Network connection failed. Please check your internet connection and try again.';
      }

      toast({
        title: 'Account creation failed',
        description: errorMessage,
        variant: 'destructive'
      });

      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  /**
   * Sign out user
   * @param {Function} [callback] - Optional callback after sign out
   */
  const signOut = async (callback?: () => void) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      // Check if we're using Firebase or mock authentication
      if (!isFirebaseConfigured() || MockAuthService.getCurrentUser()) {
        await MockAuthService.signOut();
        envLog('log', 'Mock user signed out');
      } else {
        await authService.signOut();
      }

      // Clear state regardless of auth type
      setState({
        user: null,
        profile: null,
        loading: false,
        initialized: true
      });

      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully.',
      });

      if (callback) {
        callback();
      }
    } catch (error: any) {
      envLog('error', 'Sign out error:', error);

      // Even if sign out fails, clear the local state
      setState({
        user: null,
        profile: null,
        loading: false,
        initialized: true
      });

      toast({
        title: 'Sign out completed',
        description: 'You have been signed out.',
      });

      if (callback) {
        callback();
      }
    }
  };

  /**
   * Update user profile
   * @param {Partial<UserProfile>} updates - Fields to update
   */
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!state.user) throw new Error('No user logged in');
    
    try {
      await dbService.updateUserProfile(state.user.uid, updates);

      setState(prev => ({
        ...prev,
        profile: prev.profile ? { ...prev.profile, ...updates } as UserProfile : null
      }));

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error: any) {
      envLog('error', 'Profile update error:', error);
      
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update profile.',
        variant: 'destructive'
      });
      
      throw error;
    }
  };

  /**
   * Refresh user profile
   * @returns {Promise<UserProfile|null>}
   */
  const refreshProfile = async (): Promise<UserProfile | null> => {
    if (!state.user) return null;
    
    try {
      const profile = await dbService.getUserProfile(state.user.uid);
      if (profile) {
        const userProfile = UserProfile.fromDatabaseRecord(profile);
        setState(prev => ({ ...prev, profile: userProfile }));
        return userProfile;
      }
      return null;
    } catch (error) {
      envLog('error', 'Error refreshing profile:', error);
      return null;
    }
  };

  // Helper functions for role checking
  const isAdmin = state.profile?.isAdmin() || false;
  const isSupervisor = state.profile?.isSupervisor() || false;
  const isFieldEngineer = state.profile?.isFieldEngineer() || false;
  const hasRole = (roles: string[]) => state.profile?.role && roles.includes(state.profile.role);

  return {
    user: state.user,
    profile: state.profile,
    loading: state.loading,
    initialized: state.initialized,
    isAuthenticated: !!state.user,
    isAdmin,
    isSupervisor,
    isFieldEngineer,
    hasRole,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
  };
}
