import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { API_URL } from '../../config';
import { supabase } from '../Books/supabaseClient';
import { FaSearch } from 'react-icons/fa';
import { AuthorCard } from './AuthorCard';
import { AuthorModal } from './AuthorModal';
import { AdBanner } from '../Ads/AdBanner';
import { cacheDB } from '../utils/cacheDB';
import './Authors.css';

export const Authors = () => {
  // Navigate is used for routing when users click on authors

  // Authors and state management
  const [authors, setAuthors] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [authorsPerPage] = useState(9);
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [selectedAuthorBooks, setSelectedAuthorBooks] = useState([]);
  const [externalOtherBooks, setExternalOtherBooks] = useState([]);
  const [showAllBooks, setShowAllBooks] = useState(false);
  const [showAllExternal, setShowAllExternal] = useState(false);
  const [coverFallbacks, setCoverFallbacks] = useState({});
  const [modalCoverLoading, setModalCoverLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [followedAuthors, setFollowedAuthors] = useState([]);
  const [showSocialOptions, setShowSocialOptions] = useState(null);
  const [userRatings, setUserRatings] = useState({});
  const [hoverRating, setHoverRating] = useState(0);
  const [authorReactions, setAuthorReactions] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  // ⚡ Initialize authors from cache IMMEDIATELY on mount
  useEffect(() => {
    const cacheKey = 'authors_list_cache_v2';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const cacheAge = parsed.timestamp ? Date.now() - parsed.timestamp : Infinity;
        if (cacheAge < 24 * 60 * 60 * 1000 && parsed.data?.length > 0) {
          console.log('⚡ Authors instant load from localStorage cache');
          setAuthors(parsed.data);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.warn('localStorage cache error:', e);
      }
    }
    
    // Try IndexedDB as fallback
    (async () => {
      try {
        const idbAuthors = await cacheDB.loadAuthors();
        if (idbAuthors && idbAuthors.length > 0) {
          console.log('⚡ Authors instant load from IndexedDB cache');
          setAuthors(idbAuthors);
          setIsLoading(false);
        }
      } catch (e) {
        console.warn('IndexedDB cache error:', e);
      }
    })();
  }, []);

  // Helper to get current user
  const getCurrentUser = async () => {
    try {
      if (supabase.auth?.getUser) {
        const { data } = await supabase.auth.getUser();
        return data?.user || null;
      }
      if (supabase.auth?.user) {
        return supabase.auth.user() || null;
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  // Load current user on mount
  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      setCurrentUserId(user?.id || null);
    })();
  }, []);

  // Fetch and enrich authors from books table (OPTIMIZED)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // ⚡ CHECK CACHE FIRST - instant load from localStorage
        const cacheKey = 'authors_list_cache_v2';
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
              console.log('⚡ Authors loaded from cache - INSTANT');
              if (mounted) {
                setAuthors(parsed.data || []);
                setIsLoading(false);
              }
              return; // Don't fetch from DB if cache is fresh
            }
          } catch (e) {
            console.warn('Cache parse error:', e);
          }
        }
        
        setIsLoading(true);
        
        // ⚡ FETCH: Get authors and their book data for enrichment
        console.log('📚 Fetching authors from books table...');
        const { data: rows, error } = await supabase
          .from('books')
          .select('author, cover_image_url, rating, rating_count')
          .neq('author', null)
          .limit(1000);

        if (error) {
          console.error('Failed to fetch authors from books:', error);
          if (mounted) {
            setAuthors([]);
            setIsLoading(false);
          }
          return;
        }

        console.log(`✅ Fetched ${rows?.length || 0} books with authors`);
        console.log('Sample books:', rows?.slice(0, 3));

        // Group books by author and gather metadata
        const authorMap = {};
        (rows || []).forEach(r => {
          const name = (r.author || '').trim();
          // Include all authors, even "Unknown"
          if (!name) {
            console.warn('Found book with completely empty author:', r);
            return;
          }
          
          if (!authorMap[name]) {
            authorMap[name] = {
              name,
              bookCount: 0,
              coverUrl: null,
              totalRating: 0,
              ratingCount: 0,
              books: []
            };
          }
          
          authorMap[name].bookCount += 1;
          authorMap[name].books.push(r);
          if (r.cover_url) authorMap[name].coverUrl = r.cover_url;
          if (r.average_rating) authorMap[name].totalRating += r.average_rating;
          if (r.rating_count) authorMap[name].ratingCount += r.rating_count;
        });

        const list = Object.values(authorMap).map((author) => {
          const id = `author-${author.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
          return {
            id,
            name: author.name,
            photo: author.coverUrl || null,
            nationality: '',
            biography: '',
            booksPublished: author.bookCount,
            averageRating: author.ratingCount > 0 ? author.totalRating / author.bookCount : 0,
            ratingCount: author.ratingCount,
            likes: 0,
            loves: 0,
            followers: 0,
            isFollowing: false
          };
        }).sort((a, b) => b.booksPublished - a.booksPublished);

        console.log(`🎯 Extracted ${list.length} unique authors`);
        console.log('Authors:', list);

        if (mounted) {
          // ⚡ Cache the results for 24 hours
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              data: list,
              timestamp: Date.now()
            }));
          } catch (e) {
            console.warn('Failed to cache authors:', e);
          }
          
          // ⚡ Also cache to IndexedDB for offline support
          cacheDB.saveAuthors(list).catch(e => console.warn('IndexedDB save error:', e));
          
          setAuthors(list);
          setIsLoading(false); // 🚀 Mark ready immediately!
          
          // ⚡ Enrich authors in BACKGROUND (doesn't block UI)
          (async () => {
            const cacheKey = 'author_enrichment_v1';
            let cache = {};
            try {
              cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
            } catch (e) {
              cache = {};
            }

            const enrichAuthor = async (a) => {
              const name = a.name;
              if (cache[name]) return { ...a, ...cache[name] };

              const persist = (meta) => {
                cache[name] = meta;
                try {
                  localStorage.setItem(cacheKey, JSON.stringify(cache));
                } catch (e) {}
                return { ...a, ...meta };
              };

              // Try book cover FIRST (fastest - local data)
              try {
                // Fetch books by this author without filter to avoid encoding issues
                const { data: allBooks } = await supabase
                  .from('books')
                  .select('cover_url, author')
                  .neq('cover_url', null)
                  .limit(50);
                
                // Find book by matching author name case-insensitively
                const bookData = (allBooks || []).find(b => 
                  (b.author || '').toLowerCase() === (name || '').toLowerCase()
                );

                if (!error && bookData?.cover_url) {
                  return persist({
                    photo: bookData.cover_url,
                    biography: a.biography,
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
                          photo: thumb ? String(thumb).replace(/^http:\/\//, 'https://') : a.photo,
                          biography: extract || a.biography,
                          source: 'wikipedia'
                        });
                      }
                    }
                  }
                }
              } catch (e) {}

              // Skip Open Library and DuckDuckGo for speed - they're slow
              // Only try Google Books as fallback
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
                        biography: a.biography,
                        source: 'googlebooks'
                      });
                    }
                  }
                }
              } catch (e) {}

              return persist({
                photo: a.photo,
                biography: a.biography,
                source: 'fallback'
              });
            };

            try {
              // ⚡ Enrich only top 5 authors in parallel for speed
              const topAuthors = list.slice(0, 5);
              const otherAuthors = list.slice(5);
              
              const enrichedTop = await Promise.allSettled(
                topAuthors.map(a => enrichAuthor(a).catch(() => a))
              );
              
              const enrichedTopResults = enrichedTop.map(r => r.status === 'fulfilled' ? r.value : topAuthors[enrichedTop.indexOf(r)]);
              
              if (mounted) {
                setAuthors([...enrichedTopResults, ...otherAuthors]);
              }
              
              // Enrich remaining authors in the background
              setTimeout(() => {
                Promise.allSettled(
                  otherAuthors.map(a => enrichAuthor(a).catch(() => a))
                ).then(results => {
                  if (mounted) {
                    const enrichedOthers = results.map(r => r.status === 'fulfilled' ? r.value : otherAuthors[results.indexOf(r)]);
                    setAuthors(prev => [...enrichedTopResults, ...enrichedOthers]);
                  }
                });
              }, 0);
            } catch (err) {
              console.warn('Failed to enrich authors', err);
            }
          })();
        }
      } catch (err) {
        console.error('Error deriving authors:', err);
        if (mounted) setIsLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  // Filter authors based on search
  const filteredAuthors = useMemo(() => {
    if (!searchTerm) return authors;
    const term = searchTerm.toLowerCase().trim();
    if (!term) return authors; // Return all if search is only whitespace
    
    const results = authors.filter(author => {
      const name = (author.name || '').toLowerCase();
      const nationality = (author.nationality || '').toLowerCase();
      const biography = (author.biography || '').toLowerCase();
      
      return (
        name.includes(term) ||
        nationality.includes(term) ||
        biography.includes(term)
      );
    });
    
    console.log(`Search: "${searchTerm}" | Found: ${results.length} authors`);
    return results;
  }, [searchTerm, authors]);

  // Log search events
  const logSearchEvent = useCallback(async ({ queryText, resultsCount }) => {
    try {
      const trimmed = (queryText || '').trim();
      if (!trimmed || trimmed.length < 2) return;

      const { data } = await supabase.auth.getSession();
      const session = data?.session || null;
      const token = session?.access_token || null;
      const userId = session?.user?.id || null;

      let origin = '';
      if (typeof window !== 'undefined') {
        const { protocol, hostname } = window.location || {};
        // Prefer explicit override, otherwise use localhost for dev or API_URL for production
        if (window.__API_ORIGIN__) {
          origin = window.__API_ORIGIN__;
        } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
          origin = `${protocol}//${hostname}:5000`;
        } else {
          origin = API_URL;
        }
      } else {
        origin = API_URL;
      }

      await fetch(`${origin}/api/elib/search-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          scope: 'authors',
          queryText: trimmed,
          userId,
          categoryId: null,
          bookId: null,
          authorName: null,
          pastPaperId: null,
          resultsCount: typeof resultsCount === 'number' ? resultsCount : null,
        }),
      }).catch(() => {});
    } catch (e) {
      console.warn('logSearchEvent failed', e);
    }
  }, []);

  // Debounced search logging
  useEffect(() => {
    const q = (searchTerm || '').trim();
    if (!q || q.length < 2) return;

    const handle = setTimeout(() => {
      logSearchEvent({ queryText: q, resultsCount: filteredAuthors.length });
    }, 800);

    return () => clearTimeout(handle);
  }, [searchTerm, filteredAuthors.length, logSearchEvent]);

  // Add display data to authors
  const authorsWithDisplayData = useMemo(() => {
    return filteredAuthors.map(author => ({
      ...author,
      displayRating: author.averageRating || 0,
      isLiked: authorReactions[author.id]?.liked || false,
      isLoved: authorReactions[author.id]?.loved || false,
      userRating: userRatings[author.id] || null
    }));
  }, [filteredAuthors, authorReactions, userRatings]);

  // Pagination
  const indexOfLastAuthor = currentPage * authorsPerPage;
  const indexOfFirstAuthor = indexOfLastAuthor - authorsPerPage;
  const currentAuthors = authorsWithDisplayData.slice(indexOfFirstAuthor, indexOfLastAuthor);
  const totalPages = Math.ceil(authorsWithDisplayData.length / authorsPerPage);

  // Reset to first page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Load stats and interactions
  useEffect(() => {
    if (!authors || authors.length === 0 || !currentUserId) return;

    let mounted = true;
    const loadStatsAndInteractions = async () => {
      try {
        const names = authors.map(a => a.name);
        
        // Get aggregate likes and loves counts from views
        const [likesCountRes, lovesCountRes] = await Promise.all([
          supabase.from('author_likes_counts').select('author_name, likes_count').in('author_name', names),
          supabase.from('author_loves_counts').select('author_name, loves_count').in('author_name', names)
        ]);

        const likesCountMap = {};
        const lovesCountMap = {};
        (likesCountRes.data || []).forEach(l => { likesCountMap[l.author_name] = l.likes_count; });
        (lovesCountRes.data || []).forEach(l => { lovesCountMap[l.author_name] = l.loves_count; });

        // Update authors with aggregate counts
        if (mounted) {
          setAuthors(prev => (prev || []).map(a => ({
            ...a,
            likes: likesCountMap[a.name] || 0,
            loves: lovesCountMap[a.name] || 0
          })));
        }
        
        // Get user interactions: likes, loves, follows, and ratings
        const [likesRes, lovesRes, followsRes, ratingsRes] = await Promise.all([
          supabase.from('author_likes').select('author_name').eq('user_id', currentUserId).in('author_name', names),
          supabase.from('author_loves').select('author_name').eq('user_id', currentUserId).in('author_name', names),
          supabase.from('author_followers').select('author_name').eq('user_id', currentUserId).in('author_name', names),
          supabase.from('author_ratings').select('author_name, rating_value').eq('user_id', currentUserId).in('author_name', names)
        ]);

        if (likesRes.error || lovesRes.error || followsRes.error || ratingsRes.error) {
          console.warn('Some interaction tables not found.', {
            likes: likesRes.error,
            loves: lovesRes.error,
            follows: followsRes.error,
            ratings: ratingsRes.error
          });
        }

        const userLikes = new Set((likesRes.data || []).map(l => l.author_name));
        const userLoves = new Set((lovesRes.data || []).map(l => l.author_name));
        const userFollows = new Set((followsRes.data || []).map(f => f.author_name));
        const userRatingsMap = {};
        (ratingsRes.data || []).forEach(r => { userRatingsMap[r.author_name] = r.rating_value; });

        if (!mounted) return;

        setFollowedAuthors(authors.filter(a => userFollows.has(a.name)).map(a => a.id));
        setAuthorReactions(prev => {
          const reactions = { ...prev };
          authors.forEach(a => {
            reactions[a.id] = {
              liked: userLikes.has(a.name),
              loved: userLoves.has(a.name)
            };
          });
          return reactions;
        });
        setUserRatings(prev => {
          const ratings = { ...prev };
          authors.forEach(a => {
            if (userRatingsMap[a.name]) {
              ratings[a.id] = userRatingsMap[a.name];
            }
          });
          return ratings;
        });
      } catch (err) {
        console.warn('Failed to fetch author stats', err);
      }
    };

    loadStatsAndInteractions();

    // Realtime subscriptions for author interactions
    const userInteractionsChannel = supabase
      .channel('user_interactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'author_likes', filter: `user_id=eq.${currentUserId}` }, loadStatsAndInteractions)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'author_loves', filter: `user_id=eq.${currentUserId}` }, loadStatsAndInteractions)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'author_followers', filter: `user_id=eq.${currentUserId}` }, loadStatsAndInteractions)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'author_ratings', filter: `user_id=eq.${currentUserId}` }, loadStatsAndInteractions)
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(userInteractionsChannel);
      } catch (e) {
        console.warn('Error removing channels:', e);
      }
      mounted = false;
    };
  }, [currentUserId]);

  // Interaction handlers
  const toggleFollow = async (authorId, e) => {
    if (e) e.stopPropagation();
    const author = authors.find(a => a.id === authorId);
    if (!author) return;
    const user = await getCurrentUser();
    if (!user) {
      console.warn('Login required to follow');
      return;
    }

    try {
      const { data: existing, error: fetchError } = await supabase
        .from('author_followers')
        .select('id')
        .eq('user_id', user.id)
        .eq('author_name', author.name)
        .maybeSingle();

      if (fetchError) return;

      if (existing?.id) {
        const { error } = await supabase.from('author_followers').delete().eq('id', existing.id);
        if (!error) {
          setFollowedAuthors(prev => prev.filter(id => id !== authorId));
          setAuthors(prev => (prev || []).map(a => {
            if (a.id !== authorId) return a;
            return { ...a, followers: Math.max(0, (a.followers || 0) - 1) };
          }));
        }
      } else {
        const { error } = await supabase.from('author_followers').insert({ user_id: user.id, author_name: author.name });
        if (!error) {
          setFollowedAuthors(prev => [...(prev || []), authorId]);
          setAuthors(prev => (prev || []).map(a => {
            if (a.id !== authorId) return a;
            return { ...a, followers: (a.followers || 0) + 1 };
          }));
        }
      }
    } catch (err) {
      console.error('Failed to toggle follow', err);
    }
  };

  const toggleSocialOptions = (authorId, e) => {
    e.stopPropagation();
    setShowSocialOptions(prev => prev === authorId ? null : authorId);
  };

  const followOnSocialMedia = (authorId, platform, e) => {
    e.stopPropagation();
    const author = authors.find(a => a.id === authorId);
    let url = '';

    switch (platform) {
      case 'twitter':
        url = author.socialMedia?.twitter || `https://twitter.com/${author.name.replace(/\s+/g, '')}`;
        break;
      case 'facebook':
        url = author.socialMedia?.facebook || `https://facebook.com/${author.name.replace(/\s+/g, '')}`;
        break;
      case 'instagram':
        url = author.socialMedia?.instagram || `https://instagram.com/${author.name.replace(/\s+/g, '')}`;
        break;
      default:
        return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
    setShowSocialOptions(null);
  };

  const toggleLike = (authorId, e) => {
    e.stopPropagation();
    (async () => {
      const author = authors.find(a => a.id === authorId);
      if (!author) return;
      const user = await getCurrentUser();
      if (!user) return;

      try {
        const { data: existing } = await supabase
          .from('author_likes')
          .select('id')
          .eq('user_id', user.id)
          .eq('author_name', author.name)
          .maybeSingle();

        if (existing?.id) {
          await supabase.from('author_likes').delete().eq('id', existing.id);
          setAuthorReactions(prev => ({ ...prev, [authorId]: { ...prev[authorId], liked: false } }));
          setAuthors(prev => (prev || []).map(a => {
            if (a.id !== authorId) return a;
            return { ...a, likes: Math.max(0, (a.likes || 0) - 1) };
          }));
        } else {
          await supabase.from('author_likes').insert({ user_id: user.id, author_name: author.name });
          setAuthorReactions(prev => ({ ...prev, [authorId]: { ...prev[authorId], liked: true } }));
          setAuthors(prev => (prev || []).map(a => {
            if (a.id !== authorId) return a;
            return { ...a, likes: (a.likes || 0) + 1 };
          }));
        }
      } catch (err) {
        console.error('Failed to toggle like', err);
      }
    })();
  };

  const toggleLove = (authorId, e) => {
    e.stopPropagation();
    (async () => {
      const author = authors.find(a => a.id === authorId);
      if (!author) return;
      const user = await getCurrentUser();
      if (!user) return;

      try {
        const { data: existing } = await supabase
          .from('author_loves')
          .select('id')
          .eq('user_id', user.id)
          .eq('author_name', author.name)
          .maybeSingle();

        if (existing?.id) {
          await supabase.from('author_loves').delete().eq('id', existing.id);
          setAuthorReactions(prev => ({ ...prev, [authorId]: { ...prev[authorId], loved: false } }));
          setAuthors(prev => (prev || []).map(a => {
            if (a.id !== authorId) return a;
            return { ...a, loves: Math.max(0, (a.loves || 0) - 1) };
          }));
        } else {
          await supabase.from('author_loves').insert({ user_id: user.id, author_name: author.name });
          setAuthorReactions(prev => ({ ...prev, [authorId]: { ...prev[authorId], loved: true } }));
          setAuthors(prev => (prev || []).map(a => {
            if (a.id !== authorId) return a;
            return { ...a, loves: (a.loves || 0) + 1 };
          }));
        }
      } catch (err) {
        console.error('Failed to toggle love', err);
      }
    })();
  };

  const handleRating = (authorId, rating) => {
    const safeRating = Math.max(1, Math.min(5, Number(rating) || 1));
    const prevUserRating = userRatings[authorId] ?? null;
    setUserRatings(prev => ({ ...prev, [authorId]: safeRating }));

    (async () => {
      const author = authors.find(a => a.id === authorId);
      if (!author) return;
      const user = await getCurrentUser();
      if (!user) return;

      try {
        await supabase.from('author_ratings').upsert(
          { author_name: author.name, user_id: user.id, rating_value: safeRating, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,author_name' }
        );

        setAuthors(prev => (prev || []).map(a => {
          if (a.id !== authorId) return a;
          const currentAvg = Number(a.averageRating || 0);
          const currentCount = Number(a.ratingCount || 0);

          let newCount = currentCount;
          let total = currentAvg * currentCount;

          if (prevUserRating != null) {
            total = total - prevUserRating + safeRating;
          } else {
            newCount += 1;
            total += safeRating;
          }

          const newAvg = newCount > 0 ? total / newCount : safeRating;
          return { ...a, averageRating: newAvg, ratingCount: newCount };
        }));
      } catch (err) {
        console.error('Failed to save rating', err);
      }
    })();
  };

  const handleAuthorImageError = async (e, author, options = { allowDbLookup: false }) => {
    try {
      const img = e?.target;
      if (!img || img.dataset?.fallbackTried === '1') return;

      const allowDb = !!options.allowDbLookup;
      if (allowDb) setModalCoverLoading(true);

      // Try cached fallback
      if (coverFallbacks[author.id]) {
        img.dataset.fallbackTried = '1';
        img.src = coverFallbacks[author.id];
        if (allowDb) setModalCoverLoading(false);
        return;
      }

      // Try database book cover
      // Fetch books without author filter to avoid encoding issues
      const { data: allBooks } = await supabase
        .from('books')
        .select('cover_url, author')
        .neq('cover_url', null)
        .limit(50);
      
      // Find book by matching author name case-insensitively
      const bookData = (allBooks || []).find(b => 
        (b.author || '').toLowerCase() === (author.name || '').toLowerCase()
      );

      if (bookData?.cover_url) {
        setCoverFallbacks(prev => ({ ...prev, [author.id]: bookData.cover_url }));
        img.dataset.fallbackTried = '1';
        img.src = bookData.cover_url;
        if (allowDb) setModalCoverLoading(false);
        return;
      }

      // Final fallback: SVG with initials
      const initials = ((author.name || '')
        .split(' ')
        .map(w => w[0])
        .join('') || 'A')
        .substring(0, 2)
        .toUpperCase();
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="128" height="192" viewBox="0 0 128 192">
          <rect width="100%" height="100%" fill="#0f172a" />
          <circle cx="64" cy="80" r="48" fill="#6366f1" />
          <text x="50%" y="80" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="40" font-weight="600" font-family="system-ui, -apple-system, sans-serif">${initials}</text>
        </svg>
      `;
      img.dataset.fallbackTried = '1';
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      if (allowDb) setModalCoverLoading(false);
    } catch (err) {
      if (options.allowDbLookup) setModalCoverLoading(false);
    }
  };

  // Load books when author selected
  useEffect(() => {
    let mounted = true;
    const loadBooks = async () => {
      if (!selectedAuthor) return;
      
      try {
        // Fetch books without author filter to avoid encoding issues with special characters
        const { data: allBooksData, error } = await supabase
          .from('books')
          .select('id,title,author,cover_url')
          .order('created_at', { ascending: false })
          .limit(500);
        
        // Filter by author in JavaScript (case-insensitive)
        const data = (allBooksData || []).filter(b => 
          (b.author || '').toLowerCase() === (selectedAuthor.name || '').toLowerCase()
        ).slice(0, 200);

        if (mounted) {
          setSelectedAuthorBooks(error ? [] : data || []);
        }

        // Fetch external books
        const q = `inauthor:"${selectedAuthor.name}"`;
        const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=20`;
        const res = await fetch(url);
        if (res.ok) {
          const googleData = await res.json();
          const items = (googleData.items || []).map(it => {
            const vi = it.volumeInfo || {};
            return {
              id: `g-${it.id}`,
              title: vi.title || 'Untitled',
              thumbnail: vi.imageLinks?.thumbnail || vi.imageLinks?.smallThumbnail || null,
              infoLink: vi.infoLink || it.selfLink || null,
            };
          });

          const existingTitles = new Set((data || []).map(b => (b.title || '').toLowerCase()));
          const filtered = items.filter(it => !existingTitles.has((it.title || '').toLowerCase()));
          if (mounted) setExternalOtherBooks(filtered);
        } else {
          if (mounted) setExternalOtherBooks([]);
        }
      } catch (err) {
        console.warn('Failed to fetch books', err);
        if (mounted) {
          setSelectedAuthorBooks([]);
          setExternalOtherBooks([]);
        }
      }
    };

    loadBooks();
    return () => { mounted = false; };
  }, [selectedAuthor]);

  if (isLoading) {
    return <div className="dashboard-container">Loading authors...</div>;
  }

  return (
    <div className="dashboard-container no-empty-space">
      <AdBanner placement="authors" limit={1} />
      
      <header className="headerBKP">
        <div>
          <h2 className="titleBKP">Authors</h2>
        </div>
      </header>

      <div className="search-container">
        <div className="search-box">
          <span className="search-icon"><FaSearch /></span>
          <input
            type="text"
            placeholder="Search authors by name, nationality, or books..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              Clear
            </button>
          )}
        </div>
      </div>

      {currentAuthors.length > 0 ? (
        <>
          <div className="author-grid">
            {currentAuthors.map((author, index) => {
              // For mobile: Show ad after 3rd author (index 2)
              // For desktop: Show ad in middle position
              const isMobile = window.innerWidth < 768;
              const adPosition = isMobile ? 3 : Math.floor(currentAuthors.length / 2);
              
              // Render ad at the appropriate position
              if (index === adPosition && currentAuthors.length > 0) {
                return (
                  <React.Fragment key={`ad-position-${index}`}>
                    {/* Grid Ad */}
                    <div
                      key="grid-ad-authors"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '240px',
                        maxHeight: '240px'
                      }}
                    >
                      <AdBanner placement="grid-authors" limit={5} />
                    </div>
                    
                    {/* Current Author */}
                    <AuthorCard
                      key={author.id}
                      author={author}
                      isFollowing={followedAuthors.includes(author.id)}
                      showSocialOptions={showSocialOptions}
                      onAuthorClick={setSelectedAuthor}
                      onToggleFollow={toggleFollow}
                      onToggleSocialOptions={toggleSocialOptions}
                      onFollowSocial={followOnSocialMedia}
                      onToggleLike={toggleLike}
                      onToggleLove={toggleLove}
                      onImageError={handleAuthorImageError}
                      userRating={author.userRating}
                      onRating={handleRating}
                      hoverRating={hoverRating}
                      onHoverRating={setHoverRating}
                    />
                  </React.Fragment>
                );
              }
              
              // Render regular author card
              return (
                <AuthorCard
                  key={author.id}
                  author={author}
                  isFollowing={followedAuthors.includes(author.id)}
                  showSocialOptions={showSocialOptions}
                  onAuthorClick={setSelectedAuthor}
                  onToggleFollow={toggleFollow}
                  onToggleSocialOptions={toggleSocialOptions}
                  onFollowSocial={followOnSocialMedia}
                  onToggleLike={toggleLike}
                  onToggleLove={toggleLove}
                  onImageError={handleAuthorImageError}
                  userRating={author.userRating}
                  onRating={handleRating}
                  hoverRating={hoverRating}
                  onHoverRating={setHoverRating}
                />
              );
            })}
          </div>

          <div className="pagination-controls">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <div className="no-results">
          <h3>No authors found matching your search</h3>
          <p>Try a different search term or clear your search</p>
          {searchTerm && (
            <small style={{ marginTop: '10px', opacity: 0.6 }}>
              Searched in {authors.length} available authors
            </small>
          )}
        </div>
      )}

      <AuthorModal
        author={selectedAuthor}
        authorBooks={selectedAuthorBooks}
        externalBooks={externalOtherBooks}
        showAllBooks={showAllBooks}
        showAllExternal={showAllExternal}
        modalCoverLoading={modalCoverLoading}
        userRating={userRatings[selectedAuthor?.id]}
        hoverRating={hoverRating}
        onClose={() => setSelectedAuthor(null)}
        onImageError={handleAuthorImageError}
        onRating={handleRating}
        onHoverRating={setHoverRating}
        onToggleShowAllBooks={() => setShowAllBooks(prev => !prev)}
        onToggleShowAllExternal={() => setShowAllExternal(prev => !prev)}
      />
    </div>
  );
};