/**
 * Reading Analytics API Routes
 * Handles reading sessions, goals, achievements, and statistics
 */

import express from 'express';

const router = express.Router();

// ============================================
// READING STATISTICS ENDPOINTS
// ============================================

/**
 * GET /api/reading/stats/:userId
 * Get comprehensive reading statistics for a user
 */
export function getReadingStats(supabase) {
  return async (req, res) => {
    try {
      const { userId } = req.params;

      // Get overall stats
      const { data: stats, error: statsError } = await supabase
        .from('user_reading_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (statsError && statsError.code !== 'PGRST116') throw statsError;

      // Get monthly stats (last 12 months)
      const { data: monthlyData, error: monthlyError } = await supabase
        .rpc('get_monthly_reading_stats', { p_user_id: userId });

      if (monthlyError) console.warn('Monthly stats error:', monthlyError);

      // Get genre distribution
      const { data: genreData, error: genreError } = await supabase
        .from('reading_sessions')
        .select(`
          book_id,
          books!inner(category_id, categories!inner(name))
        `)
        .eq('user_id', userId)
        .gte('progress_percent', 100);

      if (genreError) throw genreError;

      const genreDistribution = {};
      (genreData || []).forEach(session => {
        const genre = session.books?.categories?.name || 'Uncategorized';
        genreDistribution[genre] = (genreDistribution[genre] || 0) + 1;
      });

      // Get current streak
      const { data: streakData, error: streakError } = await supabase
        .from('reading_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (streakError && streakError.code !== 'PGRST116') throw streakError;

      // Get recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentActivity, error: activityError } = await supabase
        .from('reading_sessions')
        .select('started_at, book_id')
        .eq('user_id', userId)
        .gte('started_at', thirtyDaysAgo.toISOString())
        .order('started_at', { ascending: false });

      if (activityError) throw activityError;

      res.json({
        ok: true,
        stats: {
          overall: stats || {
            total_books_completed: 0,
            total_books_started: 0,
            genres_explored: 0,
            total_pages_read: 0,
            avg_pages_per_book: 0
          },
          monthly: monthlyData || [],
          genreDistribution,
          streak: streakData || { current_streak: 0, longest_streak: 0 },
          recentActivity: recentActivity || []
        }
      });

    } catch (error) {
      console.error('Error fetching reading stats:', error);
      res.status(500).json({ error: error.message });
    }
  };
}

/**
 * GET /api/reading/activity/:userId
 * Get daily reading activity for heatmap (last 365 days)
 */
export function getReadingActivity(supabase) {
  return async (req, res) => {
    try {
      const { userId } = req.params;
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const { data, error } = await supabase
        .from('reading_sessions')
        .select('started_at, book_id')
        .eq('user_id', userId)
        .gte('started_at', oneYearAgo.toISOString());

      if (error) throw error;

      // Group by date
      const activityMap = {};
      (data || []).forEach(session => {
        const date = session.started_at.split('T')[0];
        activityMap[date] = (activityMap[date] || 0) + 1;
      });

      res.json({ ok: true, activity: activityMap });

    } catch (error) {
      console.error('Error fetching activity:', error);
      res.status(500).json({ error: error.message });
    }
  };
}

// ============================================
// READING SESSION ENDPOINTS
// ============================================

/**
 * POST /api/reading/session
 * Create or update a reading session
 */
export function createReadingSession(supabase) {
  return async (req, res) => {
    try {
      const { userId, bookId, pagesRead, progressPercent, startedAt, endedAt } = req.body;

      if (!userId || !bookId) {
        return res.status(400).json({ error: 'userId and bookId are required' });
      }

      // Check if session already exists today for this book
      const today = new Date().toISOString().split('T')[0];
      const { data: existingSession, error: fetchError } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .gte('started_at', today)
        .single();

      let result;
      if (existingSession) {
        // Update existing session
        const { data, error } = await supabase
          .from('reading_sessions')
          .update({
            pages_read: pagesRead || existingSession.pages_read,
            progress_percent: progressPercent || existingSession.progress_percent,
            ended_at: endedAt || new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSession.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new session
        const { data, error } = await supabase
          .from('reading_sessions')
          .insert({
            user_id: userId,
            book_id: bookId,
            pages_read: pagesRead || 0,
            progress_percent: progressPercent || 0,
            started_at: startedAt || new Date().toISOString(),
            ended_at: endedAt
          })
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      res.json({ ok: true, session: result });

    } catch (error) {
      console.error('Error creating reading session:', error);
      res.status(500).json({ error: error.message });
    }
  };
}

// ============================================
// READING GOALS ENDPOINTS
// ============================================

/**
 * GET /api/reading/goals/:userId
 * Get all active reading goals for a user
 */
export function getReadingGoals(supabase) {
  return async (req, res) => {
    try {
      const { userId } = req.params;

      const { data, error } = await supabase
        .from('reading_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json({ ok: true, goals: data || [] });

    } catch (error) {
      console.error('Error fetching goals:', error);
      res.status(500).json({ error: error.message });
    }
  };
}

/**
 * POST /api/reading/goals
 * Create a new reading goal
 */
export function createReadingGoal(supabase) {
  return async (req, res) => {
    try {
      const { userId, goalType, targetBooks, year, month } = req.body;

      if (!userId || !goalType || !targetBooks || !year) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Deactivate existing goals of same type
      await supabase
        .from('reading_goals')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('goal_type', goalType)
        .eq('year', year)
        .eq('month', month || null);

      // Create new goal
      const { data, error } = await supabase
        .from('reading_goals')
        .insert({
          user_id: userId,
          goal_type: goalType,
          target_books: targetBooks,
          year,
          month: goalType === 'monthly' ? month : null,
          current_progress: 0,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      res.json({ ok: true, goal: data });

    } catch (error) {
      console.error('Error creating goal:', error);
      res.status(500).json({ error: error.message });
    }
  };
}

/**
 * PUT /api/reading/goals/:goalId
 * Update a reading goal
 */
export function updateReadingGoal(supabase) {
  return async (req, res) => {
    try {
      const { goalId } = req.params;
      const { targetBooks, isActive } = req.body;

      const updates = {};
      if (targetBooks !== undefined) updates.target_books = targetBooks;
      if (isActive !== undefined) updates.is_active = isActive;
      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('reading_goals')
        .update(updates)
        .eq('id', goalId)
        .select()
        .single();

      if (error) throw error;

      res.json({ ok: true, goal: data });

    } catch (error) {
      console.error('Error updating goal:', error);
      res.status(500).json({ error: error.message });
    }
  };
}

// ============================================
// ACHIEVEMENTS ENDPOINTS
// ============================================

/**
 * GET /api/reading/achievements/:userId
 * Get all achievements and user's earned badges
 */
export function getAchievements(supabase) {
  return async (req, res) => {
    try {
      const { userId } = req.params;

      // Get all achievement definitions
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('tier', { ascending: true });

      if (achievementsError) throw achievementsError;

      // Get user's earned achievements
      const { data: earnedAchievements, error: earnedError } = await supabase
        .from('user_achievements')
        .select('*, achievements(*)')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (earnedError) throw earnedError;

      res.json({
        ok: true,
        allAchievements: allAchievements || [],
        earnedAchievements: earnedAchievements || []
      });

    } catch (error) {
      console.error('Error fetching achievements:', error);
      res.status(500).json({ error: error.message });
    }
  };
}

/**
 * POST /api/reading/achievements/check/:userId
 * Check and award new achievements
 */
export function checkAchievements(supabase) {
  return async (req, res) => {
    try {
      const { userId } = req.params;

      // Get user stats
      const { data: stats } = await supabase
        .from('user_reading_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get streak
      const { data: streak } = await supabase
        .from('reading_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get achievements user doesn't have yet
      const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*');

      const { data: earnedCodes } = await supabase
        .from('user_achievements')
        .select('achievement_code')
        .eq('user_id', userId);

      const earnedCodesSet = new Set((earnedCodes || []).map(e => e.achievement_code));
      const newAchievements = [];

      // Check each achievement
      for (const achievement of allAchievements || []) {
        if (earnedCodesSet.has(achievement.code)) continue;

        const req = achievement.requirement;
        let earned = false;

        switch (req.type) {
          case 'books_completed':
            earned = (stats?.total_books_completed || 0) >= req.count;
            break;
          case 'streak':
            earned = (streak?.current_streak || 0) >= req.days;
            break;
          case 'genres':
            earned = (stats?.genres_explored || 0) >= req.count;
            break;
          // Add more checks as needed
        }

        if (earned) {
          const { data, error } = await supabase
            .from('user_achievements')
            .insert({
              user_id: userId,
              achievement_code: achievement.code,
              metadata: { stats_at_earning: stats }
            })
            .select()
            .single();

          if (!error) {
            newAchievements.push({ ...achievement, earned_at: data.earned_at });
          }
        }
      }

      res.json({ ok: true, newAchievements });

    } catch (error) {
      console.error('Error checking achievements:', error);
      res.status(500).json({ error: error.message });
    }
  };
}

// ============================================
// LEADERBOARD ENDPOINTS
// ============================================

/**
 * GET /api/reading/leaderboard
 * Get global leaderboard
 */
export function getLeaderboard(supabase) {
  return async (req, res) => {
    try {
      const { type = 'books', limit = 10 } = req.query;
      const userId = req.params.userId;

      let orderBy;
      switch (type) {
        case 'books':
          orderBy = 'total_books_completed';
          break;
        case 'pages':
          orderBy = 'total_pages_read';
          break;
        case 'streak':
          // Handle streak separately
          const { data: streakData, error: streakError } = await supabase
            .from('reading_streaks')
            .select('*, profiles!inner(full_name, email, avatar_url)')
            .eq('user_id', userId)
            .order('current_streak', { ascending: false })
            .limit(parseInt(limit));

          if (streakError) throw streakError;
          return res.json({ ok: true, leaderboard: streakData || [] });
        default:
          orderBy = 'total_books_completed';
      }

      // Fetch raw stats first without relying on an FK-based join
      const { data: statsData, error: statsError } = await supabase
        .from('user_reading_stats')
        .select('*')
        .eq('user_id', userId)
        .order(orderBy, { ascending: false })
        .limit(parseInt(limit));

      if (statsError) throw statsError;

      const stats = statsData || [];
      const userIds = stats.map((row) => row.user_id).filter(Boolean);

      let profilesById = new Map();
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', userIds);

        if (profilesError) throw profilesError;
        profilesById = new Map((profilesData || []).map((p) => [p.id, p]));
      }

      const leaderboard = stats.map((row) => ({
        ...row,
        profiles: profilesById.get(row.user_id) || null,
      }));

      res.json({ ok: true, leaderboard });

    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({ error: error.message });
    }
  };
}

export default router;
