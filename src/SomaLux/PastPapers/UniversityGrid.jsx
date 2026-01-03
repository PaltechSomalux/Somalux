import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMapPin, FiEye } from 'react-icons/fi';
import { MdVerified } from 'react-icons/md';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { FaSearch } from 'react-icons/fa';
import { AdBanner } from '../Ads/AdBanner';
import { getPastPaperCountByUniversity } from '../Books/Admin/pastPapersApi';
import './PaperPanel.css';

// Memoized university card component to prevent unnecessary re-renders
const UniversityCard = React.memo(({
  uni,
  stats,
  userRating,
  paperCount,
  universityLikes,
  universityLikesCounts,
  user,
  onUniversitySelect,
  onToggleLike,
  setShowSubscriptionModal
}) => (
  <motion.div
    key={uni.id}
    className="paper-cardpast"
    style={{ 
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative'
    }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
    layout
    whileHover={{ y: -5 }}
    onClick={() => onUniversitySelect(uni)}
  >
    {uni.cover_image_url && (
      <img
        src={uni.cover_image_url}
        alt={uni.name}
        loading="lazy"
        style={{ 
          width: '100%', 
          height: '140px', 
          objectFit: 'cover',
          borderBottom: '1px solid #2a3942'
        }}
      />
    )}

    <div className="card-contentpast" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ margin: 0, fontSize: '0.8rem', color: '#e9edef', fontWeight: '600' }}>
        {uni.name}
      </h3>
      <p style={{ margin: '2px 0 0 0', fontSize: '0.65rem', color: '#8696a0' }}>
        {uni.location}
      </p>
      
      {/* Star Rating Display */}
      {stats.average > 0 && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px',
          marginTop: '4px',
          fontSize: '0.65rem'
        }}>
          <span style={{ color: '#FFD700' }}>★</span>
          <span style={{ color: '#8696a0' }}>
            {stats.average.toFixed(1)} ({stats.count})
          </span>
        </div>
      )}

      {/* Paper count and like button */}
      <div style={{ 
        marginTop: 'auto', 
        paddingTop: '6px',
        borderTop: '1px solid #2a3942',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '4px'
      }}>
        <span style={{ fontSize: '0.65rem', color: '#8696a0', display: 'flex', alignItems: 'center', gap: '2px' }}>
          <FiEye size={12} /> {uni.views || 0}
        </span>
        {user?.subscription_tier && (user.subscription_tier === 'premium' || user.subscription_tier === 'premium_pro') ? (
          <span style={{ fontSize: '0.65rem', color: '#00a884', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '2px' }}>
            {paperCount} papers
          </span>
        ) : (
          <span 
            onClick={(e) => {
              e.stopPropagation();
              setShowSubscriptionModal?.(true);
            }}
            style={{ fontSize: '0.65rem', color: '#1DA1F2', display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }} 
            title="Click to upgrade to Premium"
          >
            <MdVerified size={12} />
          </span>
        )}
        {user && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike?.(uni.id);
            }}
            title={universityLikes[uni.id] ? "Unlike university" : "Like university"}
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: '3px',
              padding: '2px 4px',
              color: universityLikes[uni.id] ? '#FF1493' : '#8696a0',
              cursor: 'pointer',
              fontSize: '0.8rem',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px'
            }}
          >
            {universityLikes[uni.id] ? <AiFillHeart size={12} /> : <AiOutlineHeart size={12} />}
            <span style={{ fontSize: '0.65rem' }}>{universityLikesCounts[uni.id] || 0}</span>
          </button>
        )}
      </div>
    </div>
  </motion.div>
), (prevProps, nextProps) => {
  // Custom comparison for optimization
  return (
    prevProps.uni.id === nextProps.uni.id &&
    prevProps.paperCount === nextProps.paperCount &&
    prevProps.stats.average === nextProps.stats.average &&
    prevProps.stats.count === nextProps.stats.count &&
    prevProps.universityLikes[prevProps.uni.id] === nextProps.universityLikes[nextProps.uni.id] &&
    prevProps.universityLikesCounts[prevProps.uni.id] === nextProps.universityLikesCounts[nextProps.uni.id] &&
    prevProps.user?.subscription_tier === nextProps.user?.subscription_tier
  );
});

