/**
 * React hooks for ultra-fast book loading and caching
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { perfOptimizer } from './performanceOptimizer';
import { indexedDBCache } from './indexedDBCache';

/**
 * Hook for fast book fetching with automatic caching
 */
export function useFastBooks(supabase, page = 1, booksPerPage = 20) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const cacheKeyRef = useRef(`books_page_${page}`);

  useEffect(() => {
    const fetchBooks = async () => {
      // Check memory cache first
      const cached = perfOptimizer.getMemoryCache(cacheKeyRef.current);
      if (cached) {
        setBooks(cached.books);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const from = (page - 1) * booksPerPage;
        const to = from + booksPerPage - 1;

        const [{ data: rows, error: err }, { count }] = await Promise.all([
          supabase
            .from('books')
            .select('id, title, author, cover_image_url, rating, rating_count')
            .order('created_at', { ascending: false })
            .range(from, to),
          supabase
            .from('books')
            .select('*', { count: 'exact', head: true })
        ]);

        if (err) throw err;

        setBooks(rows || []);
        setHasMore((count || 0) > to + 1);

        // Cache result
        perfOptimizer.setMemoryCache(cacheKeyRef.current, {
          books: rows || [],
          total: count || 0
        }, 5 * 60 * 1000);

        // Also save to IndexedDB
        await indexedDBCache.saveBooks(page, rows || []);
      } catch (err) {
        setError(err.message);
        console.error('Failed to fetch books:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [page, supabase, booksPerPage]);

  return { books, loading, error, hasMore };
}

/**
 * Hook for fast search with caching
 */
export function useFastSearch(supabase, query, limit = 20) {
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const debounceTimeoutRef = useRef(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    // Debounce search
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Check cache first
    const cached = perfOptimizer.getMemoryCache(`search_${query.toLowerCase()}`);
    if (cached) {
      setResults(cached);
      return;
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const searchLower = query.toLowerCase();
        const { data, error: err } = await supabase
          .from('books')
          .select('id, title, author, cover_image_url, rating')
          .or(
            `title.ilike.%${searchLower}%,author.ilike.%${searchLower}%`
          )
          .limit(limit);

        if (err) throw err;

        setResults(data || []);

        // Cache results
        perfOptimizer.setMemoryCache(`search_${searchLower}`, data || [], 1 * 60 * 1000);
        await indexedDBCache.saveSearchResults(query, data || []);
      } catch (err) {
        setError(err.message);
        console.error('Search error:', err);
      } finally {
        setSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimeoutRef.current);
  }, [query, supabase, limit]);

  return { results, searching, error };
}

/**
 * Hook for lazy loading book images
 */
export function useLazyBookImage(bookCoverUrl) {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const imageRef = useRef(null);

  useEffect(() => {
    if (!bookCoverUrl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const img = new Image();
          img.onload = () => {
            setImageSrc(bookCoverUrl);
            setIsLoading(false);
            observer.unobserve(entry.target);
          };
          img.onerror = () => {
            setError('Failed to load image');
            setIsLoading(false);
          };
          img.src = bookCoverUrl;
        }
      },
      { rootMargin: '50px' }
    );

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => observer.disconnect();
  }, [bookCoverUrl]);

  return { imageSrc, isLoading, error, imageRef };
}

/**
 * Hook for infinite scroll with smart prefetch
 */
export function useInfiniteBooks(supabase, booksPerPage = 20) {
  const [allBooks, setAllBooks] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const sentinelRef = useRef(null);

  // Load books for current page
  const loadPage = useCallback(async (pageNum) => {
    setLoading(true);
    try {
      const from = (pageNum - 1) * booksPerPage;
      const to = from + booksPerPage - 1;

      const [{ data: rows, error: err }, { count }] = await Promise.all([
        supabase
          .from('books')
          .select('id, title, author, cover_url, average_rating, category_id')
          .order('created_at', { ascending: false })
          .range(from, to),
        supabase
          .from('books')
          .select('*', { count: 'exact', head: true })
      ]);

      if (err) throw err;

      setAllBooks(prev => pageNum === 1 ? rows || [] : [...prev, ...(rows || [])]);
      setTotalCount(count || 0);
      setHasMore(count || 0 > to + 1);

      // Cache this page
      await indexedDBCache.saveBooks(pageNum, rows || []);
    } catch (err) {
      console.error('Load page error:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, booksPerPage]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadPage(nextPage);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [page, hasMore, loading, loadPage]);

  // Initial load
  useEffect(() => {
    loadPage(1);
  }, []);

  return {
    books: allBooks,
    loading,
    hasMore,
    sentinelRef,
    totalCount,
    page
  };
}

/**
 * Hook for category-specific books with caching
 */
export function useCategoryBooks(supabase, categoryId, limit = 20) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!categoryId) return;

    const cacheKey = `category_${categoryId}`;

    // Check cache
    const cached = perfOptimizer.getMemoryCache(cacheKey);
    if (cached) {
      setBooks(cached);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const { data, error: err } = await supabase
          .from('books')
          .select('id, title, author, cover_image_url, rating, category_id')
          .eq('category_id', categoryId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (err) throw err;

        setBooks(data || []);

        // Cache result
        perfOptimizer.setMemoryCache(cacheKey, data || [], 10 * 60 * 1000);
      } catch (err) {
        setError(err.message);
        console.error('Category books error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [categoryId, supabase, limit]);

  return { books, loading, error };
}

/**
 * Hook to preload multiple pages
 */
export function usePreloadPages(supabase, startPage = 1, numPages = 2, booksPerPage = 20) {
  useEffect(() => {
    const preload = async () => {
      for (let p = startPage; p < startPage + numPages; p++) {
        const cacheKey = `books_page_${p}`;
        
        // Check if already cached
        if (perfOptimizer.getMemoryCache(cacheKey)) continue;

        try {
          const from = (p - 1) * booksPerPage;
          const to = from + booksPerPage - 1;

          const { data, error } = await supabase
            .from('books')
            .select('id, title, author, cover_image_url')
            .order('created_at', { ascending: false })
            .range(from, to);

          if (!error && data) {
            perfOptimizer.setMemoryCache(cacheKey, { books: data, total: null }, 5 * 60 * 1000);
            console.log(`✅ Preloaded page ${p}`);
          }
        } catch (err) {
          console.warn(`Failed to preload page ${p}:`, err);
        }
      }
    };

    // Delay preload to not interfere with initial load
    const timer = setTimeout(preload, 1000);
    return () => clearTimeout(timer);
  }, [supabase, startPage, numPages, booksPerPage]);
}

/**
 * Hook for trending books
 */
export function useTrendingBooks(supabase, days = 7, limit = 10) {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cacheKey = `trending_${days}`;

    // Check cache (trending is cached for 1 hour)
    const cached = perfOptimizer.getMemoryCache(cacheKey);
    if (cached) {
      setTrending(cached);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const since = new Date();
        since.setDate(since.getDate() - days);

        const { data, error: err } = await supabase
          .from('books')
          .select('id, title, author, cover_image_url, views_count, downloads_count, rating')
          .gte('created_at', since.toISOString())
          .order('views_count', { ascending: false })
          .order('downloads_count_count', { ascending: false })
          .limit(limit);

        if (err) throw err;

        setTrending(data || []);

        // Cache for 1 hour
        perfOptimizer.setMemoryCache(cacheKey, data || [], 60 * 60 * 1000);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [days, limit, supabase]);

  return { trending, loading, error };
}
