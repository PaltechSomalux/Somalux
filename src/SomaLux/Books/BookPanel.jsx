// src/BookPanel.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from './supabaseClient';
import { clearSessionCache } from '../../Services/utils/sessionManager';
import { useGlobalAuth } from '../../Services/context/GlobalAuthProvider';
import { Download } from './Download';
import { AuthModal } from './AuthModal';
import PremiumPanel from '../../premium-features/PremiumPanel';
import { AdBanner } from '../../Ads/AdBanner';
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
  FiInfo,
  FiLink,
} from 'react-icons/fi';
import {
  FaTwitter,
  FaFacebook,
  FaLinkedin,
  FaWhatsapp,
} from 'react-icons/fa';
import {
  SiX,
  SiFacebook,
  SiLinkedin,
  SiWhatsapp,
  SiGmail,
  SiGoogledrive,
} from 'react-icons/si';
import { motion, AnimatePresence } from 'framer-motion';
import SimpleScrollReader from './SimpleScrollReader';
import { CommentsSection } from './CommentsSection';
import { BiCommentDetail } from 'react-icons/bi';
import { API_URL } from '../../config';
import './BookPanel.css';
import '../../Admin/admin.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { booksCache, categoriesCache, statsCache } from './utils/cacheManager';
import { fetchUserRankingsAdmin } from '../../Admin/api';
import { perfOptimizer } from './utils/performanceOptimizer';
import { indexedDBCache } from './utils/indexedDBCache';
import { fetchBooksOptimized, fetchMinimalBooks, searchBooksOptimized } from './utils/optimizedQueries';
 

const ReactionButtonsBKP = ({
  itemId,
  loves,
  onLove,
  isLoved
}) => {
  const [bubbles, setBubbles] = React.useState([]);
  const containerRef = React.useRef(null);

  const handleLoveClick = (e) => {
    e.stopPropagation();
    onLove(itemId);
    
    // Create more subtle floating bubbles with random offsets
    const newBubbles = [];
    const hearts = ['❤️', '💕', '💖', '💗', '💓', '💞', '💝', '💟'];
    
    for (let i = 0; i < 10; i++) {
      // Random horizontal offset between -70 and 70
      const randomOffset = (Math.random() - 0.5) * 140;
      
      newBubbles.push({
        id: Math.random(),
        heart: hearts[i % hearts.length],
        delay: i * 60,
        randomOffset: randomOffset
      });
    }
    setBubbles(newBubbles);
    
    // Clear bubbles after animation
    setTimeout(() => setBubbles([]), 4200);
  };

  return (
    <div 
      ref={containerRef}
      style={{ 
        position: 'relative', 
        display: 'inline-flex',
        overflow: 'visible'
      }}
    >
      <button
        className={`love-buttonBKP ${isLoved ? 'activeBKP' : ''}`}
        onClick={handleLoveClick}
        title="Love this book"
      >
        {isLoved ? <FaHeart color="red" size={10} /> : <FaRegHeart size={10} />}
        <span className="countBKP">{loves || 0}</span>
      </button>
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="love-bubble heart"
          style={{
            animationDelay: `${bubble.delay}ms`,
            '--random-x': `${bubble.randomOffset}px`
          }}
        >
          {bubble.heart}
        </div>
      ))}
    </div>
  );
};

// ⚡ Memoized BookCard component to prevent re-renders
const BookCard = React.memo(({
  book,
  onClick,
  onMouseEnter,
  onFocus,
  bookLove,
  onLove,
  isLoved,
  onWishlistToggle,
  isBookmarked,
  prefetchResource,
  isMounted
}) => {
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
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onFocus={onFocus}
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
          <p className="book-authorBKP">
            {book.author && book.author.trim() ? `by ${book.author.trim()}` : 'by Unknown Author'}
          </p>

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
            loves={bookLove || 0}
            onLove={onLove}
            isLoved={isLoved}
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
              onWishlistToggle(book.id);
            }}
            className={`wishlist-buttonBKP ${isBookmarked ? 'activeBKP' : ''}`}
          >
            <FiBookmark
              size={14}
              fill={isBookmarked ? '#6366f1' : 'none'}
              color={isBookmarked ? '#6366f1' : '#64748b'}
            />
          </button>
        </div>
      </div>
    </motion.div>
  );
});

