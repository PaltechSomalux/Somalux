import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FiTrendingUp, FiTarget, FiAward, FiCalendar, FiBook, FiBarChart2, FiSearch, FiChevronLeft, FiChevronRight, FiX, FiEye, FiDownload } from 'react-icons/fi';
import ReadingStats from './ReadingStats';
import GoalSetter from './GoalSetter';
import ActivityHeatmap from './ActivityHeatmap';
import AchievementsBadge from './AchievementsBadge';
import ReadingCharts from './ReadingCharts';
import { booksCache } from '../utils/cacheManager';
import './ReadingDashboard.css';
import SecureReader from '../SecureReader';

const ReadingDashboard = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [goals, setGoals] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [activity, setActivity] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, books, goals, achievements, insights
  const [allBooks, setAllBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const BOOKS_PER_PAGE = 8;
  const [readerBook, setReaderBook] = useState(null);
  const [showReader, setShowReader] = useState(false);
  const [readerUrl, setReaderUrl] = useState(null);

  const userId = userProfile?.id;

  // Fetch current user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (userId) {
      // Initial load
      fetchAllData();

      // Polling fallback for near-real-time updates
      const pollInterval = 15000; // 15s
      const poller = setInterval(() => {
        // Refresh lightweight pieces frequently
        fetchStats().catch(console.error);
        fetchActivity().catch(console.error);
        // goals/achievements are less frequently changing but still polled
        fetchGoals().catch(console.error);
        fetchAchievements().catch(console.error);
      }, pollInterval);

      // Try to subscribe to Supabase realtime changes for reading-related tables
      let channel = null;
      try {
        channel = supabase
          .channel('public:reading_dashboard')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'reading_sessions' }, (payload) => {
            console.log('Realtime: reading_sessions change', payload);
            // reading session changes => update stats and activity
            fetchStats().catch(console.error);
            fetchActivity().catch(console.error);
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'reading_goals' }, (payload) => {
            console.log('Realtime: reading_goals change', payload);
            fetchGoals().catch(console.error);
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'reading_achievements' }, (payload) => {
            console.log('Realtime: reading_achievements change', payload);
            fetchAchievements().catch(console.error);
          })
          .subscribe((status) => {
            console.log('Reading dashboard realtime subscription status:', status);
          });
      } catch (err) {
        console.warn('Realtime subscription failed, using polling fallback:', err);
      }

      return () => {
        if (poller) clearInterval(poller);
        if (channel) {
          try { supabase.removeChannel(channel); } catch (e) { console.warn('Failed to remove channel', e); }
        }
      };
    }
  }, [userId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchGoals(),
        fetchAchievements(),
        fetchActivity()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (forceRefresh = false) => {
    try {
      const response = await fetch(`http://localhost:5000/api/reading/stats/${userId}`);
      const data = await response.json();
      if (data.ok) {
        setStats(data.stats);
        console.log('✅ Reading stats loaded');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchGoals = async (maybeNewGoal) => {
    try {
      // If a new goal was just created, optimistically prepend it
      if (maybeNewGoal) {
        setGoals(prev => {
          // avoid duplicates
          const exists = prev.some(g => g.id === maybeNewGoal.id);
          if (exists) return prev;
          return [maybeNewGoal, ...prev];
        });
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await fetch(`http://localhost:5000/api/reading/goals/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await response.json();
      console.log('fetchGoals response:', data);
      if (data.ok) {
        setGoals(data.goals || []);
      } else {
        console.warn('fetchGoals returned not ok', data);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const fetchAchievements = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/reading/achievements/${userId}`);
      const data = await response.json();
      if (data.ok) {
        setAchievements(data.earnedAchievements);
        // Check for new achievements
        await checkNewAchievements();
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const checkNewAchievements = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/reading/achievements/check/${userId}`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.ok && data.newAchievements.length > 0) {
        // Show celebration for new achievements
        data.newAchievements.forEach(achievement => {
          showAchievementNotification(achievement);
        });
        fetchAchievements(); // Refresh
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const showAchievementNotification = (achievement) => {
    // You can use a toast library or custom notification
    alert(`🎉 New Achievement Unlocked: ${achievement.title}!`);
  };

  const fetchActivity = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/reading/activity/${userId}`);
      const data = await response.json();
      if (data.ok) {
        setActivity(data.activity);
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  };

  const fetchBooks = async (forceRefresh = false) => {
    try {
      setBooksLoading(true);
      
      // Try cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedBooks = booksCache.get('dashboard_books');
        if (cachedBooks) {
          console.log('📚 Loading dashboard books from cache...');
          setAllBooks(cachedBooks);
          setBooksLoading(false);
          // Continue fetching in background to update cache
          fetchBooks(true).catch(console.error);
          return;
        }
      }

      if (!userId) {
        setAllBooks([]);
        setBooksLoading(false);
        return;
      }

      // Fetch categories to map category_id -> name (genre)
      const { data: cats, error: catErr } = await supabase
        .from('categories')
        .select('id, name');

      if (catErr) console.warn('Failed to load categories for dashboard books', catErr);

      const catMap = new Map((cats || []).map(c => [c.id, c.name]));

      // Only books the user has started reading, ordered by most recent session
      const { data: books, error } = await supabase
        .from('reading_sessions')
        .select('book:books(id, title, author, cover_image_url, pages, category_id, created_at, views_count, downloads_count, file_url), ended_at, started_at')
        .eq('user_id', userId)
        .order('started_at', { ascending: false });

      if (error) throw error;

      const uniqueByBook = new Map();
      (books || []).forEach((row) => {
        const b = row.book;
        if (!b) return;
        if (!uniqueByBook.has(b.id)) {
          uniqueByBook.set(b.id, {
            ...b,
            last_started_at: row.started_at,
          });
        }
      });

      const booksList = Array.from(uniqueByBook.values());
      // Map category_id to genre name for UI
      const booksWithGenre = booksList.map(b => ({
        ...b,
        genre: catMap.get(b.category_id) || ''
      }));

      setAllBooks(booksWithGenre);
      // Cache the results (5 minutes TTL)
      booksCache.set('dashboard_books', booksWithGenre || [], 5 * 60 * 1000);
      console.log('✅ Dashboard books loaded and cached');
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setBooksLoading(false);
    }
  };

  // Search and pagination logic
  const filteredBooks = useMemo(() => {
    if (!searchTerm.trim()) return allBooks;
    
    const searchLower = searchTerm.toLowerCase();
    return allBooks.filter(book =>
      book.title?.toLowerCase().includes(searchLower) ||
      book.author?.toLowerCase().includes(searchLower) ||
      book.genre?.toLowerCase().includes(searchLower)
    );
  }, [allBooks, searchTerm]);

  const paginatedBooks = useMemo(() => {
    const startIndex = (currentPage - 1) * BOOKS_PER_PAGE;
    const endIndex = startIndex + BOOKS_PER_PAGE;
    return filteredBooks.slice(startIndex, endIndex);
  }, [filteredBooks, currentPage]);

  useEffect(() => {
    const newTotalPages = Math.ceil(filteredBooks.length / BOOKS_PER_PAGE);
    setTotalPages(newTotalPages);
    
    // Reset to page 1 if current page is out of bounds
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredBooks.length, currentPage]);

  const openOnlineReader = async (book) => {
    if (!book || !book.id) return;

    try {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        await fetch('http://localhost:5000/api/reading/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            userId,
            bookId: book.id,
            pagesRead: 0,
            progressPercent: 0
          })
        });
      } catch (e) {
        console.warn('ReadingDashboard: failed to record reading session', e);
      }

      if (book.file_path) {
        try {
          const { data: publicData } = supabase
            .storage
            .from('elib-books')
            .getPublicUrl(book.file_path);
          const url = publicData?.publicUrl;
          if (url) {
            setReaderBook(book);
            setReaderUrl(url);
            setShowReader(true);
            return;
          }
        } catch (e) {
          console.warn('ReadingDashboard: failed to resolve public URL for book', e);
        }
      }

      alert('Unable to open this book in the inline reader.');
    } catch (err) {
      console.error('ReadingDashboard: openOnlineReader failed', err);
      alert('Something went wrong while opening the reader.');
    }
  };

  // Fetch books when switching to books tab
  useEffect(() => {
    if (activeTab === 'books' && allBooks.length === 0) {
      fetchBooks();
    }
  }, [activeTab]);

  // Reset search and pagination when switching tabs
  useEffect(() => {
    if (activeTab !== 'books') {
      setSearchTerm('');
      setCurrentPage(1);
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="reading-dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your reading journey...</p>
      </div>
    );
  }

  const currentYearGoal = goals.find(g => g.goal_type === 'yearly' && g.year === new Date().getFullYear());
  const currentMonthGoal = goals.find(g => 
    g.goal_type === 'monthly' && 
    g.year === new Date().getFullYear() && 
    g.month === new Date().getMonth() + 1
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of books section
    const booksSection = document.getElementById('books-section');
    if (booksSection) {
      booksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleBookClick = (book) => {
    openOnlineReader(book);
  };

  return (
    <div className="reading-dashboard">
      {/* Header */}
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <button className="back-link" onClick={() => navigate('/BookManagement')}>
          <FiChevronLeft />
          <span>Back to books</span>
        </button>
        <div>
          <h1>📊 My Reading Journey</h1>
          <p>Track your progress, set goals, and earn achievements</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FiBarChart2 /> Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'books' ? 'active' : ''}`}
          onClick={() => setActiveTab('books')}
        >
          <FiBook /> Books
        </button>
        <button 
          className={`tab-btn ${activeTab === 'goals' ? 'active' : ''}`}
          onClick={() => setActiveTab('goals')}
        >
          <FiTarget /> Goals
        </button>
        <button 
          className={`tab-btn ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          <FiAward /> Achievements
        </button>
        <button 
          className={`tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          <FiTrendingUp /> Insights
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          {/* Quick Stats */}
          <ReadingStats stats={stats} />

          {/* Current Goals Preview */}
          <div className="goals-preview-section">
            <h2>Current Goals</h2>
            <div className="goals-preview-grid">
              {currentYearGoal && (
                <div className="goal-preview-card">
                  <div className="goal-header">
                    <FiTarget size={24} color="#00a884" />
                    <span>Yearly Goal {currentYearGoal.year}</span>
                  </div>
                  <div className="goal-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${Math.min((currentYearGoal.current_progress / currentYearGoal.target_books) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">
                      {currentYearGoal.current_progress} / {currentYearGoal.target_books} books
                    </span>
                  </div>
                </div>
              )}

              {currentMonthGoal && (
                <div className="goal-preview-card">
                  <div className="goal-header">
                    <FiCalendar size={24} color="#6366f1" />
                    <span>This Month</span>
                  </div>
                  <div className="goal-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${Math.min((currentMonthGoal.current_progress / currentMonthGoal.target_books) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">
                      {currentMonthGoal.current_progress} / {currentMonthGoal.target_books} books
                    </span>
                  </div>
                </div>
              )}

              {!currentYearGoal && !currentMonthGoal && (
                <div className="no-goals-card">
                  <FiTarget size={40} color="#8696a0" />
                  <p>No active goals. Set one to get started!</p>
                  <button className="btn-primary" onClick={() => setActiveTab('goals')}>
                    Create Goal
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Activity Heatmap */}
          <div className="heatmap-section">
            <h2>Reading Activity</h2>
            <ActivityHeatmap activity={activity} />
          </div>

          {/* Recent Achievements */}
          {achievements.length > 0 && (
            <div className="recent-achievements-section">
              <h2>Recent Achievements</h2>
              <div className="achievements-preview">
                {achievements.slice(0, 6).map(achievement => (
                  <div key={achievement.id} className="achievement-badge-mini">
                    <span className="achievement-icon">{achievement.achievements.icon}</span>
                    <span className="achievement-title">{achievement.achievements.title}</span>
                  </div>
                ))}
              </div>
              <button className="btn-secondary" onClick={() => setActiveTab('achievements')}>
                View All Achievements
              </button>
            </div>
          )}
        </div>
      )}

      {/* Books Tab */}
      {activeTab === 'books' && (
        <div className="tab-content" id="books-section">
          {/* Search Bar */}
          <div className="books-search-section">
            <div className="search-container">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search books by title, author, or genre..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  className="clear-search-btn"
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                >
                  <FiX size={16} />
                </button>
              )}
            </div>
            
            {/* Results Count */}
            <div className="search-results">
              {filteredBooks.length === allBooks.length 
                ? `${allBooks.length} books available`
                : `${filteredBooks.length} of ${allBooks.length} books found`
              }
            </div>
          </div>

          {/* Books Grid */}
          {booksLoading && allBooks.length === 0 ? (
            <div className="books-loading">
              <div className="spinner"></div>
              <p>Loading books...</p>
            </div>
          ) : paginatedBooks.length === 0 ? (
            <div className="no-books-found">
              <FiBook size={48} color="#8696a0" />
              <h3>No books found</h3>
              <p>{searchTerm ? 'Try adjusting your search terms' : 'No books available in the library'}</p>
              {searchTerm && (
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="books-grid">
                {paginatedBooks.map((book) => (
                  <div 
                    key={book.id} 
                    className="book-card"
                    onClick={() => handleBookClick(book)}
                  >
                    <div className="book-cover">
                      {book.cover_url ? (
                        <img 
                          src={book.cover_url} 
                          alt={book.title}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="book-cover-placeholder">
                        <FiBook size={32} color="#8696a0" />
                      </div>
                    </div>
                    
                    <div className="book-info">
                      <h3 className="book-title">{book.title}</h3>
                      <p className="book-author">by {book.author}</p>
                      
                      <div className="book-meta">
                        {book.genre && (
                          <span className="book-genre">{book.genre}</span>
                        )}
                        {book.pages && (
                          <span className="book-pages">{book.pages} pages</span>
                        )}
                      </div>
                      
                      <div className="book-stats">
                        <span className="book-stat">
                          <FiEye size={14} /> {book.views || 0}
                        </span>
                        <span className="book-stat">
                          <FiDownload size={14} /> {book.downloads || 0}
                        </span>
                      </div>
                      {book.progress_percent >= 100 && (
                        <span className="book-completed-label">Completed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    <FiChevronLeft size={16} />
                    Previous
                  </button>
                  
                  <div className="pagination-numbers">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    className="pagination-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Next
                    <FiChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {showReader && readerBook && readerUrl && (
        <SecureReader
          src={readerUrl}
          title={readerBook.title}
          author={readerBook.author}
          bookId={readerBook.id}
          pages={readerBook.pages || 0}
          userId={userId}
          onClose={() => setShowReader(false)}
        />
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="tab-content">
          <GoalSetter 
            userId={userId}
            goals={goals}
            onGoalCreated={fetchGoals}
            onGoalUpdated={fetchGoals}
          />
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="tab-content">
          <AchievementsBadge 
            userId={userId}
            achievements={achievements}
          />
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="tab-content">
          <ReadingCharts 
            stats={stats}
            userId={userId}
          />
        </div>
      )}
    </div>
  );
};

export default ReadingDashboard;
