import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../../firebase'; // Use common Supabase client from main app

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [groups, setGroups] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from Supabase session
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session?.user) {
          setCurrentUser(session.user);
          setIsLoggedIn(true);
          
          // Fetch user profile from profiles table
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.warn('Profile fetch error:', profileError);
          } else if (profile) {
            setUserProfile(profile);
          }

          // Fetch user's groups and channels
          await fetchUserGroupsAndChannels(session.user.id);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthError(error.message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setCurrentUser(session.user);
          setIsLoggedIn(true);

          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) setUserProfile(profile);
          await fetchUserGroupsAndChannels(session.user.id);
        } else {
          setCurrentUser(null);
          setIsLoggedIn(false);
          setUserProfile(null);
          setGroups([]);
          setChannels([]);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  // Fetch user's groups and channels
  const fetchUserGroupsAndChannels = async (userId) => {
    try {
      // Fetch user's groups (from group_members)
      const { data: membershipData, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId);

      if (memberError) throw memberError;

      const groupIds = membershipData?.map((m) => m.group_id) || [];

      if (groupIds.length > 0) {
        const { data: groupsData, error: groupsError } = await supabase
          .from('groups')
          .select('*')
          .in('id', groupIds);

        if (groupsError) throw groupsError;
        setGroups(groupsData || []);
      } else {
        setGroups([]);
      }

      // Fetch user's 1-on-1 chats (from messages)
      const { data: chatsData, error: chatsError } = await supabase
        .from('messages')
        .select('chat_id, sender_id, recipient_id')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (chatsError) throw chatsError;

      // Extract unique chat_ids
      const uniqueChats = [];
      const seenChatIds = new Set();

      for (const msg of chatsData || []) {
        if (!seenChatIds.has(msg.chat_id)) {
          seenChatIds.add(msg.chat_id);
          const otherUserId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
          uniqueChats.push({
            id: msg.chat_id,
            otherUserId,
            lastMessage: msg,
          });
        }
      }

      setChannels(uniqueChats);
    } catch (error) {
      console.error('Error fetching groups/channels:', error);
    }
  };

  const logout = async () => {
    setIsAuthenticating(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setCurrentUser(null);
      setIsLoggedIn(false);
      setUserProfile(null);
      setGroups([]);
      setChannels([]);
      setAuthSuccess('Logged out successfully!');
    } catch (error) {
      setAuthError(error.message || 'Logout failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (currentUser?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', currentUser.id)
          .select()
          .single();

        if (error) throw error;
        setUserProfile(data);
        setAuthSuccess('Profile updated!');
      }
    } catch (error) {
      setAuthError(error.message || 'Update failed');
    }
  };

  const value = {
    currentUser,
    userProfile,
    authError,
    authSuccess,
    isAuthenticating,
    isLoggedIn,
    groups,
    channels,
    loading,
    logout,
    updateProfile,
    setAuthError,
    setAuthSuccess,
    fetchUserGroupsAndChannels,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};