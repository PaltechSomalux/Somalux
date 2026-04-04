import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabase';
import { ProfileViewer } from '../ChatList/Components/ProfileViewer';

/**
 * ProfilePage Component
 * Full-page profile view that loads user data and displays it using ProfileViewer
 */
export const ProfilePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('ProfilePage: Rendering, location.hash:', location.hash);

  // Extract userId from hash (e.g., #profile/userId)
  const userId = location.hash.startsWith('#profile/') 
    ? location.hash.substring('#profile/'.length) 
    : null;

  console.log('ProfilePage: userId extracted:', userId);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) {
        setError('No user ID provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch from users table
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (data) {
          console.log('ProfilePage: User data fetched:', data);
          setUserProfile(data);
        } else {
          setError('User not found');
        }
      } catch (err) {
        console.error('ProfilePage: Error fetching user profile:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  const handleClose = () => {
    console.log('ProfilePage: Close button clicked, navigating to #chats');
    navigate('#chats');
  };

  const handleToggleMute = () => {
    console.log('ProfilePage: Toggle mute for user:', userId);
  };

  const handleToggleBlock = () => {
    console.log('ProfilePage: Toggle block for user:', userId);
  };

  const handleToggleFollow = () => {
    console.log('ProfilePage: Toggle follow for user:', userId);
  };

  const handleReport = () => {
    console.log('ProfilePage: Report user:', userId);
  };

  // Show error state
  if (error && !isLoading) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0d1418 0%, #0b1216 100%)',
        color: '#e9edef',
        gap: '20px',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <h2>Error Loading Profile</h2>
        <p>{error}</p>
        <button 
          onClick={handleClose}
          style={{
            marginTop: '20px',
            padding: '12px 32px',
            background: '#25d366',
            border: 'none',
            color: '#111b21',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '16px'
          }}
        >
          Back to Chats
        </button>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0d1418 0%, #0b1216 100%)',
        color: '#e9edef',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255,255,255,0.1)',
          borderTopColor: '#25d366',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ marginTop: '20px' }}>Loading profile...</p>
      </div>
    );
  }

  // Render ProfileViewer with page-view mode
  if (userProfile) {
    return (
      <ProfileViewer
        profile={userProfile}
        isPageView={true}
        onClose={handleClose}
        onToggleMute={handleToggleMute}
        onToggleBlock={handleToggleBlock}
        onToggleFollow={handleToggleFollow}
        onReport={handleReport}
      />
    );
  }

  // Fallback: no profile found
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, #0d1418 0%, #0b1216 100%)',
      color: '#e9edef',
      gap: '20px',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 100,
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <h2>User not found</h2>
      <p>The user profile you are looking for does not exist</p>
      <button 
        onClick={handleClose}
        style={{
          marginTop: '20px',
          padding: '12px 32px',
          background: '#25d366',
          border: 'none',
          color: '#111b21',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '16px'
        }}
      >
        Back to Chats
      </button>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;
