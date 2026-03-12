import React from 'react';
import { 
  FaTimes, 
  FaFilter, 
  FaUndo,
  FaStar 
} from 'react-icons/fa';

export const FiltersModal = ({
  setShowFilters,
  activeFilterTab,
  setActiveFilterTab,
  filters,
  setFilters,
  categories,
  brands
}) => {
  return (
    <div className="modal-overlay" onClick={() => setShowFilters(false)}>
      <div className="filters-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Filter Products</h2>
          <button className="close-modal" onClick={() => setShowFilters(false)}>
            <FaTimes />
          </button>
        </div>
        
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${activeFilterTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveFilterTab('basic')}
          >
            Basic
          </button>
          <button 
            className={`filter-tab ${activeFilterTab === 'advanced' ? 'active' : ''}`}
            onClick={() => setActiveFilterTab('advanced')}
          >
            Advanced
          </button>
          <button 
            className={`filter-tab ${activeFilterTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveFilterTab('saved')}
          >
            Saved
          </button>
        </div>
        
        <div className="filter-content">
          {activeFilterTab === 'basic' ? (
            <>
              <div className="filter-group">
                <label>Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}</label>
                <div className="range-sliders">
                  <input 
                    type="range" 
                    min="0" 
                    max="1000" 
                    value={filters.priceRange[0]}
                    onChange={e => setFilters(prev => ({
                      ...prev,
                      priceRange: [parseInt(e.target.value), prev.priceRange[1]]
                    }))}
                  />
                  <input 
                    type="range" 
                    min="0" 
                    max="1000" 
                    value={filters.priceRange[1]}
                    onChange={e => setFilters(prev => ({
                      ...prev,
                      priceRange: [prev.priceRange[0], parseInt(e.target.value)]
                    }))}
                  />
                </div>
              </div>
              
              <div className="filter-group">
                <label>Categories</label>
                <div className="checkbox-group">
                  {categories.map(category => (
                    <label key={category.id} className="checkbox-label">
                      <input 
                        type="checkbox" 
                        name="categories"
                        value={category.id}
                        checked={filters.categories.includes(category.id)}
                        onChange={e => {
                          const { categories } = filters;
                          if (e.target.checked) {
                            setFilters(prev => ({
                              ...prev,
                              categories: [...categories, category.id]
                            }));
                          } else {
                            setFilters(prev => ({
                              ...prev,
                              categories: categories.filter(c => c !== category.id)
                            }));
                          }
                        }}
                      />
                      <span className="checkmark"></span>
                      <span className="label-text">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="filter-group">
                <label>Brands</label>
                <div className="checkbox-group">
                  {brands.map(brand => (
                    <label key={brand.id} className="checkbox-label">
                      <input 
                        type="checkbox" 
                        name="brands"
                        value={brand.id}
                        checked={filters.brands.includes(brand.id)}
                        onChange={e => {
                          const { brands } = filters;
                          if (e.target.checked) {
                            setFilters(prev => ({
                              ...prev,
                              brands: [...brands, brand.id]
                            }));
                          } else {
                            setFilters(prev => ({
                              ...prev,
                              brands: brands.filter(b => b !== brand.id)
                            }));
                          }
                        }}
                      />
                      <span className="checkmark"></span>
                      <span className="label-text">{brand.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="filter-group">
                <label>Customer Ratings</label>
                <div className="rating-filters">
                  {[4, 3, 2, 1].map(rating => (
                    <label key={rating} className="rating-filter">
                      <input 
                        type="checkbox" 
                        name="ratings"
                        value={rating}
                        checked={filters.ratings.includes(rating)}
                        onChange={e => {
                          const { ratings } = filters;
                          if (e.target.checked) {
                            setFilters(prev => ({
                              ...prev,
                              ratings: [...ratings, rating]
                            }));
                          } else {
                            setFilters(prev => ({
                              ...prev,
                              ratings: ratings.filter(r => r !== rating)
                            }));
                          }
                        }}
                      />
                      <div className="stars">
                        {[...Array(5)].map((_, i) => (
                          <FaStar 
                            key={i} 
                            className={i < rating ? 'filled' : 'empty'}
                          />
                        ))}
                      </div>
                      <span>& Up</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          ) : activeFilterTab === 'advanced' ? (
            <>
              <div className="filter-group">
                <label>Shipping Options</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input 
                      type="radio" 
                      name="shipping"
                      value="any"
                      checked={filters.shipping === 'any'}
                      onChange={() => setFilters(prev => ({ ...prev, shipping: 'any' }))}
                    />
                    <span className="radiomark"></span>
                    <span className="label-text">Any Shipping</span>
                  </label>
                  <label className="radio-label">
                    <input 
                      type="radio" 
                      name="shipping"
                      value="free"
                      checked={filters.shipping === 'free'}
                      onChange={() => setFilters(prev => ({ ...prev, shipping: 'free' }))}
                    />
                    <span className="radiomark"></span>
                    <span className="label-text">Free Shipping</span>
                  </label>
                  <label className="radio-label">
                    <input 
                      type="radio" 
                      name="shipping"
                      value="fast"
                      checked={filters.shipping === 'fast'}
                      onChange={() => setFilters(prev => ({ ...prev, shipping: 'fast' }))}
                    />
                    <span className="radiomark"></span>
                    <span className="label-text">Fast Delivery (1-2 days)</span>
                  </label>
                </div>
              </div>
              
              <div className="filter-group">
                <label>Availability</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input 
                      type="radio" 
                      name="availability"
                      value="in-stock"
                      checked={filters.availability === 'in-stock'}
                      onChange={() => setFilters(prev => ({ ...prev, availability: 'in-stock' }))}
                    />
                    <span className="radiomark"></span>
                    <span className="label-text">In Stock Only</span>
                  </label>
                  <label className="radio-label">
                    <input 
                      type="radio" 
                      name="availability"
                      value="all"
                      checked={filters.availability === 'all'}
                      onChange={() => setFilters(prev => ({ ...prev, availability: 'all' }))}
                    />
                    <span className="radiomark"></span>
                    <span className="label-text">Include Out of Stock</span>
                  </label>
                </div>
              </div>
              
              <div className="filter-group">
                <label>
                  <input 
                    type="checkbox" 
                    name="deals"
                    checked={filters.deals}
                    onChange={e => setFilters(prev => ({ ...prev, deals: e.target.checked }))}
                  />
                  <span className="checkmark"></span>
                  <span className="label-text">On Sale Only</span>
                </label>
              </div>
              
              <div className="filter-group">
                <label>Sellers</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      name="verifiedSellers"
                      checked={filters.sellers.includes('verified')}
                      onChange={e => {
                        const { sellers } = filters;
                        if (e.target.checked) {
                          setFilters(prev => ({
                            ...prev,
                            sellers: [...sellers, 'verified']
                          }));
                        } else {
                          setFilters(prev => ({
                            ...prev,
                            sellers: sellers.filter(s => s !== 'verified')
                          }));
                        }
                      }}
                    />
                    <span className="checkmark"></span>
                    <span className="label-text">Verified Sellers Only</span>
                  </label>
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      name="premiumSellers"
                      checked={filters.sellers.includes('premium')}
                      onChange={e => {
                        const { sellers } = filters;
                        if (e.target.checked) {
                          setFilters(prev => ({
                            ...prev,
                            sellers: [...sellers, 'premium']
                          }));
                        } else {
                          setFilters(prev => ({
                            ...prev,
                            sellers: sellers.filter(s => s !== 'premium')
                          }));
                        }
                      }}
                    />
                    <span className="checkmark"></span>
                    <span className="label-text">Premium Sellers Only</span>
                  </label>
                </div>
              </div>
            </>
          ) : (
            <div className="saved-filters">
              <p>You don't have any saved filters yet.</p>
              <button className="save-current-filter">
                Save Current Filter
              </button>
            </div>
          )}
        </div>
        
        <div className="modal-actions">
          <button 
            className="reset-button"
            onClick={() => setFilters({
              priceRange: [0, 1000],
              categories: [],
              brands: [],
              ratings: [],
              shipping: 'any',
              sellers: [],
              availability: 'in-stock',
              deals: false
            })}
          >
            <FaUndo /> Reset All
          </button>
          <button 
            className="apply-button"
            onClick={() => setShowFilters(false)}
          >
            Show Results
          </button>
        </div>
      </div>
    </div>
  );
};