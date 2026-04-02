
import './Liked.css';
import React, { useState, useRef, useEffect } from 'react';
import JobCard from './JobCard';
import DetailsPanel from './DetailsPanel';
import Search from './Search';

function Liked({ searchTerm = '', profiles = [], likedItems, bookmarkedItems, onToggleLiked, onToggleBookmarked, onToggleFollowing, followingItems, onSearchChange }) {
  const [selectedProfile, setSelectedProfile] = useState(null);
  // Filter only the liked and bookmarked ones
  const likedAndBookmarkedJobs = profiles.filter(job => likedItems?.[job.id] || bookmarkedItems?.[job.id]);

  const scrollRefsMap = useRef({});
  const [scrollStates, setScrollStates] = useState({});

  // Initialize scroll state when component mounts or categories change
  useEffect(() => {
    // Check all scrollable elements on mount/update
    Object.keys(scrollRefsMap.current).forEach(category => {
      if (scrollRefsMap.current[category]) {
        const element = scrollRefsMap.current[category];
        if (element && element.current) {
          const { scrollLeft, scrollWidth, clientWidth } = element.current;
          setScrollStates(prev => ({
            ...prev,
            [category]: {
              canScrollLeft: scrollLeft > 0,
              canScrollRight: scrollLeft < scrollWidth - clientWidth - 10
            }
          }));
        }
      }
    });
  }, [likedAndBookmarkedJobs]);

  const checkScroll = (category) => {
    const ref = scrollRefsMap.current[category];
    if (ref && ref.current) {
      const { scrollLeft, scrollWidth, clientWidth } = ref.current;
      setScrollStates(prev => ({
        ...prev,
        [category]: {
          canScrollLeft: scrollLeft > 0,
          canScrollRight: scrollLeft < scrollWidth - clientWidth - 10
        }
      }));
    }
  };

  const handleScroll = (category, direction) => {
    const ref = scrollRefsMap.current[category];
    if (ref && ref.current) {
      const scrollAmount = 250;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(() => checkScroll(category), 100);
    }
  };

  const handleSelect = (profile) => {
    setSelectedProfile(profile);
  };

  // Group liked items by category
  const categories = Object.entries(
    likedAndBookmarkedJobs.reduce((groups, profile) => {
      const category = profile.title;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(profile);
      return groups;
    }, {})
  ).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="Liked-container">
      <div className="Liked">
        <div className="home-search-section">
          <Search profiles={profiles} onSearchChange={onSearchChange} />
        </div>
        {categories.length > 0 ? (
          categories.map(([category, categoryProfiles]) => {
            // Ensure ref exists for this category
            if (!scrollRefsMap.current[category]) {
              scrollRefsMap.current[category] = React.createRef();
            }
            const ref = scrollRefsMap.current[category];
            const canScrollLeft = scrollStates[category]?.canScrollLeft || false;
            const canScrollRight = scrollStates[category]?.canScrollRight !== false;

            return (
              <div 
                key={category} 
                className="category-section scrollable-category"
              >
                <h3 className="category-header">{category}</h3>
                {canScrollLeft && (
                  <button 
                    className="scroll-btn scroll-btn-left"
                    onClick={() => handleScroll(category, 'left')}
                    aria-label="Scroll left"
                  >
                    ‹
                  </button>
                )}
                <div 
                  className="jobs-scroll"
                  ref={ref}
                  onScroll={() => checkScroll(category)}
                >
                  {categoryProfiles.map((profile) => (
                    <JobCard 
                      key={profile.id} 
                      job={profile} 
                      searchTerm={searchTerm}
                      onSelect={() => handleSelect(profile)}
                      onToggleLiked={onToggleLiked}
                      likedItems={likedItems}
                      onToggleBookmarked={onToggleBookmarked}
                      bookmarkedItems={bookmarkedItems}
                      onToggleFollowing={onToggleFollowing}
                      followingItems={followingItems}
                    />
                  ))}
                </div>
                {canScrollRight && (
                  <button 
                    className="scroll-btn scroll-btn-right"
                    onClick={() => handleScroll(category, 'right')}
                    aria-label="Scroll right"
                  >
                    ›
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📌</div>
            <h3>No liked or bookmarked users yet</h3>
            <p>Start exploring and bookmark users you're interested in!</p>
          </div>
        )}
      </div>
      {selectedProfile && (
        <DetailsPanel 
          profile={selectedProfile} 
          onClose={() => setSelectedProfile(null)}
          onToggleFollowing={onToggleFollowing}
          followingItems={followingItems}
        />
      )}
    </div>
  );
}

export default Liked;
