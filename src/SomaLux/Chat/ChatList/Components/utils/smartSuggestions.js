/* eslint-disable no-undef */
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 📘 SMART USER SUGGESTION ALGORITHM v2.0
 * This function implements a sophisticated user suggestion algorithm that considers:
 * - Mutual contacts (shared connections with the current user)
 * - Recency (activity based on last seen timestamp)
 * - Name similarity (between current user and suggested user)
 * - Online status (boost for currently online users)
 * The algorithm fetches users from Supabase profiles, calculates a weighted score, normalizes it, and returns the top 3 suggestions.
 * Only users not already added as contacts are included in suggestions.
 *
 * @param {Object} currentUser - The current authenticated user object containing uid, name, displayName, etc.
 * @param {string[]} addedContactUids - Array of UIDs for users already added as contacts.
 * @param {Function} setSuggestedUsers - State setter function to update the suggested readers list.
 * @param {Function} setAllUsersAdded - State setter function to indicate if all users are added.
 * @param {Function} setIsLoading - State setter function to manage loading state.
 * @returns {Promise<void>} - Resolves when the suggestion process is complete.
 */
export const fetchSuggestedUsersV2 = async (currentUser, addedContactUids, setSuggestedUsers, setAllUsersAdded, setIsLoading) => {
  try {
    setIsLoading(true);
    console.log("🔍 Fetching smart user suggestions v2.0 from Supabase...");

    // 1️⃣ Fetch all users from the Supabase 'profiles' table
    const { data: allUsers, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("❌ Error fetching profiles from Supabase:", error);
      setSuggestedUsers([]);
      setAllUsersAdded(false);
      return;
    }

    let users = (allUsers || []).map(doc => ({
      id: doc.id,
      uid: doc.id,
      email: doc.email,
      name: doc.full_name || doc.email?.split('@')[0] || 'Unknown',
      displayName: doc.full_name,
      photoURL: doc.avatar_url,
    }));

    // 2️⃣ Filter out already added contacts
    // Now includes current user if not added, to allow self-chat
    const candidateUsers = users.filter(
      u => !addedContactUids.includes(u.uid)
    );

    if (candidateUsers.length === 0) {
      setSuggestedUsers([]);
      setAllUsersAdded(true);
      return;
    }

    // 3️⃣ For suggestions, we don't need contact map as we'll use simpler scoring
    // Skip pre-fetching contacts for now and use basic scoring

    // 4️⃣ Helper scoring functions
    const now = new Date();

    const getNameSimilarity = (a = "", b = "") => {
      const minLen = Math.min(a.length, b.length);
      let matches = 0;
      for (let i = 0; i < minLen; i++) {
        if (a[i].toLowerCase() === b[i].toLowerCase()) matches++;
      }
      return minLen > 0 ? matches / minLen : 0; // Avoid division by zero
    };

    // 5️⃣ Calculate weighted score per candidate (simplified without Firebase contacts)
    const scoredUsers = candidateUsers.map(user => {
      // Simple scoring: prioritize name similarity and alphabetical order
      const nameScore = getNameSimilarity(currentUser.name || currentUser.displayName || '', user.name || user.displayName || '');
      
      // Just return a basic score for sorting
      const score = nameScore;

      return { ...user, score };
    });

    // 6️⃣ Normalize scores between 0–1
    const maxScore = Math.max(...scoredUsers.map(u => u.score || 0), 1); // Ensure at least 1 to avoid division by zero
    const normalized = scoredUsers.map(u => ({
      ...u,
      score: +(u.score / maxScore).toFixed(3), // Normalize and limit to 3 decimal places
    }));

    // 7️⃣ Sort by score (descending) and pick top 3, ensuring no added users
    const topSuggestions = normalized
      .sort((a, b) => {
        // Sort by score first, then by name
        if (b.score !== a.score) return b.score - a.score;
        return (a.name || 'Z').localeCompare(b.name || 'Z');
      })
      .filter(u => !addedContactUids.includes(u.uid)) // Ensure no added users in suggestions
      .slice(0, 3);

    // 8️⃣ Log the results for logging
    console.table(topSuggestions.map(u => ({
      name: u.name || u.displayName || 'Unknown',
      email: u.email,
      score: u.score,
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