import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFileText, FiFilter, FiX, FiDownload, FiUpload, FiEye, FiBookmark } from 'react-icons/fi';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import PDFCover from '../Books/PDFCover';
import { AdBanner } from '../Ads/AdBanner';
import './PaperPanel.css';

export const PaperGrid = ({
  displayedPapers,
  visibleCount,
  setVisibleCount,
  filteredPapers,
  showFilters,
  activeFilter,
  sortBy,
  searchTerm,
  toggleFilters,
  handleFilterChange,
  handleSortChange,
  setSearchTerm,
  user,
  onPaperSelect,
  onUploadClick,
  onAdminClick,
  paperLikes = {},
  paperLikesCounts = {},
  onToggleLike,
  paperBookmarks = [],
  paperBookmarksCounts = {},
  onToggleBookmark
}) => {
  const hasMorePapers = visibleCount < filteredPapers.length;

  return (
    <>
      {/* Search and Filter Controls */}
      <div className="controlspast">
        <div className="search-containerpast">
          <input
            type="text"
            placeholder="Search papers by course, code or faculty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-inputpast"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="clear-buttonpast"
            >
              <FiX size={16} />
            </button>
          )}
        </div>

        <div className="filter-wrapperpast">
          <button
            onClick={toggleFilters}
            className={`filter-buttonpast ${showFilters ? 'activepast' : ''}`}
          >
            <FiFilter /> {activeFilter !== 'all' && '• '}Filters
          </button>

          {((user?.role === 'admin' || user?.role === 'editor') || ['campuslives254@gmail.com', 'paltechsomalux@gmail.com'].includes(user?.email)) && (
            <button
              onClick={onAdminClick}
              className="filter-buttonpast"
              title="Open Admin Dashboard"
            >
              {user?.role === 'admin' || ['campuslives254@gmail.com', 'paltechsomalux@gmail.com'].includes(user?.email) ? 'Admin' : 'Editor'}
            </button>
          )}

          {user && (
            <button
              onClick={onUploadClick}
              className="filter-buttonpast"
              title="Upload a past paper"
            >
              <FiUpload size={16} /> Upload
            </button>
          )}

          {showFilters && (
            <div className="filter-dropdownpast">
              <div className="filter-sectionpast">
                <h4>Filter by:</h4>
                <div
                  className={`filter-optionpast ${activeFilter === 'all' ? 'activepast' : ''}`}
                  onClick={() => handleFilterChange('all')}
                >
                  All Papers
                </div>
                <div
                  className={`filter-optionpast ${activeFilter === 'recent' ? 'activepast' : ''}`}
                  onClick={() => handleFilterChange('recent')}
                >
                  Recent (2 years)
                </div>
              </div>
              <div className="filter-sectionpast">
                <h4>Sort by:</h4>
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
                  className={`filter-optionpast ${sortBy === 'course' ? 'activepast' : ''}`}
                  onClick={() => handleSortChange('course')}
                >
                  Course (A-Z)
                </div>
                <div
                  className={`filter-optionpast ${sortBy === 'year' ? 'activepast' : ''}`}
                  onClick={() => handleSortChange('year')}
                >
                  Year (Newest)
                </div>
                <div
                  className={`filter-optionpast ${sortBy === 'views' ? 'activepast' : ''}`}
                  onClick={() => handleSortChange('views')}
                >
                  Most Viewed
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="gridpast">
            <AnimatePresence>
              {displayedPapers.map((paper, index) => {
                // For mobile: Show ad after 3rd paper (index 2)
                // For desktop: Show ad in middle position
                const isMobile = window.innerWidth < 768;
                const adPosition = isMobile ? 3 : Math.floor(displayedPapers.length / 2);
                
                // Render ad at the appropriate position
                if (index === adPosition && displayedPapers.length > 0) {
                  return (
                    <React.Fragment key={`ad-position-${index}`}>
                      {/* Grid Ad */}
                      <motion.div
                        key="grid-ad-pastpapers"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        layout
                      >
                        <div style={{ height: '100%' }}>
                          <AdBanner placement="grid-pastpapers" limit={5} />
                        </div>
                      </motion.div>
                      
                      {/* Current Paper */}
                      <motion.div
                        key={paper.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        layout
                      >
                        <div
                          className="paper-cardpast"
                          onClick={() => onPaperSelect(paper)}
                        >
                    {/* Paper Cover - Renders first page of PDF */}
                    <PDFCover
                      src={paper.downloadUrl}
                      alt={paper.title}
                      className="paper-snapshotpast"
                      loading="lazy"
                    />

                    {/* Card Content */}
                    <div className="card-contentpast">
                      <h3 style={{ margin: 0, fontSize: '0.65rem', color: '#e9edef', fontWeight: '600', lineHeight: '1.2', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 1, overflow: 'hidden' }}>
                        {paper.courseCode ? `${paper.courseCode}: ${paper.title}` : paper.title}
                      </h3>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.6em', color: '#8696a0', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {paper.faculty && <span>{paper.faculty}</span>}
                        {paper.year && <span>•</span>}
                        {paper.year && <span>{paper.year}</span>}
                        {paper.semester && <span>•</span>}
                        {paper.semester && <span>Sem {paper.semester}</span>}
                        {paper.exam_type && <span>•</span>}
                        {paper.exam_type && <span>{paper.exam_type}</span>}
                      </div>
                    </div>

                    {/* Stats Footer */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid #2a3942',
                      padding: '4px 4px',
                      gap: '2px'
                    }}>
                      <span style={{ fontSize: '0.55rem', color: '#8696a0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                        <FiEye size={11} /> {paper.views || 0}
                      </span>
                      <span style={{ fontSize: '0.55rem', color: '#8696a0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                        <FiDownload size={11} /> {paper.downloads_count || 0}
                      </span>
                      {user && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleLike?.(paper.id);
                            }}
                            title={paperLikes[paper.id] ? "Unlike" : "Like"}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                              color: paperLikes[paper.id] ? '#FF1493' : '#8696a0',
                              padding: '2px 2px',
                              fontSize: '0.55rem',
                              transition: 'all 0.2s'
                            }}
                          >
                            {paperLikes[paper.id] ? <AiFillHeart size={10} /> : <AiOutlineHeart size={10} />}
                            <span>{paperLikesCounts[paper.id] || 0}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleBookmark?.(paper.id);
                            }}
                            title={paperBookmarks.includes(paper.id) ? "Remove bookmark" : "Bookmark"}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                              color: paperBookmarks.includes(paper.id) ? '#00a884' : '#8696a0',
                              padding: '2px 2px',
                              fontSize: '0.8rem',
                              transition: 'all 0.2s'
                            }}
                          >
                            <FiBookmark size={10} fill={paperBookmarks.includes(paper.id) ? '#00a884' : 'none'} />
                          </button>
                        </>
                      )}
                    </div>
                        </div>
                      </motion.div>
                    </React.Fragment>
                  );
                }
                
                // Render regular paper card
                return (
                  <motion.div
                    key={paper.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    layout
                  >
                    <div
                      className="paper-cardpast"
                      onClick={() => onPaperSelect(paper)}
                    >
                      {/* Paper Cover - Renders first page of PDF */}
                      <PDFCover
                        src={paper.downloadUrl}
                        alt={paper.title}
                        className="paper-snapshotpast"
                        loading="lazy"
                      />

                      {/* Card Content */}
                      <div className="card-contentpast">
                        <h3 style={{ margin: 0, fontSize: '0.65rem', color: '#e9edef', fontWeight: '600', lineHeight: '1.2', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 1, overflow: 'hidden' }}>
                          {paper.courseCode ? `${paper.courseCode}: ${paper.title}` : paper.title}
                        </h3>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.6em', color: '#8696a0', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {paper.faculty && <span>{paper.faculty}</span>}
                          {paper.year && <span>•</span>}
                          {paper.year && <span>{paper.year}</span>}
                          {paper.semester && <span>•</span>}
                          {paper.semester && <span>Sem {paper.semester}</span>}
                          {paper.exam_type && <span>•</span>}
                          {paper.exam_type && <span>{paper.exam_type}</span>}
                        </div>
                      </div>

                      {/* Stats Footer */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px solid #2a3942',
                        padding: '4px 4px',
                        gap: '2px'
                      }}>
                        <span style={{ fontSize: '0.55rem', color: '#8696a0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                          <FiEye size={11} /> {paper.views || 0}
                        </span>
                        <span style={{ fontSize: '0.55rem', color: '#8696a0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                          <FiDownload size={11} /> {paper.downloads_count || 0}
                        </span>
                        {user && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleLike?.(paper.id);
                              }}
                              title={paperLikes[paper.id] ? "Unlike" : "Like"}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px',
                                color: paperLikes[paper.id] ? '#FF1493' : '#8696a0',
                                padding: '2px 2px',
                                fontSize: '0.8rem',
                                transition: 'all 0.2s'
                              }}
                            >
                              {paperLikes[paper.id] ? <AiFillHeart size={10} /> : <AiOutlineHeart size={10} />}
                              <span>{paperLikesCounts[paper.id] || 0}</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleBookmark?.(paper.id);
                              }}
                              title={paperBookmarks.includes(paper.id) ? "Remove bookmark" : "Bookmark"}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px',
                                color: paperBookmarks.includes(paper.id) ? '#00a884' : '#8696a0',
                                padding: '2px 2px',
                                fontSize: '0.8rem',
                                transition: 'all 0.2s'
                              }}
                            >
                              <FiBookmark size={10} fill={paperBookmarks.includes(paper.id) ? '#00a884' : 'none'} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Load More Button */}
          {hasMorePapers && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', marginBottom: '20px' }}>
              <button
                onClick={() => setVisibleCount(prev => prev + 8)}
                style={{
                  padding: '10px 30px',
                  background: 'linear-gradient(135deg, #00a884 0%, #008060 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  transition: 'all 0.3s ease'
                }}
              >
                Load More ({visibleCount} of {filteredPapers.length})
              </button>
            </div>
          )}
    </>
  );
};
