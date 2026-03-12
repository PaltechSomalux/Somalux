import React, { useState, useEffect, useMemo } from 'react';
import { 
  FiBookOpen, 
  FiStar, 
  FiFilter, 
  FiChevronRight,
  FiX,
  FiTrendingUp,  
  FiClock
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import './BookCategories.css';
import { supabase } from '../Books/supabaseClient';
import { useNavigate } from 'react-router-dom';

export const BookCategories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [displayedCategories, setDisplayedCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(8);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');

  // We will populate categories from Supabase instead of the hardcoded list
  const defaultIconMap = {
    'contemporary': '📚',
    'tech': '🔬',
    'mystery': '🕵️',
    'biography': '👤',
    'fantasy': '🧙',
    'business': '💼',
    'historical': '🏰',
    'self': '💪',
    'science': '🚀',
    'health': '💚',
    'crime': '🔍',
    'art': '🎨'
  };

  const pickIcon = (name) => {
    if (!name) return '📚';
    const key = name.toLowerCase();
    for (const k of Object.keys(defaultIconMap)) {
      if (key.includes(k)) return defaultIconMap[k];
    }
    return '📚';
  };

  useEffect(() => {
    let mounted = true;
    const fetchCategories = async () => {
      setLoading(true);
      try {
        // Try to select detailed fields; if the table doesn't have some columns (400),
        // fall back to a minimal select so the UI can still render.
        let catsData = null;
        let catsError = null;
        try {
          // Avoid selecting columns that may not exist in all schemas (e.g. color, updated_at)
          // Request only the most common fields; fall back logic below will handle missing data.
          const res = await supabase
            .from('categories')
            .select('id,name,description');
          catsData = res.data;
          catsError = res.error;
        } catch (e) {
          catsError = e;
        }

        if (catsError) {
          // Log detailed error to help debugging
          try { console.error('Categories query error:', JSON.stringify(catsError, Object.getOwnPropertyNames(catsError), 2)); } catch (_) { console.error('Categories query error (non-serializable):', catsError); }
          // Try a minimal fallback select (id,name) which is less likely to fail
          try {
            const fallback = await supabase.from('categories').select('id,name');
            catsData = fallback.data || [];
            if (fallback.error) console.warn('Fallback categories query also returned error:', fallback.error);
            console.info('Used fallback category select (id,name)');
          } catch (fbErr) {
            console.error('Fallback categories query failed:', fbErr);
            throw catsError;
          }
        } else {
          console.debug('Fetched categories:', catsData);
        }

        // Fetch books to compute simple counts per category (fallback if there's no aggregated field)
        const { data: booksData, error: booksError } = await supabase
          .from('books')
          .select('id,category_id');

        if (booksError) console.warn('Books query error (counts):', booksError);
        console.debug('Fetched books for counts:', booksData?.length || 0);

        const counts = {};
        if (!booksError && booksData) {
          booksData.forEach(b => {
            const key = b.category_id;
            counts[key] = (counts[key] || 0) + 1;
          });
        }

        let mapped = (catsData || []).map(cat => ({
          id: cat.id,
          name: cat.name || 'Unknown',
          description: cat.description || '',
          icon: pickIcon(cat.name),
          color: cat.color || '#6366f1',
          bookCount: counts[cat.id] || 0,
          rating: 4.2,
          trending: false,
          newReleases: [],
          updatedAt: cat.updated_at || new Date().toISOString()
        }));

        // Fallback: if no categories exist in DB, generate defaults from defaultIconMap
        if ((!mapped || mapped.length === 0) && Object.keys(defaultIconMap).length > 0) {
          mapped = Object.keys(defaultIconMap).map((k, idx) => ({
            id: `fallback-${idx}`,
            name: k.charAt(0).toUpperCase() + k.slice(1),
            description: '',
            icon: defaultIconMap[k],
            color: '#6366f1',
            bookCount: 0,
            rating: 4.2,
            trending: false,
            newReleases: [],
            updatedAt: new Date().toISOString()
          }));
          console.info('No categories in DB; using fallback categories');
        }

        if (mounted) {
          setCategories(mapped);
          setDisplayedCategories(mapped.slice(0, visibleCount));
        }
      } catch (err) {
        console.error('Failed to fetch categories', err);
        if (mounted) {
          setCategories([]);
          setDisplayedCategories([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchCategories();

    return () => { mounted = false; };
  }, []);

  const filteredCategories = useMemo(() => {
    let result = [...categories];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(cat => 
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (activeFilter === 'trending') {
      result = result.filter(cat => cat.trending);
    } else if (activeFilter === 'new') {
      // Assuming "new" means updated in the last 3 months
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      result = result.filter(cat => new Date(cat.updatedAt) > threeMonthsAgo);
    }
    
    // Apply sorting
    if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'bookCount') {
      result.sort((a, b) => b.bookCount - a.bookCount);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    }
    
    return result;
  }, [categories, searchTerm, activeFilter, sortBy]);

  useEffect(() => {
    setDisplayedCategories(filteredCategories.slice(0, visibleCount));
  }, [filteredCategories, visibleCount]);

  const loadMore = () => {
    setVisibleCount(prev => prev + 4);
  };

  const viewCategoryDetails = (category) => {
    setSelectedCategory(category);
  };

  const closeDetails = () => {
    setSelectedCategory(null);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setShowFilters(false);
    setVisibleCount(8); // Reset visible count when changing filters
  };

  const handleSortChange = (sortType) => {
    setSortBy(sortType);
    setVisibleCount(8); // Reset visible count when changing sort
  };

  if (loading) {
    return (
      <div className="containercat">
        <header className="headercat">
          <h1 className="titlecat">Categories</h1>
          <p className="subtitlecat">Fly ✈️ ~ take a friend</p>
        </header>
        
        <div className="controlscat">
          <input
            type="text"
            className="search-inputcat"
            placeholder="Search categories..."
            disabled
            value={searchTerm}
          />
          <button className="filter-buttoncat" disabled>
            <FiFilter /> Filters
          </button>
        </div>
        
        <div className="gridcat">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="skeleton-cardcat">
              <div className="skeleton-iconcat"></div>
              <div className="skeleton-textcat" style={{ width: '70%' }}></div>
              <div className="skeleton-textcat" style={{ width: '90%' }}></div>
              <div className="skeleton-textcat" style={{ width: '50%' }}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="containercat">
      <header className="headercat">
        <h1 className="titlecat">Categories</h1>
        <p className="subtitlecat">Just fly ✈️ ~ take a friend</p>
      </header>

      <div className="controlscat">
        <input
          type="text"
          className="search-inputcat"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button 
            className="clear-searchcat"
            onClick={() => setSearchTerm('')}
          >
            <FiX size={16} />
          </button>
        )}
        <div className="filter-wrappercat">
          <button 
            className={`filter-buttoncat ${showFilters ? 'activecat' : ''}`}
            onClick={toggleFilters}
          >
            <FiFilter /> {activeFilter !== 'all' && '• '}Filters
          </button>
          
          {showFilters && (
            <div className="filter-dropdowncat">
              <div 
                className={`filter-optioncat ${activeFilter === 'all' ? 'activecat' : ''}`}
                onClick={() => handleFilterChange('all')}
              >
                All Categories
              </div>
              <div 
                className={`filter-optioncat ${activeFilter === 'trending' ? 'activecat' : ''}`}
                onClick={() => handleFilterChange('trending')}
              >
                <FiTrendingUp /> Trending
              </div>
              <div 
                className={`filter-optioncat ${activeFilter === 'new' ? 'activecat' : ''}`}
                onClick={() => handleFilterChange('new')}
              >
                <FiClock /> Recently Updated
              </div>
              
              <div className="sort-sectioncat">
                <small>Sort By:</small>
                <div 
                  className={`filter-optioncat ${sortBy === 'default' ? 'activecat' : ''}`}
                  onClick={() => handleSortChange('default')}
                >
                  Default
                </div>
                <div 
                  className={`filter-optioncat ${sortBy === 'name' ? 'activecat' : ''}`}
                  onClick={() => handleSortChange('name')}
                >
                  Name (A-Z)
                </div>
                <div 
                  className={`filter-optioncat ${sortBy === 'bookCount' ? 'activecat' : ''}`}
                  onClick={() => handleSortChange('bookCount')}
                >
                  Most Books
                </div>
                <div 
                  className={`filter-optioncat ${sortBy === 'rating' ? 'activecat' : ''}`}
                  onClick={() => handleSortChange('rating')}
                >
                  Highest Rating
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {displayedCategories.length === 0 ? (
        <div className="empty-statecat">
          <FiBookOpen size={48} />
          <h3>No categories found</h3>
          <p>Try adjusting your search or filters</p>
          <button 
            className="reset-filterscat"
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
          <div className="gridcat">
            <AnimatePresence>
              {displayedCategories.map((category) => (
                <motion.div
                  key={category.id}
                  className="category-cardcat"
                  style={{ '--category-color': category.color }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  layout
                  whileHover={{ y: -5 }}
                  onClick={() => viewCategoryDetails(category)}
                >
                  <div className="card-contentcat">
                    <div className="badge-containercat">
                      {category.trending && (
                        <span className="trending-badgecat">
                          <FiTrendingUp size={12} /> Trending
                        </span>
                      )}
                      {new Date(category.updatedAt) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) && (
                        <span className="new-badgecat">New</span>
                      )}
                    </div>
                    
                    <div className="category-iconcat">{category.icon}</div>
                    <h3 className="category-namecat">{category.name}</h3>
                    <p className="category-desccat">{category.description}</p>
                    <div className="category-metacat">
                      <span
                        className="book-countcat"
                        aria-label={`Books in category ${category.name}: ${category.bookCount}`}
                        title={`${category.bookCount.toLocaleString()} books`}
                      >
                        <FiBookOpen size={14} /> {category.bookCount.toLocaleString()} books
                      </span>
                      <span className="ratingcat">
                        <FiStar size={14} fill="#fbbf24" /> {category.rating}
                      </span>
                    </div>
                  </div>
                  <div className="view-buttoncat">
                    View <FiChevronRight />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {visibleCount < filteredCategories.length && (
            <motion.button
              className="load-more-buttoncat"
              onClick={loadMore}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Load More ({filteredCategories.length - visibleCount} remaining)
            </motion.button>
          )}
        </>
      )}

      {/* Category Detail Modal */}
      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            className="modal-overlaycat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDetails}
          >
            <motion.div
                className="modal-contentcat"
                style={{ ['--category-color']: selectedCategory.color }}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="close-buttoncat" onClick={closeDetails}>
                <FiX size={24} />
              </button>
              
                <div
                  className="modal-headercat"
                  style={{
                    background: `linear-gradient(135deg, ${selectedCategory.color}22, ${selectedCategory.color}12)`,
                    color: '#fff'
                  }}
                >
                  <div className="modal-iconcat">{selectedCategory.icon}</div>
                  <h2>{selectedCategory.name}</h2>
                  <p>{selectedCategory.description}</p>
                </div>
              
              <div className="modal-bodycat">
                <div className="stats-containercat">
                  <div className="stat-itemcat">
                    <FiBookOpen size={20} />
                    <span>{selectedCategory.bookCount.toLocaleString()} books available</span>
                  </div>
                  <div className="stat-itemcat">
                    <FiStar size={20} fill="#fbbf24" />
                    <span>Average rating: {selectedCategory.rating}/5</span>
                  </div>
                  <div className="stat-itemcat">
                    <FiClock size={20} />
                    <span>Last updated: {new Date(selectedCategory.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="new-releasescat">
                  <h3>New Releases</h3>
                  <ul>
                    {selectedCategory.newReleases.map((book, index) => (
                      <li key={index}>
                        <FiChevronRight size={14} /> {book}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <motion.button
                className="explore-buttoncat"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  // Use bookmarkable query params so the filter can be shared/bookmarked.
                  if (selectedCategory && selectedCategory.id) {
                    const cid = encodeURIComponent(selectedCategory.id);
                    const cname = encodeURIComponent(selectedCategory.name || '');
                    navigate(`/BookManagement?category=${cid}&categoryName=${cname}`);
                  } else {
                    navigate('/BookManagement');
                  }
                  closeDetails();
                }}
              >
                Explore {selectedCategory.name} &rarr;
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};