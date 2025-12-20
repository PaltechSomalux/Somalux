// Comprehensive ranking endpoints for admin dashboard
// Includes all entities: users, books, authors, categories, universities, 
// past papers, reading activity, ads, and more

import { Router } from 'express';

export const createRankingRoutes = (supabaseAdmin) => {
  const router = Router();

  // Helper: Get date range based on timeRange parameter
  const getDateRange = (timeRange) => {
    const now = new Date();
    let startDate = new Date();
    
    switch(timeRange) {
      case 'daily':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'annually':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }
    
    return {
      start: startDate.toISOString(),
      end: now.toISOString()
    };
  };

  // ===== BOOKS RANKINGS =====
  router.get('/books', async (req, res) => {
    try {
      const timeRange = req.query.timeRange || 'monthly';
      const dateRange = getDateRange(timeRange);

      const { data, error } = await supabaseAdmin
        .from('books')
        .select('id, title, author, downloads, views, average_rating, rating_count, created_at')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end)
        .order('downloads', { ascending: false })
        .limit(100);

      if (error) throw error;

      const rankings = (data || []).map((book, idx) => ({
        ...book,
        rank: idx + 1,
        score: (book.downloads * 3) + (book.views * 1) + (book.average_rating * 10 || 0),
        likes: book.rating_count || 0
      }));

      res.json({ ok: true, rankings });
    } catch (e) {
      console.error('Failed to fetch book rankings:', e);
      res.status(500).json({ error: e.message || 'Failed to fetch rankings' });
    }
  });

  // ===== AUTHORS RANKINGS =====
  router.get('/authors', async (req, res) => {
    try {
      const timeRange = req.query.timeRange || 'monthly';
      const dateRange = getDateRange(timeRange);

      // Get author stats
      const { data: authorStats, error: statsError } = await supabaseAdmin
        .from('author_stats')
        .select('author_name, books_count, average_rating, rating_count, likes_count, loves_count, followers_count');

      if (statsError) throw statsError;

      // Get detailed book data for calculation
      const { data: books, error: booksError } = await supabaseAdmin
        .from('books')
        .select('author, downloads_count, views_count')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      if (booksError) throw booksError;

      const authorMap = new Map();
      
      // Initialize with author_stats data
      (authorStats || []).forEach(author => {
        authorMap.set(author.author_name, {
          author: author.author_name,
          books_count: author.books_count || 0,
          total_downloads: 0,
          total_views: 0,
          average_rating: author.average_rating || 0,
          followers_count: author.followers_count || 0,
          likes_count: author.likes_count || 0,
          loves_count: author.loves_count || 0
        });
      });

      // Aggregate book data
      (books || []).forEach(book => {
        if (!book.author) return;
        const existing = authorMap.get(book.author) || {
          author: book.author,
          books_count: 1,
          total_downloads: 0,
          total_views: 0,
          average_rating: 0,
          followers_count: 0,
          likes_count: 0,
          loves_count: 0
        };
        existing.total_downloads += book.downloads || 0;
        existing.total_views += book.views || 0;
        authorMap.set(book.author, existing);
      });

      const rankings = Array.from(authorMap.values())
        .map((author, idx) => ({
          ...author,
          rank: idx + 1,
          score: (author.total_downloads * 2) + (author.total_views * 0.5) + (author.average_rating * 100) + (author.followers_count * 5)
        }))
        .sort((a, b) => b.score - a.score);

      res.json({ ok: true, rankings });
    } catch (e) {
      console.error('Failed to fetch author rankings:', e);
      res.status(500).json({ error: e.message || 'Failed to fetch rankings' });
    }
  });

  // ===== CATEGORIES RANKINGS =====
  router.get('/categories', async (req, res) => {
    try {
      const timeRange = req.query.timeRange || 'monthly';
      const dateRange = getDateRange(timeRange);

      const { data: books, error: booksError } = await supabaseAdmin
        .from('books')
        .select('category_id, downloads_count, views_count, rating')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      if (booksError) throw booksError;

      const { data: categories, error: catError } = await supabaseAdmin
        .from('categories')
        .select('id, name');

      if (catError) throw catError;

      const categoryMap = new Map();
      categories.forEach(cat => {
        categoryMap.set(cat.id, {
          category_id: cat.id,
          category_name: cat.name,
          book_count: 0,
          total_downloads: 0,
          total_views: 0,
          rating_sum: 0,
          avg_rating: 0
        });
      });

      (books || []).forEach(book => {
        if (!book.category_id) return;
        const cat = categoryMap.get(book.category_id);
        if (cat) {
          cat.book_count += 1;
          cat.total_downloads += book.downloads || 0;
          cat.total_views += book.views || 0;
          cat.rating_sum += book.average_rating || 0;
        }
      });

      const rankings = Array.from(categoryMap.values())
        .filter(cat => cat.book_count > 0)
        .map(cat => ({
          ...cat,
          avg_rating: (cat.rating_sum / cat.book_count).toFixed(2)
        }))
        .map((cat, idx) => ({
          ...cat,
          rank: idx + 1,
          score: (cat.total_downloads * 2) + (cat.total_views * 0.5) + (parseFloat(cat.avg_rating) * 100)
        }))
        .sort((a, b) => b.score - a.score);

      res.json({ ok: true, rankings });
    } catch (e) {
      console.error('Failed to fetch category rankings:', e);
      res.status(500).json({ error: e.message || 'Failed to fetch rankings' });
    }
  });

  // ===== UNIVERSITIES RANKINGS =====
  router.get('/universities', async (req, res) => {
    try {
      const timeRange = req.query.timeRange || 'monthly';
      const dateRange = getDateRange(timeRange);

      const { data: papers, error: papersError } = await supabaseAdmin
        .from('past_papers')
        .select('university_id, downloads_count, views_count')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      if (papersError) throw papersError;

      const { data: universities, error: uniError } = await supabaseAdmin
        .from('universities')
        .select('id, name, views');

      if (uniError) throw uniError;

      const universityMap = new Map();
      universities.forEach(uni => {
        universityMap.set(uni.id, {
          university_id: uni.id,
          university_name: uni.name,
          paper_count: 0,
          total_downloads: 0,
          total_views: uni.views || 0
        });
      });

      (papers || []).forEach(paper => {
        if (!paper.university_id) return;
        const uni = universityMap.get(paper.university_id);
        if (uni) {
          uni.paper_count += 1;
          uni.total_downloads += paper.downloads || 0;
          uni.total_views += paper.views || 0;
        }
      });

      const rankings = Array.from(universityMap.values())
        .filter(uni => uni.paper_count > 0)
        .map((uni, idx) => ({
          ...uni,
          rank: idx + 1,
          score: (uni.total_downloads * 3) + (uni.total_views * 1) + (uni.paper_count * 10)
        }))
        .sort((a, b) => b.score - a.score);

      res.json({ ok: true, rankings });
    } catch (e) {
      console.error('Failed to fetch university rankings:', e);
      res.status(500).json({ error: e.message || 'Failed to fetch rankings' });
    }
  });

  // ===== PAST PAPERS RANKINGS =====
  router.get('/past-papers', async (req, res) => {
    try {
      const timeRange = req.query.timeRange || 'monthly';
      const dateRange = getDateRange(timeRange);

      const { data: papers, error } = await supabaseAdmin
        .from('past_papers')
        .select('id, unit_code, unit_name, faculty, year, semester, downloads_count, views_count, created_at')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end)
        .order('downloads', { ascending: false })
        .limit(100);

      if (error) throw error;

      const rankings = (data || []).map((paper, idx) => ({
        ...paper,
        rank: idx + 1,
        score: (paper.downloads * 3) + (paper.views * 1),
        title: `${paper.unit_code} - ${paper.unit_name} (${paper.year})`
      }));

      res.json({ ok: true, rankings });
    } catch (e) {
      console.error('Failed to fetch past papers rankings:', e);
      res.status(500).json({ error: e.message || 'Failed to fetch rankings' });
    }
  });

  // ===== READING ACTIVITY RANKINGS =====
  router.get('/reading-activity', async (req, res) => {
    try {
      const timeRange = req.query.timeRange || 'monthly';
      const dateRange = getDateRange(timeRange);

      // Get reading sessions
      const { data: sessions, error: sessionsError } = await supabaseAdmin
        .from('reading_sessions')
        .select('user_id, pages_read')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      if (sessionsError) throw sessionsError;

      // Get user profiles for names
      const userIds = [...new Set((sessions || []).map(s => s.user_id))];
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name as display_name, email, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map();
      (profiles || []).forEach(p => profileMap.set(p.id, p));

      const userMap = new Map();
      (sessions || []).forEach(session => {
        if (!session.user_id) return;
        const existing = userMap.get(session.user_id) || {
          user_id: session.user_id,
          pages_read: 0,
          sessions_count: 0,
          profile: profileMap.get(session.user_id)
        };
        existing.pages_read += session.pages_read || 0;
        existing.sessions_count += 1;
        userMap.set(session.user_id, existing);
      });

      const rankings = Array.from(userMap.values())
        .map((user, idx) => ({
          ...user,
          rank: idx + 1,
          score: user.pages_read * 10 + user.sessions_count * 5
        }))
        .sort((a, b) => b.score - a.score);

      res.json({ ok: true, rankings });
    } catch (e) {
      console.error('Failed to fetch reading activity rankings:', e);
      res.status(500).json({ error: e.message || 'Failed to fetch rankings' });
    }
  });

  // ===== ACHIEVEMENTS RANKINGS =====
  router.get('/achievements', async (req, res) => {
    try {
      // Count achievements per user
      const { data: userAchievements, error } = await supabaseAdmin
        .from('user_achievements')
        .select('user_id, achievement_code');

      if (error) throw error;

      // Get user profiles
      const userIds = [...new Set((userAchievements || []).map(ua => ua.user_id))];
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name as display_name, email, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map();
      (profiles || []).forEach(p => profileMap.set(p.id, p));

      const userMap = new Map();
      (userAchievements || []).forEach(ua => {
        if (!ua.user_id) return;
        const existing = userMap.get(ua.user_id) || {
          user_id: ua.user_id,
          achievements_count: 0,
          profile: profileMap.get(ua.user_id)
        };
        existing.achievements_count += 1;
        userMap.set(ua.user_id, existing);
      });

      const rankings = Array.from(userMap.values())
        .map((user, idx) => ({
          ...user,
          rank: idx + 1,
          score: user.achievements_count * 50
        }))
        .sort((a, b) => b.score - a.score);

      res.json({ ok: true, rankings });
    } catch (e) {
      console.error('Failed to fetch achievements rankings:', e);
      res.status(500).json({ error: e.message || 'Failed to fetch rankings' });
    }
  });

  // ===== ADS PERFORMANCE RANKINGS =====
  router.get('/ads-performance', async (req, res) => {
    try {
      const timeRange = req.query.timeRange || 'monthly';
      const dateRange = getDateRange(timeRange);

      const { data: ads, error } = await supabaseAdmin
        .from('ads')
        .select('id, title, total_impressions, total_clicks, total_dismisses, is_active, created_at')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end)
        .order('total_impressions', { ascending: false })
        .limit(50);

      if (error) throw error;

      const rankings = (data || []).map((ad, idx) => ({
        ...ad,
        rank: idx + 1,
        ctr: ad.total_impressions > 0 ? ((ad.total_clicks / ad.total_impressions) * 100).toFixed(2) : 0,
        dismissal_rate: ad.total_impressions > 0 ? ((ad.total_dismisses / ad.total_impressions) * 100).toFixed(2) : 0,
        score: (ad.total_impressions * 1) + (ad.total_clicks * 10) - (ad.total_dismisses * 2)
      }));

      res.json({ ok: true, rankings });
    } catch (e) {
      console.error('Failed to fetch ads rankings:', e);
      res.status(500).json({ error: e.message || 'Failed to fetch rankings' });
    }
  });

  // ===== READING GOALS RANKINGS =====
  router.get('/reading-goals', async (req, res) => {
    try {
      const { data: goals, error: goalsError } = await supabaseAdmin
        .from('reading_goals')
        .select('user_id, target_books, current_progress, is_completed');

      if (goalsError) throw goalsError;

      // Get user profiles
      const userIds = [...new Set((goals || []).map(g => g.user_id))];
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name as display_name, email, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map();
      (profiles || []).forEach(p => profileMap.set(p.id, p));

      const userMap = new Map();
      (goals || []).forEach(goal => {
        if (!goal.user_id) return;
        const existing = userMap.get(goal.user_id) || {
          user_id: goal.user_id,
          total_goal_books: 0,
          total_progress: 0,
          completed_goals: 0,
          active_goals: 0,
          profile: profileMap.get(goal.user_id)
        };
        existing.total_goal_books += goal.target_books || 0;
        existing.total_progress += goal.current_progress || 0;
        if (goal.is_completed) existing.completed_goals += 1;
        existing.active_goals += 1;
        userMap.set(goal.user_id, existing);
      });

      const rankings = Array.from(userMap.values())
        .map((user, idx) => ({
          ...user,
          rank: idx + 1,
          completion_rate: user.total_goal_books > 0 ? ((user.total_progress / user.total_goal_books) * 100).toFixed(2) : 0,
          score: user.completed_goals * 100 + user.total_progress * 10
        }))
        .sort((a, b) => b.score - a.score);

      res.json({ ok: true, rankings });
    } catch (e) {
      console.error('Failed to fetch reading goals rankings:', e);
      res.status(500).json({ error: e.message || 'Failed to fetch rankings' });
    }
  });

  // ===== PREMIUM SUBSCRIBERS RANKINGS =====
  router.get('/subscribers', async (req, res) => {
    try {
      const { data: subs, error: subsError } = await supabaseAdmin
        .from('subscriptions')
        .select('user_id, product, months, price_kes, status')
        .eq('status', 'active');

      if (subsError) throw subsError;

      // Get user profiles
      const userIds = [...new Set((subs || []).map(s => s.user_id))];
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name as display_name, email, avatar_url, role')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map();
      (profiles || []).forEach(p => profileMap.set(p.id, p));

      const userMap = new Map();
      (subs || []).forEach(sub => {
        if (!sub.user_id) return;
        const existing = userMap.get(sub.user_id) || {
          user_id: sub.user_id,
          total_spent: 0,
          products: new Set(),
          subscription_count: 0,
          profile: profileMap.get(sub.user_id)
        };
        existing.total_spent += sub.price_kes || 0;
        existing.products.add(sub.product);
        existing.subscription_count += 1;
        userMap.set(sub.user_id, existing);
      });

      const rankings = Array.from(userMap.values())
        .map(user => ({
          ...user,
          products: Array.from(user.products)
        }))
        .map((user, idx) => ({
          ...user,
          rank: idx + 1,
          score: user.total_spent + (user.subscription_count * 100)
        }))
        .sort((a, b) => b.score - a.score);

      res.json({ ok: true, rankings });
    } catch (e) {
      console.error('Failed to fetch subscribers rankings:', e);
      res.status(500).json({ error: e.message || 'Failed to fetch rankings' });
    }
  });

  // ===== ENGAGEMENT RANKINGS (comments, ratings, etc) =====
  router.get('/engagement', async (req, res) => {
    try {
      const timeRange = req.query.timeRange || 'monthly';
      const dateRange = getDateRange(timeRange);

      // Get comments
      const { data: comments, error: commentsError } = await supabaseAdmin
        .from('book_comments')
        .select('user_id, user_email')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      if (commentsError) throw commentsError;

      // Get ratings
      const { data: ratings, error: ratingsError } = await supabaseAdmin
        .from('book_ratings')
        .select('user_id')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      if (ratingsError) throw ratingsError;

      // Get likes
      const { data: likes, error: likesError } = await supabaseAdmin
        .from('book_likes')
        .select('user_id')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      if (likesError) throw likesError;

      // Get user profiles
      const allUserIds = [
        ...new Set([
          ...(comments || []).map(c => c.user_id),
          ...(ratings || []).map(r => r.user_id),
          ...(likes || []).map(l => l.user_id)
        ])
      ];

      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name as display_name, email, avatar_url')
        .in('id', allUserIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map();
      (profiles || []).forEach(p => profileMap.set(p.id, p));

      const userMap = new Map();

      // Count comments
      (comments || []).forEach(c => {
        const existing = userMap.get(c.user_id) || {
          user_id: c.user_id,
          comments_count: 0,
          ratings_count: 0,
          likes_count: 0,
          profile: profileMap.get(c.user_id)
        };
        existing.comments_count += 1;
        userMap.set(c.user_id, existing);
      });

      // Count ratings
      (ratings || []).forEach(r => {
        const existing = userMap.get(r.user_id) || {
          user_id: r.user_id,
          comments_count: 0,
          ratings_count: 0,
          likes_count: 0,
          profile: profileMap.get(r.user_id)
        };
        existing.ratings_count += 1;
        userMap.set(r.user_id, existing);
      });

      // Count likes
      (likes || []).forEach(l => {
        const existing = userMap.get(l.user_id) || {
          user_id: l.user_id,
          comments_count: 0,
          ratings_count: 0,
          likes_count: 0,
          profile: profileMap.get(l.user_id)
        };
        existing.likes_count += 1;
        userMap.set(l.user_id, existing);
      });

      const rankings = Array.from(userMap.values())
        .map((user, idx) => ({
          ...user,
          rank: idx + 1,
          total_interactions: user.comments_count + user.ratings_count + user.likes_count,
          score: (user.comments_count * 10) + (user.ratings_count * 5) + (user.likes_count * 2)
        }))
        .sort((a, b) => b.score - a.score);

      res.json({ ok: true, rankings });
    } catch (e) {
      console.error('Failed to fetch engagement rankings:', e);
      res.status(500).json({ error: e.message || 'Failed to fetch rankings' });
    }
  });

  // ===== USER ACTIVITY RANKINGS (Comprehensive) =====
  router.get('/user-activity', async (req, res) => {
    try {
      const timeRange = req.query.timeRange || 'monthly';
      const dateRange = getDateRange(timeRange);

      // Get all users except super_admins
      const { data: users, error: usersError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name as display_name, avatar_url, created_at')
        .neq('role', 'super_admin');

      if (usersError) throw usersError;

      // Get comments count per user
      const { data: comments, error: commentsError } = await supabaseAdmin
        .from('book_comments')
        .select('user_id')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      if (commentsError) throw commentsError;

      // Get likes/ratings count per user
      const { data: ratings, error: ratingsError } = await supabaseAdmin
        .from('book_ratings')
        .select('user_id')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      if (ratingsError) throw ratingsError;

      // Get likes count per user
      const { data: likes, error: likesError } = await supabaseAdmin
        .from('book_likes')
        .select('user_id')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      if (likesError) throw likesError;

      // Get book views per user
      const { data: views, error: viewsError } = await supabaseAdmin
        .from('book_views')
        .select('user_id')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      if (viewsError) throw viewsError;

      // Get books read (reading sessions count)
      const { data: readingSessions, error: readingError } = await supabaseAdmin
        .from('reading_sessions')
        .select('user_id')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      if (readingError) throw readingError;

      // Get books downloaded
      const { data: downloads, error: downloadsError } = await supabaseAdmin
        .from('book_downloads')
        .select('user_id')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      // Downloads might not exist, so we'll handle the error gracefully
      const downloadsList = downloadsError ? [] : (downloads || []);

      // Get books uploaded/submitted
      const { data: submissions, error: submissionsError } = await supabaseAdmin
        .from('book_submissions')
        .select('user_id')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      if (submissionsError) throw submissionsError;

      // Get author follows
      const { data: authorFollows, error: authorFollowsError } = await supabaseAdmin
        .from('author_follows')
        .select('user_id')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);

      if (authorFollowsError) throw authorFollowsError;

      // Aggregate all activities
      const userActivityMap = new Map();

      // Initialize all users
      (users || []).forEach(user => {
        userActivityMap.set(user.id, {
          user_id: user.id,
          email: user.email,
          display_name: user.display_name || 'Unknown User',
          avatar_url: user.avatar_url,
          comments_count: 0,
          ratings_count: 0,
          likes_count: 0,
          views_count: 0,
          books_read: 0,
          downloads_count: 0,
          uploads_count: 0,
          author_follows: 0,
          total_activity: 0,
          score: 0
        });
      });

      // Count comments
      (comments || []).forEach(c => {
        const user = userActivityMap.get(c.user_id);
        if (user) user.comments_count++;
      });

      // Count ratings
      (ratings || []).forEach(r => {
        const user = userActivityMap.get(r.user_id);
        if (user) user.ratings_count++;
      });

      // Count likes
      (likes || []).forEach(l => {
        const user = userActivityMap.get(l.user_id);
        if (user) user.likes_count++;
      });

      // Count views
      (views || []).forEach(v => {
        const user = userActivityMap.get(v.user_id);
        if (user) user.views_count++;
      });

      // Count books read (reading sessions)
      (readingSessions || []).forEach(rs => {
        const user = userActivityMap.get(rs.user_id);
        if (user) user.books_read++;
      });

      // Count downloads
      downloadsList.forEach(d => {
        const user = userActivityMap.get(d.user_id);
        if (user) user.downloads_count++;
      });

      // Count uploads
      (submissions || []).forEach(s => {
        const user = userActivityMap.get(s.user_id);
        if (user) user.uploads_count++;
      });

      // Count author follows
      (authorFollows || []).forEach(af => {
        const user = userActivityMap.get(af.user_id);
        if (user) user.author_follows++;
      });

      // Calculate scores and total activity
      const rankings = Array.from(userActivityMap.values())
        .map(user => {
          // Score calculation weighted by activity type
          user.total_activity = 
            user.comments_count + 
            user.ratings_count + 
            user.likes_count + 
            user.views_count + 
            user.books_read + 
            user.downloads_count + 
            user.uploads_count + 
            user.author_follows;

          user.score = 
            (user.comments_count * 10) +      // Comments weighted high
            (user.ratings_count * 5) +        // Ratings moderate weight
            (user.likes_count * 3) +          // Likes lighter weight
            (user.views_count * 1) +          // Views minimal weight
            (user.books_read * 20) +          // Reading is very important
            (user.downloads_count * 15) +     // Downloads important
            (user.uploads_count * 25) +       // Uploads are weighted highest
            (user.author_follows * 8);        // Following authors is important

          return user;
        })
        .filter(user => user.total_activity > 0) // Only users with activity
        .sort((a, b) => b.score - a.score)       // Sort by score
        .map((user, idx) => ({
          ...user,
          rank: idx + 1
        }));

      res.json({ ok: true, rankings });
    } catch (e) {
      console.error('Failed to fetch user activity rankings:', e);
      res.status(500).json({ error: e.message || 'Failed to fetch rankings' });
    }
  });

  return router;
};
