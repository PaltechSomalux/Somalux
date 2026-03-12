// src/BookPanel.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Download } from './Download';
import { CommentsSection } from '../../KissMe/Components/CommentsSection';
import { AuthModal } from './AuthModal';
import { RatingModal } from './RatingModal';
import { SubscriptionModal } from './SubscriptionModal';
import {
  FaHeart,
  FaRegHeart,
} from 'react-icons/fa';
import {
  FiSearch,
  FiBook,
  FiStar,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiTrendingUp,
  FiClock,
  FiDownload,
  FiShare2,
  FiCopy,
  FiTwitter,
  FiFacebook,
  FiLinkedin,
  FiMail,
  FiBookmark,
  FiEye,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import './BookPanel.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { booksCache, categoriesCache, statsCache } from './utils/cacheManager';
 

const ReactionButtonsBKP = ({
  itemId,
  loves,
  onLove,
  isLoved
}) => {
  return (
    <button
      className={`love-buttonBKP ${isLoved ? 'activeBKP' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onLove(itemId);
      }}
      title="Love this book"
    >
      {isLoved ? <FaHeart color="red" size={14} /> : <FaRegHeart size={14} />}
      <span className="countBKP">{loves || 0}</span>
    </button>
  );
};

// Helper component to ping reading session periodically
const ReaderSessionPinger = ({ user, book }) => {
  useEffect(() => {
    let timer;
    const tick = async () => {
      if (!user || !book) return;
      try {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        await fetch('http://localhost:5000/api/reading/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ userId: user.id, bookId: book.id, pagesRead: 1, progressPercent: 1 })
        });
      } catch (e) {
        console.warn('reading session ping failed', e);
      }
    };
    // Immediately ping once, then every 30s
    tick();
    timer = setInterval(tick, 30000);
    return () => clearInterval(timer);
  }, [user?.id, book?.id]);
  return null;
};

export const BookPanel = ({ demoMode = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [categoryFilterName, setCategoryFilterName] = useState(null);
  const [books, setBooks] = useState([]);
  const [displayedBooks, setDisplayedBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryFilterId, setCategoryFilterId] = useState(null);
  const [totalBooks, setTotalBooks] = useState(0);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageCacheStatus, setPageCacheStatus] = useState({}); // page -> 'cached'|'remote'|'loading'
  const [hasMore, setHasMore] = useState(true);
  const BOOKS_PER_PAGE = 20;
  const [filteredByCategory, setFilteredByCategory] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [showWishlist, setShowWishlist] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState(demoMode);
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState('action');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [userRating, setUserRating] = useState(null);
  const [bookRatings, setBookRatings] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showReader, setShowReader] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [focusedBookId, setFocusedBookId] = useState(null);
  const [focusedBookLoading, setFocusedBookLoading] = useState(false);

  // Simple network error modal state
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [networkRetryPage, setNetworkRetryPage] = useState(1);

  const CACHE_TTL_MS = 5 * 60 * 1000;

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * Retrieves a cached page of books from localStorage.
 * @param {number} page The page number to retrieve.
 * @returns {null|object[]} The cached page of books, or null if it does not exist or has expired.
 */
/*******  4b59b5d0-5dd5-4852-b3b1-1400d5e8e97c  *******/
  const getCachedPage = (page) => {
    try {
      const raw = localStorage.getItem(`books_page_${page}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.data || !parsed.ts) return null;
      if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
      return parsed.data;
    } catch {
      return null;
    }
  };

  const setCachedPage = (page, data) => {
    try {
      localStorage.setItem(`books_page_${page}` , JSON.stringify({ ts: Date.now(), data }));
      const pages = JSON.parse(localStorage.getItem('books_pages_loaded') || '[]');
      if (!pages.includes(page)) {
        const next = [...pages, page].sort((a,b) => a-b);
        localStorage.setItem('books_pages_loaded', JSON.stringify(next));
      }
    } catch {}
    // mark page cached
    setPageCacheStatus(prev => ({ ...prev, [page]: 'cached' }));
  };

  const getSearchCachedPage = (term, page) => {
    try {
      const key = `search_cache_${term.toLowerCase()}_page_${page}`;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.data || !parsed.ts) return null;
      if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
      return parsed.data;
    } catch { return null; }
  };

  const setSearchCachedPage = (term, page, data) => {
    try {
      const key = `search_cache_${term.toLowerCase()}_page_${page}`;
      localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
      setPageCacheStatus(prev => ({ ...prev, [page]: 'cached' }));
    } catch {}
  };

  const clearBookCaches = () => {
    try {
      booksCache.clear();
    } catch (err) {
      console.warn('Failed to clear booksCache', err);
    }
    try {
      categoriesCache.clear();
    } catch (err) {
      console.warn('Failed to clear categoriesCache', err);
    }
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key === 'books_pages_loaded' || key.startsWith('books_page_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (err) {
      console.warn('Failed to clear page caches from localStorage', err);
    }
    try {
      setPageCacheStatus({});
    } catch {}
  };

  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('bookWishlist');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to parse wishlist from localStorage', error);
      return [];
    }
  });

  const [bookLoves, setBookLoves] = useState({});

  const [bookReactions, setBookReactions] = useState({});

  const [mediaComments, setMediaComments] = useState({});

  const [commentLikes, setCommentLikes] = useState({});

  // Map a Supabase row to current UI shape
  const mapRowToUi = (row, catMap, trendingThreshold = 50) => {
    const views = row.views || 0;
    const downloads = row.downloads || 0;
    const score = views + 2 * downloads;
    const ratingCount = row.rating_count || 0;
    
    // Improved "New" badge logic
    const isNew = (() => {
      const created = row.created_at ? new Date(row.created_at) : null;
      if (!created) return false;
      
      const daysSinceCreation = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
      
      // Not new if older than 14 days
      if (daysSinceCreation > 14) return false;
      
      // Within 7 days - always show as new
      if (daysSinceCreation <= 7) return true;
      
      // Between 7-14 days - only show as new if not well-established
      // Consider a book "established" if it has:
      // - More than 50 views OR
      // - More than 10 downloads OR
      // - More than 5 ratings
      const isEstablished = views > 50 || downloads > 10 || ratingCount > 5;
      
      return !isEstablished;
    })();
    
    const isTrending = score >= trendingThreshold;
    // Use actual rating from database (0 for new books without ratings)
    const rating = row.average_rating !== null && row.average_rating !== undefined ? row.average_rating : 0;
    const filePath = row.file_path || '';
    const ext = filePath.split('.').pop()?.toLowerCase() || 'pdf';
    const publicUrl = filePath ? supabase.storage.from('elib-books').getPublicUrl(filePath).data.publicUrl : null;
    return {
      id: row.id,
      categoryId: row.category_id ? String(row.category_id) : null,
      title: row.title || '',
      author: row.author || '',
      description: row.description || '',
      genre: catMap.get(row.category_id ? String(row.category_id) : row.category_id) || 'Uncategorized',
      year: row.year || null,
      language: row.language || 'Unknown',
      isbn: row.isbn || '',
      bookImage: row.cover_url || 'https://via.placeholder.com/300x420?text=No+Cover',
      rating,
      ratingCount,
      views,
      downloads,
      newRelease: isNew,
      trending: isTrending,
      downloadUrl: publicUrl || undefined,
      fileFormat: ext,
      pages: row.pages || 0,
      publisher: row.publisher || 'N/A',
    };
  };

  const fetchAll = async (forceRefresh = false, page = 1) => {
    try {
      // Try to load from cache first for page 1
      if (!forceRefresh && page === 1) {
        const cachedBooks = booksCache.get('all_books_page_1') || getCachedPage(1);
        const cachedCategories = categoriesCache.get('categories');
        const cachedTotal = booksCache.get('total_books_count');

        if (cachedBooks && cachedCategories && cachedTotal) {
          console.log('📦 Loading books from cache...');
          setBooks(cachedBooks);
          setTotalBooks(cachedTotal);
          setHasMore(cachedBooks.length < cachedTotal);
          setLoading(false);

          // Load additional cached pages (2..n)
          try {
            const pages = JSON.parse(localStorage.getItem('books_pages_loaded') || '[]');
            if (Array.isArray(pages) && pages.length > 1) {
              let appended = cachedBooks;
              for (const p of pages) {
                if (p === 1) continue;
                const pg = getCachedPage(p);
                if (pg && pg.length) {
                  appended = [...appended, ...pg];
                }
              }
              setBooks(appended);
              setCurrentPage(Math.max(...pages));
              setHasMore(appended.length < cachedTotal);
            }
          } catch {}

          // Background refresh for page 1
          fetchAll(true, 1).catch(console.error);
          return;
        }
      }

      setLoading(page === 1);

      // Get total count first (lightweight query)
      const { count, error: countErr } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true });

      if (countErr) throw countErr;
      setTotalBooks(count || 0);

      // Paginated fetch with limit
      const from = (page - 1) * BOOKS_PER_PAGE;
      const to = from + BOOKS_PER_PAGE - 1;
      const [{ data: cats, error: catErr }, { data: rows, error: bookErr }] = await Promise.all([
        supabase.from('categories').select('id, name'),
        // Include related category name via the foreign key relationship so we can fallback to it
        supabase
          .from('books')
          .select('id, title, author, description, category_id, categories(id,name), year, language, isbn, cover_url, file_path, created_at, views, downloads, pages, publisher, average_rating, rating_count')
          .order('created_at', { ascending: false })
          .range(from, to)
      ]);

      if (catErr) {
        console.error('Failed to fetch categories:', catErr);
        throw new Error(`Categories error: ${catErr.message}`);
      }
      if (bookErr) {
        console.error('Failed to fetch books:', bookErr);
        throw new Error(`Books error: ${bookErr.message}. Make sure the books table has all required columns (author, category_id, views, downloads, cover_url, file_path, etc.)`);
      }

      const catMap = new Map((cats || []).map(c => [c.id, c.name]));

      // Calculate dynamic trending threshold (top 10% of books by engagement)
      const scores = (rows || []).map(r => (r.views || 0) + 2 * (r.downloads || 0));
      scores.sort((a, b) => b - a);
      // Only top 10% are trending, minimum score of 50 to avoid marking low-activity books
      const trendingThreshold = scores.length > 10 ? Math.max(scores[Math.floor(scores.length * 0.1)], 50) : 100;

      const mapped = (rows || []).map(r => mapRowToUi(r, catMap, trendingThreshold));
      
      if (page === 1) {
        setBooks(mapped);
      } else {
        setBooks(prev => [...prev, ...mapped]);
      }
      
      // Robust hasMore: compare how many we have vs total count
      const loadedSoFar = (page - 1) * BOOKS_PER_PAGE + rows.length;
      setHasMore((count || 0) > loadedSoFar);

      // Track current page when a page finishes loading successfully
      setCurrentPage(page);

      // Cache the results (5 minutes TTL) - only cache page 1
      if (page === 1) {
        booksCache.set('all_books_page_1', mapped, 5 * 60 * 1000);
        booksCache.set('total_books_count', count, 5 * 60 * 1000);
      }
      // Persist every page to localStorage for instant reloads
      setCachedPage(page, mapped);
      categoriesCache.set('categories', cats, 10 * 60 * 1000);

      console.log(`✅ Books loaded and cached (Page ${page}, ${rows.length} books, Total: ${count})`);
    } catch (e) {
      console.error('Failed to fetch books:', e);

      // Provide specific error messages based on error type
      let errorMessage = 'Error loading books:\n\n';

      if (e.message && e.message.includes('Failed to fetch')) {
        errorMessage += '❌ Network Error: Cannot connect to Supabase.\n\n';
        errorMessage += 'Possible causes:\n';
        errorMessage += '1. Supabase project is not accessible\n';
        errorMessage += '2. Check your internet connection\n';
        errorMessage += '3. Verify SUPABASE_URL in .env file\n';
        errorMessage += '4. Check if Supabase project is paused\n\n';
        errorMessage += 'Supabase URL: ' + (process.env.REACT_APP_SUPABASE_URL || 'Using fallback URL');
      } else if (e.message && e.message.includes('JWT')) {
        errorMessage += '❌ Authentication Error: Invalid Supabase key.\n\n';
        errorMessage += 'Please check REACT_APP_SUPABASE_ANON_KEY in your .env file.';
      } else if (e.message && e.message.includes('column')) {
        errorMessage += '❌ Database Schema Error:\n\n';
        errorMessage += e.message + '\n\n';
        errorMessage += 'Please run the database migration scripts.';
      } else {
        errorMessage += e.message || 'Unknown error occurred';
      }

      console.error('📊 Error Details:', {
        message: e.message,
        type: e.name,
        stack: e.stack,
        supabaseUrl: process.env.REACT_APP_SUPABASE_URL || 'fallback URL'
      });

      // Show a simple, user-friendly network modal instead of a long alert
      try {
        setNetworkRetryPage(page || 1);
        setShowNetworkModal(true);
      } catch (modalErr) {
        // Fallback to original alert if modal state fails for any reason
        alert('Please check your network and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Auth state listener - optimized to prevent flickering
  useEffect(() => {
    let userCache = null;

    const fetchUserWithRole = async (session) => {
      if (!session?.user) {
        setUser(null);
        setLoadingUser(false);
        return;
      }

      try {
        setLoadingUser(true);
        // Fetch the user's role from the profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;

        // Set user with the role information and cache it
        const userData = {
          ...session.user,
          role: profile?.role || 'viewer'
        };
        userCache = userData;
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user role:', error);
        const userData = { ...session.user, role: 'viewer' };
        userCache = userData;
        setUser(userData);
      } finally {
        setLoadingUser(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchUserWithRole(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUserWithRole(session);
    });

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, []);

  // Fetch personalized recommendations - memoized to prevent flickering
  const fetchRecommendations = useCallback(async () => {
    if (!user || books.length === 0) return;

    try {
      const { data, error } = await supabase
        .rpc('get_user_recommendations', {
          p_user_id: user.id,
          p_limit: 6
        });

      if (error) {
        console.warn('Recommendations function error (this is optional):', error);
        // Fallback: show popular books that user hasn't interacted with
        const fallbackRecs = books
          .filter(b => !wishlist.includes(b.id))
          .sort((a, b) => {
            const scoreA = (a.views || 0) + 2 * (a.downloads || 0) + (a.rating || 0) * 10;
            const scoreB = (b.views || 0) + 2 * (b.downloads || 0) + (b.rating || 0) * 10;
            return scoreB - scoreA;
          })
          .slice(0, 6)
          .map(b => ({ ...b, reason: 'Popular choice' }));

        setRecommendations(fallbackRecs);
        return;
      }

      if (data && data.length > 0) {
        // Map recommendation IDs to actual books
        const recommendedBooks = data
          .map(rec => {
            const book = books.find(b => b.id === rec.book_id);
            if (book) {
              return { ...book, reason: rec.reason, score: rec.recommendation_score };
            }
            return null;
          })
          .filter(Boolean);

        setRecommendations(recommendedBooks);
      } else {
        // Fallback if no recommendations returned
        const fallbackRecs = books
          .filter(b => !wishlist.includes(b.id))
          .sort((a, b) => {
            const scoreA = (a.views || 0) + 2 * (a.downloads || 0) + (a.rating || 0) * 10;
            const scoreB = (b.views || 0) + 2 * (b.downloads || 0) + (b.rating || 0) * 10;
            return scoreB - scoreA;
          })
          .slice(0, 6)
          .map(b => ({ ...b, reason: 'Popular choice' }));

        setRecommendations(fallbackRecs);
      }
    } catch (error) {
      console.warn('Failed to fetch recommendations, using fallback:', error);
      // Fallback: show popular books
      const fallbackRecs = books
        .filter(b => !wishlist.includes(b.id))
        .sort((a, b) => {
          const scoreA = (a.views || 0) + 2 * (a.downloads || 0) + (a.rating || 0) * 10;
          const scoreB = (b.views || 0) + 2 * (a.downloads || 0) + (b.rating || 0) * 10;
          return scoreB - scoreA;
        })
        .slice(0, 6)
        .map(b => ({ ...b, reason: 'Popular choice' }));

      setRecommendations(fallbackRecs);
    }
  }, [user, books, wishlist]);

  const fetchSubscription = useCallback(async (currentUser) => {
    if (!currentUser?.id) {
      setSubscription(null);
      return;
    }

    try {
      setCheckingSubscription(true);
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('product', 'books')
        .eq('status', 'active')
        .order('end_at', { ascending: false })
        .limit(1);

      if (error) {
        console.warn('Failed to load subscription:', error);
        setSubscription(null);
        return;
      }

      const row = data && data.length > 0 ? data[0] : null;
      if (row && row.end_at && new Date(row.end_at) > new Date()) {
        setSubscription(row);
      } else {
        setSubscription(null);
      }
    } catch (err) {
      console.warn('Subscription check failed:', err);
      setSubscription(null);
    } finally {
      setCheckingSubscription(false);
    }
  }, []);

  // Load likes and comments from Supabase
  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load user's likes
      const { data: likes } = await supabase
        .from('book_likes')
        .select('book_id')
        .eq('user_id', user.id);

      if (likes) {
        const reactions = {};
        likes.forEach(like => {
          reactions[like.book_id] = { loved: true };
        });
        setBookReactions(reactions);
      }

      // Load comments for all books
      const { data: comments } = await supabase
        .from('book_comments')
        .select('*')
        .order('created_at', { ascending: false });

      // Load all replies
      const { data: replies } = await supabase
        .from('book_replies')
        .select('*')
        .order('created_at', { ascending: true });

      if (comments) {
        const commentsByBook = {};

        // Group replies by comment_id
        const repliesByComment = {};
        if (replies) {
          replies.forEach(reply => {
            if (!repliesByComment[reply.comment_id]) {
              repliesByComment[reply.comment_id] = [];
            }
            repliesByComment[reply.comment_id].push({
              id: reply.id,
              user: reply.user_email || 'Anonymous',
              text: reply.text,
              timestamp: reply.created_at,
              liked: false,
            });
          });
        }

        comments.forEach(comment => {
          if (!commentsByBook[comment.book_id]) {
            commentsByBook[comment.book_id] = [];
          }
          commentsByBook[comment.book_id].push({
            id: comment.id,
            user: comment.user_email || 'Anonymous',
            text: comment.text,
            timestamp: comment.created_at,
            liked: false,
            replies: repliesByComment[comment.id] || [],
            likes: 0,
          });
        });
        setMediaComments(commentsByBook);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  // Load like counts for all books
  const loadLikeCounts = async () => {
    try {
      const { data: likeCounts } = await supabase
        .from('book_likes')
        .select('book_id');

      if (likeCounts) {
        const counts = {};
        likeCounts.forEach(like => {
          counts[like.book_id] = (counts[like.book_id] || 0) + 1;
        });
        setBookLoves(counts);
      }
    } catch (error) {
      console.error('Failed to load like counts:', error);
    }
  };

  useEffect(() => {
    loadLikeCounts();
  }, []);

  // Initial load + realtime subscription with polling fallback
  useEffect(() => {
    let poller = null;
    let channel = null;
    fetchAll(); // Load from cache or fetch fresh

    try {
      channel = supabase
        .channel('public:books')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, (payload) => {
          console.log('📡 Real-time update: books table changed', payload.eventType);
          // Invalidate cache and force refresh
          booksCache.remove('all_books_page_1');
          booksCache.remove('total_books_count');
          setCurrentPage(1);
          fetchAll(true, 1);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'book_likes' }, () => {
          console.log('📡 Real-time update: book likes changed');
          loadLikeCounts();
          if (user) loadUserData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'book_comments' }, () => {
          console.log('📡 Real-time update: comments changed');
          if (user) loadUserData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'book_replies' }, () => {
          console.log('📡 Real-time update: replies changed');
          if (user) loadUserData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'book_ratings' }, () => {
          console.log('📡 Real-time update: ratings changed');
          booksCache.remove('all_books_page_1');
          setCurrentPage(1);
          fetchAll(true, 1);
        })
        .subscribe((status) => {
          console.log('📡 Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Real-time subscription active');
            if (poller) { clearInterval(poller); poller = null; }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('⚠️ Real-time subscription failed, using polling');
            if (!poller) poller = setInterval(() => fetchAll(true, 1), 30000); // Poll every 30s
          }
        });
    } catch (err) {
      console.warn('Realtime unavailable, falling back to polling.', err);
      if (!poller) poller = setInterval(() => fetchAll(true, 1), 30000);
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
      if (poller) clearInterval(poller);
    };
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem('bookWishlist', JSON.stringify(wishlist));
    } catch (error) {
      console.error('Failed to save wishlist to localStorage', error);
    }
  }, [wishlist]);

  // Fetch recommendations when user is loaded
  useEffect(() => {
    if (user && !loadingUser) {
      loadUserData();
      fetchSubscription(user);
      if (books.length > 0) {
        fetchRecommendations();
      }
    }
  }, [user, loadingUser, books.length, fetchRecommendations, fetchSubscription]);

  // Fetch recommendations when books are loaded
  useEffect(() => {
    if (user && books.length > 0 && recommendations.length === 0) {
      fetchRecommendations();
    }
  }, [books.length, user, recommendations.length, fetchRecommendations]);

  // Background prefetch: after first page loads, prefetch next pages to make Show More instant
  useEffect(() => {
    if (loading) return;
    if (!hasMore) return;
    // Prefetch up to first 3 pages total, without spamming network
    const pagesLoaded = Math.ceil(books.length / BOOKS_PER_PAGE) || 0;
    const targetPages = Math.min(3, Math.ceil((totalBooks || 0) / BOOKS_PER_PAGE));
    const fetchNext = async () => {
      for (let p = pagesLoaded + 1; p <= targetPages; p++) {
        // Skip if this page is already cached in localStorage
        if (getCachedPage(p)) continue;
        await fetchAll(false, p);
        // If no longer more pages, stop
        if (!hasMore) break;
      }
    };
    fetchNext();
  }, [loading, books.length, hasMore, totalBooks]);

  // Disable initial animations until after first mount to prevent flicker
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  // Read query params for category filtering and single-book deep links (bookmarkable link)
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search || '');
      const cid = params.get('category');
      const cname = params.get('categoryName');
      const bid = params.get('book');
      console.log('BookPanel: parsed query params', { cid, cname, bid });
      if (cid) {
        setCategoryFilterId(cid);
        setCategoryFilterName(cname || null);
        setCurrentPage(1);
        setWelcomeMessage(false);
      }
      if (bid) {
        // For a direct book link, clear any previous filters/search so we don't hide the book
        setFocusedBookId(bid);
        setCategoryFilterId(null);
        setCategoryFilterName(null);
        setFilteredByCategory(null);
        setSearchTerm('');
        setActiveFilter('all');
        setCurrentPage(1);
        setWelcomeMessage(false);
      }
    } catch (err) {
      // ignore
    }
  }, [location.search]);

  // When a focused book id is provided via query param, ensure that book exists in local state
  useEffect(() => {
    if (!focusedBookId) return;

    // If we already have this book loaded, no need to fetch
    const alreadyLoaded = books.some(b => String(b.id) === String(focusedBookId));
    if (alreadyLoaded) {
      setFocusedBookLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        setFocusedBookLoading(true);
        // Fetch the single book row by id
        const { data: row, error } = await supabase
          .from('books')
          .select('id, title, author, description, category_id, categories(id,name), year, language, isbn, cover_url, file_path, created_at, views, downloads, pages, publisher, average_rating, rating_count')
          .eq('id', focusedBookId)
          .maybeSingle();

        if (error) {
          console.warn('BookPanel: failed to fetch focused book by id', focusedBookId, error);
          return;
        }
        if (!row) {
          console.warn('BookPanel: no book found for id', focusedBookId);
          return;
        }

        // Fetch categories to build catMap for mapRowToUi
        const { data: cats } = await supabase.from('categories').select('id,name');
        const catMap = new Map((cats || []).map(c => [c.id, c.name]));
        const mapped = mapRowToUi(row, catMap, 50);

        if (!mounted) return;

        // Merge into books state if not present
        setBooks(prev => {
          const exists = (prev || []).some(b => String(b.id) === String(mapped.id));
          if (exists) return prev;
          return [mapped, ...(prev || [])];
        });
      } catch (err) {
        console.error('BookPanel: error ensuring focused book is loaded', err);
      } finally {
        if (mounted) setFocusedBookLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [focusedBookId, books]);

  // When a category filter id is set, fetch matching books server-side so we can
  // show all books for that category even if the current paginated pages don't include them.
  useEffect(() => {
    if (!categoryFilterId) {
      setFilteredByCategory(null);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        // Fetch a reasonable number of matching books (up to 1000)
        const { data: rows, error } = await supabase
          .from('books')
          .select('id, title, author, description, category_id, categories(id,name), year, language, isbn, cover_url, file_path, created_at, views, downloads, pages, publisher, average_rating, rating_count')
          .eq('category_id', categoryFilterId)
          .order('created_at', { ascending: false })
          .limit(1000);

        if (error) {
          console.warn('Category-specific fetch returned error:', error);
          if (mounted) setFilteredByCategory(null);
          return;
        }

        const { data: cats } = await supabase.from('categories').select('id,name');
        const catMap = new Map((cats || []).map(c => [c.id, c.name]));
        const mapped = (rows || []).map(r => mapRowToUi(r, catMap, 50));
        if (mounted) {
          setFilteredByCategory(mapped);
          console.log('BookPanel: fetched category-specific books', { categoryFilterId, count: mapped.length });
        }
      } catch (err) {
        console.error('Failed to fetch books for category filter:', err);
        if (mounted) setFilteredByCategory(null);
      }
    })();

    return () => { mounted = false; };
  }, [categoryFilterId]);

  const filteredBooks = useMemo(() => {
    // If we have a server-side fetched set for the active category, use it as the source
    const source = filteredByCategory !== null ? filteredByCategory : books;
    let result = [...source];

    // If a focused book id was provided (e.g. via ?book= in the URL), only show that book
    if (focusedBookId) {
      result = result.filter(book => String(book.id) === String(focusedBookId));
    }

    // Apply category filter if provided via router state
    if (categoryFilterId !== null && categoryFilterId !== undefined) {
      result = result.filter(book => String(book.categoryId) === String(categoryFilterId));
    }

    if (searchTerm) {
      result = result.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.genre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (activeFilter === 'trending') {
      result = result.filter(book => book.trending);
    } else if (activeFilter === 'new') {
      result = result.filter(book => book.newRelease);
    } else if (activeFilter === 'wishlist') {
      result = result.filter(book => wishlist.includes(book.id));
    }

    if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'author') {
      result.sort((a, b) => a.author.localeCompare(b.author));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'views') {
      result.sort((a, b) => b.views - a.views);
    } else if (sortBy === 'downloads') {
      result.sort((a, b) => b.downloads - a.downloads);
    } else if (sortBy === 'year') {
      result.sort((a, b) => b.year - a.year);
    }

    // Debugging: if a category filter is active, log a sample of book.categoryId values and the filtered size
    try {
      if (categoryFilterId) {
        const sample = (source || []).slice(0, 6).map(b => ({ id: b.id, categoryId: b.categoryId, genre: b.genre }));
        const uniqueIds = Array.from(new Set((source || []).map(b => String(b.categoryId)))).filter(x => x && x !== 'undefined' && x !== 'null');
        const matchesExact = (source || []).filter(b => String(b.categoryId) === String(categoryFilterId)).length;
        const matchesNormalized = (source || []).filter(b => (String(b.categoryId) || '').trim().toLowerCase() === String(categoryFilterId).trim().toLowerCase()).length;
        const matchesByName = categoryFilterName ? (source || []).filter(b => (b.genre || '').toLowerCase().includes(String(categoryFilterName).toLowerCase())).length : 0;
        console.log('BookPanel filter debug', {
          categoryFilterId,
          categoryFilterName,
          totalBooksLoaded: source.length,
          uniqueCategoryIds: uniqueIds.slice(0, 12),
          matchesExact,
          matchesNormalized,
          matchesByName,
          sample: JSON.parse(JSON.stringify(sample)),
          filteredCount: result.length
        });

        if (matchesExact === 0 && matchesByName > 0) {
          console.warn('BookPanel: No books matched by category id — however some match by category name. Consider passing categoryName as a fallback or normalizing category ids.');
        }
      }
    } catch (e) {}

    return result;
  }, [books, searchTerm, activeFilter, sortBy, wishlist, categoryFilterId, focusedBookId]);

  useEffect(() => {
    // Show the current page slice
    const start = (currentPage - 1) * BOOKS_PER_PAGE;
    setDisplayedBooks(filteredBooks.slice(start, start + BOOKS_PER_PAGE));
  }, [filteredBooks, currentPage]);

  // Server-side search fetch (paginated) to provide accurate results when searching
  const fetchSearch = async (term, page = 1) => {
    try {
      setPageLoading(page !== 1);
      setLoading(page === 1);

      const from = (page - 1) * BOOKS_PER_PAGE;
      const to = from + BOOKS_PER_PAGE - 1;
      const q = term.trim();

      // Count matching rows
      const countRes = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
        .or(`title.ilike.%${q}%,author.ilike.%${q}%,description.ilike.%${q}%,isbn.ilike.%${q}%`);

      const total = countRes.count || 0;
      setTotalBooks(total);

      // Fetch categories and matching page
      const [{ data: cats }, { data: rows }] = await Promise.all([
        supabase.from('categories').select('id, name'),
        supabase
          .from('books')
          .select('id, title, author, description, category_id, categories(id,name), year, language, isbn, cover_url, file_path, created_at, views, downloads, pages, publisher, average_rating, rating_count')
          .or(`title.ilike.%${q}%,author.ilike.%${q}%,description.ilike.%${q}%,isbn.ilike.%${q}%`)
          .order('created_at', { ascending: false })
          .range(from, to)
      ]);

      const catMap = new Map((cats || []).map(c => [c.id, c.name]));
      const mapped = (rows || []).map(r => mapRowToUi(r, catMap, 50));

      // Replace books with search results (only pages loaded)
      if (page === 1) {
        setBooks(mapped);
      } else {
        setBooks(prev => {
          // ensure pages are merged in order
          const copy = [...prev];
          // append new mapped entries
          return [...copy, ...mapped];
        });
      }

      setHasMore((total || 0) > (page * BOOKS_PER_PAGE));
      setCurrentPage(page);
      setCachedPage(page, mapped);
      categoriesCache.set('categories', cats, 10 * 60 * 1000);

    } catch (err) {
      console.error('Search fetch failed', err);
    } finally {
      setPageLoading(false);
      setLoading(false);
    }
  };

  // Debounced search effect: when searchTerm changes, perform server-side search
  useEffect(() => {
    const term = (searchTerm || '').trim();
    if (!term) {
      // If search cleared, reload page 1
      fetchAll(true, 1);
      return;
    }

    const id = setTimeout(() => {
      // For short terms (<2) avoid querying
      if (term.length < 2) return;
      fetchSearch(term, 1);
    }, 300);

    return () => clearTimeout(id);
  }, [searchTerm]);

  // Background search fetch that stores results in cache without touching UI state
  const fetchSearchBackground = async (term, page = 1) => {
    try {
      const from = (page - 1) * BOOKS_PER_PAGE;
      const q = term.trim();
      // Try RPC first
      let rows = null;
      try {
        const res = await supabase.rpc('search_books', { p_query: q, p_limit: BOOKS_PER_PAGE, p_offset: from });
        rows = res.data || [];
      } catch (rpcErr) {
        // ignore
      }
      if (!rows) {
        const { data: rows2 } = await supabase
          .from('books')
          .select('id, title, author, description, category_id, categories(id,name), year, language, isbn, cover_url, file_path, created_at, views, downloads, pages, publisher, average_rating, rating_count')
          .or(`title.ilike.%${q}%,author.ilike.%${q}%,description.ilike.%${q}%,isbn.ilike.%${q}%`)
          .order('created_at', { ascending: false })
          .range(from, from + BOOKS_PER_PAGE - 1);
        rows = rows2 || [];
      }
      const { data: cats } = await supabase.from('categories').select('id, name');
      const catMap = new Map((cats || []).map(c => [c.id, c.name]));
      const mapped = (rows || []).map(r => mapRowToUi(r, catMap, 50));
      setSearchCachedPage(term, page, mapped);
      return mapped;
    } catch (err) {
      return null;
    }
  };

  // Pre-warm a few popular search terms in background to make searches snappier
  useEffect(() => {
    const popular = ['fiction','science','mathematics','history','programming'];
    let mounted = true;
    const prewarm = async () => {
      for (let i = 0; i < Math.min(popular.length, 3); i++) {
        const term = popular[i];
        // only run if no user search active
        if (searchTerm && searchTerm.trim().length > 0) break;
        try {
          await fetchSearchBackground(term, 1);
        } catch (e) { /* ignore */ }
        if (!mounted) break;
      }
    };
    const id = setTimeout(prewarm, 4500);
    return () => { mounted = false; clearTimeout(id); };
  }, []);

  const handlePageChange = async (page) => {
    if (page < 1) return;
    const totalCountForPaging = filteredByCategory !== null ? (filteredByCategory.length || 0) : (totalBooks || filteredBooks.length);
    const computedTotalPages = Math.max(1, Math.ceil((totalCountForPaging) / BOOKS_PER_PAGE));
    if (page > computedTotalPages) return;
    setCurrentPage(page);
    // Ensure the page data is loaded (use cache if available) — skip network fetch when paginating filtered results
    try {
      if (filteredByCategory !== null) {
        // client-side pagination only; nothing to fetch
      } else if (searchTerm && searchTerm.trim().length >= 2) {
        // If searching, fetch the page using search
        await fetchSearch(searchTerm.trim(), page);
      } else {
        const cached = getCachedPage(page);
        if (!cached) {
          setPageLoading(true);
          await fetchAll(false, page);
        } else {
          // If cached exists, ensure books state contains that page so filteredBooks slicing works
          setBooks(prev => {
            // merge cached page into prev if not present
            const ids = new Set(prev.map(b => b.id));
            const toAdd = cached.filter(b => !ids.has(b.id));
            return [...prev, ...toAdd];
          });
        }
      }
    } catch (err) {
      console.warn('Failed to ensure page data', err);
    } finally {
      setPageLoading(false);
    }

    // Scroll to top of the grid for better UX
    const grid = document.querySelector('.gridBKP');
    if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Note: No infinite scroll. Background fetch can still occur via realtime or manual triggers.

  const viewBookDetails = async (book) => {
    if (!requireAuth('view')) return;
    setSelectedBook(book);
    setWelcomeMessage(false);

    if (user && book && book.id) {
      try {
        // Track view in DB (RPC)
        try {
          await supabase.rpc('track_book_view', { p_book_id: book.id, p_user_id: user.id });
        } catch (err) {
          // If RPC not available, try a lightweight update
          try {
            await supabase.from('books').update({ views: (book.views || 0) + 1 }).eq('id', book.id);
          } catch (e) { /* ignore */ }
        }

        // Track reading session via backend if available
        try {
          const { data } = await supabase.auth.getSession();
          const token = data?.session?.access_token;
          await fetch('http://localhost:5000/api/reading/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ userId: user.id, bookId: book.id, pagesRead: 0, progressPercent: 0 })
          });
        } catch (err) { console.warn('Session tracking failed:', err); }

        // Optimistically update local views
        setBooks(prev => prev.map(b => b.id === book.id ? { ...b, views: (b.views || 0) + 1 } : b));
        // Refresh recommendations after viewing
        setTimeout(() => fetchRecommendations(), 500);
      } catch (error) {
        console.error('Failed to track view:', error);
      }

      // Load existing user rating for this book if any
      try {
        const { data: existingRating } = await supabase
          .from('book_ratings')
          .select('rating')
          .eq('book_id', book.id)
          .eq('user_id', user.id)
          .maybeSingle();

        setUserRating(existingRating?.rating || null);
        if (!existingRating && Math.random() < 0.3) {
          setTimeout(() => setShowRatingModal(true), 3000);
        }
      } catch (err) {
        console.warn('Failed to load user rating', err);
      }
    }
  };
  const handleSortChange = (sortType) => {
    setSortBy(sortType);
    setCurrentPage(1);
    setWelcomeMessage(false);
  };

  const toggleFilters = () => {
    setShowFilters(prev => !prev);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setShowFilters(false);
    setCurrentPage(1);
    setWelcomeMessage(false);
  };

  const closeDetails = () => {
    setSelectedBook(null);
  };

  const handleRating = async (rating) => {
    if (!selectedBook || !user) return;

    try {
      // Upsert rating (insert or update if exists)
      const { error } = await supabase
        .from('book_ratings')
        .upsert({
          book_id: selectedBook.id,
          user_id: user.id,
          rating
        }, {
          onConflict: 'book_id,user_id'
        });

      if (error) throw error;

      setUserRating(rating);

      // Optimistically update book rating in UI
      setBooks(prev => prev.map(b =>
        b.id === selectedBook.id
          ? {
            ...b,
            rating: rating, // Will be replaced by actual average on next fetch
            ratingCount: (b.ratingCount || 0) + (userRating ? 0 : 1)
          }
          : b
      ));

      // Refresh book data to get new average
      setTimeout(() => fetchAll(), 1000);
    } catch (error) {
      console.error('Failed to submit rating:', error);
      throw error;
    }
  };

  const loadRecommendations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_user_recommendations', {
          p_user_id: user.id,
          p_limit: 5
        });

      if (error) throw error;

      if (data && data.length > 0) {
        // Fetch full book details for recommendations
        const bookIds = data.map(r => r.book_id);
        const { data: recBooks } = await supabase
          .from('books')
          .select('*')
          .in('id', bookIds);

        if (recBooks) {
          setRecommendations(recBooks);
        }
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const requireAuth = (action) => {
    if (!user) {
      setAuthAction(action);
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  const toggleLove = async (bookId) => {
    if (!requireAuth('like')) return;

    const isCurrentlyLoved = bookReactions[bookId]?.loved;

    try {
      if (isCurrentlyLoved) {
        // Unlike
        await supabase
          .from('book_likes')
          .delete()
          .eq('book_id', bookId)
          .eq('user_id', user.id);
      } else {
        // Like
        await supabase
          .from('book_likes')
          .insert({ book_id: bookId, user_id: user.id });
      }

      // Optimistic update
      setBookReactions(prev => ({
        ...prev,
        [bookId]: {
          ...prev[bookId],
          loved: !isCurrentlyLoved
        }
      }));

      setBookLoves(prev => ({
        ...prev,
        [bookId]: (prev[bookId] || 0) + (isCurrentlyLoved ? -1 : 1)
      }));
    } catch (error) {
      console.error('Failed to toggle love:', error);
    }
  };

  const toggleWishlist = (bookId) => {
    setWishlist(prev => {
      const newWishlist = prev.includes(bookId)
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId];
      return newWishlist;
    });
  };

  const startReadingSession = async () => {
    if (!user || !selectedBook) return;
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
          userId: user.id,
          bookId: selectedBook.id,
          pagesRead: 1,
          progressPercent: 1
        })
      });
    } catch (e) {
      console.warn('start read session failed', e);
    }
  };

  const handleReadClick = async () => {
    if (!requireAuth('read')) return;

    const isActive =
      subscription && subscription.end_at && new Date(subscription.end_at) > new Date();

    if (!isActive) {
      setPendingAction({ type: 'read' });
      setShowSubscriptionModal(true);
      return;
    }

    await startReadingSession();
    setShowReader(true);
  };

  const handleShare = async (method, book) => {
    if (!book) return;
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const url = `${baseUrl}?id=${book.id}`;
    const text = `Check out "${book.title}" by ${book.author}`;
    try {
      switch (method) {
        case 'copy': {
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(`${text}\n${url}`);
            alert('Link copied to clipboard');
          } else {
            const input = document.createElement('input');
            input.value = `${text}\n${url}`;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            alert('Link copied to clipboard');
          }
          break;
        }
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=books,reading`,`_blank`,`noopener,noreferrer`);
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,`_blank`,`noopener,noreferrer`);
          break;
        case 'linkedin':
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,`_blank`,`noopener,noreferrer`);
          break;
        case 'email':
          window.open(`mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(`${text}\n\n${url}\n\n`)}`);
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Share failed', err);
    }
  };

  const handleSubmitComment = async (commentData) => {
    if (!requireAuth('comment')) return;

    try {
      const { data, error } = await supabase
        .from('book_comments')
        .insert({
          book_id: selectedBook.id,
          user_id: user.id,
          user_email: user.email,
          text: commentData.text,
        })
        .select()
        .single();

      if (error) throw error;

      // Optimistic update
      setMediaComments(prev => ({
        ...prev,
        [selectedBook.id]: [
          ...(Array.isArray(prev[selectedBook.id]) ? prev[selectedBook.id] : []),
          {
            id: data.id,
            user: user.email || 'Anonymous',
            text: commentData.text,
            timestamp: data.created_at,
            liked: false,
            replies: [],
            likes: 0,
          }
        ]
      }));
    } catch (error) {
      console.error('Failed to submit comment:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!user) return;

    try {
      await supabase
        .from('book_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      setMediaComments(prev => ({
        ...prev,
        [selectedBook.id]: (Array.isArray(prev[selectedBook.id]) ? prev[selectedBook.id] : []).filter(comment => comment.id !== commentId)
      }));
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleLikeComment = async (commentId) => {
    setCommentLikes(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const handleReplyToComment = async (commentId, replyData) => {
    if (!requireAuth('reply')) return;

    try {
      // Save reply to database
      const { data, error } = await supabase
        .from('book_replies')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          user_email: user.email,
          text: replyData.text
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state optimistically
      setMediaComments(prev => {
        const bookComments = Array.isArray(prev[selectedBook.id]) ? [...prev[selectedBook.id]] : [];
        const commentIndex = bookComments.findIndex(comment => comment.id === commentId);
        if (commentIndex !== -1) {
          const newReply = {
            id: data.id,
            user: user.email || 'Anonymous',
            text: replyData.text,
            timestamp: data.created_at,
            liked: false,
          };
          bookComments[commentIndex] = {
            ...bookComments[commentIndex],
            replies: Array.isArray(bookComments[commentIndex].replies)
              ? [...bookComments[commentIndex].replies, newReply]
              : [newReply]
          };
        }
        return {
          ...prev,
          [selectedBook.id]: bookComments
        };
      });
    } catch (error) {
      console.error('Failed to post reply:', error);
      alert('Failed to post reply. Please try again.');
    }
  };

  const wishlistBooks = useMemo(() => {
    return books.filter(book => wishlist.includes(book.id));
  }, [books, wishlist]);

  if (loading && books.length === 0) {
    return (
      <div className="containerBKP">
        <header className="headerBKP">
          <h2 className="titleBKP">Books</h2>
          <p className="subtitleBKP">Life happens here ~ Books, find your taste</p>
        </header>

        <div className="controlsBKP">
          <div className="search-containerBKP">
            <input
              type="text"
              placeholder="Search books..."
              className="search-inputBKP"
              disabled
            />
          </div>
          <button className="filter-buttonBKP" disabled>
            <FiFilter /> Filters
          </button>
        </div>

        <div className="stats-bar-skeletonBKP">
          <div className="stat-skeleton-itemBKP"><div className="skeleton-stat-valueBKP"/><div className="skeleton-stat-labelBKP"/></div>
          <div className="stat-skeleton-itemBKP"><div className="skeleton-stat-valueBKP"/><div className="skeleton-stat-labelBKP"/></div>
          <div className="stat-skeleton-itemBKP"><div className="skeleton-stat-valueBKP"/><div className="skeleton-stat-labelBKP"/></div>
          <div className="stat-skeleton-itemBKP"><div className="skeleton-stat-valueBKP"/><div className="skeleton-stat-labelBKP"/></div>
        </div>
        <div className="gridBKP">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="book-card-skeletonBKP">
              <div className="skeleton-badges-containerBKP">
                <div className="skeleton-badgeBKP" style={{ width: '65px' }} />
                <div className="skeleton-badgeBKP" style={{ width: '45px' }} />
              </div>
              <div className="skeleton-imageBKP" />
              <div className="skeleton-contentBKP">
                <div className="skeleton-titleBKP" />
                <div className="skeleton-authorBKP" />
                <div className="skeleton-metaBKP">
                  <div className="skeleton-meta-itemBKP" />
                  <div className="skeleton-meta-itemBKP" />
                </div>
              </div>
              <div className="skeleton-actionsBKP">
                <div className="skeleton-action-btnBKP" />
                <div className="skeleton-action-btnBKP" />
                <div className="skeleton-action-btnBKP" />
              </div>
            </div>
          ))}
        </div>
        {/* Network error modal (also shown when initial load fails) */}
        {showNetworkModal && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', zIndex: 1100 }}>
            <div style={{ width: 360, background: '#0b1220', color: '#e6eef7', padding: 20, borderRadius: 8, boxShadow: '0 8px 30px rgba(0,0,0,0.6)', textAlign: 'center' }}>
              <h3 style={{ margin: 0, marginBottom: 8 }}>Please check your network</h3>
              <p style={{ margin: 0, marginBottom: 18, color: '#9ca3af' }}>Unable to connect. Please verify your internet connection and try again.</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button className="btn" onClick={() => setShowNetworkModal(false)}>Close</button>
                <button
                  className="btn primary"
                  onClick={async () => {
                    setShowNetworkModal(false);
                    setLoading(true);
                    try {
                      clearBookCaches();
                      await fetchAll(true, networkRetryPage || 1);
                    } catch (err) {
                      console.error('Retry failed', err);
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // When deep-linking to a specific book, show a centered loading state while that book is being resolved
  if (focusedBookId && filteredBooks.length === 0 && (loading || focusedBookLoading)) {
    return (
      <div className="containerBKP">
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#6b7280', fontSize: 14 }}>Loading book...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="containerBKP">
      {/* Inline overrides: compact horizontal padding for small screens */}
      <style>{`
        .containerBKP{padding-left:12px;padding-right:12px}
        @media (max-width: 768px){
          .containerBKP{padding-left:8px;padding-right:8px}
          .controlsBKP{padding-left:0;padding-right:0}
          .search-containerBKP{padding-left:0;padding-right:0}
          .filter-wrapperBKP{gap:8px}
          .book-cardBKP{padding-left:8px;padding-right:8px}
          .modal-contentBKP{margin-left:8px;margin-right:8px;width:calc(100% - 16px)}
          .recommendations-panelBKP,.wishlist-panelBKP{left:8px;right:8px;width:calc(100% - 16px)}
        }
        @media (max-width: 420px){
          .containerBKP{padding-left:6px;padding-right:6px}
          .modal-contentBKP{margin-left:6px;margin-right:6px;width:calc(100% - 12px)}
          .recommendations-panelBKP,.wishlist-panelBKP{left:6px;right:6px;width:calc(100% - 12px)}
          .titleBKP{font-size:1.1rem}
          .controlsBKP{padding-left:0;padding-right:0}
        }
      `}</style>
      {/* Network error modal */}
      {showNetworkModal && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', zIndex: 1100 }}>
          <div style={{ width: 360, background: '#0b1220', color: '#e6eef7', padding: 20, borderRadius: 8, boxShadow: '0 8px 30px rgba(0,0,0,0.6)', textAlign: 'center' }}>
            <h3 style={{ margin: 0, marginBottom: 8 }}>Please check your network</h3>
            <p style={{ margin: 0, marginBottom: 18, color: '#9ca3af' }}>Unable to connect. Please verify your internet connection and try again.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn" onClick={() => setShowNetworkModal(false)}>Close</button>
              <button
                className="btn primary"
                onClick={async () => {
                  setShowNetworkModal(false);
                  setLoading(true);
                  try {
                    clearBookCaches();
                    await fetchAll(true, networkRetryPage || 1);
                  } catch (err) {
                    console.error('Retry failed', err);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}
      {welcomeMessage && (
        <motion.div
          className="welcome-bannerBKP"
          initial={isMounted ? { opacity: 0, y: -12 } : false}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="welcome-contentBKP">
            <h3>Welcome to the Book Library!</h3>
            <p>Discover your next favorite read</p>
            <button
              className="close-welcomeBKP"
              onClick={() => setWelcomeMessage(false)}
            >
              <FiX size={18} />
            </button>
          </div>
        </motion.div>
      )}

      <header className="headerBKP">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h2 className="titleBKP">Books</h2>
            <p className="subtitleBKP" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Life happens here ~ Books, find your taste
              {user ? (
                <span 
                  title="You are signed in - Full access to all features!"
                  style={{ 
                    cursor: 'help', 
                    display: 'inline-flex', 
                    alignItems: 'center',
                    color: '#3b82f6',
                    animation: 'pulse 2s infinite'
                  }}
                >
                  <FiStar size={16} fill="#3b82f6" />
                </span>
              ) : (
                <span 
                  title="Sign in to unlock all features: likes, comments, ratings & reading stats"
                  style={{ 
                    cursor: 'help', 
                    display: 'inline-flex', 
                    alignItems: 'center',
                    color: '#94a3b8',
                    borderStyle: 'dotted',
                    borderWidth: '1px',
                    borderColor: '#94a3b8',
                    borderRadius: '50%',
                    padding: '2px'
                  }}
                >
                  <FiStar size={14} />
                </span>
              )}
            </p>
            {categoryFilterId && (
              <div style={{ marginTop: 8 }}>
                <button
                  onClick={() => {
                    // Clear category filter and remove query param
                    setCategoryFilterId(null);
                    setCategoryFilterName(null);
                    try {
                      const url = new URL(window.location.href);
                      url.searchParams.delete('category');
                      url.searchParams.delete('categoryName');
                      window.history.replaceState({}, '', url.pathname + url.search);
                    } catch (e) {}
                  }}
                  style={{
                    background: 'linear-gradient(90deg, rgba(0,168,132,0.12), rgba(0,168,132,0.06))',
                    border: '1px solid rgba(0,168,132,0.18)',
                    color: '#dffaf0',
                    padding: '6px 10px',
                    borderRadius: 999,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {categoryFilterName || 'Filtered'} ✕
                </button>
              </div>
            )}
          </div>
          {user && (
            <button
              onClick={() => navigate('/books/reading-dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #00a884 0%, #6366f1 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <FiTrendingUp size={18} />
              My Reading Stats
            </button>
          )}
        </div>
      </header>

      <div className="controlsBKP">
        <div className="search-containerBKP">
          <input
            type="text"
            placeholder="Search books by title, author or genre..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setWelcomeMessage(false);
            }}
            className="search-inputBKP"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="clear-buttonBKP"
            >
              <FiX size={16} />
            </button>
          )}
        </div>

        <div className="filter-wrapperBKP">
          <button
            onClick={toggleFilters}
            className={`filter-buttonBKP ${showFilters ? 'activeBKP' : ''}`}
          >
            <FiFilter /> {activeFilter !== 'all' && '• '}Filters
          </button>

          {(user?.role === 'admin' || user?.role === 'editor') && (
            <button
              onClick={() => navigate('/books/admin')}
              className="filter-buttonBKP"
              title="Open Admin Dashboard"
            >
              {user?.role === 'admin' ? 'Admin' : 'Editor'}
            </button>
          )}

          {showFilters && (
            <div className="filter-dropdownBKP">
              <div className="filter-sectionBKP">
                <h4>Filter by:</h4>
                <div
                  className={`filter-optionBKP ${activeFilter === 'all' ? 'activeBKP' : ''}`}
                  onClick={() => handleFilterChange('all')}
                >
                  All Books
                </div>
                <div
                  className={`filter-optionBKP ${activeFilter === 'trending' ? 'activeBKP' : ''}`}
                  onClick={() => handleFilterChange('trending')}
                >
                  Trending
                </div>
                <div
                  className={`filter-optionBKP ${activeFilter === 'new' ? 'activeBKP' : ''}`}
                  onClick={() => handleFilterChange('new')}
                >
                  New Releases
                </div>
                <div
                  className={`filter-optionBKP ${activeFilter === 'wishlist' ? 'activeBKP' : ''}`}
                  onClick={() => handleFilterChange('wishlist')}
                >
                  My Wishlist
                </div>

                <h4>Sort by:</h4>
                <div
                  className={`filter-optionBKP ${sortBy === 'default' ? 'activeBKP' : ''}`}
                  onClick={() => handleSortChange('default')}
                >
                  Default
                </div>
                <div
                  className={`filter-optionBKP ${sortBy === 'title' ? 'activeBKP' : ''}`}
                  onClick={() => handleSortChange('title')}
                >
                  Title (A-Z)
                </div>
                <div
                  className={`filter-optionBKP ${sortBy === 'author' ? 'activeBKP' : ''}`}
                  onClick={() => handleSortChange('author')}
                >
                  Author (A-Z)
                </div>
                <div
                  className={`filter-optionBKP ${sortBy === 'rating' ? 'activeBKP' : ''}`}
                  onClick={() => handleSortChange('rating')}
                >
                  Highest Rating
                </div>
                <div
                  className={`filter-optionBKP ${sortBy === 'views' ? 'activeBKP' : ''}`}
                  onClick={() => handleSortChange('views')}
                >
                  Most Viewed
                </div>
                <div
                  className={`filter-optionBKP ${sortBy === 'downloads' ? 'activeBKP' : ''}`}
                  onClick={() => handleSortChange('downloads')}
                >
                  Most Downloaded
                </div>
                <div
                  className={`filter-optionBKP ${sortBy === 'year' ? 'activeBKP' : ''}`}
                  onClick={() => handleSortChange('year')}
                >
                  Publication Year
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations Panel Toggle */}
      {user && recommendations.length > 0 && (
        <motion.button
          className="recommendations-toggleBKP"
          onClick={() => setShowRecommendations(!showRecommendations)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Recommendations for you"
        >
          <FiTrendingUp size={30} color="#00a884" />
          <span className="rec-countBKP">{recommendations.length}</span>
        </motion.button>
      )}

      <motion.button
        className="wishlist-toggleBKP"
        onClick={() => setShowWishlist(!showWishlist)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <FiBookmark size={30} />
        <span className="wishlist-countBKP">{wishlist.length}</span>
      </motion.button>

      {/* Recommendations Panel */}
      <AnimatePresence initial={false}>
        {showRecommendations && (
          <motion.div
            className="recommendations-panelBKP"
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <div className="recommendations-headerBKP">
              <h3 className="recommendations-titleBKP">Recommended for You</h3>
              <button
                onClick={() => setShowRecommendations(false)}
                className="close-panel-btnBKP"
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="recommendations-contentBKP">
              {recommendations.length === 0 ? (
                <p className="empty-recommendations-msgBKP">Start reading books to get personalized recommendations!</p>
              ) : (
                recommendations.map((book) => (
                  <div
                    key={book.id}
                    className="recommendation-itemBKP"
                    onClick={() => {
                      setShowRecommendations(false);
                      viewBookDetails(book);
                    }}
                  >
                    <img src={book.bookImage} alt={book.title} className="rec-book-imgBKP" />
                    <div className="rec-book-infoBKP">
                      <h4 className="rec-book-titleBKP">{book.title}</h4>
                      <p className="rec-book-authorBKP">{book.author}</p>
                      <div className="rec-book-metaBKP">
                        <span className="rec-ratingBKP">
                          <FiStar fill="#fbbf24" /> {book.rating > 0 ? book.rating.toFixed(1) : 'New'}
                        </span>
                      </div>
                      <p className="rec-reasonBKP">
                        <FiTrendingUp size={12} color="#00a884" /> {book.reason}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {showWishlist && (
          <motion.div
            className="wishlist-panelBKP"
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <div className="wishlist-headerBKP">
              <h3 className="wishlist-titleBKP">Your Wishlist</h3>
              <button className="wishlist-close-buttonBKP" onClick={() => setShowWishlist(false)}>
                <FiX size={20} />
              </button>
            </div>

            <div className="wishlist-booksBKP">
              {wishlistBooks.length > 0 ? (
                wishlistBooks.map(book => (
                  <div
                    key={book.id}
                    className="recommendation-itemBKP"
                    onClick={() => {
                      viewBookDetails(book);
                      setShowWishlist(false);
                    }}
                  >
                    <img src={book.bookImage} alt={book.title} className="rec-book-imgBKP" />
                    <div className="rec-book-infoBKP">
                      <h4 className="rec-book-titleBKP">{book.title}</h4>
                      <p className="rec-book-authorBKP">{book.author}</p>
                      <div className="rec-book-metaBKP">
                        <span className="rec-ratingBKP">
                          <FiStar fill={book.rating > 0 ? "#fbbf24" : "none"} color={book.rating > 0 ? "#fbbf24" : "#64748b"} />
                          {book.rating > 0 ? book.rating.toFixed(1) : 'New'}
                        </span>
                      </div>
                      <p className="rec-reasonBKP">
                        <FiBookmark size={12} color="#6366f1" /> In your wishlist
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(book.id);
                      }}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(239, 68, 68, 0.9)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'white'
                      }}
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="wishlist-emptyBKP">
                  <FiBookmark size={40} color="#6366f1" />
                  <p>Your wishlist is empty</p>
                  <button
                    onClick={() => setShowWishlist(false)}
                    className="browse-books-buttonBKP"
                  >
                    Browse Books
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {displayedBooks.length === 0 && !pageLoading ? (
        <div className="empty-stateBKP">
          <FiBook size={48} />
          <h3>No books found</h3>
          <p>Try adjusting your search or filters</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setActiveFilter('all');
              setSortBy('default');
            }}
            className="reset-buttonBKP"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="gridBKP" aria-busy={pageLoading} aria-live={pageLoading ? 'polite' : 'off'}>
            <AnimatePresence initial={false}>
              {displayedBooks.map((book) => (
                <motion.div
                  key={book.id}
                  initial={isMounted ? { opacity: 0, y: 12 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  layout
                >
                  <div
                    className="book-cardBKP"
                    onClick={() => viewBookDetails(book)}
                  >
                    <div className="badge-containerBKP">
                      {book.trending && (
                        <span className="trending-badgeBKP">
                          <FiTrendingUp size={12} /> Trending
                        </span>
                      )}
                      {book.newRelease && (
                        <span className="new-badgeBKP">New</span>
                      )}
                    </div>

                    <img src={book.bookImage} alt={book.title} className="book-coverBKP" />

                    <div className="card-contentBKP">
                      <h3 className="book-titleBKP">{book.title}</h3>
                      <p className="book-authorBKP">by {book.author}</p>

                      <div className="book-metaBKP">
                        <span className="ratingBKP">
                          <FiStar fill={book.rating > 0 ? "#fbbf24" : "none"} color={book.rating > 0 ? "#fbbf24" : "#64748b"} />
                          {book.rating > 0 ? book.rating.toFixed(1) : 'No ratings yet'}
                        </span>
                        <span className="downloads-displayBKP">
                          <FiDownload size={14} color="#64748b" /> {book.downloads.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="action-buttonsBKP">
                      <ReactionButtonsBKP
                        itemId={book.id}
                        loves={bookLoves[book.id] || 0}
                        onLove={toggleLove}
                        isLoved={bookReactions[book.id]?.loved}
                      />
                      <span className="view-countBKP">
                        <FiEye size={14} color="#64748b" /> <span className="countBKP">{book.views.toLocaleString()}</span>
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(book.id);
                        }}
                        className={`wishlist-buttonBKP ${wishlist.includes(book.id) ? 'activeBKP' : ''}`}
                      >
                        <FiBookmark
                          size={14}
                          fill={wishlist.includes(book.id) ? '#6366f1' : 'none'}
                          color={wishlist.includes(book.id) ? '#6366f1' : '#64748b'}
                        />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* If we're loading a page and there are no displayedBooks yet, show skeletons */}
          {pageLoading && displayedBooks.length === 0 && (
            <div className="gridBKP">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={`s-${i}`} className="book-card-skeletonBKP">
                  <div className="skeleton-badges-containerBKP">
                    <div className="skeleton-badgeBKP" style={{ width: '65px' }} />
                    <div className="skeleton-badgeBKP" style={{ width: '45px' }} />
                  </div>
                  <div className="skeleton-imageBKP" />
                  <div className="skeleton-contentBKP">
                    <div className="skeleton-titleBKP" />
                    <div className="skeleton-authorBKP" />
                    <div className="skeleton-metaBKP">
                      <div className="skeleton-meta-itemBKP" />
                      <div className="skeleton-meta-itemBKP" />
                    </div>
                  </div>
                  <div className="skeleton-actionsBKP">
                    <div className="skeleton-action-btnBKP" />
                    <div className="skeleton-action-btnBKP" />
                    <div className="skeleton-action-btnBKP" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {(() => {
            const totalCountForPaging = filteredByCategory !== null ? (filteredByCategory.length || 0) : (totalBooks || filteredBooks.length);
            const computedTotal = Math.max(1, Math.ceil((totalCountForPaging) / BOOKS_PER_PAGE));
            if (computedTotal <= 1) return null;

            return (
              <div>
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
                  {Array.from({ length: Math.min(5, computedTotal) }, (_, i) => {
                    let pageNum;
                    if (computedTotal <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= computedTotal - 2) {
                      pageNum = computedTotal - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                          <button
                            key={pageNum}
                            className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                            onClick={() => handlePageChange(pageNum)}
                            disabled={pageLoading || currentPage === pageNum}
                            aria-current={currentPage === pageNum ? 'page' : undefined}
                            aria-label={`Go to page ${pageNum}`}
                          >
                              {pageNum}
                              {(() => {
                                const status = pageCacheStatus[pageNum] || (getCachedPage(pageNum) ? 'cached' : 'remote');
                                const color = status === 'cached' ? '#10b981' : status === 'loading' ? '#f59e0b' : '#64748b';
                                return (
                                  <span
                                    style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 8, marginLeft: 8, background: color }}
                                    title={status}
                                  />
                                );
                              })()}
                          </button>
                    );
                  })}
                </div>

                <button
                  className="pagination-btn"
                  disabled={pageLoading || currentPage === computedTotal}
                  onClick={() => handlePageChange(currentPage + 1)}
                  aria-label="Next page"
                >
                  Next
                  <FiChevronRight size={16} />
                </button>
                </div>

                {pageLoading && (
                  <div>
                    <div className="dots-loader" aria-hidden>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <div role="status" aria-live="polite" className="sr-only">Loading page {currentPage}…</div>
                  </div>
                )}

              </div>
            );
          })()}
        </>
      )}

      <AnimatePresence initial={false}>
        {selectedBook && (
          <motion.div
            className="modal-overlayBKP"
            initial={isMounted ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDetails}
          >
            <motion.div
              className="modal-contentBKP"
              initial={isMounted ? { scale: 0.98, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ type: 'tween', duration: 0.16 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="close-buttonBKP" onClick={closeDetails}>
                <FiX size={24} />
              </button>

              <div className="modal-headerBKP">
                <img
                  src={selectedBook.bookImage}
                  alt={selectedBook.title}
                  className="book-coverBKP"
                  style={{ width: '40%', height: '150px', margin: '0 auto 0.1px' }}
                />
                <h2>{selectedBook.title}</h2>
                <p>by {selectedBook.author}</p>

                <div className="stats-containerBKP" style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px', flexWrap: 'wrap', color: '#cbd5e1', fontSize: '0.95rem' }}>
                  <span><strong>Rating:</strong> {selectedBook.rating ? selectedBook.rating.toFixed(1) : 'N/A'} ({selectedBook.ratingCount || 0})</span>
                  <span>•</span>
                  <span><strong>Downloads:</strong> {selectedBook.downloads || 0}</span>
                  <span>•</span>
                  <span><strong>Views:</strong> {selectedBook.views || 0}</span>
                  {userRating && (
                    <>
                      <span>•</span>
                      <span><strong>Your rating:</strong> {userRating}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="modal-bodyBKP">
                <div className="details-containerBKP">
                  <div className="detail-itemBKP">
                    <span className="detail-labelBKP">Genre:</span>
                    <span className="detail-valueBKP">{selectedBook.genre}</span>
                  </div>
                  <div className="detail-itemBKP">
                    <span className="detail-labelBKP">Pages:</span>
                    <span className="detail-valueBKP">{selectedBook.pages}</span>
                  </div>
                  <div className="detail-itemBKP">
                    <span className="detail-labelBKP">Language:</span>
                    <span className="detail-valueBKP">{selectedBook.language}</span>
                  </div>
                  <div className="detail-itemBKP">
                    <span className="detail-labelBKP">Publisher:</span>
                    <span className="detail-valueBKP">{selectedBook.publisher || 'N/A'}</span>
                  </div>
                </div>

                <p className="book-descBKP" style={{ margin: '20px 0' }}>
                  {selectedBook.description}
                </p>

                <CommentsSection
                  currentMedia={{ id: selectedBook.id }}
                  currentUser={user?.email || 'Anonymous'}
                  showComments={true}
                  commentsRef={null}
                  mediaComments={mediaComments}
                  commentLikes={commentLikes}
                  onSubmitComment={handleSubmitComment}
                  onDeleteComment={handleDeleteComment}
                  onLikeComment={handleLikeComment}
                  onReplyToComment={handleReplyToComment}
                />
              </div>

              <div className="modal-actionsBKP">
                <Download
                  book={selectedBook}
                  variant="full"
                  onDownloadStart={async () => {
                    if (!requireAuth('download')) return false;

                    const isActive =
                      subscription && subscription.end_at && new Date(subscription.end_at) > new Date();

                    if (!isActive) {
                      setPendingAction({ type: 'read' });
                      setShowSubscriptionModal(true);
                      return false;
                    }

                    // Increment download count
                    try {
                      await supabase
                        .from('books')
                        .update({ downloads: (selectedBook.downloads || 0) + 1 })
                        .eq('id', selectedBook.id);
                    } catch (error) {
                      console.error('Failed to increment downloads:', error);
                    }

                    alert('Offline downloads are disabled for this book. Please use the Read button to view it online.');
                    return false;
                  }}
                />
                <button
                  className="btn-readBKP"
                  onClick={handleReadClick}
                >
                  <FiBook size={16} /> Read
                </button>
                <div className="share-rowBKP">
                  <button className="share-btnBKP" title="Copy Link" onClick={() => handleShare('copy', selectedBook)}><FiCopy size={16} /> Copy</button>
                  <button className="share-btnBKP" title="Twitter" onClick={() => handleShare('twitter', selectedBook)}><FiTwitter size={16} /> Twitter</button>
                  <button className="share-btnBKP" title="Facebook" onClick={() => handleShare('facebook', selectedBook)}><FiFacebook size={16} /> Facebook</button>
                  <button className="share-btnBKP" title="LinkedIn" onClick={() => handleShare('linkedin', selectedBook)}><FiLinkedin size={16} /> LinkedIn</button>
                  <button className="share-btnBKP" title="Email" onClick={() => handleShare('email', selectedBook)}><FiMail size={16} /> Email</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {showReader && selectedBook && (
        <div className="reader-overlayBKP" onClick={() => setShowReader(false)}>
          <div className="reader-containerBKP" onClick={(e) => e.stopPropagation()}>
            <div className="reader-headerBKP">
              <div className="reader-titleBKP">{selectedBook.title}</div>
              <button className="reader-closeBKP" onClick={() => setShowReader(false)}>
                <FiX size={18} />
              </button>
            </div>
            <div className="reader-bodyBKP">
              {selectedBook.downloadUrl ? (
                <iframe title="reader" className="reader-iframeBKP" src={selectedBook.downloadUrl} />
              ) : (
                <div className="reader-fallbackBKP">
                  <p>Preview unavailable. You can download and read locally.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Periodic reading session update while reader is open */}
      {showReader && selectedBook && (
        <ReaderSessionPinger user={user} book={selectedBook} />
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
        action={authAction}
      />

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => {
          setShowSubscriptionModal(false);
          setPendingAction(null);
        }}
        user={user}
        onSubscribed={async (sub) => {
          setSubscription(sub);
          setShowSubscriptionModal(false);
          if (pendingAction?.type === 'read' && selectedBook) {
            await startReadingSession();
            setShowReader(true);
          }
          setPendingAction(null);
        }}
      />

      <RatingModal
        isOpen={showRatingModal && selectedBook !== null}
        onClose={() => setShowRatingModal(false)}
        book={selectedBook}
        onRate={handleRating}
      />
    </div>
  );
};