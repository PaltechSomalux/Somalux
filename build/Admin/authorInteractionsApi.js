/**
 * Author Interactions API
 * Handles: followers, likes, loves, comments, ratings, shares
 */

import { supabase } from '../../Books/supabaseClient';

// ============================================
// FOLLOWERS MANAGEMENT
// ============================================

export async function toggleAuthorFollow(authorId, userId) {
  try {
    if (!userId) throw new Error('User ID required');
    
    const { data, error } = await supabase
      .rpc('toggle_author_follow', {
        p_follower_id: userId,
        p_author_id: authorId
      });
    
    if (error) throw error;
    return { success: true, isFollowing: data };
  } catch (error) {
    console.error('Error toggling author follow:', error);
    throw error;
  }
}

export async function getAuthorFollowers(authorId) {
  try {
    const { data, error } = await supabase
      .from('author_followers')
      .select('id, follower_id, profiles(id, username, avatar_url), followed_at')
      .eq('author_id', authorId)
      .order('followed_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching author followers:', error);
    return [];
  }
}

export async function getFollowersCount(authorId) {
  try {
    const { count, error } = await supabase
      .from('author_followers')
      .select('id', { count: 'exact' })
      .eq('author_id', authorId);
    
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching followers count:', error);
    return 0;
  }
}

// ============================================
// LIKES MANAGEMENT
// ============================================

export async function toggleAuthorLike(authorId, userId) {
  try {
    if (!userId) throw new Error('User ID required');
    
    const { data, error } = await supabase
      .rpc('toggle_author_like', {
        p_user_id: userId,
        p_author_id: authorId
      });
    
    if (error) throw error;
    return { success: true, isLiked: data };
  } catch (error) {
    console.error('Error toggling author like:', error);
    throw error;
  }
}

export async function getAuthorLikes(authorId) {
  try {
    const { data, error } = await supabase
      .from('author_likes')
      .select('id, user_id, profiles(id, username, avatar_url), liked_at')
      .eq('author_id', authorId)
      .order('liked_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching author likes:', error);
    return [];
  }
}

export async function getLikesCount(authorId) {
  try {
    const { count, error } = await supabase
      .from('author_likes')
      .select('id', { count: 'exact' })
      .eq('author_id', authorId);
    
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching likes count:', error);
    return 0;
  }
}

// ============================================
// LOVES MANAGEMENT
// ============================================

export async function toggleAuthorLove(authorId, userId) {
  try {
    if (!userId) throw new Error('User ID required');
    
    const { data, error } = await supabase
      .rpc('toggle_author_love', {
        p_user_id: userId,
        p_author_id: authorId
      });
    
    if (error) throw error;
    return { success: true, isLoved: data };
  } catch (error) {
    console.error('Error toggling author love:', error);
    throw error;
  }
}

export async function getAuthorLoves(authorId) {
  try {
    const { data, error } = await supabase
      .from('author_loves')
      .select('id, user_id, profiles(id, username, avatar_url), loved_at')
      .eq('author_id', authorId)
      .order('loved_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching author loves:', error);
    return [];
  }
}

export async function getLovesCount(authorId) {
  try {
    const { count, error } = await supabase
      .from('author_loves')
      .select('id', { count: 'exact' })
      .eq('author_id', authorId);
    
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching loves count:', error);
    return 0;
  }
}

// ============================================
// COMMENTS MANAGEMENT
// ============================================

export async function addAuthorComment(authorId, userId, content, parentCommentId = null) {
  try {
    if (!userId) throw new Error('User ID required');
    if (!content || content.trim().length === 0) throw new Error('Comment content required');

    const { data, error } = await supabase
      .from('author_comments')
      .insert({
        author_id: authorId,
        user_id: userId,
        content,
        parent_comment_id: parentCommentId
      })
      .select('*, profiles(id, username, avatar_url)')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding author comment:', error);
    throw error;
  }
}

export async function getAuthorComments(authorId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('author_comments')
      .select('id, user_id, content, parent_comment_id, likes_count, created_at, updated_at, profiles(id, username, avatar_url, tier)')
      .eq('author_id', authorId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching author comments:', error);
    return [];
  }
}

export async function deleteAuthorComment(commentId, userId) {
  try {
    // Verify ownership
    const { data: comment, error: fetchError } = await supabase
      .from('author_comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (fetchError) throw fetchError;
    if (comment.user_id !== userId) throw new Error('Unauthorized');

    const { error } = await supabase
      .from('author_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting author comment:', error);
    throw error;
  }
}

export async function getCommentsCount(authorId) {
  try {
    const { count, error } = await supabase
      .from('author_comments')
      .select('id', { count: 'exact' })
      .eq('author_id', authorId)
      .is('parent_comment_id', null);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching comments count:', error);
    return 0;
  }
}

// ============================================
// RATINGS MANAGEMENT
// ============================================

export async function rateAuthor(authorId, userId, rating, review = '') {
  try {
    if (!userId) throw new Error('User ID required');
    if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5');

    const { data, error } = await supabase
      .from('author_ratings')
      .upsert(
        {
          author_id: authorId,
          user_id: userId,
          rating,
          review: review || null
        },
        { onConflict: 'user_id,author_id' }
      )
      .select('*, profiles(id, username, avatar_url)')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error rating author:', error);
    throw error;
  }
}

export async function getAuthorRatings(authorId, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('author_ratings')
      .select('id, user_id, rating, review, helpful_count, created_at, profiles(id, username, avatar_url, tier)')
      .eq('author_id', authorId)
      .order('helpful_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching author ratings:', error);
    return [];
  }
}

