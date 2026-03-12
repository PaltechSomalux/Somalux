import { db } from '../../../firebase'; // Adjust the path based on your project structure
import { collection, getDocs } from 'firebase/firestore';

/**
 * 📘 SMART USER SUGGESTION ALGORITHM v2.0
 * This function implements a sophisticated user suggestion algorithm that considers:
 * - Mutual contacts (shared connections with the current user)
 * - Recency (activity based on last seen timestamp)
 * - Name similarity (between current user and suggested user)
 * - Online status (boost for currently online users)
 * The algorithm fetches users from Firestore, calculates a weighted score, normalizes it, and returns the top 3 suggestions.
 * Only users not already added as contacts are included in suggestions.
 *
 * @param {Object} currentUser - The current authenticated user object containing uid, name, displayName, etc.
 * @param {string[]} addedContactUids - Array of UIDs for users already added as contacts.
 * @param {Function} setSuggestedUsers - State setter function to update the suggested users list.
 * @param {Function} setAllUsersAdded - State setter function to indicate if all users are added.
 * @param {Function} setIsLoading - State setter function to manage loading state.
 * @returns {Promise<void>} - Resolves when the suggestion process is complete.
 */
export const fetchSuggestedUsersV2 = async (currentUser, addedContactUids, setSuggestedUsers, setAllUsersAdded, setIsLoading) => {
  try {
    setIsLoading(true);
    console.log("🔍 Fetching smart user suggestions v2.0...");

    // 1️⃣ Fetch all users from the 'users' collection (no limit/orderBy for completeness)
    const usersSnap = await getDocs(collection(db, "users"));
    let allUsers = usersSnap.docs.map(doc => ({
      id: doc.id,
      uid: doc.id,
      ...doc.data(),
    }));

    // Sort by lastSeen descending in code (no Firestore index needed)
    allUsers.sort((a, b) => {
      const aTime = a.lastSeen?.toDate?.() || new Date(0);
      const bTime = b.lastSeen?.toDate?.() || new Date(0);
      return bTime - aTime;
    });

    // 2️⃣ Filter out already added contacts (excluding deleted ones) 
    // Now includes current user if not added, to allow self-chat
    const candidateUsers = allUsers.filter(
      u => !addedContactUids.includes(u.uid)
    );

    if (candidateUsers.length === 0) {
      setSuggestedUsers([]);
      setAllUsersAdded(true);
      return;
    }

    // 3️⃣ Pre-fetch contacts only for top 50 candidates (for speed, reduced from 100)
    const userContactsMap = {};
    for (const user of candidateUsers.slice(0, 50)) {
      try {
        const contactSnap = await getDocs(collection(db, "userChats", user.uid, "chats"));
        userContactsMap[user.uid] = contactSnap.docs
          .filter(doc => !doc.data().isDeleted)
          .map(doc => doc.id);
      } catch (e) {
        userContactsMap[user.uid] = []; // Graceful fallback if contact fetch fails
        console.warn(`Failed to fetch contacts for user ${user.uid}:`, e);
      }
    }

    // 4️⃣ Helper scoring functions
    const now = new Date();

    const getMutualCount = (user) => {
      const contacts = userContactsMap[user.uid] || [];
      return contacts.filter(uid => addedContactUids.includes(uid)).length;
    };

    const getActivityScore = (user) => {
      const lastSeen = user.lastSeen?.toDate?.() || new Date(0);
      const hoursAgo = (now - lastSeen) / 36e5; // Convert to hours
      return Math.max(0, 1 - Math.min(hoursAgo / 24, 1)); // 1 = active today, 0 = >24h inactive
    };

    const getNameSimilarity = (a = "", b = "") => {
      const minLen = Math.min(a.length, b.length);
      let matches = 0;
      for (let i = 0; i < minLen; i++) {
        if (a[i].toLowerCase() === b[i].toLowerCase()) matches++;
      }
      return minLen > 0 ? matches / minLen : 0; // Avoid division by zero
    };

    // 5️⃣ Calculate weighted score per candidate
    const scoredUsers = candidateUsers.map(user => {
      const mutualCount = getMutualCount(user);
      const activityScore = getActivityScore(user);
      const nameScore = getNameSimilarity(currentUser.name || currentUser.displayName, user.name || user.displayName);
      const onlineBoost = user.isOnline ? 1 : 0;

      // Weighted sum (tune weights easily: mutuals=5, activity=3, name=2, online=1)
      const score =
        (mutualCount * 5) +          // Up to 25+ based on mutual contacts
        (activityScore * 3) +        // Up to 3 based on recency
        (nameScore * 2) +            // Up to 2 based on name similarity
        (onlineBoost * 1);           // +1 if online

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
      .sort((a, b) => b.score - a.score)
      .filter(u => !addedContactUids.includes(u.uid)) // Ensure no added users in suggestions
      .slice(0, 3);

    // 8️⃣ Log the results for logging
    console.table(topSuggestions.map(u => ({
      name: u.name || u.displayName || 'Unknown',
      score: u.score,
      mutuals: getMutualCount(u),
      online: u.isOnline ? "✅" : "❌",
      activity: getActivityScore(u).toFixed(2),
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