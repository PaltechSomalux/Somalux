/**
 * Fast Authors Loading Utility
 * Optimized for quick loading with progressive enrichment
 */

// Cache key for authors
const AUTHORS_CACHE_KEY = 'authors_list_cache_v2';
const AUTHORS_CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Get authors from database or cache
 * @param {Object} supabase - Supabase client
 * @returns {Promise<Array>} Authors list
 */
export async function getAuthorsOptimized(supabase) {
  try {
    // Check localStorage cache first
    const cached = localStorage.getItem(AUTHORS_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.timestamp && Date.now() - parsed.timestamp < AUTHORS_CACHE_TTL) {
          console.log('✅ Authors loaded from cache');
          return parsed.data || [];
        }
      } catch (e) {
        console.warn('Cache parse error:', e);
      }
    }

    // ⚡ Fast: Use RPC function if available, otherwise fetch minimal data
    let rows;
    try {
      const { data, error } = await supabase.rpc('get_top_authors', { limit_count: 1000 });
      if (!error && data) {
        rows = data.map(d => ({ author: d.author_name }));
      } else {
        // Fallback
        const result = await supabase
          .from('books')
          .select('author', { count: 'exact' })
          .neq('author', null);
        rows = result.data || [];
      }
    } catch (e) {
      const result = await supabase
        .from('books')
        .select('author', { count: 'exact' })
        .neq('author', null);
      rows = result.data || [];
    }

    const counts = {};
    (rows || []).forEach(r => {
      const name = (r.author || '').trim();
      if (!name) return;
      counts[name] = (counts[name] || 0) + 1;
    });

    const authors = Object.keys(counts)
      .map((name) => ({
        id: `author-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name,
        photo: null,
        nationality: '',
        biography: '',
        booksPublished: counts[name],
        averageRating: 0,
        ratingCount: 0,
        likes: 0,
        loves: 0,
        followers: 0,
        isFollowing: false
      }))
      .sort((a, b) => b.booksPublished - a.booksPublished);

    // Cache the results
    try {
      localStorage.setItem(AUTHORS_CACHE_KEY, JSON.stringify({
        data: authors,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Failed to cache authors:', e);
    }

    return authors;
  } catch (error) {
    console.error('getAuthorsOptimized error:', error);
    return [];
  }
}

/**
 * Enrich author with external data (book cover, Wikipedia, etc.)
 * Non-blocking - runs in background
 */
export async function enrichAuthor(author, supabase, cache = {}) {
  const name = author.name;

  // Return cached data if available
  if (cache[name]) {
    return { ...author, ...cache[name] };
  }

  const persist = (meta) => {
    cache[name] = meta;
    try {
      localStorage.setItem('author_enrichment_v1', JSON.stringify(cache));
    } catch (e) {}
    return { ...author, ...meta };
  };

  // Try book cover FIRST (fastest - local data)
  try {
    // Fetch books without author filter to avoid encoding issues
    const { data: allBooks } = await supabase
      .from('books')
      .select('cover_image_url')
      .not('cover_image_url', 'is', null)
      .limit(100);
    
    // Find book by matching author name case-insensitively
    const bookData = (allBooks || []).find(b => 
      (b.author || '').toLowerCase() === (name || '').toLowerCase()
    );

    if (!error && bookData?.cover_image_url) {
      return persist({
        photo: bookData.cover_image_url,
        biography: author.biography,
        source: 'book_cover'
      });
    }
  } catch (e) {}

  // Try Wikipedia (reliable and fast)
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&list=search&srsearch=${encodeURIComponent(name)}&srlimit=1`;
    const sres = await fetch(searchUrl);
    if (sres.ok) {
      const sdata = await sres.json();
      const hit = sdata?.query?.search?.[0];
      if (hit?.pageid) {
        const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&pageids=${hit.pageid}&prop=pageimages|extracts&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=400`;
        const pres = await fetch(pageUrl);
        if (pres.ok) {
          const pdata = await pres.json();
          const page = pdata?.query?.pages?.[hit.pageid];
          const thumb = page?.thumbnail?.source;
          const extract = page?.extract;
          if (thumb || extract) {
            return persist({
              photo: thumb ? String(thumb).replace(/^http:\/\//, 'https://') : author.photo,
              biography: extract || author.biography,
              source: 'wikipedia'
            });
          }
        }
      }
    }
  } catch (e) {}

  // Try Google Books as fallback
  try {
    const q = `inauthor:"${name}"`;
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=1`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const item = (data.items || [])[0];
      if (item) {
        const vi = item.volumeInfo || {};
        const image = vi.imageLinks?.thumbnail || vi.imageLinks?.smallThumbnail;
        if (image) {
          return persist({
            photo: String(image).replace(/^http:\/\//, 'https://'),
            biography: author.biography,
            source: 'googlebooks'
          });
        }
      }
    }
  } catch (e) {}

  return persist({
    photo: author.photo,
    biography: author.biography,
    source: 'fallback'
  });
}

/**
 * Progressively enrich authors
 * Enrich top N immediately, rest in background
 */
export async function enrichAuthorsProgressively(authors, supabase, topN = 10) {
  const cacheKey = 'author_enrichment_v1';
  let cache = {};
  try {
    cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
  } catch (e) {
    cache = {};
  }

  const topAuthors = authors.slice(0, topN);
  const otherAuthors = authors.slice(topN);

  // Enrich top authors in parallel
  const enrichedTop = await Promise.allSettled(
    topAuthors.map(a => enrichAuthor(a, supabase, cache).catch(() => a))
  );

  const enrichedTopResults = enrichedTop.map((r, i) =>
    r.status === 'fulfilled' ? r.value : topAuthors[i]
  );

  // Return immediately with top authors enriched
  const result = [...enrichedTopResults, ...otherAuthors];

  // Enrich remaining authors in background
  setTimeout(() => {
    Promise.allSettled(
      otherAuthors.map(a => enrichAuthor(a, supabase, cache).catch(() => a))
    ).then(results => {
      const enrichedOthers = results.map((r, i) =>
        r.status === 'fulfilled' ? r.value : otherAuthors[i]
      );
      // You would update the state here in the component
      return [...enrichedTopResults, ...enrichedOthers];
    });
  }, 500);

  return result;
}
