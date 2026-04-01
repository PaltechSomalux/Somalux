import './Home.css';
import { useState, useRef, useEffect } from 'react';
import JobCard from './JobCard';
import DetailsPanel from './DetailsPanel';
import Search from './Search';
import { MdAdminPanelSettings } from 'react-icons/md';

function Home({ profiles = [], searchTerm = '', onToggleLiked, likedItems, onToggleBookmarked, bookmarkedItems, onToggleFollowing, followingItems, userProfileId = null, onSearchChange })  {
  const [selectedProfile, setSelectedProfile] = useState(null);
  const scrollRefsMap = useRef({});
  const [scrollStates, setScrollStates] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [cardOrder, setCardOrder] = useState([]);
  const [categoryOrder, setCategoryOrder] = useState([]);
  const isShufflingRef = useRef(false);
  const isCategoryShufflingRef = useRef(false);
  const ROWS_PER_PAGE = 6;
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const getOrCreateRef = (category) => {
    if (!scrollRefsMap.current[category]) {
      scrollRefsMap.current[category] = { current: null };
    }
    return scrollRefsMap.current[category];
  };

  const checkScroll = (category) => {
    const scrollRef = scrollRefsMap.current[category];
    if (scrollRef?.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setScrollStates(prev => ({
        ...prev,
        [category]: {
          canScrollLeft: scrollLeft > 0,
          canScrollRight: scrollLeft < scrollWidth - clientWidth - 10,
          hasOverflow: scrollWidth > clientWidth
        }
      }));
    }
  };

  const handleScroll = (direction, category) => {
    // Handle both mobile and desktop with smooth horizontal scrolling
    const scrollRef = scrollRefsMap.current[category];
    if (scrollRef?.current) {
      const scrollAmount = isMobile ? 300 : 250;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(() => checkScroll(category), 100);
    }
  };

  // Touch swipe handler for mobile
  const handleTouchStart = useRef({});
  const handleTouchMove = (e, category) => {
    if (!handleTouchStart.current[category]) return;
  };
  const handleTouchEnd = (e, category) => {
    if (!handleTouchStart.current[category]) return;
    const startX = handleTouchStart.current[category];
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    
    if (Math.abs(diff) > 50) {
      handleScroll(diff > 0 ? 'right' : 'left', category);
    }
    delete handleTouchStart.current[category];
  };

  // Initialize and shuffle card order on page load
  useEffect(() => {
    const initialOrder = [...Array(profiles.length).keys()];
    // Do initial shuffle
    const shuffled = [...initialOrder];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setCardOrder(shuffled);
  }, [profiles]);

  // Shuffle individual cards randomly at staggered intervals
  useEffect(() => {
    const interval = setInterval(() => {
      // Only shuffle if not currently shuffling
      if (!isShufflingRef.current) {
        isShufflingRef.current = true;
        setCardOrder(prevOrder => {
          const newOrder = [...prevOrder];
          // Swap only 1 pair of random cards
          const i = Math.floor(Math.random() * newOrder.length);
          const j = Math.floor(Math.random() * newOrder.length);
          if (i !== j) {
            [newOrder[i], newOrder[j]] = [newOrder[j], newOrder[i]];
          }
          return newOrder;
        });
        
        // Wait for transition to complete before allowing next shuffle
        setTimeout(() => {
          isShufflingRef.current = false;
        }, 2000);
      }
    }, 30000); // Every 30 seconds, shuffle one card

    return () => clearInterval(interval);
  }, []);

  // Initialize category order on page load
  useEffect(() => {
    const categories = Object.entries(
      profiles.reduce((groups, profile) => {
        const category = profile.title;
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(profile);
        return groups;
      }, {})
    ).sort((a, b) => a[0].localeCompare(b[0]));

    const initialOrder = [...Array(categories.length).keys()];
    // Do initial shuffle
    const shuffled = [...initialOrder];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setCategoryOrder(shuffled);
  }, [profiles]);

  // Shuffle categories randomly at staggered intervals
  useEffect(() => {
    const interval = setInterval(() => {
      // Only shuffle if not currently shuffling
      if (!isCategoryShufflingRef.current) {
        isCategoryShufflingRef.current = true;
        setCategoryOrder(prevOrder => {
          const newOrder = [...prevOrder];
          // Swap only 1 pair of random categories
          const i = Math.floor(Math.random() * newOrder.length);
          const j = Math.floor(Math.random() * newOrder.length);
          if (i !== j) {
            [newOrder[i], newOrder[j]] = [newOrder[j], newOrder[i]];
          }
          return newOrder;
        });
        
        // Wait for transition to complete before allowing next shuffle
        setTimeout(() => {
          isCategoryShufflingRef.current = false;
        }, 2000);
      }
    }, 30000); // Every 30 seconds, shuffle one category

    return () => clearInterval(interval);
  }, []);

  // Check scroll state for all categories after render
  useEffect(() => {
    const timer = setTimeout(() => {
      Object.keys(scrollRefsMap.current).forEach(category => {
        checkScroll(category);
      });
    }, 100);
    
    return () => clearTimeout(timer);
  }, [profiles, currentPage]);

  // Handle window resize to recheck scroll state
  useEffect(() => {
    const handleResize = () => {
      Object.keys(scrollRefsMap.current).forEach(category => {
        checkScroll(category);
      });
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="Home-container">
      <div className="Home">
        <div className="home-search-section">
          <Search profiles={profiles} onSearchChange={onSearchChange} />
        </div>
        <div className="home-header">
          <p>Find and hire skilled freelancers, start your project today</p>
        </div>
        
        {/* Group profiles by job title and render by category with pagination */}
        {(() => {
          const categories = Object.entries(
            profiles.reduce((groups, profile) => {
              const category = profile.title;
              if (!groups[category]) {
                groups[category] = [];
              }
              groups[category].push(profile);
              return groups;
            }, {})
          ).sort((a, b) => a[0].localeCompare(b[0]));

          const totalPages = Math.ceil(categories.length / ROWS_PER_PAGE);
          const startIndex = currentPage * ROWS_PER_PAGE;
          const paginatedCategories = categories.slice(startIndex, startIndex + ROWS_PER_PAGE);

          return (
            <>
              <div className="categories-container">
                {paginatedCategories.map(([category, categoryProfiles], idx) => {
                const categoryIndex = Object.entries(
                  profiles.reduce((groups, profile) => {
                    const category = profile.title;
                    if (!groups[category]) {
                      groups[category] = [];
                    }
                    groups[category].push(profile);
                    return groups;
                  }, {})
                ).sort((a, b) => a[0].localeCompare(b[0]))
                .findIndex(([cat]) => cat === category);
                
                const categoryScrollRef = getOrCreateRef(category);
                const categoryScrollState = scrollStates[category] || { canScrollLeft: false, canScrollRight: false, hasOverflow: false };
                
                // Show all cards - let horizontal scroll handle them
                const cardsToDisplay = categoryProfiles;
                
                // Determine scroll button visibility
                const shouldShowLeftBtn = categoryScrollState.hasOverflow && categoryScrollState.canScrollLeft;
                const shouldShowRightBtn = categoryScrollState.hasOverflow && categoryScrollState.canScrollRight;
                
                const categoryNewIndex = categoryOrder[categoryIndex];
                
                return (
                  <div 
                    key={category} 
                    className="category-section scrollable-category"
                    style={{ order: categoryNewIndex }}
                  >
                    <h3 className="category-header">{category}</h3>
                    {shouldShowLeftBtn && (
                      <button 
                        className="scroll-btn scroll-btn-left"
                        onClick={() => handleScroll('left', category)}
                        aria-label="Scroll left"
                        title="Scroll left"
                      >
                        ‹
                      </button>
                    )}
                    <div 
                      className="jobs-scroll"
                      ref={categoryScrollRef}
                      onScroll={() => checkScroll(category)}
                      onTouchStart={(e) => {
                        handleTouchStart.current[category] = e.touches[0].clientX;
                      }}
                      onTouchEnd={(e) => handleTouchEnd(e, category)}
                      onTouchMove={(e) => handleTouchMove(e, category)}
                    >
                      {cardsToDisplay.map((profile, idx) => {
                        const baseIndex = profiles.findIndex(p => p.id === profile.id);
                        const newIndex = cardOrder[baseIndex];
                        return (
                          <JobCard 
                            key={profile.id} 
                            job={profile} 
                            searchTerm={searchTerm}
                            onSelect={() => setSelectedProfile(profile)}
                            style={{ order: newIndex }}
                            onToggleLiked={onToggleLiked}
                            likedItems={likedItems}
                            onToggleBookmarked={onToggleBookmarked}
                            bookmarkedItems={bookmarkedItems}
                            onToggleFollowing={onToggleFollowing}
                            followingItems={followingItems}
                            isUserProfile={profile.id === userProfileId}
                          />
                        );
                      })}
                    </div>
                    {shouldShowRightBtn && (
                      <button 
                        className="scroll-btn scroll-btn-right"
                        onClick={() => handleScroll('right', category)}
                        aria-label="Scroll right"
                        title="Scroll right"
                      >
                        ›
                      </button>
                    )}
                  </div>
                );
              })}
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pagination-container">
                  <button 
                    className="pagination-btn"
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    title="Previous page"
                  >
                    ← Prev
                  </button>
                  <span className="pagination-info">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button 
                    className="pagination-btn"
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage === totalPages - 1}
                    title="Next page"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          );
        })()}
      </div>
      {selectedProfile && (
        <DetailsPanel 
          profile={selectedProfile} 
          onClose={() => setSelectedProfile(null)}
          onToggleFollowing={onToggleFollowing}
          followingItems={followingItems}
        />
      )}
      <button 
        onClick={() => { 
          // Navigate to admin panel
          window.location.hash = '#/admin';
        }} 
        className="floating-admin-btn" 
        title="Admin Panel"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <MdAdminPanelSettings className="admin-btn-icon" />
      </button>
    </div>
  );
}

export default Home;
