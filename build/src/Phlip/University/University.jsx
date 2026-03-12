// University.jsx - Updated with Auth, Ratings, and Real-time Data
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../Books/supabaseClient';
import { 
  fetchUniversities, 
  rateUniversity, 
  getUserUniversityRating,
  getUniversityRatingStats,
  trackUniversityView,
  subscribeToUniversities,
  subscribeToUniversityRatings
} from '../Books/Admin/campusApi';
import { AuthModal } from '../Books/AuthModal';
import { RatingModal } from '../Books/RatingModal';
import { 
  FiSearch, 
  FiBookOpen, 
  FiStar, 
  FiFilter, 
  FiChevronRight,
  FiX,
  FiExternalLink,
  FiEye,
  FiMapPin
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import './University.css';

export const University = () => {
  const [universities, setUniversities] = useState([]);
  const [displayedUniversities, setDisplayedUniversities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(8);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authAction, setAuthAction] = useState('view');
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [userRatings, setUserRatings] = useState({});
  const [ratingStats, setRatingStats] = useState({});
  const navigate = useNavigate();

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
        loadUserRatings();
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Load universities from database
  useEffect(() => {
    loadUniversities();
  }, []);

  const loadUniversities = async () => {
    setLoading(true);
    try {
      const { data } = await fetchUniversities({ page: 1, pageSize: 100 });
      setUniversities(data);
      
      // Load rating stats for all universities
      const stats = {};
      for (const uni of data) {
        const stat = await getUniversityRatingStats(uni.id);
        stats[uni.id] = stat;
      }
      setRatingStats(stats);
    } catch (error) {
      console.error('Error loading universities:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRatings = async () => {
    if (!user) return;
    const ratings = {};
    for (const uni of universities) {
      const rating = await getUserUniversityRating(uni.id);
      if (rating) ratings[uni.id] = rating;
    }
    setUserRatings(ratings);
  };

  // Real-time subscription for universities
  useEffect(() => {
    const subscription = subscribeToUniversities((payload) => {
      console.log('University change detected:', payload);
      loadUniversities();
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Load user ratings when universities change
  useEffect(() => {
    if (user && universities.length > 0) {
      loadUserRatings();
    }
  }, [user, universities]);

  const filteredUniversities = useMemo(() => {
    let result = [...universities];
    
    if (searchTerm) {
      result = result.filter(uni => 
        uni.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        uni.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        uni.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (activeFilter === 'nairobi') {
      result = result.filter(uni => uni.location?.toLowerCase().includes('nairobi'));
    } else if (activeFilter === 'established') {
      result = result.filter(uni => uni.established && uni.established < 1980);
    } else if (activeFilter === 'large') {
      result = result.filter(uni => uni.student_count && uni.student_count > 30000);
    }
    
    if (sortBy === 'name') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'students') {
      result.sort((a, b) => (b.student_count || 0) - (a.student_count || 0));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (ratingStats[b.id]?.average || 0) - (ratingStats[a.id]?.average || 0));
    } else if (sortBy === 'established') {
      result.sort((a, b) => (a.established || 9999) - (b.established || 9999));
    }
    
    return result;
  }, [universities, searchTerm, activeFilter, sortBy, ratingStats]);

  useEffect(() => {
    setDisplayedUniversities(filteredUniversities.slice(0, visibleCount));
  }, [filteredUniversities, visibleCount]);

  const loadMore = () => {
    setVisibleCount(prev => prev + 4);
  };

  const viewUniversityDetails = async (university) => {
    if (!user) {
      setAuthAction('view');
      setAuthModalOpen(true);
      return;
    }

    // Track view
    await trackUniversityView(university.id);

    navigate('/papers', { 
      state: { 
        universityFilter: university.name,
        universityId: university.id
      } 
    });
  };

  // Small image carousel component used inside university cards
  const UniversityImageCarousel = ({ images = [], alt = '', interval = 3500 }) => {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const len = images.length;
    const intervalRef = useRef(null);

    useEffect(() => {
      if (len <= 1) return undefined;
      if (paused) return undefined;

      intervalRef.current = setInterval(() => {
        setIndex((i) => (i + 1) % len);
      }, interval);

      return () => clearInterval(intervalRef.current);
    }, [len, interval, paused]);

    useEffect(() => {
      return () => clearInterval(intervalRef.current);
    }, []);

    if (!images || images.length === 0) return null;

    return (
      <div
        className="image-carousel-uni"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        tabIndex={0}
        aria-label={alt || 'University images'}
      >
        <div
          className="image-track-uni"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {images.map((src, i) => (
            <div className="image-slide-uni" key={i}>
              <img src={src} alt={alt || `image-${i + 1}`} />
            </div>
          ))}
        </div>

        {len > 1 && (
          <div className="carousel-indicators-uni" role="tablist">
            {images.map((_, i) => (
              <div
                key={i}
                className={`carousel-dot-uni ${i === index ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                role="tab"
                aria-selected={i === index}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setIndex(i); } }}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const handleRateClick = (e, university) => {
    e.stopPropagation();
    if (!user) {
      setAuthAction('action');
      setAuthModalOpen(true);
      return;
    }
    setSelectedUniversity(university);
    setRatingModalOpen(true);
  };

  const handleRate = async (rating) => {
    if (!selectedUniversity) return;
    
    try {
      await rateUniversity(selectedUniversity.id, rating);
      
      // Update local state
      setUserRatings(prev => ({ ...prev, [selectedUniversity.id]: rating }));
      
      // Refresh rating stats
      const stats = await getUniversityRatingStats(selectedUniversity.id);
      setRatingStats(prev => ({ ...prev, [selectedUniversity.id]: stats }));
      
      setRatingModalOpen(false);
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating. Please try again.');
    }
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setVisibleCount(8);

    // Close the panel after a short delay to allow the exit animation to play
    // and return focus to the filter button for accessibility.
    setTimeout(() => {
      setShowFilters(false);
      const btn = document.querySelector('.filter-button-uni');
      try { btn?.focus(); } catch (e) {}
    }, 140);
  };

  const handleSortChange = (sortType) => {
    setSortBy(sortType);
    setVisibleCount(8);

    // Also close the filter panel after choosing a sort option
    setTimeout(() => {
      setShowFilters(false);
      const btn = document.querySelector('.filter-button-uni');
      try { btn?.focus(); } catch (e) {}
    }, 140);
  };

  if (loading) {
    return (
      <div className="container-uni">
        <div className="header-uni">
          <h1 className="title-uni">Universities</h1>
          <p className="subtitle-uni">Unlock your campus</p>
        </div>
        
        <div className="controls-uni">
          <div className="search-container-uni">
            <input
              type="text"
              className="search-input-uni"
              placeholder="Search universities..."
              disabled
            />
          </div>
          <button className="filter-button-uni" disabled>
            <FiFilter /> Filters
          </button>
        </div>
        
        <div className="grid-uni">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="skeleton-card-uni">
              <div className="skeleton-icon-uni"></div>
              <div className="skeleton-text-uni" style={{ width: '70%' }}></div>
              <div className="skeleton-text-uni" style={{ width: '90%' }}></div>
              <div className="skeleton-text-uni" style={{ width: '50%' }}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container-uni">
      <div className="header-uni">
        <h1 className="title-uni">Universities</h1>
        <p className="subtitle-uni">Unlock your campus</p>
      </div>

      <div className="controls-uni">
        <div className="search-container-uni">
          <input
            type="text"
            className="search-input-uni"
            placeholder="Search Universities or courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="clear-search-uni"
              onClick={() => setSearchTerm('')}
            >
              <FiX size={16} />
            </button>
          )}
        </div>
        
        <div className="filter-wrapper-uni">
          <button 
            className={`filter-button-uni ${showFilters ? 'active-uni' : ''}`}
            onClick={toggleFilters}
          >
            <FiFilter /> {activeFilter !== 'all' && '• '}Filters
          </button>
          
          <AnimatePresence>
            {showFilters && (
              <motion.div
                className="filter-dropdown-uni"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <div 
                  className={`filter-option-uni ${activeFilter === 'all' ? 'active-uni' : ''}`}
                  onClick={() => handleFilterChange('all')}
                >
                  All Universities
                </div>
                <div 
                  className={`filter-option-uni ${activeFilter === 'nairobi' ? 'active-uni' : ''}`}
                  onClick={() => handleFilterChange('nairobi')}
                >
                  Nairobi-based
                </div>
                <div 
                  className={`filter-option-uni ${activeFilter === 'established' ? 'active-uni' : ''}`}
                  onClick={() => handleFilterChange('established')}
                >
                  Established pre-1980
                </div>
                <div 
                  className={`filter-option-uni ${activeFilter === 'large' ? 'active-uni' : ''}`}
                  onClick={() => handleFilterChange('large')}
                >
                  Large Universities
                </div>
                <div className="filter-section-uni">
                  <h5>Sort by:</h5>
                  <div 
                    className={`filter-option-uni ${sortBy === 'default' ? 'active-uni' : ''}`}
                    onClick={() => handleSortChange('default')}
                  >
                    Default
                  </div>
                  <div 
                    className={`filter-option-uni ${sortBy === 'name' ? 'active-uni' : ''}`}
                    onClick={() => handleSortChange('name')}
                  >
                    Name (A-Z)
                  </div>
                  <div 
                    className={`filter-option-uni ${sortBy === 'students' ? 'active-uni' : ''}`}
                    onClick={() => handleSortChange('students')}
                  >
                    Student Count
                  </div>
                  <div 
                    className={`filter-option-uni ${sortBy === 'rating' ? 'active-uni' : ''}`}
                    onClick={() => handleSortChange('rating')}
                  >
                    Rating
                  </div>
                  <div 
                    className={`filter-option-uni ${sortBy === 'established' ? 'active-uni' : ''}`}
                    onClick={() => handleSortChange('established')}
                  >
                    Established
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {displayedUniversities.length === 0 ? (
        <div className="empty-state-uni">
          <FiBookOpen size={48} />
          <h3>No universities found</h3>
          <p>Try adjusting your search or filters</p>
          <button 
            className="reset-filters-uni"
            onClick={() => {
              setSearchTerm('');
              setActiveFilter('all');
              setSortBy('default');
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid-uni">
            <AnimatePresence>
              {displayedUniversities.map((university) => {
                const stats = ratingStats[university.id] || { average: 0, count: 0 };
                const userRating = userRatings[university.id];
                
                return (
                  <motion.div
                    key={university.id}
                    className="category-card-uni"
                    style={{ 
                      borderTop: `3px solid #00a884`,
                      backgroundImage: university.cover_image_url 
                        ? `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${university.cover_image_url})`
                        : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    layout
                    whileHover={{ y: -5 }}
                  >
                    <div className="card-content-uni">
                      <div className="category-icon-uni">
                        {(() => {
                          // Prefer an explicit array of images if present
                          const imgs = (university.cover_images && university.cover_images.length > 0)
                            ? university.cover_images
                            : (university.cover_image_url ? [university.cover_image_url] : []);

                          if (imgs.length === 0) return <FiMapPin size={32} />;
                          if (imgs.length === 1) {
                            return (
                              <img
                                src={imgs[0]}
                                alt={university.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                              />
                            );
                          }

                          // Multiple images -> show carousel
                          return <UniversityImageCarousel images={imgs} alt={university.name} />;
                        })()}
                      </div>
                      <h3 className="category-name-uni">{university.name}</h3>
                      <p className="category-desc-uni">{university.description || 'No description available'}</p>
                      
                      <div className="category-meta-uni">
                        <span className="rating-uni" onClick={(e) => handleRateClick(e, university)} style={{ cursor: 'pointer' }}>
                          <FiStar size={14} fill={stats.average > 0 ? '#fbbf24' : 'none'} color="#fbbf24" />
                          {stats.average > 0 ? stats.average.toFixed(1) : 'Rate'}
                          {stats.count > 0 && <span style={{ fontSize: '0.85em', marginLeft: '4px' }}>({stats.count})</span>}
                          {userRating && <span style={{ marginLeft: '4px', color: '#00a884' }}>✓</span>}
                        </span>
                        {university.views > 0 && (
                          <span className="views-uni">
                            <FiEye size={14} /> {university.views}
                          </span>
                        )}
                      </div>
                      
                      {university.location && (
                        <div style={{ fontSize: '0.85em', color: '#8696a0', marginTop: '4px' }}>
                          <FiMapPin size={12} /> {university.location}
                        </div>
                      )}
                    </div>
                    
                    <div className="action-buttonspast-uni">
                      <div 
                        className="view-button-uni"
                        onClick={() => viewUniversityDetails(university)}
                      >
                        PastPapers <FiChevronRight />
                      </div>
                      {university.website_url && (
                        <a
                          href={university.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="website-button-uni"
                          aria-label={`Visit ${university.name} website`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Website <FiExternalLink />
                        </a>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {visibleCount < filteredUniversities.length && (
            <motion.button 
              className="load-more-button-uni"
              onClick={loadMore}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Load More ({filteredUniversities.length - visibleCount} remaining)
            </motion.button>
          )}
        </>
      )}

      <div className="past-papers-container-uni">
        <button
          className="past-papers-button-uni"
          onClick={() => navigate('/papers')}
        >
          All Past Papers
        </button>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
        action={authAction}
      />

      {/* Rating Modal */}
      <RatingModal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        book={{ id: selectedUniversity?.id, title: selectedUniversity?.name }}
        onRate={handleRate}
        existingRating={selectedUniversity ? userRatings[selectedUniversity.id] : null}
      />
    </div>
  );
};