export const UniversityGrid = React.memo(({
  universities,
  universitySearchTerm,
  setUniversitySearchTerm,
  ratingStats,
  userRatings,
  papers,
  onUniversitySelect,
  setRatingModalOpen,
  setSelectedUniversity,
  user,
  universityLikes = {},
  universityLikesCounts = {},
  onToggleLike,
  setShowSubscriptionModal
}) => {
  const [paperCounts, setPaperCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Initialize paperCounts with 0 for all universities to prevent flash
  const initialCounts = useMemo(() => {
    const counts = {};
    universities.forEach(uni => {
      counts[uni.id] = 0;
    });
    return counts;
  }, [universities]);

  // Fetch actual paper counts from database - batch loading for performance
  useEffect(() => {
    const fetchCounts = async () => {
      setIsLoading(true);
      const counts = { ...initialCounts };
      const BATCH_SIZE = 5; // Load 5 universities at a time

      try {
        // Load in batches to avoid overwhelming the server and blocking UI
        for (let i = 0; i < universities.length; i += BATCH_SIZE) {
          const batch = universities.slice(i, i + BATCH_SIZE);
          const countPromises = batch.map(async (uni) => {
            try {
              const count = await getPastPaperCountByUniversity(uni.id, user?.subscription_tier);
              return { id: uni.id, count };
            } catch (err) {
              console.error(`Error fetching paper count for ${uni.name}:`, err);
              return { id: uni.id, count: 0 };
            }
          });

          const results = await Promise.all(countPromises);
          results.forEach(({ id, count }) => {
            counts[id] = count;
          });

          // Update state after each batch for progressive rendering
          setPaperCounts(prevCounts => ({ ...prevCounts, ...counts }));
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching paper counts:', err);
        setIsLoading(false);
      }
    };

    if (universities.length > 0) {
      fetchCounts();
    }
  }, [universities, user?.subscription_tier, initialCounts]);
  const filteredUniversities = universities.filter(uni => 
    !universitySearchTerm || 
    uni.name?.toLowerCase().includes(universitySearchTerm.toLowerCase()) ||
    uni.location?.toLowerCase().includes(universitySearchTerm.toLowerCase())
  );

  if (filteredUniversities.length === 0) {
    return (
      <div className="empty-statepast">
        <FiMapPin size={48} />
        <h3>No universities found</h3>
        <p>Try adjusting your search</p>
        <button 
          className="reset-filterspast"
          onClick={() => setUniversitySearchTerm('')}
        >
          Clear Search
        </button>
      </div>
    );
  }

  return (
    <>
      {/* University Search */}
      <div className="search-container" style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '20px' }}>
        <div className="search-box" style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', maxWidth: '500px' }}>
          <FaSearch style={{ position: 'absolute', left: '12px', color: '#8696a0' }} />
          <input
            type="text"
            placeholder="Search universities..."
            value={universitySearchTerm}
            onChange={(e) => setUniversitySearchTerm(e.target.value)}
            style={{ padding: '4px 32px 4px 40px', width: '100%', border: '1px solid #2a3942', borderRadius: '4px', fontSize: '0.9em', boxSizing: 'border-box', background: '#0b1216', color: '#e9edef', outline: 'none' }}
          />
          {universitySearchTerm && (
            <button 
              onClick={() => setUniversitySearchTerm('')}
              style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: '#8696a0', cursor: 'pointer', fontSize: '1em' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Universities Grid Display */}
      <div className="gridpast">
        <AnimatePresence>
          {filteredUniversities.map((uni, index) => {
            // Calculate stats first (before conditional rendering)
            const stats = ratingStats[uni.id] || { average: 0, count: 0 };
            const userRating = userRatings[uni.id];
            const paperCount = paperCounts[uni.id] || 0;
            
            // For mobile: Show ad after 3rd university (index 2)
            // For desktop: Show ad in middle position
            const isMobile = window.innerWidth < 768;
            const adPosition = isMobile ? 3 : Math.floor(filteredUniversities.length / 2);
            
            // Render ad at the appropriate position (only if not premium_pro)
            if (index === adPosition && filteredUniversities.length > 0 && user?.subscription_tier !== 'premium_pro') {
              return (
                <React.Fragment key={`ad-position-${index}`}>
                  {/* Grid Ad */}
                  <motion.div
                    key="grid-ad-university"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    layout
                  >
                    <div style={{ height: '100%' }}>
                      <AdBanner placement="grid-campus" limit={5} user={user} />
                    </div>
                  </motion.div>
                  
                  {/* Current University */}
                  <UniversityCard
                    uni={uni}
                    stats={stats}
                    userRating={userRating}
                    paperCount={paperCount}
                    universityLikes={universityLikes}
                    universityLikesCounts={universityLikesCounts}
                    user={user}
                    onUniversitySelect={onUniversitySelect}
                    onToggleLike={onToggleLike}
                    setShowSubscriptionModal={setShowSubscriptionModal}
                  />
                </React.Fragment>
              );
            }
            
            // Render regular university card
            return (
              <UniversityCard
                key={uni.id}
                uni={uni}
                stats={stats}
                userRating={userRating}
                paperCount={paperCount}
                universityLikes={universityLikes}
                universityLikesCounts={universityLikesCounts}
                user={user}
                onUniversitySelect={onUniversitySelect}
                onToggleLike={onToggleLike}
                setShowSubscriptionModal={setShowSubscriptionModal}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
});

export default UniversityGrid;
