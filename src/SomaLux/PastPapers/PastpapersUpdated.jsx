// Pastpapers.jsx - Updated with Auth and Real-time Data
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../Books/supabaseClient';
import {
  fetchPastPapers,
  trackPastPaperView,
  subscribeToPastPapers,
  getFaculties,
  getUniversitiesForDropdown
} from '../Books/Admin/pastPapersApi';
import { PastpaperShareButton } from './PastpaperShare';
import { Download } from './PastpaperDownload';
import { AuthModal } from '../Books/AuthModal';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { 
  FiSearch, FiFileText, FiFilter, FiChevronRight, FiChevronLeft, FiX, 
  FiTrendingUp, FiDownload, FiBookmark, FiArrowLeft, FiEye 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { CommentsSection } from '../../KissMe/Components/CommentsSection';
// import './PaperPanel.css';

const ReactionButtons = ({ itemId, loves, onLove, isLoved, disabled }) => {
  return (
    <div className="reaction-buttons-containerpast">
      <button 
        className={`love-buttonpast ${isLoved ? 'activepast' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) onLove(itemId);
        }}
        title={disabled ? "Sign in to love this paper" : "Love this paper"}
        disabled={disabled}
      >
        {isLoved ? <FaHeart color="red" /> : <FaRegHeart />}
        <span className="countpast">{loves || 0}</span>
      </button>
    </div>
  );
};

export const PaperPanel = ({ demoMode = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [papers, setPapers] = useState([]);
  const [displayedPapers, setDisplayedPapers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(8);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [showWishlist, setShowWishlist] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState(demoMode);
  const [universityFilter, setUniversityFilter] = useState(null);
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authAction, setAuthAction] = useState('view');
  const [universities, setUniversities] = useState([]);
  const [faculties, setFaculties] = useState([]);

  // Comments state for CommentsSection
  const [mediaComments, setMediaComments] = useState({});
  const [commentLikes, setCommentLikes] = useState({});
  const commentsRef = useRef(null);

  // Initialize state from localStorage
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('paperWishlist');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to parse wishlist from localStorage', error);
      return [];
    }
  });

  const [paperLoves, setPaperLoves] = useState(() => {
    try {
      const saved = localStorage.getItem('paperLoves');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Failed to parse paperLoves from localStorage', error);
      return {};
    }
  });

  const [paperReactions, setPaperReactions] = useState(() => {
    try {
      const saved = localStorage.getItem('paperReactions');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Failed to parse paperReactions from localStorage', error);
      return {};
    }
  });

  const carouselRef = useRef(null);

  // Check authentication status
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        setAuthModalOpen(false);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Handle university filter from navigation
  useEffect(() => {
    if (location.state?.universityFilter) {
      setUniversityFilter(location.state.universityFilter);
      setSearchTerm(location.state.universityFilter);
      setActiveFilter('university');
    }
  }, [location.state]);

  // Load past papers from database
  useEffect(() => {
    loadPastPapers();
    loadUniversities();
    loadFaculties();
  }, []);

  const loadPastPapers = async () => {
    setLoading(true);
    try {
      const { data } = await fetchPastPapers({ page: 1, pageSize: 100 });
      // Transform data to match expected format
      const transformedData = data.map(paper => ({
        id: paper.id,
        title: paper.title || `${paper.course_code} - ${paper.subject}`,
        course: paper.subject,
        courseCode: paper.course_code,
        faculty: paper.subject,
        university: paper.universities?.name || 'Unknown',
        year: paper.exam_year,
        semester: paper.semester,
        examType: paper.exam_type,
        downloads: paper.downloads_count || 0,
        views: paper.views_count || 0,
        file_url: paper.file_url,
        created_at: paper.created_at
      }));
      setPapers(transformedData);
    } catch (error) {
      console.error('Error loading past papers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUniversities = async () => {
    try {
      const data = await getUniversitiesForDropdown();
      setUniversities(data);
    } catch (error) {
      console.error('Error loading universities:', error);
    }
  };

  const loadFaculties = async () => {
    try {
      const data = await getFaculties();
      setFaculties(data);
    } catch (error) {
      console.error('Error loading faculties:', error);
    }
  };

  // Real-time subscription for past papers
  useEffect(() => {
    const subscription = subscribeToPastPapers((payload) => {
      console.log('Past paper change detected:', payload);
      loadPastPapers();
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Persist states to localStorage
  useEffect(() => {
    localStorage.setItem('paperWishlist', JSON.stringify(wishlist));
    localStorage.setItem('paperLoves', JSON.stringify(paperLoves));
    localStorage.setItem('paperReactions', JSON.stringify(paperReactions));
  }, [wishlist, paperLoves, paperReactions]);

  // Comment handlers for CommentsSection
  const handleSubmitComment = async (commentData) => {
    if (!user) {
      setAuthAction('comment');
      setAuthModalOpen(true);
      return;
    }
    setMediaComments((prev) => ({
      ...prev,
      [selectedPaper.id]: [...(prev[selectedPaper.id] || []), commentData],
    }));
  };

  const handleDeleteComment = async (commentId) => {
    setMediaComments((prev) => ({
      ...prev,
      [selectedPaper.id]: (prev[selectedPaper.id] || []).filter((comment) => comment.id !== commentId),
    }));
  };

  const handleLikeComment = async (commentId) => {
    if (!user) {
      setAuthAction('action');
      setAuthModalOpen(true);
      return;
    }
    setCommentLikes((prev) => {
      const isLiked = !!prev[commentId];
      return {
        ...prev,
        [commentId]: isLiked ? undefined : true,
      };
    });
  };

  const handleReplyToComment = async (commentId, replyData) => {
    if (!user) {
      setAuthAction('comment');
      setAuthModalOpen(true);
      return;
    }
    setMediaComments((prev) => ({
      ...prev,
      [selectedPaper.id]: (prev[selectedPaper.id] || []).map((comment) =>
        comment.id === commentId
          ? { ...comment, replies: [...(comment.replies || []), replyData] }
          : comment
      ),
    }));
  };

  const filteredPapers = useMemo(() => {
    let result = [...papers];
     
    // Apply university filter if present
    if (activeFilter === 'university' && universityFilter) {
      result = result.filter(paper => 
        paper.university?.toLowerCase() === universityFilter.toLowerCase()
      );
    }
    
    // Apply search filter
    if (searchTerm && activeFilter !== 'university') {
      const term = searchTerm.toLowerCase();
      result = result.filter(paper => 
        (paper.title?.toLowerCase() || '').includes(term) ||
        (paper.course?.toLowerCase() || '').includes(term) ||
        (paper.university?.toLowerCase() || '').includes(term) ||
        (paper.faculty?.toLowerCase() || '').includes(term) ||
        (paper.courseCode?.toLowerCase() || '').includes(term) ||
        String(paper.year || '').includes(term)
      );
    }
    
    // Apply other filters
    if (activeFilter === 'wishlist') {
      result = result.filter(paper => wishlist.includes(paper.id));
    } else if (activeFilter === 'recent') {
      result = result.filter(paper => paper.year >= new Date().getFullYear() - 2);
    }
    
    // Apply sorting
    if (sortBy === 'title') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'course') {
      result.sort((a, b) => (a.course || '').localeCompare(b.course || ''));
    } else if (sortBy === 'university') {
      result.sort((a, b) => (a.university || '').localeCompare(b.university || ''));
    } else if (sortBy === 'views') {
      result.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
    } else if (sortBy === 'downloads') {
      result.sort((a, b) => (b.downloads_count || 0) - (a.downloads_count || 0));
    } else if (sortBy === 'year') {
      result.sort((a, b) => (b.year || 0) - (a.year || 0));
    }
    
    return result;
  }, [papers, searchTerm, activeFilter, sortBy, wishlist, universityFilter]);

  useEffect(() => {
    setDisplayedPapers(filteredPapers.slice(0, visibleCount));
  }, [filteredPapers, visibleCount]);

  const loadMore = () => {
    setVisibleCount(prev => prev + 4);
  };

  const viewPaperDetails = async (paper) => {
    if (!user) {
      setAuthAction('view');
      setAuthModalOpen(true);
      return;
    }

    // Track view
    await trackPastPaperView(paper.id);
    setSelectedPaper(paper);
    setWelcomeMessage(false);
  };

  const closeDetails = () => {
    setSelectedPaper(null);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setShowFilters(false);
    setVisibleCount(8);
    setWelcomeMessage(false);
    
    // Clear university filter if changing to another filter
    if (filter !== 'university') {
      setUniversityFilter(null);
    }
  };

  const handleSortChange = (sortType) => {
    setSortBy(sortType);
    setVisibleCount(8);
    setWelcomeMessage(false);
  };

  const toggleLove = (paperId) => {
    if (!user) {
      setAuthAction('action');
      setAuthModalOpen(true);
      return;
    }

    setPaperLoves(prev => {
      const currentLoves = prev[paperId] || 0;
      const isCurrentlyLoved = paperReactions[paperId]?.loved;
      const newLoves = isCurrentlyLoved ? currentLoves - 1 : currentLoves + 1;
      
      return {
        ...prev,
        [paperId]: newLoves
      };
    });
    
    setPaperReactions(prev => ({
      ...prev,
      [paperId]: {
        ...prev[paperId],
        loved: !prev[paperId]?.loved
      }
    }));
  };

  const toggleWishlist = (paperId) => {
    if (!user) {
      setAuthAction('action');
      setAuthModalOpen(true);
      return;
    }

    setWishlist(prev => {
      const newWishlist = prev.includes(paperId) 
        ? prev.filter(id => id !== paperId)
        : [...prev, paperId];
      return newWishlist;
    });
  };

  const scrollCarousel = (direction) => {
    const carousel = carouselRef.current;
    if (carousel) {
      const scrollAmount = direction === 'left' ? -100 : 100;
      carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const wishlistPapers = useMemo(() => {
    return papers.filter(paper => wishlist.includes(paper.id));
  }, [papers, wishlist]);

  // Helper: log past paper search events to backend
  const logSearchEvent = useCallback(
    async ({ queryText, resultsCount }) => {
      try {
        const trimmed = (queryText || '').trim();
        if (!trimmed || trimmed.length < 2) return;

        const { data } = await supabase.auth.getSession();
        const session = data?.session || null;
        const token = session?.access_token || null;
        const currentUserId = session?.user?.id || null;

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
        if (!origin) origin = 'http://localhost:5000';

        await fetch(`${origin}/api/elib/search-events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            scope: 'past_papers',
            queryText: trimmed,
            userId: currentUserId,
            categoryId: null,
            bookId: null,
            authorName: null,
            pastPaperId: null,
            resultsCount: typeof resultsCount === 'number' ? resultsCount : null,
          }),
        }).catch(() => {});
      } catch (e) {
        console.warn('logSearchEvent (past_papers) failed', e);
      }
    },
    []
  );

  // Debounced logging of past paper searches
  useEffect(() => {
    try {
      const q = (searchTerm || '').trim();
      if (!q || q.length < 2) return;

      const handle = setTimeout(() => {
        logSearchEvent({ queryText: q, resultsCount: filteredPapers.length });
      }, 800);

      return () => clearTimeout(handle);
    } catch {
      // ignore
    }
  }, [searchTerm, filteredPapers.length, logSearchEvent]);

  if (loading) {
    return (
      <div className="containerpast">
        <header className="headerpast">
          <h1 className="titlepast">Past Papers</h1>
          <p className="subtitlepast">Access past exam papers for university courses</p>
        </header>
        
        <div className="controlspast">
          <div className="search-containerpast">
            <input
              type="text"
              className="search-inputpast"
              placeholder="Search papers..."
              disabled
            />
          </div>
          <button className="filter-buttonpast" disabled>
            <FiFilter /> Filters
          </button>
        </div>
        
        <div className="gridpast">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="skeleton-cardpast">
              <div className="skeleton-iconpast"></div>
              <div className="skeleton-textpast" style={{ width: '70%' }}></div>
              <div className="skeleton-textpast" style={{ width: '90%' }}></div>
              <div className="skeleton-textpast" style={{ width: '50%' }}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="containerpast">
      <header className="headerpast">
        <h1 className="titlepast">Past Papers</h1>
        <p className="subtitlepast">Access past exam papers for university courses</p>
        {!user && (
          <p style={{ fontSize: '0.9em', color: '#fbbf24', marginTop: '8px' }}>
            Sign in to view and download past papers
          </p>
        )}
      </header>

      {/* University filter breadcrumb */}
      {universityFilter && (
        <div style={{ 
          padding: '12px 16px', 
          background: 'rgba(0, 168, 132, 0.1)', 
          borderRadius: '8px', 
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={() => navigate('/campus')}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#00a884', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <FiArrowLeft /> Back to Universities
            </button>
            <span style={{ color: '#8696a0' }}>|</span>
            <span style={{ color: '#e9edef' }}>Showing papers from: <strong>{universityFilter}</strong></span>
          </div>
          <button 
            onClick={() => {
              setUniversityFilter(null);
              setSearchTerm('');
              setActiveFilter('all');
            }}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#8696a0', 
              cursor: 'pointer'
            }}
          >
            <FiX size={20} />
          </button>
        </div>
      )}

      <div className="controlspast">
        <div className="search-containerpast">
          <FiSearch className="search-iconpast" />
          <input
            type="text"
            className="search-inputpast"
            placeholder="Search by course, university, or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="clear-searchpast"
              onClick={() => setSearchTerm('')}
            >
              <FiX size={16} />
            </button>
          )}
        </div>
        
        <div className="filter-wrapperpast">
          <button 
            className={`filter-buttonpast ${showFilters ? 'activepast' : ''}`}
            onClick={toggleFilters}
          >
            <FiFilter /> {activeFilter !== 'all' && activeFilter !== 'university' && '• '}Filters
          </button>
          
          <AnimatePresence>
            {showFilters && (
              <motion.div
                className="filter-dropdownpast"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <div 
                  className={`filter-optionpast ${activeFilter === 'all' ? 'activepast' : ''}`}
                  onClick={() => handleFilterChange('all')}
                >
                  All Papers
                </div>
                <div 
                  className={`filter-optionpast ${activeFilter === 'wishlist' ? 'activepast' : ''}`}
                  onClick={() => handleFilterChange('wishlist')}
                >
                  <FiBookmark size={14} /> My Wishlist ({wishlist.length})
                </div>
                <div 
                  className={`filter-optionpast ${activeFilter === 'recent' ? 'activepast' : ''}`}
                  onClick={() => handleFilterChange('recent')}
                >
                  Recent Years
                </div>
                
                <div className="filter-sectionpast">
                  <h5>Sort by:</h5>
                  <div 
                    className={`filter-optionpast ${sortBy === 'default' ? 'activepast' : ''}`}
                    onClick={() => handleSortChange('default')}
                  >
                    Default
                  </div>
                  <div 
                    className={`filter-optionpast ${sortBy === 'title' ? 'activepast' : ''}`}
                    onClick={() => handleSortChange('title')}
                  >
                    Title (A-Z)
                  </div>
                  <div 
                    className={`filter-optionpast ${sortBy === 'university' ? 'activepast' : ''}`}
                    onClick={() => handleSortChange('university')}
                  >
                    University
                  </div>
                  <div 
                    className={`filter-optionpast ${sortBy === 'views' ? 'activepast' : ''}`}
                    onClick={() => handleSortChange('views')}
                  >
                    Most Viewed
                  </div>
                  <div 
                    className={`filter-optionpast ${sortBy === 'downloads' ? 'activepast' : ''}`}
                    onClick={() => handleSortChange('downloads')}
                  >
                    Most Downloaded
                  </div>
                  <div 
                    className={`filter-optionpast ${sortBy === 'year' ? 'activepast' : ''}`}
                    onClick={() => handleSortChange('year')}
                  >
                    Year (Newest)
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {displayedPapers.length === 0 ? (
        <div className="empty-statepast">
          <FiFileText size={48} />
          <h3>No past papers found</h3>
          <p>Try adjusting your search or filters</p>
          <button 
            className="reset-filterspast"
            onClick={() => {
              setSearchTerm('');
              setActiveFilter('all');
              setSortBy('default');
              setUniversityFilter(null);
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="gridpast">
            <AnimatePresence>
              {displayedPapers.map((paper) => (
                <motion.div
                  key={paper.id}
                  className="paper-cardpast"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  layout
                  whileHover={{ y: -5 }}
                  onClick={() => viewPaperDetails(paper)}
                >
                  <div className="card-contentpast">
                    <div className="paper-iconpast">
                      <FiFileText size={32} />
                    </div>
                    <h3 className="paper-titlepast">{paper.title}</h3>
                    <p className="paper-coursepast">{paper.course}</p>
                    <div className="paper-metapast">
                      <span>{paper.university}</span>
                      {paper.year && <span>• {paper.year}</span>}
                    </div>
                    <div className="paper-statspast">
                      <span><FiEye size={14} /> {paper.views || 0}</span>
                      <span><FiDownload size={14} /> {paper.downloads || 0}</span>
                    </div>
                  </div>
                  <div className="card-actionspast">
                    <ReactionButtons
                      itemId={paper.id}
                      loves={paperLoves[paper.id] || 0}
                      onLove={toggleLove}
                      isLoved={paperReactions[paper.id]?.loved}
                      disabled={!user}
                    />
                    <button
                      className={`wishlist-buttonpast ${wishlist.includes(paper.id) ? 'activepast' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(paper.id);
                      }}
                      title={!user ? "Sign in to add to wishlist" : "Add to wishlist"}
                      disabled={!user}
                    >
                      <FiBookmark />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {visibleCount < filteredPapers.length && (
            <motion.button 
              className="load-more-buttonpast"
              onClick={loadMore}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Load More ({filteredPapers.length - visibleCount} remaining)
            </motion.button>
          )}
        </>
      )}

      {/* Paper Details Modal */}
      <AnimatePresence>
        {selectedPaper && user && (
          <motion.div
            className="modal-overlaypast"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDetails}
          >
            <motion.div
              className="modal-contentpast"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-closepast" onClick={closeDetails}>
                <FiX size={24} />
              </button>

              <div className="modal-headerpast">
                <h2>{selectedPaper.title}</h2>
                <p className="modal-course-namepast">{selectedPaper.course}</p>
                <div className="modal-metapast">
                  <span>{selectedPaper.university}</span>
                  {selectedPaper.year && <span>• Year: {selectedPaper.year}</span>}
                  {selectedPaper.semester && <span>• Semester {selectedPaper.semester}</span>}
                  {selectedPaper.examType && <span>• {selectedPaper.examType}</span>}
                </div>
              </div>

              <div className="modal-statspast">
                <div className="stat-itempast">
                  <FiEye size={20} />
                  <span>{selectedPaper.views_count || 0} views</span>
                </div>
                <div className="stat-itempast">
                  <FiDownload size={20} />
                  <span>{selectedPaper.downloads_count || 0} downloads</span>
                </div>
              </div>

              <div className="modal-actionspast">
                <Download paper={selectedPaper} />
                <PastpaperShareButton paper={selectedPaper} />
                <button
                  className={`wishlist-button-largepast ${wishlist.includes(selectedPaper.id) ? 'activepast' : ''}`}
                  onClick={() => toggleWishlist(selectedPaper.id)}
                >
                  <FiBookmark size={20} />
                  {wishlist.includes(selectedPaper.id) ? 'Saved' : 'Save'}
                </button>
              </div>

              <div className="modal-comments-sectionpast">
                <CommentsSection
                  ref={commentsRef}
                  mediaId={selectedPaper.id}
                  comments={mediaComments[selectedPaper.id] || []}
                  currentUser={user?.email || 'User'}
                  commentLikes={commentLikes}
                  onSubmitComment={handleSubmitComment}
                  onDeleteComment={handleDeleteComment}
                  onLikeComment={handleLikeComment}
                  onReplyToComment={handleReplyToComment}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
        action={authAction}
      />
    </div>
  );
};

export default PaperPanel;
