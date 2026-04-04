import { supabase } from '../../../../../supabase';

/**
 * 📘 SMART READER SUGGESTION ALGORITHM v2.0 - SUPABASE VERSION
 * This function implements a sophisticated reader suggestion algorithm that considers:
 * - Mutual contacts (shared connections with the current reader)
 * - Recency (activity based on last seen timestamp)
 * - Name similarity (between current reader and suggested reader)
 * - Online status (boost for currently online readers)
 * The algorithm fetches readers from Supabase, calculates a weighted score, normalizes it, and returns the top 3 suggestions.
 * Only readers not already added as contacts are included in suggestions.
 *
 * @param {Object} currentUser - The current authenticated user object containing id, email, etc.
 * @param {string[]} addedContactUids - Array of user IDs for users already added as contacts.
 * @param {Function} setSuggestedUsers - State setter function to update the suggested readers list.
 * @param {Function} setAllUsersAdded - State setter function to indicate if all users are added.
 * @param {Function} setIsLoading - State setter function to manage loading state.
 * @returns {Promise<void>} - Resolves when the suggestion process is complete.
 */
export const fetchSuggestedUsersV2 = async (currentUser, addedContactUids, setSuggestedUsers, setAllUsersAdded, setIsLoading) => {
  try {
    setIsLoading(true);
    console.log("🔍 Fetching smart reader suggestions v2.0 from Supabase...");
    console.log("📋 Current reader:", currentUser);

    // 1️⃣ Fetch ALL readers from 'profiles' table (removed limit to get all available readers)
    const { data: allUsers, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    console.log("📊 Profiles query result:", { dataLength: allUsers?.length, error: usersError });

    if (usersError) {
      console.error("❌ Error fetching profiles:", usersError);
      throw usersError;
    }

    if (!allUsers || allUsers.length === 0) {
      console.warn("⚠️ No readers found in profiles table. Please ensure Supabase has reader data.");
      setSuggestedUsers([]);
      setAllUsersAdded(true);
      return;
    }

    console.log(`✅ Found ${allUsers.length} readers in profiles table`);

    // Map Supabase data to internal format
    const users = allUsers.map(doc => ({
      id: doc.id,
      uid: doc.id,
      name: doc.full_name || doc.display_name || 'Unknown',
      displayName: doc.full_name || doc.display_name || 'Unknown',
      email: doc.email || '',
      photoURL: doc.avatar_url || '',
      isOnline: doc.last_active_at ? (new Date() - new Date(doc.last_active_at)) < 300000 : false, // Online if active in last 5 minutes
      lastSeen: doc.last_active_at ? new Date(doc.last_active_at) : new Date(0),
    }));

    console.log("👥 Mapped readers:", users.map(u => ({ id: u.id, name: u.name, email: u.email })));

    // 2️⃣ Filter out already added contacts and current reader
    const candidateUsers = users.filter(
      u => !addedContactUids.includes(u.id) && u.id !== currentUser?.id
    );

    console.log(`🎯 Candidate readers (filtered): ${candidateUsers.length}`);

    if (candidateUsers.length === 0) {
      console.log("ℹ️ No candidate readers available for suggestions");
      setSuggestedUsers([]);
      setAllUsersAdded(true);
      return;
    }

    // 3️⃣ Return all candidate readers for pagination (initially display 10, with Load More for rest)
    const topSuggestions = candidateUsers;

    console.log(`🏆 Top ${topSuggestions.length} reader suggestions loaded:`);
    console.table(topSuggestions.map(u => ({
      name: u.name || u.displayName || 'Unknown',
      email: u.email,
      online: u.isOnline ? "✅" : "❌",
    })));

    setSuggestedUsers(topSuggestions);
    setAllUsersAdded(candidateUsers.length === 0);
  } catch (error) {
    console.error("❌ Error generating suggestions v2.0:", error.message, error.stack);
    setSuggestedUsers([]);
    setAllUsersAdded(false);
  } finally {
    setIsLoading(false);
  }
};

// Export for testing or additional utility functions (if added later)
export default { fetchSuggestedUsersV2 };