BookCard.displayName = 'BookCard';

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
  
  // Get auth state from global provider
  const { user, loading: authLoading } = useGlobalAuth();
  
  const [categoryFilterName, setCategoryFilterName] = useState(null);
  const [books, setBooks] = useState([]);
  const [displayedBooks, setDisplayedBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryFilterId, setCategoryFilterId] = useState(null);
  const [totalBooks, setTotalBooks] = useState(0);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageCacheStatus, setPageCacheStatus] = useState({}); // page -> 'cached'|'remote'|'loading'
  const [hasMore, setHasMore] = useState(true);
  const BOOKS_PER_PAGE = 31;
  const [filteredByCategory, setFilteredByCategory] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [showWishlist, setShowWishlist] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState(demoMode);
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
  const [readerUrl, setReaderUrl] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
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

  // Sharing modal state
  const [showSharingModal, setShowSharingModal] = useState(false);
  


  // Admin notification state
  const [pendingSubmissions, setPendingSubmissions] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [pendingAds, setPendingAds] = useState(0);

  // Bulk download selection state
  const [selectedBooksForDownload, setSelectedBooksForDownload] = useState(new Set());
  const [selectAllBooks, setSelectAllBooks] = useState(false);
  const [bulkDownloadMode, setBulkDownloadMode] = useState(false);
  const [downloadingBooks, setDownloadingBooks] = useState({});

  // Reading carousel state
  const [animationCycle, setAnimationCycle] = useState(0);
  const [shuffledBooks, setShuffledBooks] = useState([]);
  const [fullScreenBook, setFullScreenBook] = useState(null);
  const [isShuffling, setIsShuffling] = useState(true);
  const [showRemovalNotification, setShowRemovalNotification] = useState(false);
  const [removedBookIds, setRemovedBookIds] = useState([]);

  // Track scroll overflow for each category grid
  const [gridScrollStates, setGridScrollStates] = useState({});

  // Category shuffling state
  const [categoryOrder, setCategoryOrder] = useState([]);
  const isCategoryShufflingRef = useRef(false);
  
  // Grid books shuffling state - track shuffled order for each category
  const [categoryShuffledBooks, setCategoryShuffledBooks] = useState({});
  const isGridShufflingRef = useRef(false);
  const isHoveringRef = useRef(false); // Track if user is hovering over books
  const shuffleTimersRef = useRef(null);
  const longPressTimeoutRef = useRef(null);
  const commentsRef = useRef(null);

  const CACHE_TTL_MS = 5 * 60 * 1000;

  // Load removed book IDs from localStorage on mount
  useEffect(() => {
    const removed = JSON.parse(localStorage.getItem('removedBookIds') || '[]');
    setRemovedBookIds(removed);
  }, []);

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

  // ⚡ Debounce search term to avoid excessive filtering on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to page 1 on search
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Update Open Graph meta tags for sharing
  useEffect(() => {
    // OG tag updates removed - book popup feature removed
  }, []);

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

  // ⚡ Memoized inline styles to prevent object recreation on every render (critical for perf)
  const modalStyles = useMemo(() => ({
    overlay: { position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', zIndex: 1100 },
    modal: { width: 360, background: '#0b1220', color: '#e6eef7', padding: 20, borderRadius: 8, boxShadow: '0 8px 30px rgba(0,0,0,0.6)', textAlign: 'center' },
    title: { margin: 0, marginBottom: 8 },
    description: { margin: 0, marginBottom: 18, color: '#9ca3af' },
    buttonGroup: { display: 'flex', gap: 8, justifyContent: 'center' },
    loadingContainer: { minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    loadingText: { color: '#6b7280', fontSize: 14 },
    paginationContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '24px', marginBottom: '20px' },
    paginationText: { fontSize: '13px', fontWeight: '500', color: '#666', minWidth: '80px', textAlign: 'center' },
  }), []);

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
    // Support both full URLs and storage paths
    let publicUrl = null;
    if (filePath) {
      if (/^https?:\/\//.test(filePath)) {
        // Already a full HTTP URL
        publicUrl = filePath;
      } else if (filePath.includes('supabase') || filePath.includes('storage')) {
        // Supabase storage path - construct full URL
        publicUrl = filePath.startsWith('/') ? `https://wuwlnawtuhjoubfkdtgc.supabase.co/storage/v1/object/public${filePath}` : `https://wuwlnawtuhjoubfkdtgc.supabase.co/storage/v1/object/public/${filePath}`;
      } else if (!filePath.startsWith('/')) {
        // Path without leading slash - assume it's in elib-books bucket
        publicUrl = `https://wuwlnawtuhjoubfkdtgc.supabase.co/storage/v1/object/public/elib-books/${filePath}`;
      } else {
        // Path with leading slash - use as-is with public URL
        publicUrl = `https://wuwlnawtuhjoubfkdtgc.supabase.co/storage/v1/object/public${filePath}`;
      }
    }
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
      
      // Fetch ALL books sorted by engagement (downloads, views, likes)
      // This ensures books are displayed by highest engagement dynamically
      const result = await fetchBooksOptimized(supabase, 1, 50000);
      
      const { books: rows, categories: cats, totalCount: count } = result;
      const catMap = new Map((cats || []).map(c => [c.id, c.name]));

      // Calculate trending threshold - only top 2 books are trending
      const scores = (rows || []).map(r => (r.views_count || 0) + 2 * (r.downloads_count || 0));
      scores.sort((a, b) => b - a);
      const trendingThreshold = scores.length > 2 ? scores[1] : Infinity;

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

  // Auth state listener - load user ranking and setup profile realtime updates
  // Session initialization is now handled globally by GlobalAuthProvider
  useEffect(() => {
    if (!user?.id) {
      setLoadingUser(false);
      setUserRanking(null);
      return;
    }

    // Load ranking for this user (admin rankings may be shaped differently)
    (async () => {
      try {
        setLoadingUser(true);
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
            return candidates.includes(String(user.id)) || (user.email && candidates.includes(String(user.email)));
          }) || null;
        }

        const norm = normalizeRanking(match);

        // Fetch uploads count for this user to support fallback scoring
        let uploadsCount = 0;
        try {
          const { count, error: uploadsErr } = await supabase
            .from('books')
            .select('id', { count: 'exact', head: true })
            .eq('uploaded_by', user.id);
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
          // Fetch profile for fallback calculation
          const { data: profile } = await supabase
            .from('profiles')
            .select('created_at, last_active_at')
            .eq('id', user.id)
            .single();

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
      } finally {
        setLoadingUser(false);
      }
    })();

    // Setup realtime listener for profile changes (e.g., role updates)
    const profileSubscription = supabase
      .channel(`public:profiles:id=eq.${user.id}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('[BookPanel] Profile updated:', payload);
          if (payload.new?.role) {
            // Profile changed - the global auth provider will handle this update
            // Just log for now
            console.log('[BookPanel] Role or subscription updated');
          }
        }
      )
      .subscribe();

    return () => {
      if (profileSubscription?.unsubscribe && typeof profileSubscription.unsubscribe === 'function') {
        try { profileSubscription.unsubscribe(); } catch (e) {}
      }
    };
  }, [user?.id, user?.email]);

  // Fetch pending submissions count for admins
  useEffect(() => {
    if (!user) return;

    const ADMIN_EMAILS = ['campuslives254@gmail.com', 'paltechsomalux@gmail.com'];
    const isAdmin = user?.role === 'admin' || ADMIN_EMAILS.includes(user?.email);
    
    if (!isAdmin) return;

    const fetchSubmissionsCount = async () => {
      try {
        const { count: bookCount } = await supabase
          .from('book_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending');
        
        const { count: paperCount } = await supabase
          .from('past_paper_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending');

        const { count: universityCount } = await supabase
          .from('universities')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending');

        const total = (bookCount || 0) + (paperCount || 0) + (universityCount || 0);
        setPendingSubmissions(total);
      } catch (err) {
        console.warn('Failed to fetch pending submissions count:', err);
      }
    };

    fetchSubmissionsCount();

    const fetchRequestsCount = async () => {
      try {
        const { count } = await supabase
          .from('requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending');
        setPendingRequests(count || 0);
      } catch (err) {
        console.warn('Failed to fetch pending requests count:', err);
      }
    };

    fetchRequestsCount();

    const fetchPendingAds = async () => {
      try {
        // Fetch pending requests and filter ad submissions
        const res = await fetch(`${API_URL}/api/requests?status=pending`);
        const json = await res.json();
        const list = Array.isArray(json.requests) ? json.requests : (Array.isArray(json) ? json : []);
        const pendingAdsFromRequests = list.filter(r => (r.type === 'user_ad_submission' || r.ad_type) && r.status === 'pending').length || 0;

        // Also count pending rows in user_ads table
        let pendingUserAdsCount = 0;
        try {
          const { data: userAdsData, error: userAdsError } = await supabase
            .from('user_ads')
            .select('id')
            .eq('status', 'pending');
          if (!userAdsError && Array.isArray(userAdsData)) pendingUserAdsCount = userAdsData.length;
        } catch (e) {
          console.warn('Failed to fetch user_ads pending count:', e?.message || e);
        }

        setPendingAds((pendingAdsFromRequests || 0) + (pendingUserAdsCount || 0));
      } catch (err) {
        console.warn('Failed to fetch pending ads:', err);
      }
    };

    fetchPendingAds();

    // Poll every 30 seconds for updates
    const interval = setInterval(() => { fetchSubmissionsCount(); fetchRequestsCount(); fetchPendingAds(); }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Track user activity - updates last_active_at for metrics
  useEffect(() => {
    if (!user?.id) return;

    const trackActivity = async () => {
      try {
        await fetch(`${API_URL}/api/user/activity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
      } catch (e) {
        console.warn('Failed to track activity:', e);
      }
    };

    // Track immediately on mount
    trackActivity();

    // Then track every 5 minutes during active session
    const interval = setInterval(trackActivity, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user?.id]);

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

      // Load comments for all books with user profile data
      const { data: comments } = await supabase
        .from('book_comments')
        .select('*, profiles!user_id(full_name, display_name, email)')
        .order('created_at', { ascending: false });

      // Load all replies with user profile data
      const { data: replies } = await supabase
        .from('book_replies')
        .select('*, profiles!user_id(full_name, display_name, email)')
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
              user: reply.profiles?.full_name || reply.profiles?.display_name || reply.user_name || reply.user_email?.split('@')[0] || 'Anonymous',
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
            user: comment.profiles?.full_name || comment.profiles?.display_name || comment.user_name || comment.user_email?.split('@')[0] || 'Anonymous',
            userId: comment.user_id,
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

  // Load comments for a specific book
  const loadCommentsForBook = async (bookId) => {
    if (!bookId) return;

    try {
      console.log('Loading comments for book:', bookId);
      
      // Load comments for this specific book
      const { data: comments, error: commentsError } = await supabase
        .from('book_comments')
        .select('*')
        .eq('book_id', bookId)
        .order('created_at', { ascending: false });

      if (commentsError) {
        const errorMsg = commentsError?.message || JSON.stringify(commentsError);
        console.error('Error fetching comments:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('Loaded comments for book', bookId, ':', comments?.length || 0, 'comments');

      if (comments && comments.length > 0) {
        const commentIds = comments.map(c => c.id);
        const userIds = comments.map(c => c.user_id).filter(Boolean);

        // Load user profiles for these comments
        let profileMap = {};
        if (userIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, display_name, email')
            .in('id', [...new Set(userIds)]);

          if (!profilesError && profiles) {
            profiles.forEach(p => {
              profileMap[p.id] = p;
            });
          }
        }

        // Load replies for these comments
        const { data: replies, error: repliesError } = await supabase
          .from('book_replies')
          .select('*')
          .in('comment_id', commentIds)
          .order('created_at', { ascending: true });

        if (repliesError) {
          const errorMsg = repliesError?.message || JSON.stringify(repliesError);
          console.error('Error fetching replies:', errorMsg);
          throw new Error(errorMsg);
        }

        // Load reply user profiles
        const replyUserIds = replies?.map(r => r.user_id).filter(Boolean) || [];
        if (replyUserIds.length > 0) {
          const { data: replyProfiles } = await supabase
            .from('profiles')
            .select('id, full_name, display_name, email')
            .in('id', [...new Set(replyUserIds)]);

          if (replyProfiles) {
            replyProfiles.forEach(p => {
              profileMap[p.id] = p;
            });
          }
        }

        // Load likes for these comments
        const { data: commentLikesRows, error: likesError } = await supabase
          .from('book_comment_likes')
          .select('comment_id, user_id')
          .in('comment_id', commentIds);

        if (likesError) {
          const errorMsg = likesError?.message || JSON.stringify(likesError);
          console.error('Error fetching likes:', errorMsg);
          throw new Error(errorMsg);
        }

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

            const profile = profileMap[reply.user_id];
            repliesByComment[reply.comment_id].push({
              id: reply.id,
              user: profile?.full_name || profile?.display_name || reply.user_name || reply.user_email?.split('@')[0] || 'Anonymous',
              text: reply.text,
              timestamp: reply.created_at,
              liked: false,
              media,
            });
          });
        }

        // Build like counts and current user's liked map
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

        // Map comments
        const mappedComments = comments.map(comment => {
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

          const profile = profileMap[comment.user_id];
          return {
            id: comment.id,
            user: profile?.full_name || profile?.display_name || comment.user_name || comment.user_email?.split('@')[0] || 'Anonymous',
            userId: comment.user_id,
            text: comment.text,
            media,
            timestamp: comment.created_at,
            liked: userLikedMap[comment.id] || false,
            replies: repliesByComment[comment.id] || [],
            likes: likeCountsExcludingSelf[comment.id] || 0,
          };
        });

        // Update state with comments for this book
        setMediaComments(prev => ({
          ...prev,
          [bookId]: mappedComments,
        }));

        // Update likes map
        setCommentLikes(prev => ({
          ...prev,
          ...userLikedMap,
        }));

        console.log('Successfully loaded and mapped comments for book', bookId);
      } else {
        // No comments for this book
        console.log('No comments found for book', bookId);
        setMediaComments(prev => ({
          ...prev,
          [bookId]: [],
        }));
      }
    } catch (error) {
      const errorMsg = error?.message || JSON.stringify(error);
      console.error('Failed to load comments for book:', errorMsg);
      // Set empty comments on error so modal still works
      setMediaComments(prev => ({
        ...prev,
        [bookId]: [],
      }));
    }
  };



  // Bulk download functions
  const toggleBookSelection = (bookId) => {
    const newSelected = new Set(selectedBooksForDownload);
    if (newSelected.has(bookId)) {
      newSelected.delete(bookId);
    } else {
      newSelected.add(bookId);
    }
    setSelectedBooksForDownload(newSelected);
    setSelectAllBooks(newSelected.size === displayedBooks.length && displayedBooks.length > 0);
  };

  const toggleSelectAllBooks = () => {
    if (selectAllBooks) {
      setSelectedBooksForDownload(new Set());
      setSelectAllBooks(false);
    } else {
      const allIds = new Set(displayedBooks.map(b => b.id));
      setSelectedBooksForDownload(allIds);
      setSelectAllBooks(true);
    }
  };

  const downloadSelectedBooks = async () => {
    if (selectedBooksForDownload.size === 0) return;

    const booksToDownload = displayedBooks.filter(b => selectedBooksForDownload.has(b.id));
    
    for (const book of booksToDownload) {
      // Use the existing Download component logic
      setDownloadingBooks(prev => ({ ...prev, [book.id]: true }));
      
      try {
        // Create a temporary download element
        const link = document.createElement('a');
        link.href = book.downloadUrl;
        link.download = `${book.title.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error(`Failed to download ${book.title}:`, error);
      } finally {
        setDownloadingBooks(prev => ({ ...prev, [book.id]: false }));
      }

      // Add delay between downloads to avoid browser overload
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const cancelBulkDownload = () => {
    setSelectedBooksForDownload(new Set());
    setSelectAllBooks(false);
    setBulkDownloadMode(false);
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
          // Invalidate cache and force refresh (DON'T reset page)
          booksCache.remove('all_books_page_1');
          booksCache.remove('total_books_count');
          fetchAll(true, currentPage);
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
          fetchAll(true, currentPage);
        })
        .subscribe((status) => {
          console.log('📡 Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Real-time subscription active');
            if (poller) { clearInterval(poller); poller = null; }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('⚠️ Real-time subscription failed, using polling');
            if (!poller) poller = setInterval(() => fetchAll(true), 30000); // Poll every 30s
          }
        });
    } catch (err) {
      console.warn('Realtime unavailable, falling back to polling.', err);
      if (!poller) poller = setInterval(() => fetchAll(true), 30000);
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
          .select('id, title, author, description, category_id, categories(id,name), year, language, isbn, cover_image_url, file_url, created_at, views_count, downloads_count, likes_count, pages, publisher, rating, rating_count')
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
          .select('id, title, author, description, category_id, categories(id,name), year, language, isbn, cover_image_url, file_url, created_at, views_count, downloads_count, likes_count, pages, publisher, rating, rating_count')
          .eq('category_id', categoryFilterId)
          .limit(1000);

        if (error) {
          console.warn('Category-specific fetch returned error:', error);
          if (mounted) setFilteredByCategory(null);
          return;
        }

        const { data: cats } = await supabase.from('categories').select('id,name');
        const catMap = new Map((cats || []).map(c => [c.id, c.name]));
        
        // Import calculateEngagementScore for sorting
        const { calculateEngagementScore } = await import('./utils/optimizedQueries');
        
        // Sort books by engagement (downloads, views, likes) before mapping
        const sortedRows = (rows || []).sort((a, b) => {
          const scoreA = calculateEngagementScore(a);
          const scoreB = calculateEngagementScore(b);
          return scoreB - scoreA; // Highest engagement first
        });
        
        const mapped = sortedRows.map(r => mapRowToUi(r, catMap, 50));
        if (mounted) {
          setFilteredByCategory(mapped);
          console.log('BookPanel: fetched category-specific books sorted by engagement', { categoryFilterId, count: mapped.length });
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

    if (debouncedSearchTerm) {
      result = result.filter(book =>
        book.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        book.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        book.genre.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
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
  }, [books, debouncedSearchTerm, activeFilter, sortBy, wishlist, categoryFilterId, focusedBookId]);

  useEffect(() => {
    // Group books by category first
    const groupedByCategory = filteredBooks.reduce((acc, book) => {
      const category = book.genre || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(book);
      return acc;
    }, {});

    // Convert to array and paginate by categories
    const categories = Object.entries(groupedByCategory);
    const CATEGORIES_PER_PAGE = 5; // Show up to 5 categories per page
    const start = (currentPage - 1) * CATEGORIES_PER_PAGE;
    const paginatedCategories = categories.slice(start, start + CATEGORIES_PER_PAGE);

    // Flatten all books from paginated categories
    const booksToDisplay = paginatedCategories.flatMap(([_, booksInCategory]) => booksInCategory);
    setDisplayedBooks(booksToDisplay);
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
          .select('id, title, author, description, category_id, categories(id,name), year, language, isbn, cover_image_url, file_url, created_at, views_count, downloads_count, likes_count, pages, publisher, rating, rating_count')
          .or(`title.ilike.%${q}%,author.ilike.%${q}%,description.ilike.%${q}%,isbn.ilike.%${q}%`)
          .range(from, to)
      ]);

      const catMap = new Map((cats || []).map(c => [c.id, c.name]));
      
      // Import and sort by engagement score
      const { calculateEngagementScore } = await import('./utils/optimizedQueries');
      const sortedRows = (rows || []).sort((a, b) => {
        const scoreA = calculateEngagementScore(a);
        const scoreB = calculateEngagementScore(b);
        return scoreB - scoreA; // Highest engagement first
      });
      
      const mapped = sortedRows.map(r => mapRowToUi(r, catMap, 50));

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
        .select('id, title, author, description, category_id, categories(id,name), year, language, isbn, cover_image_url, file_url, created_at, views_count, downloads_count, likes_count, pages, publisher, rating, rating_count')
        .or(`title.ilike.%${q}%,author.ilike.%${q}%,description.ilike.%${q}%,isbn.ilike.%${q}%`)
        .range(from, from + BOOKS_PER_PAGE - 1);
      const { data: cats } = await supabase.from('categories').select('id, name');
      const catMap = new Map((cats || []).map(c => [c.id, c.name]));
      
      // Sort by engagement score
      const { calculateEngagementScore } = await import('./utils/optimizedQueries');
      const sortedRows = (rows || []).sort((a, b) => {
        const scoreA = calculateEngagementScore(a);
        const scoreB = calculateEngagementScore(b);
        return scoreB - scoreA; // Highest engagement first
      });
      
      const mapped = sortedRows.map(r => mapRowToUi(r, catMap, 50));
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
    
    // Group books by category and calculate pages based on categories
    const groupedByCategory = filteredBooks.reduce((acc, book) => {
      const category = book.genre || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(book);
      return acc;
    }, {});
    const CATEGORIES_PER_PAGE = 5;
    const totalCategories = Object.keys(groupedByCategory).length;
    const computedTotalPages = Math.max(1, Math.ceil((totalCategories) / CATEGORIES_PER_PAGE));
    
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





  // Book grid scroll handlers - per grid element
  const createScrollHandler = (element) => {
    if (!element) return { canLeft: false, canRight: true };
    const { scrollLeft, scrollWidth, clientWidth } = element;
    return {
      canLeft: scrollLeft > 10,
      canRight: scrollLeft < scrollWidth - clientWidth - 10
    };
  };

  const scrollGridLeft = (element) => {
    if (element) {
      element.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollGridRight = (element) => {
    if (element) {
      element.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const handleGridScroll = (e) => {
    // Update scroll state and button visibility
    const target = e.target;
    const gridId = target?.id;
    if (target && gridId) {
      const { scrollLeft, scrollWidth, clientWidth } = target;
      const hasOverflow = scrollWidth > clientWidth;
      const canScrollLeft = scrollLeft > 10;
      const canScrollRight = scrollLeft < scrollWidth - clientWidth - 10;
      
      setGridScrollStates(prev => ({
        ...prev,
        [gridId]: { hasOverflow, canScrollLeft, canScrollRight }
      }));
    }
  };

  // Check grid scroll state on mount and on content changes
  const checkGridScroll = useCallback((gridId) => {
    const grid = document.getElementById(gridId);
    if (grid) {
      const { scrollLeft, scrollWidth, clientWidth } = grid;
      const hasOverflow = scrollWidth > clientWidth;
      const canScrollLeft = scrollLeft > 10;
      const canScrollRight = scrollLeft < scrollWidth - clientWidth - 10;
      
      setGridScrollStates(prev => ({
        ...prev,
        [gridId]: { hasOverflow, canScrollLeft, canScrollRight }
      }));
    }
  }, []);

  // Check all grids for overflow after books are displayed
  useEffect(() => {
    const timer = setTimeout(() => {
      // Get all grid IDs and check them
      const grids = document.querySelectorAll('[id^="grid-"]');
      grids.forEach(grid => {
        checkGridScroll(grid.id);
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [displayedBooks, checkGridScroll]);

  // Add window resize listener to recheck grids
  useEffect(() => {
    const handleResize = () => {
      const grids = document.querySelectorAll('[id^="grid-"]');
      grids.forEach(grid => {
        checkGridScroll(grid.id);
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkGridScroll]);

  // Memoized hover handlers to prevent shuffling during user interaction
  const handleGridMouseEnter = useCallback(() => {
    isHoveringRef.current = true;
  }, []);

  const handleGridMouseLeave = useCallback(() => {
    isHoveringRef.current = false;
  }, []);

  // Remove book from currently reading list - persist to localStorage
  const removeFromRecentBooks = useCallback((bookId) => {
    const bookIdStr = String(bookId);
    setShuffledBooks(prev => prev.filter(b => String(b.id) !== bookIdStr));
    // Add to removed books list
    setRemovedBookIds(prev => {
      const updated = [...prev, bookIdStr];
      localStorage.setItem('removedBookIds', JSON.stringify(updated));
      return updated;
    });
    // Show removal notification
    setShowRemovalNotification(true);
    // Auto-hide after 2 seconds
    setTimeout(() => {
      setShowRemovalNotification(false);
    }, 2000);
  }, []);

  // Handle long-press to remove from currently reading
  const handleBookLongPress = useCallback((e, bookId) => {
    e.preventDefault();
    e.stopPropagation();
    removeFromRecentBooks(bookId);
  }, [removeFromRecentBooks]);

  // Initialize category order - shuffle only ONE category during refresh
  useEffect(() => {
    if (displayedBooks.length === 0) return;

    const groupedByCategory = displayedBooks.reduce((acc, book) => {
      const category = book.genre || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      return acc;
    }, {});

    const categories = Object.keys(groupedByCategory);
    const initialOrder = [...Array(categories.length).keys()];
    
    // Initialize in order, then shuffle only ONE category instead of all
    setCategoryOrder(prevOrder => {
      let newOrder = [...initialOrder];
      
      // On first load, keep the sequential order
      // On refresh, only shuffle one random category
      if (prevOrder.length === initialOrder.length) {
        const categoryIndex = Math.floor(Math.random() * newOrder.length);
        const newPosition = Math.floor(Math.random() * newOrder.length);
        
        if (categoryIndex !== newPosition) {
          const [category] = newOrder.splice(categoryIndex, 1);
          newOrder.splice(newPosition, 0, category);
        }
      }
      
      return newOrder;
    });
  }, [displayedBooks]);

  // Shuffle categories on page load/refresh and after 3 minutes of inactivity
  useEffect(() => {
    let inactivityTimer = null;
    let hasShuffledOnLoad = false;

    // Function to perform category shuffle
    const performCategoryShuffle = () => {
      if (!isCategoryShufflingRef.current && categoryOrder.length > 0) {
        isCategoryShufflingRef.current = true;
        setCategoryOrder(prevOrder => {
          const newOrder = [...prevOrder];
          // Move only 1 category to a random position
          const categoryIndex = Math.floor(Math.random() * newOrder.length);
          const newPosition = Math.floor(Math.random() * newOrder.length);
          
          if (categoryIndex !== newPosition) {
            const [category] = newOrder.splice(categoryIndex, 1);
            newOrder.splice(newPosition, 0, category);
          }
          return newOrder;
        });

        // Wait for transition to complete before allowing next shuffle
        setTimeout(() => {
          isCategoryShufflingRef.current = false;
        }, 50000);
      }
    };

    // Shuffle on page load/refresh
    if (!hasShuffledOnLoad && categoryOrder.length > 0) {
      performCategoryShuffle();
      hasShuffledOnLoad = true;
    }

    // Function to reset inactivity timer for category shuffle (3 minutes)
    const resetCategoryInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        performCategoryShuffle();
      }, 5 * 60 * 1000); // 5 minutes
    };

    // Activity event listeners for category shuffle
    const handleActivity = () => {
      resetCategoryInactivityTimer();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    // Initialize the timer
    resetCategoryInactivityTimer();

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [categoryOrder.length]);

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
    // Don't show modal while auth is loading - wait for verification
    if (loadingUser) {
      return false;
    }
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


  /**
   * Utility: Preload PDF into cache for instant loading in modal
   * Uses service worker cache to ensure instant display when modal opens
   */
  const preloadPDFForInstantDisplay = (pdfUrl) => {
    if (!pdfUrl) return;
    
    // Fetch in background to cache it with service worker
    fetch(pdfUrl, { 
      method: 'GET',
      cache: 'force-cache' // Force browser to use cache aggressively
    }).catch(() => {
      // Silently fail - preloading is optional
    });
  };

  const handleReadClick = async () => {
    if (!requireAuth('read')) return;
    setShowReader(true);
  };

  const openBookDirectly = async (book) => {
    if (!book) return;
    if (!user) {
      setAuthAction('view');
      setShowAuthModal(true);
      return;
    }

    // Just set the selected book - this will show the details modal
    setSelectedBook(book);
    
    // INSTANT LOADING: Preload PDF for lightning-fast modal display
    if (book.downloadUrl) {
      preloadPDFForInstantDisplay(book.downloadUrl);
    }
  };

  const openBookReader = async (book) => {
    if (!book) return;
    if (!user) {
      setAuthAction('view');
      setShowAuthModal(true);
      return;
    }

    try {
      // Use the downloadUrl we already generated in mapRowToUi
      const url = book.downloadUrl;

      if (!url) {
        console.warn('Unable to resolve reader URL for book', book.id);
        return;
      }

      setReaderUrl(url);
      setShowReader(true);
      
      // Track view to database
      try {
        await supabase
          .from('books')
          .update({ views_count: (book.views || 0) + 1 })
          .eq('id', book.id);
        
        // Update local state with new view count
        setBooks(prevBooks => prevBooks.map(b => {
          if (b.id === book.id) {
            return {
              ...b,
              views: (b.views || 0) + 1
            };
          }
          return b;
        }));
      } catch (err) {
        console.error('Failed to track book view:', err);
      }
    } catch (e) {
      console.warn('Failed to open reader for book', e);
    }
  };

  const closeBookDetails = () => {
    setSelectedBook(null);
  };

  // Load comments when book is selected
  useEffect(() => {
    if (selectedBook?.id) {
      loadCommentsForBook(selectedBook.id);
    }
  }, [selectedBook?.id]);

  // Comment handlers - matching PastPapers implementation
  const handleSubmitComment = async (commentData) => {
    if (!selectedBook || !user) return;
    
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      
      const payload = {
        mediaId: String(selectedBook.id),
        authorId: user.id,
        content: commentData.text,
        parentCommentId: commentData.parentCommentId || null,
      };

      const origin = window.__API_ORIGIN__ || API_URL;
      const response = await fetch(`${origin}/api/elib/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to submit comment');

      // Reload comments for this book
      const comments = await fetch(
        `${origin}/api/elib/comments?mediaId=${selectedBook.id}&mediaType=book`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      ).then(r => r.json());

      setMediaComments(prev => ({
        ...prev,
        [selectedBook.id]: comments.data || comments || []
      }));
    } catch (err) {
      console.error('Failed to submit comment:', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!user) return;
    
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      
      const origin = window.__API_ORIGIN__ || API_URL;
      const response = await fetch(`${origin}/api/elib/comments/${commentId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error('Failed to delete comment');

      // Reload comments
      if (selectedBook) {
        const comments = await fetch(
          `${origin}/api/elib/comments?mediaId=${selectedBook.id}&mediaType=book`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        ).then(r => r.json());

        setMediaComments(prev => ({
          ...prev,
          [selectedBook.id]: comments.data || comments || []
        }));
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!user) return;
    
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      
      const origin = window.__API_ORIGIN__ || API_URL;
      const isLiked = commentLikes[commentId];
      
      const response = await fetch(`${origin}/api/elib/comments/${commentId}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) throw new Error('Failed to like comment');

      setCommentLikes(prev => ({
        ...prev,
        [commentId]: !isLiked
      }));
    } catch (err) {
      console.error('Failed to like comment:', err);
    }
  };

  const handleReplyToComment = async (commentId) => {
    // Focus on comment input for reply
    if (commentsRef.current) {
      commentsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleShare = async (method, book) => {
    if (!book) return;
    
    // Ensure cover image URL is absolute
    let coverImageUrl = book.bookImage || book.cover_image_url || '';
    if (coverImageUrl && !coverImageUrl.startsWith('http')) {
      // If it's relative, make it absolute
      coverImageUrl = `${window.location.origin}${coverImageUrl.startsWith('/') ? '' : '/'}${coverImageUrl}`;
    }
    if (!coverImageUrl.startsWith('http')) {
      // Fallback to a default
      coverImageUrl = `${window.location.origin}/PaltechBlack192.png`;
    }
    
    // Use OG endpoint for proper meta tag serving to social platforms
    const ogUrl = `${window.location.origin}/api/og?type=book&id=${book.id}&title=${encodeURIComponent(book.title)}&image=${encodeURIComponent(coverImageUrl)}&description=${encodeURIComponent(`Check out "${book.title}" by ${book.author || 'Unknown Author'}`)}`;
    
    // Fallback URL for direct sharing
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const directUrl = `${baseUrl}?id=${book.id}`;
    const text = `Check out "${book.title}" by ${book.author}`;
    
    try {
      switch (method) {
        case 'copy': {
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(`${text}\n${directUrl}`);
            alert('Link copied to clipboard');
          } else {
            const input = document.createElement('input');
            input.value = `${text}\n${directUrl}`;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            alert('Link copied to clipboard');
          }
          break;
        }
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(ogUrl)}&hashtags=books,reading`,`_blank`,`noopener,noreferrer`);
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(ogUrl)}`,`_blank`,`noopener,noreferrer`);
          break;
        case 'linkedin':
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(ogUrl)}`,`_blank`,`noopener,noreferrer`);
          break;
        case 'email':
          window.open(`mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(`${text}\n\n${ogUrl}\n\n`)}`);
          break;
        case 'whatsapp':
          // Send only URL - WhatsApp will show preview with image automatically
          window.open(`https://wa.me/?text=${encodeURIComponent(ogUrl)}`,`_blank`,`noopener,noreferrer`);
          break;
        case 'googledrive':
          // Open Google Drive in new window
          window.open(`https://drive.google.com/`,`_blank`,`noopener,noreferrer`);
          // Copy link to clipboard for user to save manually
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(`${text}\n${ogUrl}`);
          }
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Share failed', err);
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

  // Shuffle books and update display with random intervals
  useEffect(() => {
    if (fullScreenBook) {
      // Auto-close the celebration popup after 3 seconds
      const closeTimer = setTimeout(() => {
        setFullScreenBook(null);
      }, 3000);
      return () => clearTimeout(closeTimer);
    }
  }, [fullScreenBook]);

  // Track inactivity to show book cover after 2 minutes
  useEffect(() => {
    if (!user || recentBooks.length === 0) return;

    const INACTIVITY_TIMEOUT = 2 * 60 * 1000; // 2 minutes in milliseconds
    let inactivityTimer = null;

    // Function to reset inactivity timer
    const resetInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);

      inactivityTimer = setTimeout(() => {
        // Show a random book after inactivity
        const source = recentBooks.filter(Boolean);
        if (source && source.length > 0) {
          const randomBook = source[Math.floor(Math.random() * source.length)];
          setFullScreenBook(randomBook);
        }
      }, INACTIVITY_TIMEOUT);
    };

    // Activity event listeners
    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Add event listeners for various user activities
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchmove', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    // Initialize the timer
    resetInactivityTimer();

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchmove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [user, recentBooks]);

  useEffect(() => {
    if (!user || recentBooks.length === 0) return;

    // Initialize shuffled books (no shuffle yet), filtering out removed books
    const removed = JSON.parse(localStorage.getItem('removedBookIds') || '[]');
    setRemovedBookIds(removed);
    const filteredBooks = recentBooks.filter(b => !removed.includes(String(b.id)));
    setShuffledBooks([...filteredBooks]);
    setIsShuffling(false);

    let inactivityTimer = null;
    let hasShuffledOnLoad = false;

    // Function to perform book shuffle - move two books at a time
    const performBookShuffle = () => {
      setIsShuffling(true);
      setShuffledBooks(s => {
        const newBooks = [...s];
        
        // Move first book to a random position
        const bookIndex1 = Math.floor(Math.random() * newBooks.length);
        const newPosition1 = Math.floor(Math.random() * newBooks.length);
        
        if (bookIndex1 !== newPosition1) {
          const [book1] = newBooks.splice(bookIndex1, 1);
          newBooks.splice(newPosition1, 0, book1);
        }
        
        // Move second book to a random position
        const bookIndex2 = Math.floor(Math.random() * newBooks.length);
        const newPosition2 = Math.floor(Math.random() * newBooks.length);
        
        if (bookIndex2 !== newPosition2) {
          const [book2] = newBooks.splice(bookIndex2, 1);
          newBooks.splice(newPosition2, 0, book2);
        }
        
        return newBooks;
      });
      setTimeout(() => {
        setIsShuffling(false);
      }, 2000);
    };

    // Don't shuffle on page load/refresh - only shuffle after inactivity
    // Shuffle only happens after 1 minute of inactivity

    // Function to reset inactivity timer for book shuffle (5 minutes)
    const resetBookInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        performBookShuffle();
      }, 300 * 1000); // 5 minutes for shuffle duration
    };

    // Activity event listeners for book shuffle
    const handleActivity = () => {
      resetBookInactivityTimer();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    // Initialize the timer
    resetBookInactivityTimer();

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [user, recentBooks]);

  // Cycle through animation types uniformly for all books
  useEffect(() => {
    const animationCycleInterval = setInterval(() => {
      setAnimationCycle(prev => (prev + 1) % 4);
    }, 120000); // Change animation every 2 minutes

    return () => clearInterval(animationCycleInterval);
  }, []);

  // Track shuffle state for single category shuffling
  const shuffleStateRef = useRef({
    currentCategoryIndex: 0,
    rotationCounts: {}, // Track rotation count per category
    categories: []
  });

  // Initialize and shuffle grid books by category on load
  useEffect(() => {
    if (!filteredBooks || filteredBooks.length === 0) return;

    const groupedByCategory = filteredBooks.reduce((acc, book) => {
      const category = book.genre || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(book);
      return acc;
    }, {});

    const newShuffledBooks = {};
    Object.entries(groupedByCategory).forEach(([category, books]) => {
      newShuffledBooks[category] = [...books];
    });

    setCategoryShuffledBooks(newShuffledBooks);
    
    // Initialize shuffle state with new categories
    const categoryList = Object.keys(groupedByCategory);
    shuffleStateRef.current = {
      currentCategoryIndex: 0,
      rotationCounts: {},
      categories: categoryList
    };
  }, [filteredBooks]);

  // Rotate first book to last in a category (carousel rotation)
  const rotateBookInCategory = useCallback((category) => {
    if (!category) return;
    
    setCategoryShuffledBooks(prevState => {
      const newState = { ...prevState };
      const books = newState[category];
      
      if (!books || books.length < 2) return newState;
      
      // Move first book to end
      const [firstBook] = books.splice(0, 1);
      books.push(firstBook);
      newState[category] = [...books];
      return newState;
    });
  }, []);

  // Shuffle a specific category position in the order
  const shuffleSingleCategoryPosition = useCallback((categoryIndex) => {
    setCategoryOrder(prevOrder => {
      const newOrder = [...prevOrder];
      if (newOrder.length === 0) {
        // Initialize with original order
        const categories = shuffleStateRef.current.categories;
        newOrder.push(...Array.from({length: categories.length}, (_, i) => i));
      }
      
      if (categoryIndex < newOrder.length) {
        // Remove category at index and append to end (rotate it)
        const [cat] = newOrder.splice(categoryIndex, 1);
        newOrder.push(cat);
      }
      
      return newOrder;
    });
  }, []);

  // Single category shuffling with 3x increased duration
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isGridShufflingRef.current && !isHoveringRef.current) {
        const state = shuffleStateRef.current;
        const categories = state.categories;
        
        if (categories.length === 0) return;
        
        // Get current category
        const categoryIndex = state.currentCategoryIndex;
        const category = categories[categoryIndex];
        
        // Initialize rotation count if needed
        if (!state.rotationCounts[category]) state.rotationCounts[category] = 0;
        
        const booksInCategory = categoryShuffledBooks[category]?.length || 0;
        
        // Rotate category books
        if (booksInCategory > 1) {
          rotateBookInCategory(category);
          state.rotationCounts[category]++;
          
          // If category is done, shuffle its position and move to next category
          if (state.rotationCounts[category] >= booksInCategory) {
            shuffleSingleCategoryPosition(categoryIndex);
            state.rotationCounts[category] = 0;
            
            // Move to next category
            state.currentCategoryIndex = (state.currentCategoryIndex + 1) % categories.length;
          }
        } else {
          // If category has fewer than 2 books, skip to next
          state.currentCategoryIndex = (state.currentCategoryIndex + 1) % categories.length;
        }
      }
    }, 30000); // Every 30 seconds

    shuffleTimersRef.current = timer;

    return () => {
      clearInterval(timer);
    };
  }, [categoryShuffledBooks, rotateBookInCategory, shuffleSingleCategoryPosition]);

  // PowerPoint-style transition variants helper
  const getPPTVariant = (typeIndex, idx) => {
    const delay = idx * 0.06;
    const type = ['fade', 'push', 'wipe', 'zoom', 'flip'][typeIndex % 5];
    switch (type) {
      case 'push':
        return {
          initial: { x: 120, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: -120, opacity: 0 },
          transition: { duration: 0.6, ease: 'easeOut', delay }
        };
      case 'wipe':
        return {
          initial: { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
          animate: { opacity: 1, clipPath: 'inset(0 0% 0 0)' },
          exit: { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
          transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay }
        };
      case 'zoom':
        return {
          initial: { scale: 0.78, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.9, opacity: 0 },
          transition: { duration: 0.7, ease: 'easeOut', delay }
        };
      case 'flip':
        return {
          initial: { rotateY: 60, opacity: 0 },
          animate: { rotateY: 0, opacity: 1 },
          exit: { rotateY: -60, opacity: 0 },
          transition: { duration: 0.72, ease: [0.2, 0.9, 0.3, 1], delay }
        };
      default:
        // fade
        return {
          initial: { opacity: 0, y: 18, scale: 0.98 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 12, scale: 0.98 },
          transition: { duration: 0.6, ease: 'easeOut', delay }
        };
    }
  };

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
          <div style={modalStyles.overlay}>
            <div style={modalStyles.modal}>
              <h3 style={modalStyles.title}>Please check your network</h3>
              <p style={modalStyles.description}>Unable to connect. Please verify your internet connection and try again.</p>
              <div style={modalStyles.buttonGroup}>
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
        <div style={modalStyles.loadingContainer}>
          <div style={modalStyles.loadingText}>Loading book...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="containerBKP">
      {/* Ads Banner */}
      <AdBanner placement="homepage" limit={1} user={user} />
      
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
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <h3 style={modalStyles.title}>Please check your network</h3>
            <p style={modalStyles.description}>Unable to connect. Please verify your internet connection and try again.</p>
            <div style={modalStyles.buttonGroup}>
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
            autoComplete="off"
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
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button
                onClick={() => navigate('/books/admin')}
                className="filter-buttonBKP"
                title="Open Admin Dashboard"
              >
                {user?.role === 'admin' || ['campuslives254@gmail.com', 'paltechsomalux@gmail.com'].includes(user?.email) ? 'Admin' : 'Editor'}
              </button>
              {(pendingSubmissions + pendingRequests + pendingAds) > 0 && (
                <div style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  background: '#ea4335',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: '600',
                  border: '2px solid #0b1216'
                }}>
                  {(pendingSubmissions + pendingRequests + pendingAds) > 99 ? '99+' : (pendingSubmissions + pendingRequests + pendingAds)}
                </div>
              )}
            </div>
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
            padding: '12px 4px',
            borderRadius: 12,
            background: '#0b1216',
            border: 'none',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, paddingLeft: 8, paddingRight: 8 }}>
            <div>
              <div style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>📖 Currently Reading</div>
            </div>
            <div style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
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
              paddingLeft: 4,
              paddingRight: 4,
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth'
            }}
          >
            <AnimatePresence mode="popLayout">
              {shuffledBooks.map((book, idx) => {
                // All books use the same uniform animation type that cycles every 10 seconds
                const animationType = animationCycle;
                const { initial: initialProps, animate: animateProps, exit: exitProps, transition: transitionProps } = getPPTVariant(animationType, idx);
                const hoverProps = { y: -8, scale: 1.03 };
                
                return (
                  <motion.div
                    key={`${book.id}-${idx}`}
                    onClick={() => openBookDirectly(book)}
                    onMouseDown={(e) => {
                      longPressTimeoutRef.current = setTimeout(() => {
                        handleBookLongPress(e, book.id);
                      }, 800); // 800ms long-press
                    }}
                    onMouseUp={() => {
                      if (longPressTimeoutRef.current) {
                        clearTimeout(longPressTimeoutRef.current);
                      }
                    }}
                    onMouseLeave={() => {
                      if (longPressTimeoutRef.current) {
                        clearTimeout(longPressTimeoutRef.current);
                      }
                    }}
                    onTouchStart={(e) => {
                      longPressTimeoutRef.current = setTimeout(() => {
                        handleBookLongPress(e, book.id);
                      }, 800); // 800ms long-press
                    }}
                    onTouchEnd={() => {
                      if (longPressTimeoutRef.current) {
                        clearTimeout(longPressTimeoutRef.current);
                      }
                    }}
                    whileHover={hoverProps}
                    whileTap={{ scale: 0.98 }}
                    initial={initialProps}
                    animate={animateProps}
                    exit={exitProps}
                    transition={transitionProps}
                    style={{
                      minWidth: 110,
                      width: 110,
                      background: '#111b21',
                      borderRadius: 10,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.6), 0 2px 4px rgba(0, 0, 0, 0.4)',
                      perspective: 700,
                      transformStyle: 'preserve-3d',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative'
                    }}
                  >
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '2/1.9',
                      borderRadius: 0,
                      overflow: 'hidden',
                      background: '#020617',
                      position: 'relative'
                    }}
                  >
                    {/* Remove hint on hover */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        fontSize: 10,
                        color: '#e2e8f0',
                        fontWeight: 600,
                        zIndex: 10,
                        pointerEvents: 'none'
                      }}
                      className="remove-hint"
                    >
                      Hold to remove
                    </div>
                    <motion.img
                      src={book.bookImage}
                      alt={book.title}
                      animate={{
                        scale: [1, 1.02, 1]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        repeatType: 'reverse'
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ padding: '6px', paddingTop: '8px', flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {book.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {book.author}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: '#64748b', marginTop: 'auto' }}>
                      <span>
                        <FiEye size={10} /> {book.views?.toLocaleString?.() || 0}
                      </span>
                      <span>
                        <FiDownload size={10} /> {book.downloads?.toLocaleString?.() || 0}
                      </span>
                    </div>
                  </div>
                </motion.div>
                );
              })}
            </AnimatePresence>
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
                      openBookDirectly(book);
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
                      openBookDirectly(book);
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
          {(() => {
            // Group books by genre/category
            const groupedByCategory = displayedBooks.reduce((acc, book) => {
              const category = book.genre || 'Uncategorized';
              if (!acc[category]) {
                acc[category] = [];
              }
              acc[category].push(book);
              return acc;
            }, {});

            // Render each category section
            const categories = Object.entries(groupedByCategory);
            return categories.map(([category, books], index) => {
              const gridId = `grid-${category}`;
              const scrollState = gridScrollStates[gridId] || { hasOverflow: false, canScrollLeft: false, canScrollRight: false };
              const categoryNewIndex = categoryOrder[index] !== undefined ? categoryOrder[index] : index;
              
              return (
              <div 
                key={category} 
                className="category-sectionBKP"
                style={{ order: categoryNewIndex }}
              >
                <h2 className="category-headerBKP">{category}</h2>
                <div className="grid-with-scrollBKP" id={`wrapper-${gridId}`}>
                  {scrollState.canScrollLeft && (
                    <button
                      className="grid-scroll-navBKP grid-scroll-nav-leftBKP"
                      onClick={(e) => {
                        const wrapper = e.currentTarget.parentElement;
                      const grid = wrapper?.querySelector('.gridBKP');
                      scrollGridLeft(grid);
                    }}
                    aria-label="Scroll books left"
                  >
                    <FiChevronLeft size={24} />
                  </button>
                  )}
                  <div 
                    className="gridBKP" 
                    id={gridId}
                    aria-busy={pageLoading} 
                    aria-live={pageLoading ? 'polite' : 'off'} 
                    onScroll={handleGridScroll}
                    onMouseEnter={handleGridMouseEnter}
                    onMouseLeave={handleGridMouseLeave}
                    onTouchStart={handleGridMouseEnter}
                    onTouchEnd={handleGridMouseLeave}
                  >
                  <AnimatePresence initial={false}>
                    {(categoryShuffledBooks[category] || books).map((book, index) => {
                      // Show ad at middle position for each category
                      const isMobile = window.innerWidth < 768;
                      const booksToRender = categoryShuffledBooks[category] || books;
                      const adPosition = isMobile ? 3 : Math.floor(booksToRender.length / 2);
                      
                      if (index === adPosition && booksToRender.length > 0 && user?.subscription_tier !== 'premium_pro') {
                        return (
                          <React.Fragment key={`ad-position-${category}-${index}`}>
                            {/* Grid Ad */}
                            <motion.div
                              key={`grid-ad-${category}-0`}
                              initial={isMounted ? { opacity: 0, y: 12 } : false}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.65, ease: 'easeInOut' }}
                              layout="position"
                            >
                              <div className="book-cardBKP">
                                <AdBanner placement="grid-books" limit={5} user={user} />
                              </div>
                            </motion.div>
                            
                            {/* Current Book */}
                            <motion.div
                              key={book.id}
                              initial={isMounted ? { opacity: 0, y: 12 } : false}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.65, ease: 'easeInOut' }}
                              layout="position"
                            >
                              <div
                                className="book-cardBKP"
                                onClick={() => bulkDownloadMode ? toggleBookSelection(book.id) : openBookDirectly(book)}
                                onMouseEnter={() => prefetchResource(book.downloadUrl)}
                                onFocus={() => prefetchResource(book.downloadUrl)}
                                tabIndex={0}
                                style={{ position: 'relative' }}
                              >
                                {/* Bulk Selection Checkbox */}
                                {bulkDownloadMode && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '8px',
                                    left: '8px',
                                    zIndex: 10,
                                    background: 'rgba(0, 0, 0, 0.7)',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    border: selectedBooksForDownload.has(book.id) ? '3px solid #00a884' : '3px solid #374151',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <input
                                      type="checkbox"
                                      checked={selectedBooksForDownload.has(book.id)}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        toggleBookSelection(book.id);
                                      }}
                                      style={{ cursor: 'pointer', width: '22px', height: '22px', accentColor: '#00a884' }}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                )}

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
                        
                        // For all other indices, render the book normally
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
                              onClick={() => openBookDirectly(book)}
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
                  {scrollState.canScrollRight && (
                    <button
                      className="grid-scroll-navBKP grid-scroll-nav-rightBKP"
                      onClick={(e) => {
                        const wrapper = e.currentTarget.parentElement;
                        const grid = wrapper?.querySelector('.gridBKP');
                        scrollGridRight(grid);
                      }}
                      aria-label="Scroll books right"
                    >
                      <FiChevronRight size={24} />
                    </button>
                  )}
                </div>
              </div>
              );
            });
          })()}


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

        </>
      )}





      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
        action={authAction}
      />

      {showSubscriptionModal && (
        <PremiumPanel
          onClose={() => {
            setShowSubscriptionModal(false);
          }}
          onSelectPlan={() => {
            setShowSubscriptionModal(false);
          }}
        />
      )}

      {showSubscriptionModal && (
        <PremiumPanel
          onClose={() => setShowSubscriptionModal(false)}
          onSelectPlan={() => setShowSubscriptionModal(false)}
        />
      )}

      {/* Removal Notification Popup */}
      {showRemovalNotification && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#10b981',
            color: '#ffffff',
            padding: '16px 32px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            zIndex: 1050,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            animation: 'fadeInOut 2s ease-in-out',
          }}
        >
          Removed
        </div>
      )}
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>

    </div>

    {/* Pagination at the very end */}
    {displayedBooks.length > 0 && (() => {
      // Group books by category and calculate pages based on categories
      const groupedByCategory = filteredBooks.reduce((acc, book) => {
        const category = book.genre || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(book);
        return acc;
      }, {});
      const CATEGORIES_PER_PAGE = 5;
      const totalCategories = Object.keys(groupedByCategory).length;
      const computedTotal = Math.max(1, Math.ceil((totalCategories) / CATEGORIES_PER_PAGE));
      if (computedTotal <= 1) return null;

      return (
        <div style={{ marginTop: '40px', marginBottom: '20px', paddingLeft: '12px', paddingRight: '12px' }}>
          <div className="actions" style={{ marginTop: 10, justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <button
              className="btn"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              ← Prev
            </button>

            {(user?.subscription_tier === 'premium' || user?.subscription_tier === 'premium_pro') && (
              <span style={{ color: '#cfd8dc', fontSize: 12 }}>
                Page {currentPage} of {computedTotal}
              </span>
            )}

            <button
              className="btn"
              disabled={currentPage >= computedTotal}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next →
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

    {/* Book Details Modal - Shows before PDF reader */}
    <AnimatePresence>
      {selectedBook && user && (
        <motion.div
          className="modal-overlaypast"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeBookDetails}
        >
          <motion.div
            className="modal-contentpast"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-buttonpast" onClick={closeBookDetails} aria-label="Close">
              <FiX size={24} />
            </button>

            <div className="modal-bodyBKP" style={{ paddingTop: '0', paddingLeft: '0', paddingRight: '0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '0.1rem' }}>
                {selectedBook.bookImage ? (
                  <div style={{ width: '100%', maxWidth: '250px', display: 'flex', justifyContent: 'center', borderRadius: '8px', overflow: 'hidden', background: '#121a1f', padding: '0.1rem' }}>
                    <img 
                      src={selectedBook.bookImage} 
                      alt={selectedBook.title}
                      style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      maxWidth: '250px',
                      width: '100%',
                      height: '320px',
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1))',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '1.5rem',
                      textAlign: 'center'
                    }}
                  >
                    <FiBook size={60} style={{ color: '#6366f1', marginBottom: '1rem', opacity: 0.8 }} />
                    <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', fontWeight: '700', color: '#e9edef' }}>{selectedBook.title}</h2>
                    <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#8696a0', fontWeight: '500' }}>{selectedBook.author}</p>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.75rem', lineHeight: '1.4' }}>
                      {
                        [
                          selectedBook.genre,
                          selectedBook.year ? `Year: ${selectedBook.year}` : null,
                          selectedBook.language || null
                        ].filter(Boolean).join(' • ')
                      }
                    </div>
                  </div>
                )}
              </div>

              <div style={{ paddingLeft: '1rem', paddingRight: '1rem', marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                  <div className="stat-badge-itemspast">
                    <span className="stat-label-itempast">
                      <FiEye size={12} />
                      Views
                    </span>
                    <span className="stat-count-itempast">{selectedBook.views?.toLocaleString() || 0}</span>
                  </div>

                  <div className="stat-badge-itemspast">
                    <span className="stat-label-itempast">
                      <FiDownload size={12} />
                      Downloads
                    </span>
                    <span className="stat-count-itempast">{selectedBook.downloads?.toLocaleString() || 0}</span>
                  </div>

                  {selectedBook.rating > 0 && (
                    <div className="stat-badge-itemspast">
                      <span className="stat-label-itempast">
                        <FiStar size={12} />
                        Rating
                      </span>
                      <span className="stat-count-itempast">{selectedBook.rating.toFixed(1)}</span>
                    </div>
                  )}

                  <div className="stat-badge-itemspast">
                    <span className="stat-label-itempast">
                      <BiCommentDetail size={12} />
                      Comments
                    </span>
                    <span className="stat-count-itempast">{(mediaComments[selectedBook.id] || []).length}</span>
                  </div>
                </div>

                <div>
                  <CommentsSection
                    currentMedia={{ id: String(selectedBook.id) }}
                    currentUser={user}
                    showComments={true}
                    commentsRef={commentsRef}
                    mediaComments={mediaComments}
                    commentLikes={commentLikes}
                    onSubmitComment={handleSubmitComment}
                    onDeleteComment={handleDeleteComment}
                    onLikeComment={handleLikeComment}
                    onReplyToComment={handleReplyToComment}
                  />
                </div>
              </div>
            </div>

            <div className="modal-actionspast" style={{ marginTop: '12px', paddingTop: '12px' }}>
              <div className="actions-primary-rowpast">
                <Download 
                  book={selectedBook} 
                  variant="full" 
                  user={user}
                  downloadText="Save"
                  downloadingText="Saving..."
                  className="btn-readBKP btn-action-primaryBKP"
                />
                <button
                  className="btn-readBKP btn-action-primaryBKP"
                  onClick={() => handleShare('copy', selectedBook)}
                  title="Share this book"
                >
                  <FiShare2 size={16} /> Share
                </button>
                <button
                  className="btn-readBKP btn-action-primaryBKP"
                  onClick={() => openBookReader(selectedBook)}
                >
                  <FiBook size={16} /> Read
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* PDF Reader - Opens when user clicks Read button */}
    {showReader && selectedBook && readerUrl && (
      <SimpleScrollReader
        src={readerUrl}
        title={selectedBook.title}
        author={selectedBook.author || ''}
        sampleText={selectedBook.genre || selectedBook.categoryId || ''}
        user={user}
        onClose={() => {
          setShowReader(false);
          setReaderUrl(null);
        }}
      />
    )}
    </>
  );
};