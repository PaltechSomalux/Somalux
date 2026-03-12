import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../Books/supabaseClient';
import {
  FaUsers,
  FaUserEdit,
  FaHeart,
  FaRegHeart,
  FaThumbsUp,
  FaRegThumbsUp,
  FaBookOpen,
  FaSearch,
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaStar,
  FaRegStar,
  FaList
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './Authors.css';

const USER_RATINGS_KEY = 'authorUserRatings';
const LIKES_STORAGE_KEY = 'authorLikes';
const LOVES_STORAGE_KEY = 'authorLoves';
const REACTIONS_STORAGE_KEY = 'authorReactions';
const AUTHORS_CACHE_KEY = 'authorsCache_v1';

export const Authors = () => {
  const navigate = useNavigate();

  // Authors derived from books in the database
  const [authors, setAuthors] = useState([]);

  // State management
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

  // Load current user on mount
  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      setCurrentUserId(user?.id || null);
    })();
  }, []);

  // Fetch authors from `books` table and derive a unique authors list
  useEffect(() => {

    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        const { data: rows, error } = await supabase
          .from('books')
          .select('author')
          .neq('author', null);

        if (error) {
          console.error('Failed to fetch authors from books:', error);
          if (mounted) {
            setAuthors([]);
            setIsLoading(false);
          }
          return;
        }

        const counts = {};
        (rows || []).forEach(r => {
          const name = (r.author || '').trim();
          if (!name) return;
          counts[name] = (counts[name] || 0) + 1;
        });

        const list = Object.keys(counts).map((name, idx) => {
          const id = `author-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
          return {
            id,
            name,
            photo: null, // Will be set later with book cover or enrichment data
            nationality: '',
            biography: '',
            booksPublished: counts[name],
            averageRating: 0,
            ratingCount: 0,
            likes: 0,
            loves: 0,
            followers: 0,
            isFollowing: false
          };
        }).sort((a,b) => b.booksPublished - a.booksPublished);

        // Randomize initial display order so authors appear in a different order
        const randomized = [...list].sort(() => Math.random() - 0.5);

        if (mounted) {
          setAuthors(randomized);

          // Cache derived authors list (without enrichment) for faster subsequent loads
          try {
            localStorage.setItem(AUTHORS_CACHE_KEY, JSON.stringify(randomized));
          } catch (e) {}
          
          // Enrich authors with online metadata using multiple sources (Wikipedia, Open Library,
          // DuckDuckGo Instant Answer, Google Books) with local caching to minimize requests.
          // Profile images from these sources take priority over book covers.
          (async () => {
            const cacheKey = 'author_enrichment_v1';
            let cache = {};
            try { cache = JSON.parse(localStorage.getItem(cacheKey) || '{}'); } catch (e) { cache = {}; }

            const enrichAuthor = async (a) => {
              const name = a.name;
              if (cache[name]) return { ...a, ...cache[name] };

              // Helper to persist single entry
              const persist = (meta) => {
                cache[name] = meta;
                try { localStorage.setItem(cacheKey, JSON.stringify(cache)); } catch (e) {}
                return { ...a, ...meta };
              };

              // 1) Wikipedia
              try {
                const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&list=search&srsearch=${encodeURIComponent(name)}&srlimit=1`;
                const sres = await fetch(searchUrl);
                if (sres.ok) {
                  const sdata = await sres.json();
                  const hit = sdata?.query?.search?.[0];
                  if (hit && hit.pageid) {
                    const pageid = hit.pageid;
                    const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&pageids=${pageid}&prop=pageimages|extracts&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=400`;
                    const pres = await fetch(pageUrl);
                    if (pres.ok) {
                      const pdata = await pres.json();
                      const page = pdata?.query?.pages?.[pageid];
                      const thumb = page?.thumbnail?.source;
                      const extract = page?.extract;
                      if (thumb || extract) return persist({ photo: thumb ? String(thumb).replace(/^http:\/\//, 'https://') : a.photo, biography: extract || a.biography, source: 'wikipedia' });
                    }
                  }
                }
              } catch (e) {}

              // 2) Open Library (author search)
              try {
                const olSearch = `https://openlibrary.org/search/authors.json?q=${encodeURIComponent(name)}`;
                const or = await fetch(olSearch);
                if (or.ok) {
                  const odata = await or.json();
                  const doc = (odata.docs || [])[0];
                  if (doc && doc.key) {
                    const key = doc.key; // e.g. "/authors/OL23919A"
                    try {
                      const authorJson = await fetch(`https://openlibrary.org${key}.json`);
                      if (authorJson.ok) {
                        const aj = await authorJson.json();
                        const bio = (typeof aj.bio === 'string') ? aj.bio : (aj.bio && aj.bio.value) || a.biography;
                        const olid = key.split('/').pop();
                        const possibleImg = `https://covers.openlibrary.org/a/olid/${olid}-M.jpg`;
                        // Note: OpenLibrary returns 200 even when image missing, but clients can handle fallback.
                        return persist({ photo: possibleImg, biography: bio, source: 'openlibrary' });
                      }
                    } catch (e) {}
                  }
                }
              } catch (e) {}

              // 3) DuckDuckGo Instant Answer (may include an Image field)
              try {
                const ddUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(name)}&format=json&pretty=1`;
                const dres = await fetch(ddUrl);
                if (dres.ok) {
                  const ddata = await dres.json();
                  const img = ddata?.Image;
                  const text = ddata?.Abstract || ddata?.AbstractText || a.biography;
                  if (img || text) return persist({ photo: img ? String(img).replace(/^http:\/\//, 'https://') : a.photo, biography: text || a.biography, source: 'duckduckgo' });
                }
              } catch (e) {}

              // 4) Google Books fallback
              try {
                const q = `inauthor:"${name}"`;
                const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=5`;
                const res = await fetch(url);
                if (res.ok) {
                  const data = await res.json();
                  const item = (data.items || []).find(it => it.volumeInfo && (it.volumeInfo.imageLinks || it.volumeInfo.description));
                  if (item) {
                    const vi = item.volumeInfo || {};
                    const image = vi.imageLinks?.thumbnail || vi.imageLinks?.smallThumbnail;
                    const bio = vi.description || item.searchInfo?.textSnippet || a.biography;
                    if (image || bio) return persist({ photo: image ? String(image).replace(/^http:\/\//, 'https://') : a.photo, biography: bio || a.biography, source: 'googlebooks' });
                  }
                }
              } catch (e) {}

              // Nothing found from online sources — fallback to book cover
              try {
                const { data: bookData, error } = await supabase
                  .from('books')
                  .select('cover_url')
                  .eq('author', name)
                  .not('cover_url', 'is', null)
                  .limit(1)
                  .single();

                if (!error && bookData?.cover_url) {
                  return persist({ photo: bookData.cover_url, biography: a.biography, source: 'book_cover' });
                }
              } catch (e) {
                // No book cover found either
              }

              // Nothing found — persist placeholder to avoid repeated attempts
              return persist({ photo: a.photo, biography: a.biography, source: 'fallback' });
            };

            try {
              const enriched = await Promise.all(list.map(async (a) => {
                try { return await enrichAuthor(a); } catch (e) { return a; }
              }));
              setAuthors(enriched);
            } catch (err) {
              console.warn('Failed to enrich authors with online metadata', err);
            }
          })();
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error deriving authors from books:', err);
        if (mounted) setIsLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  // Filter authors based on search term
  const filteredAuthors = useMemo(() => {
    if (!searchTerm) return authors;

    const term = searchTerm.toLowerCase();
    return authors.filter(author =>
      author.name.toLowerCase().includes(term) ||
      author.nationality.toLowerCase().includes(term) ||
      author.biography?.toLowerCase().includes(term) ||
      author.books?.some(book => book.title.toLowerCase().includes(term))
    );
  }, [searchTerm, authors]);

  // Calculate display ratings
  const authorsWithDisplayData = useMemo(() => {
    return filteredAuthors.map(author => {
      const displayRating = author.averageRating || 0;

      return {
        ...author,
        displayRating,
        isLiked: authorReactions[author.id]?.liked || false,
        isLoved: authorReactions[author.id]?.loved || false
      };
    });
  }, [filteredAuthors, authorReactions]);

  // Pagination
  const indexOfLastAuthor = currentPage * authorsPerPage;
  const indexOfFirstAuthor = indexOfLastAuthor - authorsPerPage;
  const currentAuthors = authorsWithDisplayData.slice(indexOfFirstAuthor, indexOfLastAuthor);
  const totalPages = Math.ceil(authorsWithDisplayData.length / authorsPerPage);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Helper to get the currently authenticated user (works with supabase v1/v2 clients)
  const getCurrentUser = async () => {
    try {
      if (supabase.auth && supabase.auth.getUser) {
        const { data } = await supabase.auth.getUser();
        return data?.user || null;
      }
      if (supabase.auth && supabase.auth.user) {
        // older clients
        return supabase.auth.user() || null;
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  // When authors list is ready, fetch aggregated stats and user's interactions
  useEffect(() => {
    if (!authors || authors.length === 0 || !currentUserId) return;

    let mounted = true;
    const loadStatsAndInteractions = async () => {
      try {
        const names = authors.map(a => a.name);
        
        // Fetch aggregated stats (handle if table doesn't exist)
        const { data: stats, error: statsError } = await supabase
          .from('author_stats')
          .select('*')
          .in('author_name', names);

        if (!mounted) return;

        // If table doesn't exist, just continue without stats
        if (statsError && statsError.code === 'PGRST116') {
          console.warn('Author stats table not found. Please run the migration.');
          return;
        }

        const statsMap = {};
        (stats || []).forEach(s => { statsMap[s.author_name] = s; });

        // Fetch user's interactions (handle if tables don't exist)
        const [likesRes, lovesRes, followsRes, ratingsRes] = await Promise.all([
          supabase.from('author_likes').select('author_name').eq('user_id', currentUserId).in('author_name', names),
          supabase.from('author_loves').select('author_name').eq('user_id', currentUserId).in('author_name', names),
          supabase.from('author_follows').select('author_name').eq('follower_id', currentUserId).in('author_name', names),
          supabase.from('author_ratings').select('author_name, rating').eq('user_id', currentUserId).in('author_name', names)
        ]);

        // Handle errors gracefully
        if (likesRes.error || lovesRes.error || followsRes.error || ratingsRes.error) {
          console.warn('Some interaction tables not found. Please run the migration.');
          return;
        }

        const userLikes = new Set((likesRes.data || []).map(l => l.author_name));
        const userLoves = new Set((lovesRes.data || []).map(l => l.author_name));
        const userFollows = new Set((followsRes.data || []).map(f => f.author_name));
        const userRatingsMap = {};
        (ratingsRes.data || []).forEach(r => { userRatingsMap[r.author_name] = r.rating; });

        setAuthors(prev => (prev || []).map(a => ({
          ...a,
          averageRating: statsMap[a.name]?.average_rating ?? 0,
          ratingCount: statsMap[a.name]?.rating_count ?? 0,
          likes: statsMap[a.name]?.likes_count ?? 0,
          loves: statsMap[a.name]?.loves_count ?? 0,
          followers: statsMap[a.name]?.followers_count ?? 0
        })));

        // Set user interactions
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
        console.warn('Failed to fetch author stats and interactions', err);
      }
    };

    loadStatsAndInteractions();

    // Subscribe to realtime updates on author_stats table directly
    const statsChannel = supabase
      .channel('author_stats_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'author_stats'
        },
        (payload) => {
          console.log('Author stats changed:', payload);
          const updatedStat = payload.new;
          
          if (updatedStat && updatedStat.author_name) {
            setAuthors(prev => (prev || []).map(a => {
              if (a.name === updatedStat.author_name) {
                return {
                  ...a,
                  averageRating: updatedStat.average_rating ?? a.averageRating ?? 0,
                  ratingCount: updatedStat.rating_count ?? a.ratingCount ?? 0,
                  likes: updatedStat.likes_count ?? a.likes ?? 0,
                  loves: updatedStat.loves_count ?? a.loves ?? 0,
                  followers: updatedStat.followers_count ?? a.followers ?? 0
                };
              }
              return a;
            }));
          }
        }
      )
      .subscribe((status) => {
        // console.log('Subscription status:', status);
      });

    // Also subscribe to user's own interactions for immediate UI feedback
    const userInteractionsChannel = supabase
      .channel('user_interactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'author_likes',
          filter: `user_id=eq.${currentUserId}`
        },
        async (payload) => {
          // Reload user interactions
          await loadStatsAndInteractions();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'author_loves',
          filter: `user_id=eq.${currentUserId}`
        },
        async (payload) => {
          await loadStatsAndInteractions();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'author_follows',
          filter: `follower_id=eq.${currentUserId}`
        },
        async (payload) => {
          await loadStatsAndInteractions();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'author_ratings',
          filter: `user_id=eq.${currentUserId}`
        },
        async (payload) => {
          await loadStatsAndInteractions();
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(statsChannel);
        supabase.removeChannel(userInteractionsChannel);
      } catch (e) {
        console.warn('Error removing channels:', e);
      }
      mounted = false;
    };
  }, [authors, currentUserId]);

  const toggleFollow = async (authorId, e) => {
    if (e) e.stopPropagation();
    const author = authors.find(a => a.id === authorId);
    if (!author) return;
    const user = await getCurrentUser();
    if (!user) {
      console.warn('Login required to follow authors');
      return;
    }

    try {
      // Check existing follow
      const { data: existing, error: fetchError } = await supabase
        .from('author_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('author_name', author.name)
        .maybeSingle();

      if (fetchError) {
        console.error('Error checking follow status:', fetchError);
        return;
      }

      if (existing && existing.id) {
        // Unfollow
        const { error: deleteError } = await supabase.from('author_follows').delete().eq('id', existing.id);
        if (!deleteError) {
          setFollowedAuthors(prev => prev.filter(id => id !== authorId));
          // Optimistically update followers count
          setAuthors(prev => (prev || []).map(a => {
            if (a.id !== authorId) return a;
            const nextFollowers = Math.max(0, (a.followers || 0) - 1);
            return { ...a, followers: nextFollowers };
          }));
        }
      } else {
        // Follow
        const { error: insertError } = await supabase.from('author_follows').insert({ follower_id: user.id, author_name: author.name });
        if (!insertError) {
          setFollowedAuthors(prev => Array.from(new Set([...(prev || []), authorId])));
          // Optimistically update followers count
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
      if (!user) return console.warn('Login required to like');

      try {
        const { data: existing, error: fetchError } = await supabase
          .from('author_likes')
          .select('id')
          .eq('user_id', user.id)
          .eq('author_name', author.name)
          .maybeSingle();

        if (fetchError) {
          console.error('Error checking like status:', fetchError);
          return;
        }

        if (existing && existing.id) {
          const { error: deleteError } = await supabase.from('author_likes').delete().eq('id', existing.id);
          if (!deleteError) {
            setAuthorReactions(prev => ({ ...prev, [authorId]: { ...prev[authorId], liked: false } }));
            // Optimistically decrement likes count
            setAuthors(prev => (prev || []).map(a => {
              if (a.id !== authorId) return a;
              const nextLikes = Math.max(0, (a.likes || 0) - 1);
              return { ...a, likes: nextLikes };
            }));
          }
        } else {
          const { error: insertError } = await supabase.from('author_likes').insert({ user_id: user.id, author_name: author.name });
          if (!insertError) {
            setAuthorReactions(prev => ({ ...prev, [authorId]: { ...prev[authorId], liked: true } }));
            // Optimistically increment likes count
            setAuthors(prev => (prev || []).map(a => {
              if (a.id !== authorId) return a;
              return { ...a, likes: (a.likes || 0) + 1 };
            }));
          }
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
      if (!user) return console.warn('Login required to love');

      try {
        const { data: existing, error: fetchError } = await supabase
          .from('author_loves')
          .select('id')
          .eq('user_id', user.id)
          .eq('author_name', author.name)
          .maybeSingle();

        if (fetchError) {
          console.error('Error checking love status:', fetchError);
          return;
        }

        if (existing && existing.id) {
          const { error: deleteError } = await supabase.from('author_loves').delete().eq('id', existing.id);
          if (!deleteError) {
            setAuthorReactions(prev => ({ ...prev, [authorId]: { ...prev[authorId], loved: false } }));
            // Optimistically decrement loves count
            setAuthors(prev => (prev || []).map(a => {
              if (a.id !== authorId) return a;
              const nextLoves = Math.max(0, (a.loves || 0) - 1);
              return { ...a, loves: nextLoves };
            }));
          }
        } else {
          const { error: insertError } = await supabase.from('author_loves').insert({ user_id: user.id, author_name: author.name });
          if (!insertError) {
            setAuthorReactions(prev => ({ ...prev, [authorId]: { ...prev[authorId], loved: true } }));
            // Optimistically increment loves count
            setAuthors(prev => (prev || []).map(a => {
              if (a.id !== authorId) return a;
              return { ...a, loves: (a.loves || 0) + 1 };
            }));
          }
        }
      } catch (err) {
        console.error('Failed to toggle love', err);
      }
    })();
  };

  const handleRating = (authorId, rating) => {
    // Ensure minimum rating is 1
    const safeRating = Math.max(1, Math.min(5, Number(rating) || 1));
    const prevUserRating = userRatings[authorId] ?? null;
    setUserRatings(prev => ({ ...prev, [authorId]: safeRating }));

    // Persist to DB (upsert)
    (async () => {
      const author = authors.find(a => a.id === authorId);
      if (!author) return;
      const user = await getCurrentUser();
      if (!user) return console.warn('Login required to rate');

      try {
        const { error } = await supabase.from('author_ratings').upsert(
          { author_name: author.name, user_id: user.id, rating: safeRating, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,author_name' }
        );
        if (error) throw error;

        // Optimistically update aggregate rating on the author
        setAuthors(prev => (prev || []).map(a => {
          if (a.id !== authorId) return a;
          const currentAvg = Number(a.averageRating || 0);
          const currentCount = Number(a.ratingCount || 0);

          let newCount = currentCount;
          let total = currentAvg * currentCount;

          if (prevUserRating != null) {
            // User is updating an existing rating
            total = total - prevUserRating + safeRating;
          } else {
            // New rating from this user
            newCount += 1;
            total += safeRating;
          }

          const newAvg = newCount > 0 ? total / newCount : safeRating;
          return {
            ...a,
            averageRating: newAvg,
            ratingCount: newCount
          };
        }));
      } catch (err) {
        console.error('Failed to save rating', err);
      }
    })();
  };

  const handleHoverRating = (rating) => {
    setHoverRating(rating);
  };

  const viewAuthorBooks = (authorId) => {
    navigate(`/books?author=${encodeURIComponent(authorId)}`);
  };

  const fetchCoverFallback = async (authorName) => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('cover_url')
        .eq('author', authorName)
        .not('cover_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) return null;
      const url = (data && data[0] && data[0].cover_url) ? data[0].cover_url : null;
      return url;
    } catch (e) {
      return null;
    }
  };

  // Lightweight HEAD check to verify an image URL exists without downloading full content
  const headCheck = async (url, timeoutMs = 3000) => {
    if (!url) return false;
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
      clearTimeout(id);
      return res && res.ok;
    } catch (e) {
      return false;
    }
  };

  const handleAuthorImageError = async (e, author, options = { allowDbLookup: false }) => {
    try {
      const img = e?.target;
      if (!img) return;
      // avoid infinite loop
      if (img.dataset?.fallbackTried === '1') return;

      const allowDb = !!options.allowDbLookup;
      // If this is the modal and we will perform a DB lookup, show spinner
      if (allowDb) setModalCoverLoading(true);

      // 1) If modal-selected books exist and we're in modal, prefer cover from selectedAuthorBooks
      if (allowDb && selectedAuthor && selectedAuthor.id === author.id && selectedAuthorBooks && selectedAuthorBooks.length > 0) {
        const cover = selectedAuthorBooks[0].cover_url;
        if (cover) {
          img.dataset.fallbackTried = '1';
          img.src = cover;
          if (allowDb) setModalCoverLoading(false);
          return;
        }
      }

      // 2) If we already cached a fallback cover for this author, use it (no DB call)
      if (coverFallbacks[author.id]) {
        img.dataset.fallbackTried = '1';
        img.src = coverFallbacks[author.id];
        if (allowDb) setModalCoverLoading(false);
        return;
      }

      // If DB lookups are not allowed (card-level), try to fetch a book cover from DB
      if (!allowDb) {
        try {
          const { data: bookData, error } = await supabase
            .from('books')
            .select('cover_url')
            .eq('author', author.name)
            .not('cover_url', 'is', null)
            .limit(1)
            .single();

          if (!error && bookData?.cover_url) {
            setCoverFallbacks(prev => ({ ...prev, [author.id]: bookData.cover_url }));
            img.dataset.fallbackTried = '1';
            img.src = bookData.cover_url;
            return;
          }
        } catch (e) {
          // Continue to other fallbacks
        }

        // Check external thumbnails from enrichment results
        if (externalOtherBooks && externalOtherBooks.length > 0) {
          for (const extItem of externalOtherBooks) {
            const ext = extItem.thumbnail;
            if (!ext) continue;
            try {
              const ok = await headCheck(ext);
              if (ok) {
                img.dataset.fallbackTried = '1';
                img.src = ext;
                return;
              }
            } catch (e) { /* continue to next */ }
          }
        }

        // Last-resort: Try to get any book cover from this author
        try {
          const { data: anyBook } = await supabase
            .from('books')
            .select('cover_url')
            .eq('author', author.name)
            .not('cover_url', 'is', null)
            .limit(1);

          if (anyBook && anyBook.length > 0 && anyBook[0].cover_url) {
            img.dataset.fallbackTried = '1';
            img.src = anyBook[0].cover_url;
            return;
          }
        } catch (e) {}

        // Final fallback placeholder: circular avatar with initials (first 2 letters)
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
            <text x="50%" y="80" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="40" font-weight="600" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif">${initials}</text>
          </svg>
        `;
        img.dataset.fallbackTried = '1';
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        return;
      }

      // 3) For modal with DB lookup allowed: try fetching one cover_url from the DB for this author
      const fetched = await fetchCoverFallback(author.name);
      if (fetched) {
        setCoverFallbacks(prev => ({ ...prev, [author.id]: fetched }));
        img.dataset.fallbackTried = '1';
        img.src = fetched;
        if (allowDb) setModalCoverLoading(false);
        return;
      }

      // 4) Try external thumbnails we've fetched for the modal
      if (externalOtherBooks && externalOtherBooks.length > 0) {
        const ext = externalOtherBooks[0].thumbnail;
        if (ext) {
          img.dataset.fallbackTried = '1';
          img.src = ext;
          if (allowDb) setModalCoverLoading(false);
          return;
        }
      }

      // 5) Fallback to a book-style placeholder with author initials (first 2 letters)
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
          <text x="50%" y="80" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="40" font-weight="600" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif">${initials}</text>
        </svg>
      `;
      img.dataset.fallbackTried = '1';
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      if (allowDb) setModalCoverLoading(false);
    } catch (err) {
      if (options.allowDbLookup) setModalCoverLoading(false);
      // swallow errors — keep the existing src
    }
  };

  // When an author is selected, fetch their books from the database
  useEffect(() => {
    let mounted = true;
    const loadBooks = async () => {
      if (!selectedAuthor) return;
      let dbBooks = [];
      
      try {
        const { data, error } = await supabase
          .from('books')
          .select('id,title,cover_url')
          .eq('author', selectedAuthor.name)
          .order('created_at', { ascending: false })
          .limit(200);

        if (error) {
          console.warn('Failed to fetch books for author', selectedAuthor.name, error);
          if (mounted) setSelectedAuthorBooks([]);
        } else {
          dbBooks = data || [];
          if (mounted) setSelectedAuthorBooks(dbBooks);
        }
      } catch (err) {
        console.error('Error loading author books', err);
        if (mounted) setSelectedAuthorBooks([]);
      }

      // Also fetch a list of other books by this author from Google Books as "other books"
      try {
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

          // Filter out books that already exist in the system (match by title, case-insensitive)
          const existingTitles = new Set(dbBooks.map(b => (b.title || '').toLowerCase()));
          const filtered = items.filter(it => !existingTitles.has((it.title || '').toLowerCase()));
          if (mounted) setExternalOtherBooks(filtered);
        } else {
          if (mounted) setExternalOtherBooks([]);
        }
      } catch (err) {
        console.warn('Failed to fetch external books for author', selectedAuthor.name, err);
        if (mounted) setExternalOtherBooks([]);
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
      {/* Header */}
      <header className="dashboard-header">
        <h1>Authors</h1>
      </header>

      {/* Search Bar */}
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
            <button
              className="clear-search"
              onClick={() => setSearchTerm('')}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Author Display */}
      {currentAuthors.length > 0 ? (
        <>
          <div className="author-grid">
            {currentAuthors.map(author => (
              <div key={author.id} className="author-card" onClick={() => setSelectedAuthor(author)}>
                <div className="author-photo">
                  <img src={author.photo} alt={author.name} onError={(e) => handleAuthorImageError(e, author, { allowDbLookup: false })} />
                  <div className="author-badge">
                    <FaBookOpen /> {author.booksPublished} books
                  </div>
                </div>
                <div className="author-info">
                  <h3>{author.name}</h3>
                  <p className="nationality">{author.nationality}</p>
                  <div className="rating-stars">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < Math.floor(author.displayRating) ? 'filled' : ''}>
                        ★
                      </span>
                    ))}
                    <span>({author.displayRating > 0 ? author.displayRating.toFixed(1) : 'Not rated'})</span>
                  </div>
                  <div className="author-stats-inline">
                    <span title="Followers">{author.followers || 0} followers</span>
                  </div>
                  <div className="author-actions">
                    <div className="follow-container">
                      <button
                        className={`follow-button ${followedAuthors.includes(author.id) ? 'following' : ''}`}
                        onClick={(e) => toggleFollow(author.id, e)}
                      >
                        <FaUserEdit /> {followedAuthors.includes(author.id) ? 'Following' : 'Follow'}
                      </button>
                      {followedAuthors.includes(author.id) && (
                        <button
                          className="social-button"
                          onClick={(e) => toggleSocialOptions(author.id, e)}
                          title="Follow on social media"
                        >
                          +
                        </button>
                      )}
                      {showSocialOptions === author.id && (
                        <div className="social-options">
                          <button onClick={(e) => followOnSocialMedia(author.id, 'twitter', e)}>
                            <FaTwitter /> X.com
                          </button>
                          <button onClick={(e) => followOnSocialMedia(author.id, 'facebook', e)}>
                            <FaFacebook /> Facebook
                          </button>
                          <button onClick={(e) => followOnSocialMedia(author.id, 'instagram', e)}>
                            <FaInstagram /> Instagram
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="reaction-buttons">
                      <button
                        className={`like-button ${author.isLiked ? 'active' : ''}`}
                        onClick={(e) => toggleLike(author.id, e)}
                        title="Like this author"
                      >
                        {author.isLiked ? <FaThumbsUp /> : <FaRegThumbsUp />}
                        <span className="count">{author.likes}</span>
                      </button>
                      <button
                        className={`love-button ${author.isLoved ? 'active' : ''}`}
                        onClick={(e) => toggleLove(author.id, e)}
                        title="Love this author"
                      >
                        {author.isLoved ? <FaHeart color="red" /> : <FaRegHeart />}
                        <span className="count">{author.loves}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
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
        </div>
      )}

      {/* Author Detail Modal */}
      {selectedAuthor && (
        <div className="author-spotlight">
          <div className="modal-content">
            <button className="close-modal" onClick={() => setSelectedAuthor(null)}>×</button>
            <div className="author-header">
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={selectedAuthor.photo} alt={selectedAuthor.name} onError={(e) => handleAuthorImageError(e, selectedAuthor, { allowDbLookup: true })} />
                {modalCoverLoading && selectedAuthor && (
                  <div className="img-spinner" aria-hidden>
                    <div className="spinner" />
                  </div>
                )}
              </div>
              <div className="author-info">
                <h2>{selectedAuthor.name}</h2>
                <div className="author-stats">
                  <span><FaBookOpen /> {selectedAuthor.booksPublished} books</span>
                  <span><FaThumbsUp /> {selectedAuthor.likes || 0} likes</span>
                  <span><FaHeart /> {selectedAuthor.loves || 0} loves</span>
                  <span><FaUsers /> {selectedAuthor.followers || 0} followers</span>
                </div>
                <div className="author-rating-display">
                  <div className="rating-stars">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < Math.floor(selectedAuthor.displayRating || selectedAuthor.averageRating || 0) ? 'filled' : ''}>
                        ★
                      </span>
                    ))}
                    <span>
                      {selectedAuthor.averageRating > 0 
                        ? `${selectedAuthor.averageRating.toFixed(1)} (${selectedAuthor.ratingCount} ${selectedAuthor.ratingCount === 1 ? 'rating' : 'ratings'})`
                        : 'Not rated yet'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="author-details">
              <h3>About {selectedAuthor.name}</h3>
              <p>{selectedAuthor.biography || 'No bio added.'}</p>

              {/* Rating Section */}
              <div className="rating-section">
                <h3>Rate This Author</h3>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      onMouseEnter={() => handleHoverRating(star)}
                      onMouseLeave={() => handleHoverRating(0)}
                      onClick={() => handleRating(selectedAuthor.id, star)}
                      className={`star ${(hoverRating || userRatings[selectedAuthor.id] || 0) >= star ? 'filled' : ''}`}
                    >
                      {(hoverRating || userRatings[selectedAuthor.id] || 0) >= star ? <FaStar /> : <FaRegStar />}
                    </span>
                  ))}
                  <span className="rating-text">
                    {userRatings[selectedAuthor.id]
                      ? `You rated this author ${userRatings[selectedAuthor.id]} star${userRatings[selectedAuthor.id] > 1 ? 's' : ''}`
                      : 'Click to rate this author'}
                  </span>
                </div>
              </div>

              {/* Books In System */}
              <div className="author-books-section" onClick={(e) => e.stopPropagation()}>
                <h3>Books available</h3>
                {selectedAuthorBooks.length === 0 ? (
                  <p style={{ color: '#94a3b8' }}>No books by this author are available in the system.</p>
                ) : (
                  <ul className="author-book-list">
                    {(showAllBooks ? selectedAuthorBooks : selectedAuthorBooks.slice(0, 5)).map(b => (
                      <li key={b.id} className="author-book-item">
                        <img src={b.cover_url || selectedAuthor.photo || `https://via.placeholder.com/64x88?text=No+Cover`} alt={b.title} className="book-thumb" />
                        <button
                          className="book-link"
                          onClick={(e) => { e.stopPropagation(); navigate(`/BookManagement?book=${encodeURIComponent(b.id)}`); setSelectedAuthor(null); }}
                        >
                          {b.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {selectedAuthorBooks.length > 5 && (
                  <button
                    className="more-books"
                    onClick={(e) => { e.stopPropagation(); setShowAllBooks(prev => !prev); }}
                  >
                    {showAllBooks ? 'Show less' : `More books (${selectedAuthorBooks.length - 5} more)`}
                  </button>
                )}
              </div>

              {/* External / Other Books (not in system) */}
              <div className="author-books-section external-books-section" onClick={(e) => e.stopPropagation()}>
                <h3>Other books (not in system)</h3>
                {externalOtherBooks.length === 0 ? (
                  <p style={{ color: '#94a3b8' }}>No additional books found from external sources.</p>
                ) : (
                  <ul className="author-book-list external-book-list">
                    {(showAllExternal ? externalOtherBooks : externalOtherBooks.slice(0, 5)).map(b => (
                      <li key={b.id} className="author-book-item external-book-item">
                        <img src={b.thumbnail || selectedAuthor.photo || `https://via.placeholder.com/64x88?text=No+Cover`} alt={b.title} className="book-thumb" />
                        <a
                          className="book-link"
                          href={b.infoLink || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {b.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}

                {externalOtherBooks.length > 5 && (
                  <button
                    className="more-books"
                    onClick={(e) => { e.stopPropagation(); setShowAllExternal(prev => !prev); }}
                  >
                    {showAllExternal ? 'Show less' : `More books (${externalOtherBooks.length - 5} more)`}
                  </button>
                )}
              </div>

              {/* Social Links */}
              <div className="author-socials" style={{ marginTop: 12 }} onClick={(e) => e.stopPropagation()}>
                <h4>Find {selectedAuthor.name} online</h4>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <a
                    className="social-btn"
                    href={`https://twitter.com/search?q=${encodeURIComponent(selectedAuthor.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span style={{ color: '#1DA1F2' }}><FaTwitter /></span> Twitter
                  </a>
                  <a
                    className="social-btn"
                    href={`https://www.facebook.com/search/top?q=${encodeURIComponent(selectedAuthor.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span style={{ color: '#1877F2' }}><FaFacebook /></span> Facebook
                  </a>
                  <a
                    className="social-btn"
                    href={`https://www.instagram.com/${encodeURIComponent(selectedAuthor.name.replace(/\s+/g, ''))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span style={{ color: '#E1306C' }}><FaInstagram /></span> Instagram
                  </a>
                  <a
                    className="social-btn"
                    href={`https://en.wikipedia.org/wiki/${encodeURIComponent(selectedAuthor.name.replace(/\s+/g, '_'))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Wikipedia
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};