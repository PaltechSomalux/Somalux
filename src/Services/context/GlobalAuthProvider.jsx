import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../../SomaLux/Books/supabaseClient';
import { initializeSession, setupAuthListener, clearSessionCache } from '../utils/sessionManager';

/**
 * GlobalAuthContext - Provides persistent auth state across entire app
 * Initialized once at app startup (never destroyed during navigation)
 */
const GlobalAuthContext = createContext(null);

export const GlobalAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Fetch user profile with role and subscription tier
   */
  const fetchUserWithRole = useCallback(async (session) => {
    if (!session?.user) {
      setUser(null);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        // Still set user even if profile fetch fails
        setUser({ ...session.user, role: 'viewer' });
        return;
      }

      setUser({
        ...session.user,
        role: profile?.role || 'viewer',
        subscription_tier: profile?.subscription_tier || 'basic',
        display_name: profile?.full_name || profile?.display_name || session.user.email?.split('@')[0] || 'User'
      });
    } catch (err) {
      console.error('Error in fetchUserWithRole:', err);
      setUser({ ...session.user, role: 'viewer' });
    }
  }, []);

  /**
   * Initialize auth on app startup - runs once
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);

        // Restore from cache or Supabase
        const session = await initializeSession(supabase);
        if (session) {
          console.log('✓ Auth initialized from session');
          await fetchUserWithRole(session);
        } else {
          console.log('ℹ No session found - user needs to login');
          setUser(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setUser(null);
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [fetchUserWithRole]);

  /**
   * Setup persistent auth listener
   * This runs ONCE at app startup and persists across navigation
   * It will NOT be cleaned up unless the entire app unmounts
   */
  useEffect(() => {
    if (!isInitialized) return;

    const subscription = setupAuthListener(supabase, (_event, session) => {
      console.log('🔐 Global auth listener - session update');
      fetchUserWithRole(session);
    });

    // Cleanup only on app unmount
    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, [isInitialized, fetchUserWithRole]);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    logout: async () => {
      try {
        clearSessionCache();
        await supabase.auth.signOut().catch(e => console.error('Sign out error:', e));
        setUser(null);
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
  };

  return (
    <GlobalAuthContext.Provider value={value}>
      {children}
    </GlobalAuthContext.Provider>
  );
};

/**
 * Hook to use global auth context
 */
export const useGlobalAuth = () => {
  const context = useContext(GlobalAuthContext);
  if (!context) {
    throw new Error('useGlobalAuth must be used within GlobalAuthProvider');
  }
  return context;
};
