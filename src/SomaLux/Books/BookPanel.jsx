// src/BookPanel.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { Download } from './Download';
import { CommentsSection } from './CommentsSection';
import { AuthModal } from './AuthModal';
import { RatingModal } from './RatingModal';
import { SubscriptionModal } from './SubscriptionModal';
import { AdBanner } from '../Ads/AdBanner';
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
  FiBookmark,
  FiEye,
  FiThumbsUp,
  FiMail,
} from 'react-icons/fi';
import {
  FaTwitter,
  FaFacebook,
  FaLinkedin,
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import SimpleScrollReader from './SimpleScrollReader';
import { API_URL } from '../../config';
import './BookPanel.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { booksCache, categoriesCache, statsCache } from './utils/cacheManager';
import { fetchUserRankingsAdmin } from './Admin/api';
import { perfOptimizer } from './utils/performanceOptimizer';
import { indexedDBCache } from './utils/indexedDBCache';
import { fetchBooksOptimized, fetchMinimalBooks, searchBooksOptimized } from './utils/optimizedQueries';
 

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
      {isLoved ? <FaHeart color="red" size={10} /> : <FaRegHeart size={10} />}
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
        await fetch(`${API_URL}/api/reading/session`, {
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
  const [userRanking, setUserRanking] = useState(null);
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
  const [pointsStats, setPointsStats] = useState(null); // reading rewards stats
  const [focusedBookId, setFocusedBookId] = useState(null);
  const [focusedBookLoading, setFocusedBookLoading] = useState(false);
  const [recentBookIds, setRecentBookIds] = useState([]);

  // Simple network error modal state
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [networkRetryPage, setNetworkRetryPage] = useState(1);

  const CACHE_TTL_MS = 5 * 60 * 1000;

  // Rewards: load daily login bonus and current points once user is known
  useEffect(() => {
    if (!user?.id) return;

    (async () => {
      try {
        // Daily login reward via backend endpoint
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;
        
        let origin = '';
        if (typeof window !== 'undefined') {
          origin = window.__API_ORIGIN__ || '';
          if (!origin) {
            const { protocol, hostname } = window.location || {};
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
              origin = `${protocol}//${hostname}:5000`;
            }
          }
        }
        if (!origin) origin = API_URL;

        await fetch(`${origin}/api/rpc/daily_login_reward`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ user_id: user.id })
        });
      } catch (e) {
        // Daily rewards endpoint may not be available - ignore silently
        console.debug('daily_login_reward request failed:', e?.message);
      }

      try {
        const { data, error } = await supabase
          .from('user_points_stats')
          .select('*')
          .eq('user_id', user.id)
          .single();
        if (!error && data) {
          setPointsStats(data);
        } else if (error?.status === 406 || error?.code === 'PGRST116') {
          // Table doesn't exist yet - silently skip
          console.log('user_points_stats table not yet available');
        } else if (error?.code === 'PGRST100') {
          // Row not found - table exists but no stats yet
          setPointsStats({ user_id: user.id, total_points: 0, daily_logins: 0 });
        } else if (error) {
          console.warn('load user_points_stats error:', error);
        }
      } catch (e) {
        console.warn('load user_points_stats failed', e);
      }
    })();
  }, [user?.id]);

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

  // Prefetch helper: tries link prefetch + background fetch to warm CDN/cache
  const prefetchResource = (url) => {
    try {
      if (!url) return;
      if (typeof window === 'undefined') return;
      window.__prefetched = window.__prefetched || new Set();
      if (window.__prefetched.has(url)) return;
      window.__prefetched.add(url);

      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      // for PDFs/large docs allow crossOrigin
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);

      // fire-and-forget fetch to prime browser cache (may be CORS-limited)
      try {
        fetch(url, { method: 'GET', mode: 'cors', cache: 'force-cache' }).catch(() => {});
      } catch (e) {}
    } catch (e) {
      // noop
    }
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

  // Helper: log search events to backend for analytics
  const logSearchEvent = useCallback(
    async ({ queryText, resultsCount }) => {
      try {
        const trimmed = (queryText || '').trim();
        if (!trimmed || trimmed.length < 2) return;

        const { data } = await supabase.auth.getSession();
        const session = data?.session || null;
        const token = session?.access_token || null;
        const currentUserId = session?.user?.id || null;

        // Build API origin (mirrors patterns used elsewhere)
        let origin = '';
        if (typeof window !== 'undefined') {
          origin = window.__API_ORIGIN__ || '';
          if (!origin) {
            const { protocol, hostname } = window.location || {};
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
              origin = `${protocol}//${hostname}:5000`;
            }
          }
        }
        if (!origin) origin = API_URL;

        await fetch(`${origin}/api/elib/search-events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            scope: 'books',
            queryText: trimmed,
            userId: currentUserId,
            categoryId: categoryFilterId || null,
            bookId: null,
            authorName: null,
            pastPaperId: null,
            resultsCount: typeof resultsCount === 'number' ? resultsCount : null,
          }),
        }).catch(() => {});
      } catch (e) {
        console.warn('logSearchEvent failed', e);
      }
    },
    [categoryFilterId]
  );

  // Debounced logging of book searches for analytics
  useEffect(() => {
    try {
      const q = (searchTerm || '').trim();
      if (!q || q.length < 2) return;

      const handle = setTimeout(() => {
        logSearchEvent({ queryText: q, resultsCount: displayedBooks.length });
      }, 800); // debounce ~0.8s after typing stops

      return () => clearTimeout(handle);
    } catch {
      // ignore
    }
  }, [searchTerm, displayedBooks.length, logSearchEvent]);

  // Map a Supabase row to current UI shape
  const mapRowToUi = (row, catMap, trendingThreshold = 50) => {
    const views = row.views_count || 0;
    const downloads = row.downloads_count || 0;
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
    const rating = row.rating !== null && row.rating !== undefined ? row.rating : 0;
    const filePath = row.file_url || '';
    const ext = filePath.split('.').pop()?.toLowerCase() || 'pdf';
    // file_url is already a full public URL from the backend
    const publicUrl = filePath && /^https?:\/\//.test(filePath) ? filePath : null;
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
  bookImage: row.cover_image_url || row.cover_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 420"%3E%3Crect fill="%23333" width="300" height="420"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="24" fill="%23888" text-anchor="middle" dominant-baseline="middle"%3ENo Cover%3C/text%3E%3C/svg%3E',
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
      // ⚡ TRIPLE-LAYER CACHE CHECK (memory → IndexedDB → network)
      if (!forceRefresh) {
        // Layer 1: Memory cache (instant)
        const memCached = perfOptimizer.getMemoryCache(`books_page_${page}`);
        if (memCached) {
          console.log('🔥 [Layer 1] Memory cache hit!');
          setBooks(page === 1 ? memCached.books : prev => [...prev, ...memCached.books]);
          setTotalBooks(memCached.total);
          setLoading(false);
          return;
        }

        // Layer 2: IndexedDB cache (very fast)
        const idbBooks = await indexedDBCache.loadBooks(page);
        if (idbBooks && idbBooks.length > 0) {
          console.log('🔥 [Layer 2] IndexedDB cache hit!');
          const idbCategories = await indexedDBCache.loadCategories();
          
          setBooks(page === 1 ? idbBooks : prev => [...prev, ...idbBooks]);
          setTotalBooks(idbBooks.length); // Will refetch count in background
          setLoading(false);

          // Background fetch to update
          setTimeout(() => fetchAll(true, page), 100);
          return;
        }

        // Layer 3: Browser localStorage cache (fast)
        const localBooks = getCachedPage(page);
        if (localBooks) {
          console.log('🔥 [Layer 3] LocalStorage cache hit!');
          setBooks(page === 1 ? localBooks : prev => [...prev, ...localBooks]);
          setLoading(false);
          
          // Background update
          setTimeout(() => fetchAll(true, page), 50);
          return;
        }
      }

      setLoading(page === 1);

      // 🚀 OPTIMIZED NETWORK FETCH (fastest queries)
      console.log(`📡 Fetching page ${page} from network...`);
      console.log('🔍 Supabase URL:', process.env.REACT_APP_SUPABASE_URL || 'using fallback');
      console.log('🔑 Supabase Key available:', !!process.env.REACT_APP_SUPABASE_ANON_KEY);
      const result = await fetchBooksOptimized(supabase, page, BOOKS_PER_PAGE);
      
      const { books: rows, categories: cats, totalCount: count } = result;
      const catMap = new Map((cats || []).map(c => [c.id, c.name]));

      // Calculate trending threshold
      const scores = (rows || []).map(r => (r.views_count || 0) + 2 * (r.downloads_count || 0));
      scores.sort((a, b) => b - a);
      const trendingThreshold = scores.length > 10 ? Math.max(scores[Math.floor(scores.length * 0.1)], 50) : 100;

      const mapped = (rows || []).map(r => mapRowToUi(r, catMap, trendingThreshold));

      // Update UI
      if (page === 1) {
        setBooks(mapped);
      } else {
        setBooks(prev => [...prev, ...mapped]);
      }

      const loadedSoFar = (page - 1) * BOOKS_PER_PAGE + rows.length;
      setHasMore((count || 0) > loadedSoFar);
      setCurrentPage(page);
      setTotalBooks(count || 0);

      // 💾 SAVE TO ALL CACHE LAYERS
      const cacheData = { books: mapped, total: count };
      
      // Memory cache (5 min TTL)
      perfOptimizer.setMemoryCache(`books_page_${page}`, cacheData, 5 * 60 * 1000);
      
      // IndexedDB (24 hour TTL)
      await indexedDBCache.saveBooks(page, mapped, 24);
      
      // LocalStorage
      setCachedPage(page, mapped);

      // Save categories
      if (page === 1) {
        perfOptimizer.setMemoryCache('categories', cats, 10 * 60 * 1000);
        await indexedDBCache.saveCategories(cats);
      }

      console.log(`✅ Loaded page ${page}: ${mapped.length} books (Total: ${count})`);
      
      // 🔄 SMART PREFETCH: Load next page if network is fast
      if (result.hasMore) {
        const networkSpeed = perfOptimizer.estimateNetworkSpeed();
        if (networkSpeed === 'fast' && page === 1) {
          console.log('⚡ Network is fast, prefetching next page...');
          setTimeout(() => perfOptimizer.schedulePrefetch(page + 1, fetchAll), 500);
        }
      }
      
    } catch (e) {
      console.error('Failed to fetch books:', e);
      console.error('❌ RAW ERROR:', {
        message: e.message,
        type: e.name,
        toString: e.toString(),
        stack: e.stack
      });
      
      let errorMessage = 'Error loading books:\n\n';
      if (e.message && e.message.includes('Failed to fetch')) {
        errorMessage += '❌ Network Error: Cannot connect to database.\n\n';
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

      try {
        setNetworkRetryPage(page || 1);
        setShowNetworkModal(true);
      } catch (modalErr) {
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
        // Fetch the user's role and activity metadata from the profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, created_at, last_active_at')
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
        // load ranking for this user (admin rankings may be shaped differently)
        (async () => {
          try {
            const rankings = await fetchUserRankingsAdmin();

            // helper: normalize a single ranking record like in Admin Users
            const normalizeRanking = (r) => {
              if (!r) return null;
              const pickNumber = (...keys) => {
                for (const k of keys) {
                  if (r && Object.prototype.hasOwnProperty.call(r, k)) {
                    const n = Number(r[k]);
                    if (!Number.isNaN(n)) return n;
                  }
                }
                return null;
              };
              const score = pickNumber(
                'score',
                'score_30',
                'score_30_days',
                'score30',
                'score_last_30',
                'last_30_score',
                'value'
              );
              const tier = r.tier ?? r.rank_tier ?? r.level ?? r.category ?? null;
              const position = pickNumber('rank_position', 'position', 'rank', 'rankPos');
              const subscription = !!(r.subscription_bonus_applied ?? r.has_subscription_boost ?? r.subscription_boost ?? r.subscriber_bonus);
              return { raw: r, score, tier, position, subscription };
            };

            // Fallback ranking when server-side ranking is missing, mirroring Users.jsx
            const computeFallbackRanking = (profileRow, uploadsCount) => {
              const uploads = uploadsCount || 0;
              const createdAt = profileRow?.created_at ? new Date(profileRow.created_at) : null;
              const lastActiveAt = profileRow?.last_active_at ? new Date(profileRow.last_active_at) : createdAt;
              let recencyScore = 0;
              if (lastActiveAt) {
                const days = (Date.now() - lastActiveAt.getTime()) / (1000 * 60 * 60 * 24);
                if (days <= 7) recencyScore = 50;
                else if (days <= 30) recencyScore = 20;
                else if (days <= 90) recencyScore = 5;
              }
              const score = uploads * 10 + recencyScore;
              let tier = null;
              if (score >= 200) tier = 'legend';
              else if (score >= 100) tier = 'power_reader';
              else if (score >= 50) tier = 'active_reader';
              else if (score >= 10) tier = 'community_star';
              else if (score > 0) tier = 'new_reader';
              return { score, tier };
            };

            let match = null;
            if (Array.isArray(rankings) && rankings.length > 0) {
              match = rankings.find(r => {
                const candidates = [
                  r.user_id,
                  r.user?.id,
                  r.profile_id,
                  r.profiles?.id,
                  r.profiles?.profile_id,
                  r.email,
                  r.user_email,
                ].map(x => (x === undefined || x === null) ? null : String(x));
                return candidates.includes(String(userData.id)) || (userData.email && candidates.includes(String(userData.email)));
              }) || null;
            }

            const norm = normalizeRanking(match);

            // Fetch uploads count for this user to support fallback scoring
            let uploadsCount = 0;
            try {
              const { count, error: uploadsErr } = await supabase
                .from('books')
                .select('id', { count: 'exact', head: true })
                .eq('uploaded_by', userData.id);
              if (!uploadsErr) uploadsCount = count || 0;
            } catch {
              // ignore upload count errors, fallback will simply use 0 uploads
            }

            let finalScore = null;
            let finalTier = null;

            if (norm && typeof norm.score === 'number') {
              finalScore = norm.score;
              finalTier = norm.tier || null;
            } else {
              const fb = computeFallbackRanking(profile, uploadsCount);
              if (fb && typeof fb.score === 'number') {
                finalScore = fb.score;
                finalTier = fb.tier || null;
              }
            }

            if (finalScore === null && !finalTier) {
              setUserRanking(null);
            } else {
              setUserRanking({ raw: match, score: finalScore, tier: finalTier || null });
            }
          } catch (err) {
            console.warn('Failed to load user ranking', err);
            setUserRanking(null);
          }
        })();
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
      if (subscription?.unsubscribe && typeof subscription.unsubscribe === 'function') {
        try { subscription.unsubscribe(); } catch (e) {}
      }
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
            const scoreA = (a.views_count || 0) + 2 * (a.downloads_count || 0) + (a.rating || 0) * 10;
            const scoreB = (b.views_count || 0) + 2 * (b.downloads_count || 0) + (b.rating || 0) * 10;
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
          const scoreA = (a.views_count || 0) + 2 * (a.downloads_count || 0) + (a.rating || 0) * 10;
          const scoreB = (b.views_count || 0) + 2 * (b.downloads_count || 0) + (b.rating || 0) * 10;
          return scoreB - scoreA;
        })
        .slice(0, 6)
        .map(b => ({ ...b, reason: 'Popular choice' }));

      setRecommendations(fallbackRecs);
    }
  }, [user, books, wishlist]);

  // Load list of recently read book IDs for the current user (ordered by most recent session)
  const loadRecentBooks = useCallback(async () => {
    if (!user?.id) {
      setRecentBookIds([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('reading_sessions')
        .select('book_id, started_at')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) {
        console.warn('Failed to load recent reading sessions:', error);
        setRecentBookIds([]);
        return;
      }

      const seen = new Set();
      const orderedIds = [];
      (data || []).forEach((row) => {
        const bid = row.book_id;
        if (!bid || seen.has(bid)) return;
        seen.add(bid);
        orderedIds.push(bid);
      });

      setRecentBookIds(orderedIds.slice(0, 10));
    } catch (err) {
      console.warn('Error loading recent reading list:', err);
      setRecentBookIds([]);
    }
  }, [user?.id]);

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
        .order('end_date', { ascending: false })
        .limit(1);

      if (error) {
        console.warn('Failed to load subscription:', error);
        setSubscription(null);
        return;
      }

      const row = data && data.length > 0 ? data[0] : null;
      if (row && row.end_date && new Date(row.end_date) > new Date()) {
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

      // Load likes for all comments
      const { data: commentLikesRows } = await supabase
        .from('book_comment_likes')
        .select('comment_id, user_id');

      if (comments) {
        const commentsByBook = {};

        // Group replies by comment_id
        const repliesByComment = {};
        if (replies) {
          replies.forEach(reply => {
            if (!repliesByComment[reply.comment_id]) {
              repliesByComment[reply.comment_id] = [];
            }

            const hasValidUrl =
              typeof reply.media_url === 'string' &&
              (reply.media_url.startsWith('http://') || reply.media_url.startsWith('https://'));
            const hasValidType =
              reply.media_type === 'image' ||
              reply.media_type === 'video' ||
              reply.media_type === 'audio' ||
              reply.media_type === 'file';

            const media = hasValidUrl && hasValidType
              ? { type: reply.media_type, url: reply.media_url }
              : null;

            repliesByComment[reply.comment_id].push({
              id: reply.id,
              user: reply.user_email || 'Anonymous',
              text: reply.text,
              timestamp: reply.created_at,
              liked: false,
              media,
            });
          });
        }

        // Build like counts and current user's liked map for comments
        const likeCountsExcludingSelf = {};
        const userLikedMap = {};
        if (commentLikesRows) {
          commentLikesRows.forEach(like => {
            const isSelf = user && like.user_id === user.id;
            if (isSelf) {
              userLikedMap[like.comment_id] = true;
            } else {
              likeCountsExcludingSelf[like.comment_id] = (likeCountsExcludingSelf[like.comment_id] || 0) + 1;
            }
          });
        }

        comments.forEach(comment => {
          const hasValidUrl =
            typeof comment.media_url === 'string' &&
            (comment.media_url.startsWith('http://') || comment.media_url.startsWith('https://'));
          const hasValidType =
            comment.media_type === 'image' ||
            comment.media_type === 'video' ||
            comment.media_type === 'audio' ||
            comment.media_type === 'file';

          const media = hasValidUrl && hasValidType
            ? { type: comment.media_type, url: comment.media_url }
            : null;

          if (!commentsByBook[comment.book_id]) {
            commentsByBook[comment.book_id] = [];
          }
          commentsByBook[comment.book_id].push({
            id: comment.id,
            user: comment.user_email || 'Anonymous',
            text: comment.text,
            media,
            timestamp: comment.created_at,
            liked: false,
            replies: repliesByComment[comment.id] || [],
            likes: likeCountsExcludingSelf[comment.id] || 0,
          });
        });
        setMediaComments(commentsByBook);

        // Set current user's liked map for comments
        setCommentLikes(userLikedMap);
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

  // Load recent reading list once user and books are available
  useEffect(() => {
    if (user && books.length > 0) {
      loadRecentBooks();
    }
  }, [user, books.length, loadRecentBooks]);

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
      // Notify other components (especially Profile.js) that wishlist changed
      try {
        window.dispatchEvent(new CustomEvent('wishlistChanged', { detail: { count: wishlist.length, updatedAt: Date.now() } }));
      } catch (err) {}
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
          .select('id, title, author, description, category_id, categories(id,name), year, language, isbn, cover_image_url, file_url, created_at, views_count, downloads_count, pages, publisher, rating, rating_count')
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
          .select('id, title, author, description, category_id, categories(id,name), year, language, isbn, cover_image_url, file_url, created_at, views_count, downloads_count, pages, publisher, rating, rating_count')
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
    // Deduplicate by book ID to prevent React key warnings
    const seenIds = new Set();
    let result = source.filter(book => {
      if (seenIds.has(book.id)) {
        return false; // Skip duplicate
      }
      seenIds.add(book.id);
      return true;
    });

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
      result.sort((a, b) => b.views_count - a.views_count);
    } else if (sortBy === 'downloads') {
      result.sort((a, b) => b.downloads_count - a.downloads_count);
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
          .select('id, title, author, description, category_id, categories(id,name), year, language, isbn, cover_image_url, file_url, created_at, views_count, downloads_count, pages, publisher, rating, rating_count')
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
      // Use direct query search
      const { data: rows } = await supabase
        .from('books')
        .select('id, title, author, description, category_id, categories(id,name), year, language, isbn, cover_image_url, file_url, created_at, views_count, downloads_count, pages, publisher, rating, rating_count')
        .or(`title.ilike.%${q}%,author.ilike.%${q}%,description.ilike.%${q}%,isbn.ilike.%${q}%`)
        .order('created_at', { ascending: false })
        .range(from, from + BOOKS_PER_PAGE - 1);
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
          await fetch(`${API_URL}/api/reading/session`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ userId: user.id, bookId: book.id, pagesRead: 0, progressPercent: 0 })
          });
        } catch (err) {
          console.warn('Session tracking failed:', err);
        }

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
          onConflict: 'user_id,book_id'
        });

      if (error) throw error;

      setUserRating(rating);

      // Refresh book data to get new average rating from database
      // Force refresh to bypass cache and get actual values
      setTimeout(() => fetchAll(true, currentPage), 500);
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
    // Emit custom event so Profile.js can update
    try {
      window.dispatchEvent(new CustomEvent('wishlistChanged', { detail: { updatedAt: Date.now() } }));
    } catch (err) {}
  };

  const startReadingSession = async () => {
    if (!user || !selectedBook) return;
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      await fetch(`${API_URL}/api/reading/session`, {
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

      // Also award a small number of points for starting a reading session
      try {
        const { data: rewardData, error: rewardError } = await supabase.rpc('award_reading_points', {
          p_book_id: selectedBook.id,
          p_past_paper_id: null,
          p_pages_read: 1,
          p_points: 3,
        });
        if (!rewardError && rewardData) {
          setPointsStats(prev => ({ ...(prev || {}), points: rewardData.points, streak_days: rewardData.streak }));
        } else if (rewardError?.code === 'PGRST116' || rewardError?.status === 404) {
          // RPC function doesn't exist yet - ignore silently
          console.debug('award_reading_points RPC not available');
        } else if (rewardError) {
          console.warn('award_reading_points error:', rewardError);
        }
      } catch (err) {
        // Network error or other failure - ignore silently
        console.debug('award_reading_points request failed:', err?.message);
      }
    } catch (e) {
      console.warn('start read session failed', e);
    }
  };

  const handleReadClick = async () => {
    if (!requireAuth('read')) return;
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
      // Validate comment data
      if (!commentData.text || commentData.text.trim() === '') {
        console.error('Comment text is required');
        return;
      }

      // Upload media to storage if present (mirror Pastpapers implementation)
      let mediaUrl = null;
      let mediaType = null;
      if (commentData.file) {
        const ext = commentData.file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase
          .storage
          .from('comment_media')
          .upload(path, commentData.file, {
            upsert: true,
            contentType: commentData.file.type,
          });
        if (uploadErr) throw uploadErr;

        const { data: publicData } = supabase
          .storage
          .from('comment_media')
          .getPublicUrl(path);
        mediaUrl = publicData?.publicUrl || null;
        mediaType = commentData.file.type.startsWith('image')
          ? 'image'
          : commentData.file.type.startsWith('video')
          ? 'video'
          : commentData.file.type.startsWith('audio')
          ? 'audio'
          : 'file';
      }

      const { data, error } = await supabase
        .from('book_comments')
        .insert({
          book_id: selectedBook.id,
          user_id: user.id,
          user_email: user.email,
          text: commentData.text.trim(),
          media_url: mediaUrl,
          media_type: mediaType,
        })
        .select()
        .single();

      if (error) throw error;

      // Optimistic update with persisted values
      setMediaComments(prev => ({
        ...prev,
        [selectedBook.id]: [
          ...(Array.isArray(prev[selectedBook.id]) ? prev[selectedBook.id] : []),
          {
            id: data.id,
            user: user.email || 'Anonymous',
            text: data.text,
            media: data.media_url ? { type: data.media_type, url: data.media_url } : null,
            timestamp: data.created_at,
            liked: false,
            replies: [],
            likes: 0,
          }
        ]
      }));
    } catch (error) {
      console.error('Failed to submit comment:', error?.message || error);
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
    if (!requireAuth('comment')) return;

    const isCurrentlyLiked = !!commentLikes[commentId];

    // Optimistic toggle
    setCommentLikes(prev => {
      const next = { ...prev };
      if (isCurrentlyLiked) {
        delete next[commentId];
      } else {
        next[commentId] = true;
      }
      return next;
    });

    try {
      if (isCurrentlyLiked) {
        await supabase
          .from('book_comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
      } else {
        const { error } = await supabase
          .from('book_comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id,
          });
        if (error && error.code !== '23505') {
          throw error;
        }
      }
    } catch (err) {
      console.error('Failed to toggle like for book comment:', err);
    }
  };

  const handleReplyToComment = async (commentId, replyData) => {
    if (!requireAuth('reply')) return;

    try {
      // Upload media to storage if present (mirror Pastpapers implementation)
      let mediaUrl = null;
      let mediaType = null;
      if (replyData.file) {
        const ext = replyData.file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase
          .storage
          .from('comment_media')
          .upload(path, replyData.file, {
            upsert: true,
            contentType: replyData.file.type,
          });
        if (uploadErr) throw uploadErr;

        const { data: publicData } = supabase
          .storage
          .from('comment_media')
          .getPublicUrl(path);
        mediaUrl = publicData?.publicUrl || null;
        mediaType = replyData.file.type.startsWith('image')
          ? 'image'
          : replyData.file.type.startsWith('video')
          ? 'video'
          : replyData.file.type.startsWith('audio')
          ? 'audio'
          : 'file';
      }

      // Save reply to database with plain URL values
      const { data, error } = await supabase
        .from('book_replies')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          user_email: user.email,
          text: replyData.text,
          media_url: mediaUrl,
          media_type: mediaType,
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
            text: data.text,
            media: data.media_url ? { type: data.media_type, url: data.media_url } : null,
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

  // Map recent book IDs to full book objects, keeping the same order
  const recentBooks = useMemo(() => {
    if (!recentBookIds.length || !books.length) return [];
    const byId = new Map(books.map((b) => [b.id, b]));
    return recentBookIds.map((id) => byId.get(id)).filter(Boolean);
  }, [recentBookIds, books]);

  if (loading && books.length === 0) {
    return (
      <div className="containerBKP">
        <header className="headerBKP">
          <h2 className="titleBKP">Books</h2>
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
      {/* Ads Banner */}
      <AdBanner placement="homepage" limit={1} />
      
      {/* Inline overrides: compact horizontal padding for small screens */}
      <style>{`
        .containerBKP{padding-left:12px;padding-right:12px}
        .headerBKP{margin-bottom:0}
        .controlsBKP{margin-bottom:0.5rem;margin-top:-0.5rem}
        @media (max-width: 768px){
          .containerBKP{padding-left:8px;padding-right:8px}
          .controlsBKP{padding-left:0;padding-right:0}
          .search-containerBKP{padding-left:0;padding-right:0}
          .filter-wrapperBKP{gap:8px}
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
          {/* Button removed - moved to Profile.js */}
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

          {((user?.role === 'admin' || user?.role === 'editor') || ['campuslives254@gmail.com', 'paltechsomalux@gmail.com'].includes(user?.email)) && (
            <button
              onClick={() => navigate('/books/admin')}
              className="filter-buttonBKP"
              title="Open Admin Dashboard"
            >
              {user?.role === 'admin' || ['campuslives254@gmail.com', 'paltechsomalux@gmail.com'].includes(user?.email) ? 'Admin' : 'Editor'}
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
              </div>
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

      {/* Recently Reading rail */}
      {user && recentBooks.length > 0 && (
        <section
          style={{
            marginTop: 10,
            marginBottom: 18,
            padding: '10px 4px',
            borderRadius: 12,
            background: '#0b1216',
            border: 'none',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div>
        
              <div style={{ fontSize: 12, color: '#64748b' }}>Reading</div>
            </div>
            <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
              <FiClock size={14} />
              <span>{recentBooks.length} book{recentBooks.length === 1 ? '' : 's'}</span>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 10,
              overflowX: 'auto',
              paddingBottom: 4,
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {recentBooks.map((book) => (
              <div
                key={book.id}
                onClick={() => viewBookDetails(book)}
                style={{
                  minWidth: 140,
                  maxWidth: 160,
                  background: '#020617',
                  borderRadius: 10,
                  border: 'none',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.7)',
                  padding: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  transition: 'box-shadow 0.3s ease'
                }}
              >
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '3/4',
                    borderRadius: 8,
                    overflow: 'hidden',
                    background: '#020617',
                    border: 'none',
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.6)',
                    marginBottom: 4
                  }}
                >
                  <img
                    src={book.bookImage}
                    alt={book.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {book.title}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {book.author}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  <span>
                    <FiEye size={12} /> {book.views?.toLocaleString?.() || 0}
                  </span>
                  <span>
                    <FiDownload size={12} /> {book.downloads?.toLocaleString?.() || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommendations Panel Toggle */}
      {user && recommendations.length > 0 && (
        <motion.button
          className="recommendations-toggleBKP"
          onClick={() => setShowRecommendations(!showRecommendations)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Recommendations for you"
          style={{ bottom: wishlist.length > 0 ? '70px' : '16px' }}
        >
          <FiThumbsUp size={24} color="#00a884" />
          <span className="rec-countBKP">{recommendations.length}</span>
        </motion.button>
      )}

      {wishlist.length > 0 && (
        <motion.button
          className="wishlist-toggleBKP"
          onClick={() => setShowWishlist(!showWishlist)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiBookmark size={24} />
          <span className="wishlist-countBKP">{wishlist.length}</span>
        </motion.button>
      )}

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
                    <img src={book.bookImage} alt={book.title} className="rec-book-imgBKP" loading="lazy" decoding="async" />
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
                    <img src={book.bookImage} alt={book.title} className="rec-book-imgBKP" loading="lazy" decoding="async" />
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
              {displayedBooks.map((book, index) => {
                // For mobile: Show ad after 3rd book (index 2)
                // For desktop: Show ad in middle position
                const isMobile = window.innerWidth < 768;
                const adPosition = isMobile ? 3 : Math.floor(displayedBooks.length / 2);
                
                // Render ad at the appropriate position
                if (index === adPosition && displayedBooks.length > 0) {
                  return (
                    <React.Fragment key={`ad-position-${index}`}>
                      {/* Grid Ad */}
                      <motion.div
                        key="grid-ad-0"
                        initial={isMounted ? { opacity: 0, y: 12 } : false}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        layout
                      >
                        <div className="book-cardBKP">
                          <AdBanner placement="grid-books" limit={5} />
                        </div>
                      </motion.div>
                      
                      {/* Current Book */}
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
                          onMouseEnter={() => prefetchResource(book.downloadUrl)}
                          onFocus={() => prefetchResource(book.downloadUrl)}
                          tabIndex={0}
                        >
                          <div className="badge-containerBKP">
                            {book.trending && (
                              <span className="trending-badgeBKP">
                                <FiTrendingUp size={12} /> Trending
                              </span>
                            )}
                          </div>

                          <img src={book.bookImage} alt={book.title} className="book-coverBKP" loading="lazy" decoding="async" />

                          <div className="card-contentBKP">
                            <h3 className="book-titleBKP">{book.title}</h3>
                            <p className="book-authorBKP">by {book.author}</p>

                            <div className="book-metaBKP">
                              <span className="ratingBKP">
                                <FiStar fill={book.rating > 0 ? "#fbbf24" : "none"} color={book.rating > 0 ? "#fbbf24" : "#64748b"} />
                                {book.rating > 0 ? book.rating.toFixed(1) : <span className="na-textBKP">N/A</span>}
                                {book.ratingCount > 0 && <span className="rating-countBKP">({book.ratingCount})</span>}
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
                            <span className="downloads-countBKP">
                              <FiDownload size={14} color="#64748b" /> <span className="countBKP">{book.downloads.toLocaleString()}</span>
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
                    </React.Fragment>
                  );
                }
                
                // Render regular book card
                return (
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
                      onMouseEnter={() => prefetchResource(book.downloadUrl)}
                      onFocus={() => prefetchResource(book.downloadUrl)}
                      tabIndex={0}
                    >
                      <div className="badge-containerBKP">
                        {book.trending && (
                          <span className="trending-badgeBKP">
                            <FiTrendingUp size={12} /> Trending
                          </span>
                        )}
                      </div>

                      <img src={book.bookImage} alt={book.title} className="book-coverBKP" loading="lazy" decoding="async" />

                      <div className="card-contentBKP">
                        <h3 className="book-titleBKP">{book.title}</h3>
                        <p className="book-authorBKP">by {book.author}</p>

                        <div className="book-metaBKP">
                          <span className="ratingBKP">
                            <FiStar fill={book.rating > 0 ? "#fbbf24" : "none"} color={book.rating > 0 ? "#fbbf24" : "#64748b"} />
                            {book.rating > 0 ? book.rating.toFixed(1) : <span className="na-textBKP">N/A</span>}
                            {book.ratingCount > 0 && <span className="rating-countBKP">({book.ratingCount})</span>}
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
                          <FiEye size={10} color="#64748b" /> <span className="countBKP">{book.views.toLocaleString()}</span>
                        </span>
                        <span className="downloads-countBKP">
                          <FiDownload size={10} color="#64748b" /> <span className="countBKP">{book.downloads.toLocaleString()}</span>
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(book.id);
                          }}
                          className={`wishlist-buttonBKP ${wishlist.includes(book.id) ? 'activeBKP' : ''}`}
                        >
                          <FiBookmark
                            size={10}
                            fill={wishlist.includes(book.id) ? '#6366f1' : 'none'}
                            color={wishlist.includes(book.id) ? '#6366f1' : '#64748b'}
                          />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
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
                  loading="lazy"
                  decoding="async"
                  style={{ width: '40%', height: '150px', margin: '0 auto 0.1px' }}
                />
                <h2>{selectedBook.title}</h2>
                <p>by {selectedBook.author}</p>

                <div className="stats-containerBKP" style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px', flexWrap: 'wrap', color: '#cbd5e1', fontSize: '0.95rem' }}>
                  <span><strong>Rating:</strong> {selectedBook.rating ? selectedBook.rating.toFixed(1) : 'N/A'} ({selectedBook.ratingCount || 0})</span>
                  <span>•</span>
                  <span><strong>Downloads:</strong> {selectedBook.downloads_count || 0}</span>
                  <span>•</span>
                  <span><strong>Views:</strong> {selectedBook.views_count || 0}</span>
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
                <div className="actions-primary-rowBKP">
                  <Download
                  book={selectedBook}
                  variant="full"
                  onDownloadStart={async () => {
                    if (!requireAuth('download')) return false;

                    // Log per-user download (analytics) - with better error handling
                    try {
                      if (user && selectedBook && selectedBook.id) {
                        const downloadRecord = {
                          user_id: user.id,
                          book_id: selectedBook.id,
                          downloaded_at: new Date().toISOString(),
                          user_agent: navigator.userAgent || 'unknown'
                        };

                        const { data, error } = await supabase
                          .from('book_downloads')
                          .insert([downloadRecord])
                          .select();

                        if (error) {
                          console.error('❌ Failed to log book download:', {
                            error: error.message,
                            code: error.code,
                            details: error.details,
                            hint: error.hint,
                            context: { userId: user.id, bookId: selectedBook.id }
                          });
                        } else {
                          console.log('✅ Download logged successfully:', data);
                          
                          // Increment count using the SQL function (bypasses RLS)
                          try {
                            const { data: result, error: rpcError } = await supabase
                              .rpc('increment_book_downloads', { p_book_id: selectedBook.id });
                            
                            if (rpcError) {
                              console.error('❌ RPC increment failed, trying direct update:', {
                                message: rpcError.message,
                                code: rpcError.code,
                                details: rpcError.details
                              });
                              
                              // Fallback: direct update
                              const { data: bookData } = await supabase
                                .from('books')
                                .select('downloads_count')
                                .eq('id', selectedBook.id)
                                .single();
                              
                              const currentCount = bookData?.downloads_count || 0;
                              const newCount = currentCount + 1;
                              
                              const { error: updateError } = await supabase
                                .from('books')
                                .update({ downloads_count: newCount })
                                .eq('id', selectedBook.id);
                              
                              if (updateError) {
                                console.error('❌ Count UPDATE FAILED:', {
                                  message: updateError.message,
                                  code: updateError.code,
                                  details: updateError.details,
                                  status: updateError.status
                                });
                              } else {
                                console.log(`✅ Count incremented (fallback): ${currentCount} → ${newCount}`);
                                setSelectedBook(prev => ({
                                  ...prev,
                                  downloads_count: newCount
                                }));
                              }
                            } else {
                              const newCount = result || (selectedBook.downloads_count || 0) + 1;
                              console.log(`✅ Count incremented (RPC): ${selectedBook.downloads_count || 0} → ${newCount}`);
                              setSelectedBook(prev => ({
                                ...prev,
                                downloads_count: newCount
                              }));
                            }
                          } catch (countError) {
                            console.error('⚠️ Count increment exception:', countError);
                          }
                        }
                      }
                    } catch (error) {
                      console.error('Exception while logging book download:', error);
                    }

                    return true;
                  }}
                />
                  <button
                    className="btn-readBKP btn-action-primaryBKP"
                    onClick={handleReadClick}
                    title="Read this book"
                  >
                    <FiBook size={16} /> Read
                  </button>
                  <button
                    className="btn-readBKP btn-action-primaryBKP btn-mark-hiddenBKP"
                    onClick={() => toggleWishlist(selectedBook.id)}
                    title={wishlist.find(w => w.id === selectedBook.id) ? "Remove from marked" : "Mark for later"}
                  >
                    <FiBookmark size={16} fill={wishlist.find(w => w.id === selectedBook.id) ? "currentColor" : "none"} /> {wishlist.find(w => w.id === selectedBook.id) ? "Marked" : "Mark"}
                  </button>
                  <button
                    className="btn-readBKP btn-action-primaryBKP"
                    onClick={() => setShowRatingModal(true)}
                    title="Rate this book"
                  >
                    <FiStar size={16} /> {userRating ? `${userRating}★` : 'Rate'}
                  </button>
                </div>

                <div className="actions-social-sectionBKP">
                  <div className="social-label-mobileBKP">Share</div>
                  <div className="share-rowBKP">
                    <button className="share-btnBKP share-btn-copyBKP" title="Copy Link" onClick={() => handleShare('copy', selectedBook)}><FiCopy size={14} /><span className="btn-label-mobileBKP">Copy</span></button>
                    <button className="share-btnBKP share-btn-xBKP" title="Share on X" onClick={() => handleShare('twitter', selectedBook)}><span className="x-text-icon">𝕏</span><span className="btn-label-mobileBKP">X</span></button>
                    <button className="share-btnBKP share-btn-facebookBKP" title="Facebook" onClick={() => handleShare('facebook', selectedBook)}><FaFacebook size={14} /><span className="btn-label-mobileBKP">Facebook</span></button>
                    <button className="share-btnBKP share-btn-linkedinBKP" title="LinkedIn" onClick={() => handleShare('linkedin', selectedBook)}><FaLinkedin size={14} /><span className="btn-label-mobileBKP">LinkedIn</span></button>
                    <button className="share-btnBKP share-btn-emailBKP" title="Email" onClick={() => handleShare('email', selectedBook)}><FiMail size={14} /><span className="btn-label-mobileBKP">Email</span></button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {showReader && selectedBook && (
        <SimpleScrollReader
          src={selectedBook.downloadUrl}
          title={selectedBook.title}
          author={selectedBook.author}
          sampleText={selectedBook.sampleText || selectedBook.description}
          onClose={() => setShowReader(false)}
        />
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
        }}
        user={user}
        onSubscribed={async (sub) => {
          setSubscription(sub);
          setShowSubscriptionModal(false);
        }}
      />

      <RatingModal
        isOpen={showRatingModal && selectedBook !== null}
        onClose={() => setShowRatingModal(false)}
        book={selectedBook}
        onRate={handleRating}
        existingRating={userRating}
      />
    </div>
  );
};