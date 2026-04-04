/**
 * Ranking Calculations Utilities
 * Contains all score calculation and data processing functions for ranking components
 */

// Authors Ranking
export const calculateAuthorScore = (author) => {
  const books = (author.books_count || 0) * 5;
  const downloads = (author.total_downloads || 0) * 0.1;
  const rating = (author.avg_rating || 0) * 10;
  const followers = (author.followers_count || 0) * 2;
  const comments = (author.comments_count || 0) * 1;
  const likes = (author.likes_count || 0) * 0.5;
  const reviews = (author.reviews_count || 0) * 1.5;
  const shares = (author.shares_count || 0) * 2;
  return Math.round(books + downloads + rating + followers + comments + likes + reviews + shares);
};

export const filterAndSortAuthors = (authorsStats = [], searchTerm = '', filterMetric = 'score') => {
  let filtered = (authorsStats || []).filter(author =>
    !searchTerm ||
    author.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    author.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return [...filtered].sort((a, b) => {
    switch (filterMetric) {
      case 'books': return (b.books_count || 0) - (a.books_count || 0);
      case 'downloads': return (b.total_downloads || 0) - (a.total_downloads || 0);
      case 'followers': return (b.followers_count || 0) - (a.followers_count || 0);
      case 'rating': return (b.avg_rating || 0) - (a.avg_rating || 0);
      default: return calculateAuthorScore(b) - calculateAuthorScore(a);
    }
  });
};

// Books Ranking
export const calculateBookScore = (book) => {
  const views = (book.views_count || 0) * 0.1;
  const downloads = (book.downloads_count || 0) * 0.5;
  const reads = (book.read_count || 0) * 0.3;
  const likes = (book.likes_count || 0) * 1;
  const comments = (book.comments_count || 0) * 1.5;
  const shares = (book.shares_count || 0) * 2;
  return Math.round(views + downloads + reads + likes + comments + shares);
};

export const filterAndSortBooks = (bookStats = [], searchTerm = '', filterMetric = 'score') => {
  let filtered = (bookStats || []).filter(book =>
    !searchTerm ||
    book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return [...filtered].sort((a, b) => {
    switch (filterMetric) {
      case 'views':
        return (b.views_count || 0) - (a.views_count || 0);
      case 'downloads':
        return (b.downloads_count || 0) - (a.downloads_count || 0);
      case 'reads':
        return (b.read_count || 0) - (a.read_count || 0);
      case 'likes':
        return (b.likes_count || 0) - (a.likes_count || 0);
      default:
        return calculateBookScore(b) - calculateBookScore(a);
    }
  });
};

// Users Ranking
export const calculateUserScore = (user) => {
  const comments = (user.comments_count || 0) * 0.5;
  const ratings = (user.ratings_count || 0) * 1;
  const likes = (user.likes_count || 0) * 0.8;
  const views = (user.views_count || 0) * 0.1;
  const reads = (user.books_read || 0) * 2;
  const downloads = (user.downloads_count || 0) * 1.5;
  const uploads = (user.uploads_count || 0) * 3;
  const follows = (user.author_follows || 0) * 1.5;
  return Math.round(comments + ratings + likes + views + reads + downloads + uploads + follows);
};

export const filterAndSortUsers = (userActivityStats = [], searchTerm = '', filterMetric = 'score') => {
  let filtered = userActivityStats.filter(user =>
    !searchTerm ||
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return [...filtered].sort((a, b) => {
    switch (filterMetric) {
      case 'comments': return (b.comments_count || 0) - (a.comments_count || 0);
      case 'ratings': return (b.ratings_count || 0) - (a.ratings_count || 0);
      case 'likes': return (b.likes_count || 0) - (a.likes_count || 0);
      case 'views': return (b.views_count || 0) - (a.views_count || 0);
      case 'reads': return (b.books_read || 0) - (a.books_read || 0);
      case 'downloads': return (b.downloads_count || 0) - (a.downloads_count || 0);
      case 'uploads': return (b.uploads_count || 0) - (a.uploads_count || 0);
      case 'follows': return (b.author_follows || 0) - (a.author_follows || 0);
      case 'activity': return (b.total_activity || 0) - (a.total_activity || 0);
      default: return (b.score || 0) - (a.score || 0);
    }
  });
};

// Categories Ranking
export const calculateCategoryScore = (category) => {
  const books = (category.books_count || 0) * 2;
  const downloads = (category.downloads || 0) * 0.2;
  const views = (category.views || 0) * 0.05;
  return Math.round(books + downloads + views);
};

export const filterAndSortCategories = (categoriesStats = [], searchTerm = '', filterMetric = 'score') => {
  let filtered = (categoriesStats || []).filter(category =>
    !searchTerm ||
    category.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return [...filtered].sort((a, b) => {
    switch (filterMetric) {
      case 'books': return (b.books_count || 0) - (a.books_count || 0);
      case 'downloads': return (b.downloads || 0) - (a.downloads || 0);
      case 'views': return (b.views || 0) - (a.views || 0);
      default: return calculateCategoryScore(b) - calculateCategoryScore(a);
    }
  });
};

// Universities Ranking
export const calculateUniversityScore = (uni) => {
  const papers = (uni.papers_count || 0) * 5;
  const views = (uni.views || 0) * 0.1;
  const downloads = (uni.downloads || 0) * 0.3;
  const likes = (uni.likes_count || 0) * 1;
  const comments = (uni.comments_count || 0) * 1.2;
  const shares = (uni.shares_count || 0) * 1.5;
  const followers = (uni.followers_count || 0) * 2;
  const ratings = (uni.avg_rating || 0) * 10;
  return Math.round(papers + views + downloads + likes + comments + shares + followers + ratings);
};

export const filterAndSortUniversities = (universitiesStats = [], searchTerm = '', filterMetric = 'score') => {
  let filtered = (universitiesStats || []).filter(uni =>
    !searchTerm ||
    uni.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return [...filtered].sort((a, b) => {
    switch (filterMetric) {
      case 'papers': return (b.papers_count || 0) - (a.papers_count || 0);
      case 'views': return (b.views || 0) - (a.views || 0);
      case 'downloads': return (b.downloads || 0) - (a.downloads || 0);
      case 'followers': return (b.followers_count || 0) - (a.followers_count || 0);
      default: return calculateUniversityScore(b) - calculateUniversityScore(a);
    }
  });
};

// Papers Ranking
export const calculatePaperScore = (paper) => {
  const views = (paper.views || 0) * 0.1;
  const downloads = (paper.downloads || 0) * 0.5;
  const likes = (paper.likes_count || 0) * 1;
  const comments = (paper.comments_count || 0) * 1.5;
  const shares = (paper.shares_count || 0) * 2;
  const bookmarks = (paper.bookmarks_count || 0) * 1.2;
  return Math.round(views + downloads + likes + comments + shares + bookmarks);
};

export const filterAndSortPapers = (papersStats = [], searchTerm = '', filterMetric = 'score') => {
  let filtered = (papersStats || []).filter(paper =>
    !searchTerm ||
    paper.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paper.unit_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return [...filtered].sort((a, b) => {
    switch (filterMetric) {
      case 'views': return (b.views || 0) - (a.views || 0);
      case 'downloads': return (b.downloads || 0) - (a.downloads || 0);
      case 'likes': return (b.likes_count || 0) - (a.likes_count || 0);
      case 'comments': return (b.comments_count || 0) - (a.comments_count || 0);
      default: return calculatePaperScore(b) - calculatePaperScore(a);
    }
  });
};

// Reading Activity Ranking
export const calculateActivityScore = (activity) => {
  const sessions = (activity.sessions || 0) * 2;
  const pagesRead = (activity.pages_read || 0) * 0.5;
  return Math.round(sessions + pagesRead);
};

export const filterAndSortReadingActivity = (readingActivityStats = [], searchTerm = '', filterMetric = 'score') => {
  let filtered = (readingActivityStats || []).filter(activity =>
    !searchTerm ||
    activity.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return [...filtered].sort((a, b) => {
    switch (filterMetric) {
      case 'sessions': return (b.sessions || 0) - (a.sessions || 0);
      case 'pages': return (b.pages_read || 0) - (a.pages_read || 0);
      default: return calculateActivityScore(b) - calculateActivityScore(a);
    }
  });
};

// Achievements Ranking
export const calculateAchievementScore = (user) => {
  const achievements = (user.achievements_count || 0) * 10;
  const badgesCount = (user.badges_count || 0) * 15;
  const milestones = (user.milestones_unlocked || 0) * 20;
  const rarity = (user.rare_achievements || 0) * 30;
  return Math.round(achievements + badgesCount + milestones + rarity);
};

export const filterAndSortAchievements = (achievementsStats = [], searchTerm = '', filterMetric = 'score') => {
  let filtered = (achievementsStats || []).filter(user =>
    !searchTerm ||
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return [...filtered].sort((a, b) => {
    switch (filterMetric) {
      case 'achievements': return (b.achievements_count || 0) - (a.achievements_count || 0);
      case 'badges': return (b.badges_count || 0) - (a.badges_count || 0);
      case 'milestones': return (b.milestones_unlocked || 0) - (a.milestones_unlocked || 0);
      case 'rare': return (b.rare_achievements || 0) - (a.rare_achievements || 0);
      default: return calculateAchievementScore(b) - calculateAchievementScore(a);
    }
  });
};

// Ads Ranking
export const calculateAdScore = (ad) => {
  const impressions = (ad.impressions || 0) * 0.05;
  const clicks = (ad.clicks || 0) * 1;
  const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100) : 0;
  const conversions = (ad.conversions || 0) * 5;
  const revenue = (ad.revenue || 0) * 0.1;
  return Math.round(impressions + clicks + ctr + conversions + revenue);
};

export const filterAndSortAds = (adsStats = [], searchTerm = '', filterMetric = 'score') => {
  let filtered = (adsStats || []).filter(ad =>
    !searchTerm ||
    ad.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return [...filtered].sort((a, b) => {
    switch (filterMetric) {
      case 'impressions': return (b.impressions || 0) - (a.impressions || 0);
      case 'clicks': return (b.clicks || 0) - (a.clicks || 0);
      case 'conversions': return (b.conversions || 0) - (a.conversions || 0);
      case 'revenue': return (b.revenue || 0) - (a.revenue || 0);
      default: return calculateAdScore(b) - calculateAdScore(a);
    }
  });
};

// Goals Ranking
export const calculateGoalScore = (goal) => {
  const totalGoals = (goal.total_goals || 0) * 2;
  const completedGoals = (goal.completed_goals || 0) * 5;
  const completionRate = goal.total_goals > 0 ? ((goal.completed_goals / goal.total_goals) * 100) : 0;
  const daysOnTrack = (goal.days_on_track || 0) * 1;
  const consistency = (goal.consistency_score || 0) * 2;
  return Math.round(totalGoals + completedGoals + (completionRate * 0.5) + daysOnTrack + consistency);
};

export const filterAndSortGoals = (goalsStats = [], searchTerm = '', filterMetric = 'score') => {
  let filtered = (goalsStats || []).filter(goal =>
    !searchTerm ||
    goal.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    goal.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return [...filtered].sort((a, b) => {
    switch (filterMetric) {
      case 'goals': return (b.total_goals || 0) - (a.total_goals || 0);
      case 'completed': return (b.completed_goals || 0) - (a.completed_goals || 0);
      case 'consistency': return (b.consistency_score || 0) - (a.consistency_score || 0);
      default: return calculateGoalScore(b) - calculateGoalScore(a);
    }
  });
};

// Subscribers Ranking
export const calculateSubscriberScore = (subscriber) => {
  const spent = (subscriber.total_spent || 0) * 0.1;
  const subscriptionMonths = (subscriber.subscription_months || 0) * 5;
  const renewals = (subscriber.renewals || 0) * 10;
  const referrals = (subscriber.referrals || 0) * 20;
  const loyaltyBonus = (subscriber.is_active ? 50 : 0);
  return Math.round(spent + subscriptionMonths + renewals + referrals + loyaltyBonus);
};

export const filterAndSortSubscribers = (subscribersStats = [], searchTerm = '', filterMetric = 'score') => {
  let filtered = (subscribersStats || []).filter(subscriber =>
    !searchTerm ||
    subscriber.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subscriber.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return [...filtered].sort((a, b) => {
    switch (filterMetric) {
      case 'spent': return (b.total_spent || 0) - (a.total_spent || 0);
      case 'months': return (b.subscription_months || 0) - (a.subscription_months || 0);
      case 'renewals': return (b.renewals || 0) - (a.renewals || 0);
      case 'referrals': return (b.referrals || 0) - (a.referrals || 0);
      default: return calculateSubscriberScore(b) - calculateSubscriberScore(a);
    }
  });
};

// Engagement Ranking
export const calculateEngagementScore = (engagement) => {
  const comments = (engagement.comments || 0) * 2;
  const ratings = (engagement.ratings || 0) * 1.5;
  const likes = (engagement.likes || 0) * 1;
  const replies = (engagement.replies || 0) * 1.8;
  const mentions = (engagement.mentions || 0) * 2.5;
  const follows = (engagement.follows || 0) * 3;
  const responseTime = (engagement.avg_response_time || 0) > 0 ? 10 : 0;
  return Math.round(comments + ratings + likes + replies + mentions + follows + responseTime);
};

export const filterAndSortEngagement = (engagementStats = [], searchTerm = '', filterMetric = 'score') => {
  let filtered = (engagementStats || []).filter(engagement =>
    !searchTerm ||
    engagement.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    engagement.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return [...filtered].sort((a, b) => {
    switch (filterMetric) {
      case 'comments': return (b.comments || 0) - (a.comments || 0);
      case 'ratings': return (b.ratings || 0) - (a.ratings || 0);
      case 'likes': return (b.likes || 0) - (a.likes || 0);
      case 'replies': return (b.replies || 0) - (a.replies || 0);
      case 'mentions': return (b.mentions || 0) - (a.mentions || 0);
      case 'follows': return (b.follows || 0) - (a.follows || 0);
      default: return calculateEngagementScore(b) - calculateEngagementScore(a);
    }
  });
};
