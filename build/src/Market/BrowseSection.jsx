import React from 'react';
import { FaBoxOpen, FaHeart, FaStar, FaFilter, FaSearch } from 'react-icons/fa';
import './BrowseSection.css';
export const BrowseSection = ({
  selectedCategory,
  setSelectedCategory,
  categories,
  filteredProducts,
  products,
  profile,
  handleAddToWishlist,
  handleAddToCart,
  setCurrentProductIndex,
  setShowProductModal
}) => {
  return (
    <div className="browse-section">
      {!selectedCategory && (
        <div className="category-carousel">
          {categories.map(category => (
            <div 
              key={category.id} 
              className="category-card"
              onClick={() => setSelectedCategory(category.id)}
            >
              <div className="category-icon">
                {category.icon}
              </div>
              <span>{category.name}</span>
            </div>
          ))}
        </div>
      )}
      
      {selectedCategory && (
        <div className="category-header">
          <button 
            className="back-button"
            onClick={() => setSelectedCategory(null)}
          >
            All Categories
          </button>
          <h2>{categories.find(c => c.id === selectedCategory)?.name}</h2>
        </div>
      )}
      
      <div className="products-header">
        <h2 className="section-title">
          {selectedCategory 
            ? `${categories.find(c => c.id === selectedCategory)?.name} Products` 
            : 'Featured Products'}
        </h2>
        <div className="sort-options">
          <label>Sort by:</label>
          <select>
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rating</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="newest">Newest Arrivals</option>
            <option value="discount">Biggest Discounts</option>
          </select>
        </div>
      </div>
      
      <div className="products-grid">
        {filteredProducts.map((product, index) => (
          <div 
            key={product.id} 
            className="product-card"
            onClick={() => {
              setCurrentProductIndex(index);
              setShowProductModal(true);
            }}
          >
            <div className="product-image">
              <img src={product.images[0]} alt={product.title} />
              {product.discount > 0 && (
                <span className="discount-badge">
                  {product.discount}% OFF
                </span>
              )}
              <button 
                className="wishlist-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToWishlist(product.id);
                }}
              >
                <FaHeart className={profile.wishlist.includes(product.id) ? 'filled' : ''} />
              </button>
            </div>
            <div className="product-info">
              <h3>{product.title}</h3>
              <div className="price-section">
                {product.discount > 0 && (
                  <span className="original-price">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                )}
                <span className="current-price">
                  ${product.price.toFixed(2)}
                </span>
              </div>
              <div className="rating-section">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <FaStar 
                      key={i} 
                      className={i < Math.floor(product.rating) ? 'filled' : 'empty'}
                    />
                  ))}
                </div>
                <span>({product.reviews.toLocaleString()})</span>
              </div>
              <button 
                className="add-to-cart"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(product.id);
                }}
                disabled={product.stock <= 0}
              >
                {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        ))}
        
        {filteredProducts.length === 0 && (
          <div className="no-products">
            <FaBoxOpen size={48} />
            <p>No products found in this category</p>
            <button 
              className="browse-all"
              onClick={() => setSelectedCategory(null)}
            >
              Browse All Products
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

