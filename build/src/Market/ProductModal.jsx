import React from 'react';
import { FaStar, FaHeart, FaTimes, FaCheckCircle, FaTruck, FaPlus, FaMinus } from 'react-icons/fa';

export const ProductModal = ({
  product,
  setShowProductModal,
  profile,
  handleAddToWishlist,
  handleAddToCart
}) => {
  return (
    <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
      <div className="product-modal" onClick={e => e.stopPropagation()}>
        <div className="product-images">
          <div className="main-image">
            <img src={product.images[0]} alt={product.title} />
            <button className="image-zoom">
              {/* Zoom icon */}
            </button>
          </div>
          <div className="thumbnail-images">
            {product.images.map((image, index) => (
              <div key={index} className="thumbnail-container">
                <img src={image} alt={`Thumbnail ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>
        
        <div className="product-details">
          <div className="product-header">
            <h2>{product.title}</h2>
            <button 
              className="close-product"
              onClick={() => setShowProductModal(false)}
            >
              <FaTimes />
            </button>
          </div>
          
          <div className="price-section">
            {product.discount > 0 && (
              <span className="original-price">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
            <span className="current-price">
              ${product.price.toFixed(2)}
            </span>
            {product.discount > 0 && (
              <span className="discount-badge">
                {product.discount}% OFF
              </span>
            )}
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
            <span className="review-count">
              ({product.reviews.toLocaleString()} reviews)
            </span>
            <span className="separator">|</span>
            <span className="sold-count">
              {Math.floor(product.reviews * 10).toLocaleString()}+ sold
            </span>
          </div>
          
          <div className="stock-status">
            {product.stock > 0 ? (
              <span className="in-stock">
                <FaCheckCircle /> In Stock ({product.stock} available)
              </span>
            ) : (
              <span className="out-of-stock">
                <FaTimes /> Out of Stock
              </span>
            )}
          </div>
          
          <div className="seller-info">
            <span>Sold by: </span>
            <span className="seller-name">
              {product.seller.name}
            </span>
            {product.seller.verified && (
              <span className="verified-badge">
                <FaCheckCircle /> Verified
              </span>
            )}
            <span className="seller-rating">
              {product.seller.rating} ★
            </span>
            <button className="visit-store">
              Visit Store
            </button>
          </div>
          
          <div className="shipping-info">
            <FaTruck />
            {product.shipping.free ? (
              <span>Free Shipping</span>
            ) : (
              <span>Shipping: $5.99</span>
            )}
            <span> | Delivery: {product.shipping.deliveryTime}</span>
            <span> | Returns: {product.shipping.returnPolicy}</span>
          </div>
          
          {product.variations.length > 0 && (
            <div className="variations-section">
              <h4>Options:</h4>
              {product.variations.map(variation => (
                <div key={variation.id} className="variation-option">
                  <input 
                    type="radio" 
                    id={variation.id}
                    name="product-variation"
                    defaultChecked={variation.id === product.variations[0].id}
                  />
                  <label htmlFor={variation.id}>
                    {variation.value} 
                    {variation.price !== product.price && (
                      <span className="variation-price"> (+${(variation.price - product.price).toFixed(2)})</span>
                    )}
                    {variation.stock <= 5 && variation.stock > 0 && (
                      <span className="low-stock"> (Only {variation.stock} left!)</span>
                    )}
                  </label>
                </div>
              ))}
            </div>
          )}
          
          <div className="product-actions">
            <div className="quantity-selector">
              <button 
                className="quantity-btn minus"
                disabled={false}
              >
                <FaMinus />
              </button>
              <span className="quantity-value">1</span>
              <button 
                className="quantity-btn plus"
                disabled={false}
              >
                <FaPlus />
              </button>
            </div>
            
            <button 
              className="wishlist-button"
              onClick={() => handleAddToWishlist(product.id)}
            >
              <FaHeart className={profile.wishlist.includes(product.id) ? 'filled' : ''} /> 
              {profile.wishlist.includes(product.id) ? 
                'Saved' : 'Save'}
            </button>
            <button 
              className="add-to-cart-button"
              onClick={() => handleAddToCart(
                product.id,
                product.variations[0]?.id
              )}
              disabled={product.stock <= 0}
            >
              Add to Cart
            </button>
          </div>
          
          <div className="product-tabs">
            <button className="product-tab active">Details</button>
            <button className="product-tab">Specs</button>
            <button className="product-tab">Reviews</button>
            <button className="product-tab">Q&A</button>
            <button className="product-tab">Shipping</button>
          </div>
          
          <div className="product-description">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>
          
          <div className="product-features">
            <h3>Key Features</h3>
            <ul>
              {Object.entries(product.specs).slice(0, 4).map(([key, value]) => (
                <li key={key}>
                  <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {value}
                </li>
              ))}
            </ul>
          </div>
          
          {product.questions.length > 0 && (
            <div className="product-questions">
              <h3>Customer Questions ({product.questions.length})</h3>
              {product.questions.slice(0, 2).map(question => (
                <div key={question.id} className="question-item">
                  <div className="question">
                    <strong>Q: {question.question}</strong>
                    <span className="question-meta">Asked by {question.user} on {question.date}</span>
                  </div>
                  <div className="answer">
                    <strong>A:</strong> {question.answer}
                  </div>
                </div>
              ))}
              <button className="view-all-questions">
                View all {product.questions.length} questions
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