export async function getRatingsCount(authorId) {
  try {
    const { count, error } = await supabase
      .from('author_ratings')
      .select('id', { count: 'exact' })
      .eq('author_id', authorId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching ratings count:', error);
    return 0;
  }
}

export async function getAverageRating(authorId) {
  try {
    const { data, error } = await supabase
      .from('author_ratings')
      .select('rating')
      .eq('author_id', authorId);

    if (error) throw error;
    if (!data || data.length === 0) return 0;

    const average = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
    return Math.round(average * 10) / 10;
  } catch (error) {
    console.error('Error calculating average rating:', error);
    return 0;
  }
}

export async function deleteAuthorRating(authorId, userId) {
  try {
    const { error } = await supabase
      .from('author_ratings')
      .delete()
      .eq('author_id', authorId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting rating:', error);
    throw error;
  }
}

// ============================================
// SHARES MANAGEMENT
// ============================================

export async function recordAuthorShare(authorId, userId, shareType, platform = null) {
  try {
    const { data, error } = await supabase
      .from('author_shares')
      .insert({
        author_id: authorId,
        user_id: userId || null,
        share_type: shareType,
        platform: platform || null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error recording author share:', error);
    throw error;
  }
}

export async function getSharesCount(authorId) {
  try {
    const { count, error } = await supabase
      .from('author_shares')
      .select('id', { count: 'exact' })
      .eq('author_id', authorId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error fetching shares count:', error);
    return 0;
  }
}

// ============================================
// USER INTERACTION STATUS
// ============================================

export async function getUserAuthorInteractionStatus(authorId, userId) {
  try {
    if (!userId) {
      return {
        isFollower: false,
        hasLiked: false,
        hasLoved: false,
        userRating: null
      };
    }

    const { data, error } = await supabase
      .rpc('get_author_interaction_status', {
        p_user_id: userId,
        p_author_id: authorId
      })
      .single();

    if (error) {
      console.error('Error fetching user interaction status:', error);
      return {
        isFollower: false,
        hasLiked: false,
        hasLoved: false,
        userRating: null
      };
    }

    return {
      isFollower: data.is_follower || false,
      hasLiked: data.has_liked || false,
      hasLoved: data.has_loved || false,
      userRating: data.user_rating
    };
  } catch (error) {
    console.error('Error in getUserAuthorInteractionStatus:', error);
    return {
      isFollower: false,
      hasLiked: false,
      hasLoved: false,
      userRating: null
    };
  }
}

// ============================================
// AUTHOR ENGAGEMENT STATISTICS
// ============================================

export async function getAuthorEngagementStats(authorId) {
  try {
    const { data, error } = await supabase
      .from('author_engagement_stats')
      .select('*')
      .eq('author_id', authorId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return data || {
      author_id: authorId,
      books_count: 0,
      total_downloads: 0,
      total_views: 0,
      average_rating: 0,
      followers_count: 0,
      likes_count: 0,
      loves_count: 0,
      comments_count: 0,
      ratings_count: 0,
      shares_count: 0,
      engagement_score: 0
    };
  } catch (error) {
    console.error('Error fetching author engagement stats:', error);
    return null;
  }
}

export async function getAllAuthorsEngagementStats(limit = 100) {
  try {
    const { data, error } = await supabase
      .from('author_engagement_stats')
      .select('*')
      .order('engagement_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all authors engagement stats:', error);
    return [];
  }
}

export async function getTopAuthors(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('author_engagement_stats')
      .select('*')
      .order('engagement_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching top authors:', error);
    return [];
  }
}

// ============================================
// AUTHOR PROFILE ENRICHMENT
// ============================================

export async function enrichAuthorWithInteractions(author, userId = null) {
  try {
    const stats = await getAuthorEngagementStats(author.name || author.author_id);
    const interactions = userId 
      ? await getUserAuthorInteractionStatus(author.name || author.author_id, userId)
      : null;

    return {
      ...author,
      ...stats,
      interactions
    };
  } catch (error) {
    console.error('Error enriching author:', error);
    return author;
  }
}

export async function enrichAuthorsWithInteractions(authors, userId = null) {
  try {
    return Promise.all(
      authors.map(author => enrichAuthorWithInteractions(author, userId))
    );
  } catch (error) {
    console.error('Error enriching authors:', error);
    return authors;
  }
}
