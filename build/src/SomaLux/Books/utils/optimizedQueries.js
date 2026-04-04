/**
 * Lightning-fast book data fetching with query optimization
 */

/**
 * Calculate weighted engagement score for a book
 * Higher score = more popular/engaged book
 * @param {Object} book - Book object with views_count, downloads_count, likes_count
 * @returns {number} Engagement score
 */
export function calculateEngagementScore(book) {
  const views = book.views_count || 0;
  const downloads = book.downloads_count || 0;
  const likes = book.likes_count || 0;
  
  // Weighted formula: Downloads are HIGHEST priority (10x weight)
  // This reflects that actual downloads = proven user value
  // Weight: Downloads (10x) + Likes (2x) + Views (1x)
  return (downloads * 10) + (likes * 2) + views;
}

export async function fetchBooksOptimized(supabase, page = 1, booksPerPage = 20) {
  try {
    const from = (page - 1) * booksPerPage;
    const to = from + booksPerPage - 1;

    // Parallel queries for maximum speed
    const [countResult, booksResult, categoriesResult] = await Promise.all([
      // Ultra-light count query (head: true = no data transfer)
      supabase
        .from('books')
        .select('*', { count: 'exact', head: true }),
      
      // Optimized book query - only essential fields (including likes_count)
      supabase
        .from('books')
        .select(
          'id, title, author, description, category_id, cover_image_url, file_url, views_count, downloads_count, likes_count, pages, rating, rating_count, created_at',
          { head: false }
        )
        .order('created_at', { ascending: false })
        .range(from, to),
      
      // Lightweight category query
      supabase
        .from('categories')
        .select('id, name')
    ]);

    const count = countResult.count || 0;
    let books = booksResult.data || [];
    const categories = categoriesResult.data || [];

    if (countResult.error) throw countResult.error;
    if (booksResult.error) throw booksResult.error;
    if (categoriesResult.error) throw categoriesResult.error;

    // Sort books dynamically by engagement score (downloads, views, likes)
    books.sort((a, b) => {
      const scoreA = calculateEngagementScore(a);
      const scoreB = calculateEngagementScore(b);
      return scoreB - scoreA; // Descending order (highest engagement first)
    });

    return {
      books,
      categories,
      totalCount: count,
      page,
      hasMore: count > to + 1
    };
  } catch (error) {
    console.error('Optimized fetch error:', error);
    throw error;
  }
}

/**
 * Batch fetch book details with caching
 */
export async function fetchBookDetailsBatch(supabase, bookIds) {
  if (!bookIds || bookIds.length === 0) return [];

  try {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .in('id', bookIds);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Batch fetch error:', error);
    return [];
  }
}

/**
 * Fetch all books sorted by engagement score (downloads + views + likes)
 * This is the primary display method for the book listing
 */
export async function fetchAllBooksEngagementSorted(supabase, booksPerPage = 20) {
  try {
    // Fetch all books with engagement metrics
    const { data: books, error, count } = await supabase
      .from('books')
      .select(
        'id, title, author, description, category_id, cover_image_url, file_url, views_count, downloads_count, likes_count, pages, rating, rating_count, created_at',
        { count: 'exact' }
      );

    if (error) throw error;

    // Fetch categories
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name');

    if (catError) throw catError;

    // Sort by engagement score dynamically
    const sortedBooks = (books || []).sort((a, b) => {
      const scoreA = calculateEngagementScore(a);
      const scoreB = calculateEngagementScore(b);
      return scoreB - scoreA; // Highest engagement first
    });

    return {
      books: sortedBooks,
      categories: categories || [],
      totalCount: count || 0,
      hasMore: false
    };
  } catch (error) {
    console.error('Engagement-sorted fetch error:', error);
    throw error;
  }
}

/**
 * Ultra-fast search with full-text search (if available)
 */
export async function searchBooksOptimized(supabase, query, limit = 20) {
  if (!query || query.length < 2) return [];

  try {
    // Try full-text search if available (must be set up in DB)
    const { data, error } = await supabase
      .from('books')
      .select('id, title, author, cover_image_url, category_id')
      .or(
        `title.ilike.%${query}%,author.ilike.%${query}%`
      )
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Search optimization error:', error);
    return [];
  }
}

/**
 * Fetch trending books efficiently
 */
export async function fetchTrendingBooks(supabase, days = 7, limit = 10) {
  try {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // Get top books by engagement
    const { data, error } = await supabase
      .from('books')
      .select('id, title, author, cover_image_url, views_count, downloads_count, rating')
      .gte('created_at', sinceDate.toISOString())
      .order('views_count', { ascending: false })
      .order('downloads_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Trending books fetch error:', error);
    return [];
  }
}

/**
 * Fetch category-specific books
 */
export async function fetchCategoryBooks(supabase, categoryId, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('books')
      .select('id, title, author, description, cover_image_url, category_id, rating, rating_count')
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Category books fetch error:', error);
    return [];
  }
}

/**
 * Minimal book card query (for lists, cards)
 */
export async function fetchMinimalBooks(supabase, page = 1, limit = 20) {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
      .from('books')
      .select('id, title, author, cover_image_url, rating, rating_count')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Minimal books fetch error:', error);
    return [];
  }
}
