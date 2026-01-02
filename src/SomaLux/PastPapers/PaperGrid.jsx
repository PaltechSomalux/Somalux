import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FiFileText, FiFilter, FiX, FiDownload, FiUpload, FiEye, FiBookmark, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { AdBanner } from '../Ads/AdBanner';
import { useBatchedPDFLoader } from '../Books/useBatchedPDFLoader';
import PDFCover from '../Books/PDFCover';
import './PaperPanel.css';

export const PaperGrid = ({
  displayedPapers,
  filteredPapers,
  currentPage,
  setCurrentPage,
  pageSize,
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
  onToggleBookmark,
  faculties = [],
  facultyFilter = '',
  onFacultyClick
}) => {
  // Debounce search input to prevent excessive updates
  const searchInputRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const [localSearchValue, setLocalSearchValue] = useState(searchTerm);
  
  // Initialize batched PDF loader
  const {
    shouldRenderPDF,
    onPaperLoadComplete,
    getCurrentBatch,
    loadingState
  } = useBatchedPDFLoader(displayedPapers, 5);
  
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearchValue(value);
    
    // Clear previous debounce
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    // Debounce the actual state update by 300ms
    searchDebounceRef.current = setTimeout(() => {
      setSearchTerm(value);
    }, 300);
  };
  
  const totalPages = Math.max(1, Math.ceil(filteredPapers.length / pageSize));

  return (
    <>
      {/* Search and Filter Controls */}
      <div className="controlspast">
        <div className="search-containerpast">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search papers by course, code or faculty..."
            value={localSearchValue}
            onChange={handleSearchChange}
            className="search-inputpast"
          />
          {localSearchValue && (
            <button
              onClick={() => {
                setLocalSearchValue('');
                setSearchTerm('');
              }}
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
            <div 
              className="filter-dropdownpast"
            >
              <div className="filter-sectionpast">
                <h4>Filter by:</h4>
                <div
                  className={`filter-optionpast ${activeFilter === 'all' ? 'activepast' : ''}`}
                  onClick={() => handleFilterChange('all')}
                >
                  All Papers
                </div>

                {faculties && faculties.length > 0 && (
                  <div
                    className={`filter-optionpast ${activeFilter === 'faculty' ? 'activepast' : ''}`}
                    onClick={() => onFacultyClick?.()}
                    style={{ cursor: 'pointer', fontWeight: 'bold', color: '#00a884' }}
                  >
                    📚 Faculty
                  </div>
                )}
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
            {displayedPapers.map((paper, index) => {
                // For mobile: Show ad after 3rd paper (index 2)
                // For desktop: Show ad in middle position
                const isMobile = window.innerWidth < 768;
                const adPosition = isMobile ? 3 : Math.floor(displayedPapers.length / 2);
                
                // Render ad at the appropriate position
                if (index === adPosition && displayedPapers.length > 0 && user?.subscription_tier !== 'premium_pro') {
                  return (
                    <React.Fragment key={`ad-position-${index}`}>
                      {/* Grid Ad */}
                      <motion.div
                        key="grid-ad-pastpapers"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        layout
                      >
                        <div style={{ height: '100%' }}>
                          <AdBanner placement="grid-pastpapers" limit={5} user={user} />
                        </div>
                      </motion.div>
                      
                      {/* Current Paper */}
                      <motion.div
                        key={paper.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        layout
                      >
                        <div
                          className="paper-cardpast"
                          onClick={() => onPaperSelect(paper)}
                        >
                    {/* Paper Cover - conditionally render PDF or placeholder based on batch loading */}
                    {shouldRenderPDF(paper.id) ? (
                      <PDFCover
                        src={paper.file_url}
                        style={{
                          width: '100%',
                          height: '140px',
                          borderRadius: '6px',
                          marginBottom: '8px'
                        }}
                        onLoadComplete={() => onPaperLoadComplete(paper.id)}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '140px',
                          backgroundColor: '#1f2937',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '6px',
                          marginBottom: '8px',
                          color: '#8696a0',
                          fontSize: '0.8rem',
                          textAlign: 'center',
                          padding: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <FiFileText size={24} />
                          <span>{paper.course ? (paper.courseCode ? `${paper.course} ${paper.courseCode}` : paper.course) : paper.courseCode || 'Paper'}</span>
                        </div>
                      </div>
                    )}

                    {/* Card Content */}
                    <div className="card-contentpast">
                      <h3 style={{ margin: 0, fontSize: '0.65rem', color: '#e9edef', fontWeight: '600', lineHeight: '1.3', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', wordBreak: 'break-word', minHeight: '20px' }}>
                        {paper.course ? `${paper.course}${paper.courseCode ? ` ${paper.courseCode}` : ''}` : paper.courseCode || paper.title}
                      </h3>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.6em', color: '#8696a0', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minHeight: '14px' }}>
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
                    transition={{ duration: 0.2 }}
                    layout
                  >
                    <div
                      className="paper-cardpast"
                      onClick={() => onPaperSelect(paper)}
                    >
                      {/* Paper Cover - conditionally render PDF or placeholder based on batch loading */}
                      {shouldRenderPDF(paper.id) ? (
                        <PDFCover
                          src={paper.file_url}
                          style={{
                            width: '100%',
                            height: '140px',
                            borderRadius: '6px',
                            marginBottom: '8px'
                          }}
                          onLoadComplete={() => onPaperLoadComplete(paper.id)}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '140px',
                            backgroundColor: '#1f2937',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '6px',
                            marginBottom: '8px',
                            color: '#8696a0',
                            fontSize: '0.8rem',
                            textAlign: 'center',
                            padding: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <FiFileText size={24} />
                            <span>{paper.course ? (paper.courseCode ? `${paper.course} ${paper.courseCode}` : paper.course) : paper.courseCode || 'Paper'}</span>
                          </div>
                        </div>
                      )}

                      {/* Card Content */}
                      <div className="card-contentpast">
                        <h3 style={{ margin: 0, fontSize: '0.65rem', color: '#e9edef', fontWeight: '600', lineHeight: '1.3', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', wordBreak: 'break-word', minHeight: '20px' }}>
                          {paper.course ? `${paper.course}${paper.courseCode ? ` ${paper.courseCode}` : ''}` : paper.courseCode || paper.title}
                        </h3>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.6em', color: '#8696a0', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minHeight: '14px' }}>
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
          </div>

          {/* Pagination Controls */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              marginTop: '24px',
              marginBottom: '20px'
            }}
          >
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              style={{
                padding: '8px 16px',
                background: currentPage <= 1 ? '#e0e0e0' : 'linear-gradient(135deg, #00a884 0%, #008060 100%)',
                color: currentPage <= 1 ? '#999' : 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.3s ease'
              }}
            >
              <FiChevronLeft size={16} /> Prev
            </button>

            <span
              style={{
                color: '#666',
                fontSize: '0.9rem',
                fontWeight: '500',
                minWidth: '150px',
                textAlign: 'center'
              }}
            >
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              style={{
                padding: '8px 16px',
                background: currentPage >= totalPages ? '#e0e0e0' : 'linear-gradient(135deg, #00a884 0%, #008060 100%)',
                color: currentPage >= totalPages ? '#999' : 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.3s ease'
              }}
            >
              Next <FiChevronRight size={16} />
            </button>
          </div>
    </>
  );
};

export default React.memo(PaperGrid);
