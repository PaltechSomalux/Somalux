// src/BookPanel.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from './supabaseClient';
import { initializeSession, setupAuthListener, clearSessionCache } from '../../utils/sessionManager';
import { Download } from './Download';
import { CommentsSection } from './CommentsSection';
import { AuthModal } from './AuthModal';
import { RatingModal } from './RatingModal';
import { SubscriptionModal } from './SubscriptionModal';
import VerificationTierModal from './VerificationTierModal';
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
import { API_URL } from '../../config';
import './BookPanel.css';
import './Admin/admin.css';
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

  // Sharing modal state
  const [showSharingModal, setShowSharingModal] = useState(false);
  
  // Book Details dropdown state
  const [showDetailsDropdown, setShowDetailsDropdown] = useState(false);
  const detailsRef = useRef(null);

  // Admin notification state
  const [pendingSubmissions, setPendingSubmissions] = useState(0);

  // Bulk download selection state
  const [selectedBooksForDownload, setSelectedBooksForDownload] = useState(new Set());
  const [selectAllBooks, setSelectAllBooks] = useState(false);
  const [bulkDownloadMode, setBulkDownloadMode] = useState(false);
  const [downloadingBooks, setDownloadingBooks] = useState({});

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
    if (selectedBook) {
      const bookCover = selectedBook.bookImage || selectedBook.cover_image_url;
      const bookUrl = `${window.location.origin}${window.location.pathname}?id=${selectedBook.id}`;
      
      // Update og:image
      let ogImage = document.querySelector('meta[property="og:image"]');
      if (!ogImage) {
        ogImage = document.createElement('meta');
        ogImage.setAttribute('property', 'og:image');
        document.head.appendChild(ogImage);
      }
      ogImage.setAttribute('content', bookCover);
      
      // Update og:title
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', selectedBook.title);
      
      // Update og:description
      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (!ogDesc) {
        ogDesc = document.createElement('meta');
        ogDesc.setAttribute('property', 'og:description');
        document.head.appendChild(ogDesc);
      }
      ogDesc.setAttribute('content', `Check out "${selectedBook.title}" by ${selectedBook.author || 'Unknown Author'}`);
      
      // Update og:url
      let ogUrl = document.querySelector('meta[property="og:url"]');
      if (!ogUrl) {
        ogUrl = document.createElement('meta');
        ogUrl.setAttribute('property', 'og:url');
        document.head.appendChild(ogUrl);
      }
      ogUrl.setAttribute('content', bookUrl);
    }
  }, [selectedBook]);

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
          .select('created_at, last_active_at, subscription_tier, role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.warn('Error fetching profile:', error);
          // If profile fetch fails, still set user with session data
          const userData = {
            ...session.user,
            role: 'viewer',
            subscription_tier: 'basic'
          };
          userCache = userData;
          setUser(userData);
          setLoadingUser(false);
          return;
        }

        // Set user with the role information and cache it
        const userData = {
          ...session.user,
          role: profile?.role || 'viewer',
          subscription_tier: profile?.subscription_tier || 'basic'
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

    // Initialize session with cache-first approach
    (async () => {
      try {
        // Try to restore from cache instantly (no network call)
        const cachedSession = await initializeSession(supabase);
        if (cachedSession) {
          console.log('✓ Session restored from cache (instant)');
          fetchUserWithRole(cachedSession);
        } else {
          console.log('ℹ No cached session, user will be prompted to login');
          setLoadingUser(false);
        }
      } catch (err) {
        console.error('Session initialization failed:', err);
        setLoadingUser(false);
      }
    })();

    // Setup auth listener for ongoing changes
    const subscription = setupAuthListener(supabase, (_event, session) => {
      fetchUserWithRole(session);
    });

    // Setup realtime listener for profile changes (e.g., role updates)
    let profileSubscription = null;
    if (user?.id) {
      profileSubscription = supabase
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
              // Refresh user with new role data
              setUser(prev => ({
                ...prev,
                role: payload.new.role,
                subscription_tier: payload.new.subscription_tier || prev?.subscription_tier
              }));
              userCache = { ...userCache, role: payload.new.role, subscription_tier: payload.new.subscription_tier };
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (subscription?.unsubscribe && typeof subscription.unsubscribe === 'function') {
        try { subscription.unsubscribe(); } catch (e) {}
      }
      if (profileSubscription?.unsubscribe && typeof profileSubscription.unsubscribe === 'function') {
        try { profileSubscription.unsubscribe(); } catch (e) {}
      }
    };
  }, []);

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
    
    // Poll every 30 seconds for updates
    const interval = setInterval(fetchSubmissionsCount, 30000);
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

  // Close details dropdown when clicking outside
  useEffect(() => {
    if (!showDetailsDropdown) return;

    const handleClickOutside = (event) => {
      if (detailsRef.current && !detailsRef.current.contains(event.target)) {
        setShowDetailsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDetailsDropdown]);

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
              {pendingSubmissions > 0 && (
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
                  {pendingSubmissions > 99 ? '99+' : pendingSubmissions}
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
                // Render ad at the appropriate position
                if (index === adPosition && displayedBooks.length > 0 && user?.subscription_tier !== 'premium_pro') {
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
                          <AdBanner placement="grid-books" limit={5} user={user} />
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
                      onClick={() => bulkDownloadMode ? toggleBookSelection(book.id) : viewBookDetails(book)}
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
                <div className="actions" style={{ marginTop: 10, justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                  <button
                    className="btn"
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    ← Prev
                  </button>

                  <span style={{ color: '#cfd8dc', fontSize: 12 }}>
                    Page {currentPage} of {computedTotal}
                  </span>

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
              onClick={(e) => {
                if (showDetailsDropdown && detailsRef.current && !detailsRef.current.contains(e.target)) {
                  setShowDetailsDropdown(false);
                } else {
                  e.stopPropagation();
                }
              }}
            >
              <button className="close-buttonBKP" onClick={closeDetails}>
                <FiX size={24} />
              </button>

              <div style={{ position: 'relative' }} ref={detailsRef}>
                <button
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    left: '1rem',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 8px',
                    cursor: 'pointer',
                    color: '#64748b',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    zIndex: 1001
                  }}
                  onClick={() => setShowDetailsDropdown(!showDetailsDropdown)}
                  title="View book details"
                >
                  <div style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#64748b' }}></div>
                  <div style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#64748b' }}></div>
                  <div style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: '#64748b' }}></div>
                </button>
                <AnimatePresence>
                  {showDetailsDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      style={{
                        position: 'absolute',
                        top: '50px',
                        left: '1rem',
                        background: '#0d1621',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        minWidth: '200px',
                        zIndex: 1001,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ borderBottom: '1px solid #1f2c33', paddingBottom: '10px' }}>
                          <div style={{ color: '#8696a0', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Genre</div>
                          <div style={{ color: '#e9edef', fontSize: '0.8rem', fontWeight: '500' }}>{selectedBook.genre || 'Uncategorized'}</div>
                        </div>
                        <div style={{ borderBottom: '1px solid #1f2c33', paddingBottom: '10px' }}>
                          <div style={{ color: '#8696a0', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Pages</div>
                          <div style={{ color: '#e9edef', fontSize: '0.8rem', fontWeight: '500' }}>{selectedBook.pages || 'N/A'}</div>
                        </div>
                        <div style={{ borderBottom: '1px solid #1f2c33', paddingBottom: '10px' }}>
                          <div style={{ color: '#8696a0', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Language</div>
                          <div style={{ color: '#e9edef', fontSize: '0.8rem', fontWeight: '500' }}>{selectedBook.language || 'Unknown'}</div>
                        </div>
                        <div>
                          <div style={{ color: '#8696a0', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Publisher</div>
                          <div style={{ color: '#e9edef', fontSize: '0.8rem', fontWeight: '500' }}>{selectedBook.publisher || 'N/A'}</div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="modal-headerBKP">
                <h2>{selectedBook.title}</h2>
                <p>by {selectedBook.author}</p>
              </div>

              <div className="modal-bodyBKP" style={{ paddingTop: '0', paddingLeft: '0', paddingRight: '0' }}>
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '0.2rem' }}>
                  <img
                    src={selectedBook.bookImage}
                    alt={selectedBook.title}
                    className="book-coverBKP"
                    loading="lazy"
                    decoding="async"
                    style={{ maxWidth: '600px', width: '100%', height: '500px', objectFit: 'contain', borderRadius: '8px', display: 'block' }}
                  />
                </div>
                <p className="book-descBKP" style={{ margin: '0 1.5rem 0 1.5rem' }}>
                  {selectedBook.description}
                </p>

                <div style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem', marginTop: '0' }}>
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
              </div>

              <div className="modal-actionsBKP">
                <div className="actions-primary-rowBKP">
                  <Download
                    book={selectedBook}
                    variant="full"
                    user={user}
                    className="btn-readBKP btn-action-primaryBKP"
                    onUpgradeClick={() => setShowSubscriptionModal?.(true)}
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
                    onClick={() => setShowRatingModal(true)}
                    title="Rate this book"
                  >
                    <FiStar size={16} /> {userRating ? `${userRating}★` : 'Rate'}
                  </button>
                  <button
                    className="btn-readBKP btn-action-primaryBKP"
                    onClick={() => setShowSharingModal(true)}
                    title="Share this book"
                  >
                    <FiShare2 size={16} /> Share
                  </button>
                  <button
                    className="btn-readBKP btn-action-primaryBKP"
                    onClick={handleReadClick}
                    title="Read this book"
                  >
                    <FiBook size={16} /> Read
                  </button>
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

      <VerificationTierModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        userTier={user?.subscription_tier || 'basic'}
        onSelectTier={(tier) => {
          // This will handle tier selection
          // In next phase: integrate payment processing
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

      {/* Sharing Modal */}
      <AnimatePresence>
        {showSharingModal && selectedBook && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSharingModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.6)',
              zIndex: 1100,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#0b1220',
                color: '#e6eef7',
                padding: 48,
                borderRadius: 20,
                boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                textAlign: 'center',
                maxWidth: '600px',
                width: '85%',
                maxHeight: '90vh',
                position: 'relative',
              }}
            >
              <button
                className="share-modal-btn"
                title="Close"
                onClick={() => setShowSharingModal(false)}
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 12,
                  background: 'transparent',
                  color: '#9ca3af',
                  border: 'none',
                  padding: '0',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <FiX size={20} color="#9ca3af" />
              </button>
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ margin: 0, marginBottom: 8, fontSize: 28, fontWeight: 700, color: '#e6eef7' }}>
                  Share "{selectedBook.title}"
                </h3>
              </div>

              {/* Book Cover Image as Clickable Link */}
              <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
                <a 
                  href={`${window.location.origin}${window.location.pathname}?id=${selectedBook.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    borderRadius: 12,
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
                  }}
                >
                  <img 
                    src={selectedBook.bookImage || selectedBook.cover_image_url} 
                    alt={selectedBook.title}
                    style={{
                      width: 140,
                      height: 200,
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </a>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 0 }}>
                <button
                  className="share-modal-btn"
                  title="Share on WhatsApp"
                  onClick={() => {
                    handleShare('whatsapp', selectedBook);
                    setShowSharingModal(false);
                  }}
                  style={{
                    background: 'transparent',
                    color: '#e6eef7',
                    border: 'none',
                    padding: '8px 0',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 9,
                    fontWeight: 400,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  <div style={{ background: '#34C759', borderRadius: '8px', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SiWhatsapp size={30} color="#ffffff" />
                  </div>
                  WhatsApp
                </button>

                <button
                  className="share-modal-btn"
                  title="Share on X"
                  onClick={() => {
                    handleShare('twitter', selectedBook);
                    setShowSharingModal(false);
                  }}
                  style={{
                    background: 'transparent',
                    color: '#e6eef7',
                    border: 'none',
                    padding: '8px 0',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 9,
                    fontWeight: 400,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  <div style={{ background: '#000000', borderRadius: '8px', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SiX size={26} color="#ffffff" />
                  </div>
                  X
                </button>

                <button
                  className="share-modal-btn"
                  title="Copy Link"
                  onClick={() => {
                    handleShare('copy', selectedBook);
                    setShowSharingModal(false);
                  }}
                  style={{
                    background: 'transparent',
                    color: '#e6eef7',
                    border: 'none',
                    padding: '8px 0',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 9,
                    fontWeight: 400,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  <div style={{ background: '#8B5CF6', borderRadius: '8px', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FiLink size={26} color="#ffffff" />
                  </div>
                  Copy Link
                </button>

                <button
                  className="share-modal-btn"
                  title="Share on Facebook"
                  onClick={() => {
                    handleShare('facebook', selectedBook);
                    setShowSharingModal(false);
                  }}
                  style={{
                    background: 'transparent',
                    color: '#e6eef7',
                    border: 'none',
                    padding: '8px 0',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 9,
                    fontWeight: 400,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  <div style={{ background: '#1877F2', borderRadius: '8px', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SiFacebook size={26} color="#ffffff" />
                  </div>
                  Facebook
                </button>

                <button
                  className="share-modal-btn"
                  title="Share on LinkedIn"
                  onClick={() => {
                    handleShare('linkedin', selectedBook);
                    setShowSharingModal(false);
                  }}
                  style={{
                    background: 'transparent',
                    color: '#e6eef7',
                    border: 'none',
                    padding: '8px 0',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 9,
                    fontWeight: 400,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  <div style={{ background: '#0A66C2', borderRadius: '8px', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SiLinkedin size={26} color="#ffffff" />
                  </div>
                  LinkedIn
                </button>

                <button
                  className="share-modal-btn"
                  title="Share via Email"
                  onClick={() => {
                    handleShare('email', selectedBook);
                    setShowSharingModal(false);
                  }}
                  style={{
                    background: 'transparent',
                    color: '#e6eef7',
                    border: 'none',
                    padding: '8px 0',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 9,
                    fontWeight: 400,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  <div style={{ background: '#D44638', borderRadius: '8px', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="#ffffff">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                  </div>
                  Email
                </button>

                <button
                  className="share-modal-btn"
                  title="Save to Google Drive"
                  onClick={() => {
                    handleShare('googledrive', selectedBook);
                    setShowSharingModal(false);
                  }}
                  style={{
                    background: 'transparent',
                    color: '#e6eef7',
                    border: 'none',
                    padding: '8px 0',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 9,
                    fontWeight: 400,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  <div style={{ background: '#1F2937', borderRadius: '8px', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SiGoogledrive size={26} color="#ffffff" />
                  </div>
                  Google Drive
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};