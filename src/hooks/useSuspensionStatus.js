import { useEffect, useState } from 'react';
import { supabase } from '../SomaLux/Books/supabaseClient';

/**
 * Hook to check if the current user is suspended
 * Returns { isSuspended, suspendedReason, isLoading, error }
 * Periodically checks for suspension status changes every 10 seconds
 */
export function useSuspensionStatus() {
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspendedReason, setSuspendedReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkSuspensionStatus = async () => {
    try {
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Fetch user profile to check suspension status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_suspended, suspended_reason')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('[useSuspensionStatus] Error fetching profile:', profileError);
        setError(profileError.message);
        setIsLoading(false);
        return;
      }

      if (profile) {
        setIsSuspended(profile.is_suspended || false);
        setSuspendedReason(profile.suspended_reason || '');
        console.log('[useSuspensionStatus] User suspension status:', { 
          isSuspended: profile.is_suspended, 
          reason: profile.suspended_reason 
        });
      }

      setIsLoading(false);
    } catch (err) {
      console.error('[useSuspensionStatus] Unexpected error:', err);
      setError(err.message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkSuspensionStatus();

    // Set up interval to check every 10 seconds
    // This allows users to be immediately notified when they're unsuspended
    const interval = setInterval(() => {
      checkSuspensionStatus();
    }, 10000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  return { isSuspended, suspendedReason, isLoading, error };
}
