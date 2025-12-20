import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { FiCheck, FiAward } from 'react-icons/fi';
import VerificationTierModal from './VerificationTierModal';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'views', label: 'Books Read / Viewed' },
  { id: 'downloads', label: 'Downloads' },
  { id: 'likes', label: 'Liked Books' },
  { id: 'comments', label: 'Comments' },
  { id: 'uploads', label: 'Uploads' },
  { id: 'sessions', label: 'Reading Sessions' },
  { id: 'goals', label: 'Goals & Progress' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'authors', label: 'Author Engagement' },
  { id: 'search_overview', label: 'Search Overview' },
];

const COLORS = ['#00a884', '#34B7F1', '#FFCC00', '#f15e6c', '#8b5cf6', '#22d3ee'];

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [views, setViews] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [readingSessions, setReadingSessions] = useState([]);
  const [readingGoals, setReadingGoals] = useState([]);
  const [readingStats, setReadingStats] = useState(null);
  const [readingStreak, setReadingStreak] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [authorLikes, setAuthorLikes] = useState([]);
  const [authorFollows, setAuthorFollows] = useState([]);
  const [authorRatings, setAuthorRatings] = useState([]);
  const [authorStats, setAuthorStats] = useState([]);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('tab');
    return t && TABS.some(tab => tab.id === t) ? t : 'overview';
  });

  useEffect(() => {
    if (!id) return;
    if (activeTab === 'search_overview') {
      navigate(`/books/admin/users/${id}/search`);
    }
  }, [activeTab, id, navigate]);

  useEffect(() => {
    // Keep tab in sync if query param changes
    const params = new URLSearchParams(location.search);
    const t = params.get('tab');
    if (t && TABS.some(tab => tab.id === t) && t !== activeTab) {
      setActiveTab(t);
    }
  }, [location.search]);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      try {
        const [
          profileRes,
          viewsRes,
          downloadsRes,
          likesRes,
          commentsRes,
          subsRes,
          uploadsRes,
          sessionsRes,
          goalsRes,
          statsRes,
          streakRes,
          userAchRes,
          authorLikesRes,
          authorFollowsRes,
          authorRatingsRes,
          authorStatsRes,
        ] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, email, display_name, role, created_at, avatar_url, subscription_tier')
            .eq('id', id)
            .maybeSingle(),
          supabase
            .from('book_views')
            .select('id, book_id, view_date')
            .eq('user_id', id)
            .order('view_date', { ascending: false }),
          supabase
            .from('book_downloads')
            .select('id, book_id, downloaded_at')
            .eq('user_id', id)
            .order('downloaded_at', { ascending: false }),
          supabase
            .from('book_likes')
            .select('id, book_id, created_at')
            .eq('user_id', id)
            .order('created_at', { ascending: false }),
          supabase
            .from('book_comments')
            .select('id, book_id, text, created_at')
            .eq('user_id', id)
            .order('created_at', { ascending: false }),
          supabase
            .from('subscriptions')
            .select('id, product, plan_id, price_kes, status, start_at, end_date, created_at')
            .eq('user_id', id)
            .order('start_at', { ascending: false }),
          supabase
            .from('books')
            .select('id, title, author, created_at, views_count, downloads_count, year, language, publisher')
            .eq('uploaded_by', id)
            .order('created_at', { ascending: false }),
          supabase
            .from('reading_sessions')
            .select('id, book_id, pages_read, progress_percent, started_at, ended_at')
            .eq('user_id', id)
            .order('started_at', { ascending: false }),
          supabase
            .from('reading_goals')
            .select('id, goal_type, target_books, current_progress, year, month, is_active, created_at, updated_at')
            .eq('user_id', id)
            .order('created_at', { ascending: false }),
          supabase
            .from('user_reading_stats')
            .select('total_books_completed, total_books_started, genres_explored, total_pages_read, avg_pages_per_book, updated_at')
            .eq('user_id', id)
            .maybeSingle(),
          supabase
            .from('reading_streaks')
            .select('current_streak, longest_streak, updated_at')
            .eq('user_id', id)
            .maybeSingle(),
          supabase
            .from('user_achievements')
            .select('id, achievement_code, earned_at, metadata, achievements(title, code, tier)')
            .eq('user_id', id)
            .order('earned_at', { ascending: false }),
          supabase
            .from('author_likes')
            .select('id, author_name, created_at')
            .eq('user_id', id)
            .order('created_at', { ascending: false }),
          supabase
            .from('author_follows')
            .select('id, author_name, created_at')
            .eq('follower_id', id)
            .order('created_at', { ascending: false }),
          supabase
            .from('author_ratings')
            .select('id, author_name, rating, created_at, updated_at')
            .eq('user_id', id)
            .order('created_at', { ascending: false }),
          // NOTE: author_stats table doesn't exist yet, commenting out for now
          // supabase
          //   .from('author_stats')
          //   .select('author_name, books_count, average_rating, rating_count, likes_count, loves_count, followers_count, updated_at'),
          Promise.resolve({ data: null, error: null }),
        ]);

        if (profileRes.error) throw profileRes.error;
        setProfile(profileRes.data || null);

        const viewsData = viewsRes.error ? [] : viewsRes.data || [];
        const downloadsData = downloadsRes.error ? [] : downloadsRes.data || [];
        const likesData = likesRes.error ? [] : likesRes.data || [];
        const commentsData = commentsRes.error ? [] : commentsRes.data || [];
        const subsData = subsRes.error ? [] : subsRes.data || [];
        const uploadsData = uploadsRes.error ? [] : uploadsRes.data || [];
        const sessionsData = sessionsRes.error ? [] : sessionsRes.data || [];
        const goalsData = goalsRes.error ? [] : goalsRes.data || [];
        const statsData = statsRes.error ? null : statsRes.data || null;
        const streakData = streakRes.error ? null : streakRes.data || null;
        const userAchData = userAchRes.error ? [] : userAchRes.data || [];
        const authorLikesData = authorLikesRes.error ? [] : authorLikesRes.data || [];
        const authorFollowsData = authorFollowsRes.error ? [] : authorFollowsRes.data || [];
        const authorRatingsData = authorRatingsRes.error ? [] : authorRatingsRes.data || [];
        const authorStatsData = authorStatsRes.error ? [] : authorStatsRes.data || [];

        // Collect unique book ids to hydrate titles once (views, downloads, sessions, likes, comments)
        const bookIds = Array.from(
          new Set([
            ...viewsData.map((v) => v.book_id).filter(Boolean),
            ...downloadsData.map((d) => d.book_id).filter(Boolean),
            ...sessionsData.map((s) => s.book_id).filter(Boolean),
            ...likesData.map((l) => l.book_id).filter(Boolean),
            ...commentsData.map((c) => c.book_id).filter(Boolean),
          ]),
        );

        let booksMap = new Map();
        if (bookIds.length > 0) {
          const { data: booksData } = await supabase
            .from('books')
            .select('id, title, author, cover_url')
            .in('id', bookIds);
          if (booksData) {
            booksMap = new Map(booksData.map((b) => [b.id, b]));
          }
        }

        // Enrich datasets with book info
        const withBook = (row) => {
          const book = booksMap.get(row.book_id) || null;
          return { ...row, book };
        };

        setViews(viewsData.map(withBook));
        setDownloads(downloadsData.map(withBook));
        setReadingSessions(sessionsData.map(withBook));
        setLikes(likesData.map(withBook));
        setComments(commentsData.map(withBook));
        setSubscriptions(subsData || []);
        setUploads(uploadsData || []);
        setReadingGoals(goalsData || []);
        setReadingStats(statsData);
        setReadingStreak(streakData);
        setAchievements(userAchData || []);
        setAuthorLikes(authorLikesData || []);
        setAuthorFollows(authorFollowsData || []);
        setAuthorRatings(authorRatingsData || []);
        setAuthorStats(authorStatsData || []);
      } catch (err) {
        console.error('Failed to load user details', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const viewSummary = useMemo(() => {
    const byBook = new Map();
    views.forEach((v) => {
      if (!v.book_id) return;
      const existing = byBook.get(v.book_id) || {
        book: v.book || null,
        count: 0,
        lastViewed: null,
      };
      existing.count += 1;
      const ts = v.view_date ? new Date(v.view_date).getTime() : 0;
      const lastTs = existing.lastViewed ? new Date(existing.lastViewed).getTime() : 0;
      if (ts > lastTs) existing.lastViewed = v.view_date;
      byBook.set(v.book_id, existing);
    });
    return Array.from(byBook.values());
  }, [views]);

  const commentsCount = comments.length;
  const likesCount = likes.length;
  const viewsCount = views.length;
  const downloadsCount = downloads.length;
  const uploadsCount = uploads.length;

  const totalEngagement = viewsCount + likesCount + commentsCount + downloadsCount + uploadsCount;

  const engagementShare = (value) => {
    if (!totalEngagement) return 0;
    return Math.round((value / totalEngagement) * 100);
  };

  const engagementPieData = useMemo(() => {
    return [
      { name: 'Views', value: viewsCount },
      { name: 'Likes', value: likesCount },
      { name: 'Comments', value: commentsCount },
      { name: 'Downloads', value: downloadsCount },
      { name: 'Uploads', value: uploadsCount },
    ].filter((d) => d.value > 0);
  }, [viewsCount, likesCount, commentsCount, downloadsCount, uploadsCount]);

  const activitySeries = useMemo(() => {
    const byDay = new Map();

    const add = (dateStr, key) => {
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return;
      const dayKey = d.toISOString().slice(0, 10);
      const existing = byDay.get(dayKey) || { day: dayKey, views: 0, downloads: 0 };
      existing[key] += 1;
      byDay.set(dayKey, existing);
    };

    views.forEach((v) => add(v.view_date, 'views'));
    downloads.forEach((d) => add(d.downloaded_at, 'downloads'));

    return Array.from(byDay.values()).sort((a, b) => (a.day < b.day ? -1 : 1));
  }, [views, downloads]);

  const downloadsSummary = useMemo(() => {
    const byBook = new Map();
    downloads.forEach((d) => {
      if (!d.book_id) return;
      const existing = byBook.get(d.book_id) || {
        book: d.book || null,
        count: 0,
        lastDownloaded: null,
      };
      existing.count += 1;
      const ts = d.downloaded_at ? new Date(d.downloaded_at).getTime() : 0;
      const lastTs = existing.lastDownloaded ? new Date(existing.lastDownloaded).getTime() : 0;
      if (ts > lastTs) existing.lastDownloaded = d.downloaded_at;
      byBook.set(d.book_id, existing);
    });
    return Array.from(byBook.values());
  }, [downloads]);

  const latestSubscription = useMemo(() => {
    if (!subscriptions || subscriptions.length === 0) return null;
    return subscriptions[0];
  }, [subscriptions]);

  const renderTabContent = () => {
    if (activeTab === 'overview') {
      return (
        <div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {[{
              label: 'Books Viewed',
              value: viewsCount,
              color: '#00a884',
              bg: 'rgba(0,168,132,0.1)',
            }, {
              label: 'Books Liked',
              value: likesCount,
              color: '#34B7F1',
              bg: 'rgba(52,183,241,0.1)',
            }, {
              label: 'Comments',
              value: commentsCount,
              color: '#FFCC00',
              bg: 'rgba(255,204,0,0.1)',
            }, {
              label: 'Downloads',
              value: downloadsCount,
              color: '#8b5cf6',
              bg: 'rgba(139,92,246,0.1)',
            }, {
              label: 'Uploads',
              value: uploadsCount,
              color: '#f15e6c',
              bg: 'rgba(241,94,108,0.1)',
            }].map((card, idx) => {
              const pct = engagementShare(card.value);
              return (
                <div
                  key={idx}
                  style={{
                    padding: 8,
                    borderRadius: 12,
                    background: '#111b21',
                    minWidth: 200,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div style={{ color: '#8696a0', fontSize: 12 }}>{card.label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <div style={{ fontSize: 22, fontWeight: 600 }}>{card.value}</div>
                    <div
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: card.bg,
                        color: card.color,
                      }}
                    >
                      {totalEngagement ? `${pct}% of activity` : '—'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <div
              style={{
                flex: 1,
                minWidth: 320,
                padding: 8,
                borderRadius: 12,
                background: '#111b21',
              }}
            >
              <div style={{ color: '#e9edef', fontSize: 12, marginBottom: 6 }}>Activity Over Time</div>
              <div style={{ width: '100%', height: 260 }}>
                {activitySeries.length === 0 ? (
                  <div style={{ color: '#8696a0', textAlign: 'center', paddingTop: 40 }}>
                    No activity yet for this user.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activitySeries} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#202c33" />
                      <XAxis dataKey="day" stroke="#8696a0" tick={{ fontSize: 11 }} tickMargin={8} />
                      <YAxis stroke="#8696a0" tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2c33',
                          border: '1px solid #2a3942',
                          borderRadius: 8,
                          color: '#e9edef',
                        }}
                        labelStyle={{ color: '#cfd8dc' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="views" name="Views" stroke="#00a884" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="downloads" name="Downloads" stroke="#34B7F1" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div
              style={{
                flex: 1,
                minWidth: 280,
                padding: 8,
                borderRadius: 12,
                background: '#111b21',
              }}
            >
              <div style={{ color: '#e9edef', fontSize: 12, marginBottom: 6 }}>Engagement Breakdown</div>
              <div style={{ width: '100%', height: 260 }}>
                {engagementPieData.length === 0 ? (
                  <div style={{ color: '#8696a0', textAlign: 'center', paddingTop: 40 }}>
                    No engagement yet for this user.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={engagementPieData} layout="vertical" margin={{ top: 10, right: 24, left: 40, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#202c33" />
                      <XAxis type="number" stroke="#8696a0" />
                      <YAxis dataKey="name" type="category" stroke="#8696a0" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2c33',
                          border: '1px solid #2a3942',
                          borderRadius: 8,
                          color: '#e9edef',
                        }}
                        labelStyle={{ color: '#cfd8dc' }}
                      />
                      <Legend />
                      <Bar dataKey="value" name="Events" radius={[4, 4, 4, 4]}>
                        {engagementPieData.map((entry, index) => (
                          <Bar key={`bar-${index}`} dataKey="value" fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
          {latestSubscription && (
            <div
              style={{
                marginTop: 6,
                padding: 8,
                borderRadius: 12,
                background: '#111b21',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                maxWidth: 420,
              }}
            >
              <div style={{ fontSize: 13, color: '#8696a0' }}>Latest Subscription</div>
              <div style={{ fontSize: 13 }}>
                <strong>{latestSubscription.product}</strong> · Plan {latestSubscription.plan_id} · Ksh{' '}
                {latestSubscription.price_kes}
              </div>
              <div style={{ fontSize: 12, color: '#8696a0' }}>
                Status:{' '}
                <span style={{ fontWeight: 600 }}>{latestSubscription.status}</span>
                {latestSubscription.start_at && (
                  <>
                    {' '}
                    · From {new Date(latestSubscription.start_at).toLocaleDateString()} to{' '}
                    {latestSubscription.end_date
                      ? new Date(latestSubscription.end_date).toLocaleDateString()
                      : '—'}
                  </>
                )}
              </div>
            </div>
          )}
          {(readingStats || readingStreak) && (
            <div
              style={{
                marginTop: 12,
                padding: 8,
                borderRadius: 12,
                background: '#111b21',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              {readingStats && (
                <div style={{ minWidth: 220 }}>
                  <div style={{ color: '#8696a0', fontSize: 12 }}>Reading Stats</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    <div>Total books completed: <strong>{readingStats.total_books_completed}</strong></div>
                    <div>Total pages read: <strong>{readingStats.total_pages_read}</strong></div>
                    <div>Avg pages/book: <strong>{readingStats.avg_pages_per_book}</strong></div>
                  </div>
                </div>
              )}
              {readingStreak && (
                <div style={{ minWidth: 220 }}>
                  <div style={{ color: '#8696a0', fontSize: 12 }}>Reading Streak</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    <div>Current streak: <strong>{readingStreak.current_streak}</strong> days</div>
                    <div>Longest streak: <strong>{readingStreak.longest_streak}</strong> days</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'uploads') {
      return (
        <div>
          {uploads.length === 0 ? (
            <div style={{ color: '#8696a0' }}>No uploads recorded for this user.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Year</th>
                  <th>Language</th>
                  <th>Views</th>
                  <th>Downloads</th>
                  <th>Uploaded At</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((b) => (
                  <tr key={b.id}>
                    <td>{b.title}</td>
                    <td>{b.author || '—'}</td>
                    <td>{b.year || '—'}</td>
                    <td>{b.language || '—'}</td>
                    <td>{b.views ?? 0}</td>
                    <td>{b.downloads ?? 0}</td>
                    <td>{b.created_at ? new Date(b.created_at).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );
    }

    if (activeTab === 'views') {
      return (
        <div>
          {viewSummary.length === 0 ? (
            <div style={{ color: '#8696a0' }}>No reading activity recorded for this user.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Author</th>
                  <th>Times Viewed</th>
                  <th>Last Viewed</th>
                </tr>
              </thead>
              <tbody>
                {viewSummary.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.book?.title || 'Unknown'}</td>
                    <td>{row.book?.author || '—'}</td>
                    <td>{row.count}</td>
                    <td>
                      {row.lastViewed
                        ? new Date(row.lastViewed).toLocaleString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );
    }

    if (activeTab === 'downloads') {
      return (
        <div>
          {downloadsSummary.length === 0 ? (
            <div style={{ color: '#8696a0' }}>No downloads recorded for this user.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Author</th>
                  <th>Times Downloaded</th>
                  <th>Last Downloaded</th>
                </tr>
              </thead>
              <tbody>
                {downloadsSummary.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.book?.title || 'Unknown'}</td>
                    <td>{row.book?.author || '—'}</td>
                    <td>{row.count}</td>
                    <td>
                      {row.lastDownloaded
                        ? new Date(row.lastDownloaded).toLocaleString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );
    }

    if (activeTab === 'likes') {
      return (
        <div>
          {likes.length === 0 ? (
            <div style={{ color: '#8696a0' }}>No liked books for this user.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Author</th>
                  <th>Liked At</th>
                </tr>
              </thead>
              <tbody>
                {likes.map((like) => (
                  <tr key={like.id}>
                    <td>{like.book?.title || 'Unknown'}</td>
                    <td>{like.book?.author || '—'}</td>
                    <td>
                      {like.created_at
                        ? new Date(like.created_at).toLocaleString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );
    }

    if (activeTab === 'comments') {
      return (
        <div>
          {comments.length === 0 ? (
            <div style={{ color: '#8696a0' }}>No comments from this user.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Comment</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {comments.map((c) => (
                  <tr key={c.id}>
                    <td>{c.book?.title || 'Unknown'}</td>
                    <td>
                      {c.text && c.text.length > 120
                        ? `${c.text.slice(0, 120)}…`
                        : c.text || '—'}
                    </td>
                    <td>
                      {c.created_at
                        ? new Date(c.created_at).toLocaleString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );
    }

    if (activeTab === 'sessions') {
      return (
        <div>
          {readingSessions.length === 0 ? (
            <div style={{ color: '#8696a0' }}>No reading sessions recorded for this user.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Pages Read</th>
                  <th>Progress %</th>
                  <th>Started</th>
                  <th>Ended</th>
                </tr>
              </thead>
              <tbody>
                {readingSessions.map((s) => (
                  <tr key={s.id}>
                    <td>{s.book?.title || 'Unknown'}</td>
                    <td>{s.pages_read}</td>
                    <td>{s.progress_percent}</td>
                    <td>{s.started_at ? new Date(s.started_at).toLocaleString() : '—'}</td>
                    <td>{s.ended_at ? new Date(s.ended_at).toLocaleString() : 'In progress'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );
    }

    if (activeTab === 'goals') {
      return (
        <div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {readingStats && (
              <div
                style={{
                  padding: 8,
                  borderRadius: 12,
                  background: '#111b21',
                  minWidth: 220,
                }}
              >
                <div style={{ color: '#8696a0', fontSize: 12 }}>Lifetime Reading Stats</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  <div>Total books completed: <strong>{readingStats.total_books_completed}</strong></div>
                  <div>Total books started: <strong>{readingStats.total_books_started}</strong></div>
                  <div>Total pages read: <strong>{readingStats.total_pages_read}</strong></div>
                  <div>Avg pages per book: <strong>{readingStats.avg_pages_per_book}</strong></div>
                </div>
              </div>
            )}
            {readingStreak && (
              <div
                style={{
                  padding: 8,
                  borderRadius: 12,
                  background: '#111b21',
                  minWidth: 220,
                }}
              >
                <div style={{ color: '#8696a0', fontSize: 12 }}>Reading Streak</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  <div>Current streak: <strong>{readingStreak.current_streak}</strong> days</div>
                  <div>Longest streak: <strong>{readingStreak.longest_streak}</strong> days</div>
                </div>
              </div>
            )}
          </div>

          {readingGoals.length === 0 ? (
            <div style={{ color: '#8696a0' }}>No reading goals defined for this user.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Target Books</th>
                  <th>Progress</th>
                  <th>Period</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {readingGoals.map((g) => {
                  const pct = g.target_books > 0
                    ? Math.round((g.current_progress / g.target_books) * 100)
                    : 0;
                  const period = g.goal_type === 'yearly'
                    ? g.year || '—'
                    : g.goal_type === 'monthly'
                      ? `${g.month || '—'}/${g.year || '—'}`
                      : 'Custom';
                  return (
                    <tr key={g.id}>
                      <td>{g.goal_type}</td>
                      <td>{g.target_books}</td>
                      <td>
                        {g.current_progress} ({pct}% )
                      </td>
                      <td>{period}</td>
                      <td>{g.is_active ? 'Active' : 'Inactive'}</td>
                      <td>{g.updated_at ? new Date(g.updated_at).toLocaleString() : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      );
    }

    if (activeTab === 'achievements') {
      return (
        <div>
          {achievements.length === 0 ? (
            <div style={{ color: '#8696a0' }}>No achievements recorded for this user.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Code</th>
                  <th>Tier</th>
                  <th>Awarded</th>
                  <th>Earned</th>
                </tr>
              </thead>
              <tbody>
                {achievements.map((a) => (
                  <tr key={a.id}>
                    <td>{a.achievements?.title || 'Achievement'}</td>
                    <td>{a.achievements?.code || '—'}</td>
                    <td>{a.achievements?.tier || '—'}</td>
                    <td>{a.awarded_at ? new Date(a.awarded_at).toLocaleString() : '—'}</td>
                    <td>{a.earned_at ? new Date(a.earned_at).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );
    }

    if (activeTab === 'authors') {
      // Build quick lookup for author_stats
      const statsByAuthor = new Map(
        (authorStats || []).map((s) => [s.author_name, s])
      );

      return (
        <div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <div
              style={{
                padding: 8,
                borderRadius: 12,
                background: '#111b21',
                minWidth: 180,
              }}
            >
              <div style={{ color: '#8696a0', fontSize: 12 }}>Authors Liked</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{authorLikes.length}</div>
            </div>
            <div
              style={{
                padding: 8,
                borderRadius: 12,
                background: '#111b21',
                minWidth: 180,
              }}
            >
              <div style={{ color: '#8696a0', fontSize: 12 }}>Authors Followed</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{authorFollows.length}</div>
            </div>
            <div
              style={{
                padding: 8,
                borderRadius: 12,
                background: '#111b21',
                minWidth: 180,
              }}
            >
              <div style={{ color: '#8696a0', fontSize: 12 }}>Authors Rated</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>{authorRatings.length}</div>
            </div>
          </div>

          <h4 style={{ color: '#e9edef', marginBottom: 8 }}>Author Ratings</h4>
          {authorRatings.length === 0 ? (
            <div style={{ color: '#8696a0', marginBottom: 12 }}>No author ratings from this user.</div>
          ) : (
            <table className="table" style={{ marginBottom: 12 }}>
              <thead>
                <tr>
                  <th>Author</th>
                  <th>Rating</th>
                  <th>Given At</th>
                  <th>Author Avg Rating</th>
                  <th>Author Rating Count</th>
                </tr>
              </thead>
              <tbody>
                {authorRatings.map((r) => {
                  const s = statsByAuthor.get(r.author_name);
                  return (
                    <tr key={r.id}>
                      <td>{r.author_name}</td>
                      <td>{r.rating}</td>
                      <td>{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</td>
                      <td>{s?.average_rating ?? '—'}</td>
                      <td>{s?.rating_count ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          <h4 style={{ color: '#e9edef', marginBottom: 8 }}>Authors Followed</h4>
          {authorFollows.length === 0 ? (
            <div style={{ color: '#8696a0', marginBottom: 12 }}>No authors followed by this user.</div>
          ) : (
            <table className="table" style={{ marginBottom: 12 }}>
              <thead>
                <tr>
                  <th>Author</th>
                  <th>Followed At</th>
                  <th>Total Followers</th>
                </tr>
              </thead>
              <tbody>
                {authorFollows.map((f) => {
                  const s = statsByAuthor.get(f.author_name);
                  return (
                    <tr key={f.id}>
                      <td>{f.author_name}</td>
                      <td>{f.created_at ? new Date(f.created_at).toLocaleString() : '—'}</td>
                      <td>{s?.followers_count ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          <h4 style={{ color: '#e9edef', marginBottom: 8 }}>Authors Liked</h4>
          {authorLikes.length === 0 ? (
            <div style={{ color: '#8696a0' }}>No authors liked by this user.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Author</th>
                  <th>Liked At</th>
                  <th>Total Likes</th>
                  <th>Total Loves</th>
                </tr>
              </thead>
              <tbody>
                {authorLikes.map((l) => {
                  const s = statsByAuthor.get(l.author_name);
                  return (
                    <tr key={l.id}>
                      <td>{l.author_name}</td>
                      <td>{l.created_at ? new Date(l.created_at).toLocaleString() : '—'}</td>
                      <td>{s?.likes_count ?? '—'}</td>
                      <td>{s?.loves_count ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="panel">
      <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
        <button className="btn" onClick={() => navigate(-1)}>
          Back
        </button>
        <span>User Details</span>
      </div>

      {loading ? (
        <div style={{ color: '#8696a0', padding: 12 }}>Loading user details...</div>
      ) : !profile ? (
        <div style={{ color: '#8696a0', padding: 12 }}>User not found.</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              <div className="viewer-avatar" style={{ width: 48, height: 48, fontSize: 20, flexShrink: 0 }}>
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name || profile.email || 'User avatar'}
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  (profile.display_name || profile.email || '?').charAt(0).toUpperCase()
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {profile.display_name || '—'}
                  {profile.subscription_tier === 'premium' && (
                    <span style={{ color: '#2196F3', fontSize: 14, title: 'Premium Member' }}>
                      <FiCheck />
                    </span>
                  )}
                  {profile.subscription_tier === 'premium_pro' && (
                    <span style={{ color: '#FFD700', fontSize: 14, title: 'Premium Pro Member' }}>
                      <FiAward />
                    </span>
                  )}
                </div>
                <div style={{ color: '#8696a0', fontSize: 13 }}>{profile.email}</div>
                <div style={{ color: '#8696a0', fontSize: 12 }}>
                  Role: <strong>{profile.role || 'viewer'}</strong>
                  {profile.created_at && (
                    <>
                      {' '}
                      · Joined {new Date(profile.created_at).toLocaleDateString()}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className="btn"
                style={{
                  padding: '6px 14px',
                  fontSize: 12,
                  background: activeTab === tab.id ? '#202c33' : 'transparent',
                  borderColor: activeTab === tab.id ? '#23a76d' : 'rgba(134,150,160,0.3)',
                }}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {renderTabContent()}

          <VerificationTierModal
            isOpen={showVerificationModal}
            onClose={() => setShowVerificationModal(false)}
            userTier={profile?.subscription_tier || 'basic'}
            onSelectTier={(tier) => {
              // This will handle tier selection
              // In next phase: integrate payment processing
              setShowVerificationModal(false);
            }}
            isLoading={upgradeLoading}
          />
        </>
      )}
    </div>
  );
};

export default UserDetails;
