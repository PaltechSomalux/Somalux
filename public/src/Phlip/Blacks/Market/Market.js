import React, { useState } from 'react';
import './Market.css';
import { FABMarket } from './FABMarket'; // Adjust path as needed

const ProductGrid = ({ searchQuery }) => {
  const products = [...Array(12)].map((_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    price: `$${(Math.random() * 100).toFixed(2)}`,
  }));

  const filtered = searchQuery
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : products;

  if (filtered.length === 0) {
    return <p className="no-results-mkt">No products found for "{searchQuery}"</p>;
  }

  return (
    <div className="product-grid-mkt">
      {filtered.map(p => (
        <div key={p.id} className="product-card-mkt">
          <div className="product-image-mkt placeholder-mkt"></div>
          <div className="product-info-mkt">
            <h4>{p.name}</h4>
            <p className="price-mkt">{p.price}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export const Market = () => {
  const [activeTab, setActiveTab] = useState('me');
  const [searchQuery, setSearchQuery] = useState('');
  const [showGridMenu, setShowGridMenu] = useState(false);

  const mainTabs = [
    { id: 'me', label: 'Me' },
    { id: 'for-you', label: 'For you' }, // ← Changed from "All" to "For you"
    { id: 'clothing', label: 'Clothing' },
    { id: 'electronics', label: 'Electronics' },
    { id: 'beverages', label: 'Beverages' },
    { id: 'footwear', label: 'Footwear' },
    { id: 'beauty', label: 'Beauty' },
    { id: 'pharmacy', label: 'Pharmacy' },
    { id: 'automotive', label: 'Automotive' },
  ];

  const extendedCategories = [
    { id: 'furniture', label: 'Furniture' },
    { id: 'books', label: 'Books' },
    { id: 'office', label: 'Office Supplies' },
    { id: 'sports', label: 'Sports & Fitness' },
    { id: 'toys', label: 'Toys & Games' },
    { id: 'jewelry', label: 'Jewelry' },
    { id: 'groceries', label: 'Groceries' },
    { id: 'pets', label: 'Pet Supplies' },
    { id: 'tools', label: 'Tools & Hardware' },
  ];

  const allCategories = [...mainTabs.slice(2), ...extendedCategories]; // ← Updated to slice from index 2 to exclude 'me' and 'for-you'

  const getCategoryLabel = id => {
    if (id === 'me') return 'Me';
    if (id === 'for-you') return 'For you'; // ← Matches new label
    const cat = allCategories.find(c => c.id === id);
    return cat ? cat.label : 'Products';
  };

  // Fixed 3x3 Dots Icon (Chrome-style, proper size)
  const DotsGridIcon = () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <circle cx="5" cy="5" r="2" />
      <circle cx="12" cy="5" r="2" />
      <circle cx="19" cy="5" r="2" />
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="12" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
    </svg>
  );

  // Placeholder handlers for FAB actions
  const handlePollCreate = (options, description) => {
    console.log('Creating poll:', { options, description });
    // Add actual poll creation logic here
  };

  const handleTextCreate = (textContent, media) => {
    console.log('Creating text post:', { textContent, media });
    // Add actual text creation logic here
  };

  const handleMediaCreate = (mediaFiles, textContent, modalType, fileContents) => {
    console.log('Creating media post:', { mediaFiles, textContent, modalType, fileContents });
    // Add actual media creation logic here
  };

  return (
    <div className="market-mkt">
      {/* Header */}
      <div className="market-header-mkt">
        <div className="search-container-mkt">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="search-input-mkt"
          />
        </div>

        <button
          className="grid-menu-btn-mkt"
          onClick={() => setShowGridMenu(!showGridMenu)}
          aria-label="More categories"
        >
          <DotsGridIcon />
        </button>

        {showGridMenu && (
          <div className="grid-menu-dropdown-mkt">
            <div className="grid-menu-mkt">
              {extendedCategories.map(cat => (
                <button
                  key={cat.id}
                  className="grid-menu-item-mkt"
                  onClick={() => {
                    setActiveTab(cat.id);
                    setShowGridMenu(false);
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs-container-mkt">
        <div className="tabs-scrollable-mkt">
          {mainTabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button-mkt ${activeTab === tab.id ? 'active-mkt' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="content-area-mkt">
        <div className="tab-content-mkt">
          <h2>{getCategoryLabel(activeTab)}</h2>
          {searchQuery && (
            <p className="search-results-mkt">
              {activeTab === 'for-you'
                ? `Searching all products for "${searchQuery}"`
                : `Results in ${getCategoryLabel(activeTab)}`}
            </p>
          )}
          <ProductGrid searchQuery={searchQuery} />
        </div>
      </div>

      {showGridMenu && <div className="overlay-mkt" onClick={() => setShowGridMenu(false)} />}

      {/* Floating Action Button - Visible only when 'me' tab is active */}
      {activeTab === 'me' && (
        <FABMarket
          onPollCreate={handlePollCreate}
          onTextCreate={handleTextCreate}
          onMediaCreate={handleMediaCreate}
          isChatSelected={false}
          isFullscreen={false}
        />
      )}
    </div>
  );
};