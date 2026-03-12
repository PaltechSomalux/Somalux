import React, { useState, useEffect } from 'react';


export const Market = () => {
  // State management
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);

  // Platform data state
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [messages, setMessages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [marketingCampaigns, setMarketingCampaigns] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [wholesaleDeals, setWholesaleDeals] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  // Current user state
  const [currentUser, setCurrentUser] = useState({
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'buyer', // 'buyer', 'seller', or 'admin'
    avatar: '👤',
    balance: 1000,
    savedAddresses: [],
    paymentMethods: []
  });

  // Responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileDrawerVisible(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mock data initialization
  useEffect(() => {
    // Initialize with sample data
    setProducts([
      { 
        id: 1, 
        name: 'Wireless Headphones', 
        description: 'Premium noise-cancelling wireless headphones',
        price: 199.99,
        discountPrice: 179.99,
        category: 'Electronics',
        sellerId: 1,
        stock: 42,
        rating: 4.7,
        reviewCount: 128,
        images: ['headphones1.jpg', 'headphones2.jpg'],
        variants: [
          { color: 'black', size: null },
          { color: 'white', size: null }
        ],
        shippingOptions: ['standard', 'express'],
        returnPolicy: '30-day return',
        createdAt: '2023-01-15'
      },
      // ... more products
    ]);
    
    setSellers([
      {
        id: 1,
        name: 'TechGadgets Inc.',
        rating: 4.8,
        productCount: 56,
        joinedDate: '2022-03-10',
        description: 'Leading provider of electronic gadgets',
        logo: 'techgadgets-logo.jpg',
        policies: {
          shipping: 'Free shipping on orders over $50',
          returns: '30-day money back guarantee'
        }
      }
      // ... more sellers
    ]);
    
    // Initialize other data similarly
    setOrders([/* ... */]);
    setCart([/* ... */]);
    setMessages([/* ... */]);
    setReviews([/* ... */]);
    setShippingOptions([/* ... */]);
    setMarketingCampaigns([/* ... */]);
    setAuctions([/* ... */]);
    setWholesaleDeals([/* ... */]);
    setSubscriptions([/* ... */]);
  }, []);

  // Menu items based on user role
  const getMenuItems = () => {
    const baseItems = [
      { key: 'products', icon: '🛍️', label: 'Products', roles: ['buyer', 'seller', 'admin'] },
      { key: 'cart', icon: '🛒', label: 'Cart', roles: ['buyer'] },
      { key: 'orders', icon: '📦', label: 'Orders', roles: ['buyer', 'seller', 'admin'] },
      { key: 'messages', icon: '✉️', label: 'Messages', roles: ['buyer', 'seller', 'admin'] },
      { key: 'reviews', icon: '⭐', label: 'Reviews', roles: ['buyer', 'seller', 'admin'] },
    ];

    const sellerItems = [
      { key: 'seller', icon: '🏪', label: 'Seller Dashboard', roles: ['seller', 'admin'] },
      { key: 'shipping', icon: '🚚', label: 'Shipping', roles: ['seller', 'admin'] },
      { key: 'marketing', icon: '📢', label: 'Marketing', roles: ['seller', 'admin'] },
    ];

    const adminItems = [
      { key: 'admin', icon: '🔒', label: 'Admin Panel', roles: ['admin'] },
      { key: 'users', icon: '👥', label: 'User Management', roles: ['admin'] },
      { key: 'analytics', icon: '📊', label: 'Analytics', roles: ['admin'] },
    ];

    const specialFeatures = [
      { key: 'auctions', icon: '⏳', label: 'Auctions', roles: ['buyer', 'seller', 'admin'] },
      { key: 'wholesale', icon: '📦', label: 'Wholesale', roles: ['buyer', 'seller', 'admin'] },
      { key: 'subscriptions', icon: '🔄', label: 'Subscriptions', roles: ['buyer', 'seller', 'admin'] },
    ];

    return [
      ...baseItems,
      ...(currentUser.role === 'buyer' ? [] : sellerItems),
      ...(currentUser.role === 'admin' ? adminItems : []),
      ...specialFeatures
    ].filter(item => item.roles.includes(currentUser.role));
  };

  const menuItems = getMenuItems();

  // Mobile navigation items (simplified)
  const mobileNavItems = [
    { key: 'products', icon: '🛍️', label: 'Shop' },
    { key: 'cart', icon: '🛒', label: 'Cart' },
    { key: 'orders', icon: '📦', label: 'Orders' },
    { key: 'messages', icon: '✉️', label: 'Inbox' },
    { key: 'more', icon: '⋮', label: 'More' },
  ];

  // Render the appropriate component based on active tab
  const renderActiveComponent = () => {
    switch(activeTab) { 
      case 'products':
        return <ProductCatalog 
          products={products} 
          sellers={sellers}
          onAddToCart={(product) => setCart([...cart, product])}
        />;
      case 'seller':
        return <SellerDashboard 
          products={products}
          orders={orders.filter(o => o.sellerId === currentUser.id)}
        
        />;
      case 'cart':
        return <ShoppingCart 
          cart={cart}
          onUpdateCart={setCart}
          shippingOptions={shippingOptions}
        />;
      case 'orders':
        return <OrderManagement 
          orders={orders}
          userRole={currentUser.role}
          userId={currentUser.id}
        />;
      case 'messages':
        return <MessagingSystem 
          messages={messages}
          currentUser={currentUser}
        />;
      case 'reviews':
        return <ReviewSystem 
          reviews={reviews}
          userId={currentUser.id}
          userRole={currentUser.role}
        />;
      case 'shipping':
        return <ShippingManagement 
          options={shippingOptions}
          setOptions={setShippingOptions}
        />;
      case 'marketing':
        return <MarketingTools 
          campaigns={marketingCampaigns}
          setCampaigns={setMarketingCampaigns}
        />;
      case 'admin':
        return <AdminPanel 
          users={users}
          products={products}
          orders={orders}
        />;
      case 'users':
        return <UserManagement 
          users={users}
          setUsers={setUsers}
        />;
      case 'analytics':
        return <AnalyticsDashboard 
          products={products}
          orders={orders}
          users={users}
        />;
      case 'auctions':
        return <AuctionSystem 
          auctions={auctions}
          setAuctions={setAuctions}
        />;
      case 'wholesale':
        return <WholesalePortal 
          deals={wholesaleDeals}
          setDeals={setWholesaleDeals}
        />;
      case 'subscriptions':
        return <SubscriptionManagement 
          subscriptions={subscriptions}
          setSubscriptions={setSubscriptions}
        />;
      default:
        return <div>Select a feature from the menu</div>;
    }
  };

  return (
    <div className="market-platform">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
          <div className="logo">
            {collapsed ? 'MP' : 'MarketPlace'}
            <button 
              className="collapse-btn"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? '»' : '«'}
            </button>
          </div>
          <div className="menu">
            {menuItems.map(item => (
              <div 
                key={item.key}
                className={`menu-item ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => setActiveTab(item.key)}
              >
                <span className="menu-icon">{item.icon}</span>
                {!collapsed && <span className="menu-label">{item.label}</span>}
              </div>
            ))}
          </div>
          <div className="sidebar-footer">
            {!collapsed && (
              <div className="user-info">
                <div className="user-avatar">{currentUser.avatar}</div>
                <div className="user-details">
                  <div className="user-name">{currentUser.name}</div>
                  <div className="user-email">{currentUser.email}</div>
                  <div className="user-balance">${currentUser.balance.toFixed(2)}</div>
                </div>
              </div>
            )}
            <button 
              className="logout-btn"
              title={collapsed ? 'Logout' : ''}
              onClick={() => setActiveTab('logout')}
            >
              {collapsed ? '🚪' : 'Log Out'}
            </button>
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {isMobile && mobileDrawerVisible && (
        <div className="mobile-drawer">
          <div className="drawer-content">
            <div className="logo">
              MarketPlace
              <button 
                className="close-drawer"
                onClick={() => setMobileDrawerVisible(false)}
              >
                ×
              </button>
            </div>
            <div className="menu">
              {menuItems.map(item => (
                <div 
                  key={item.key}
                  className={`menu-item ${activeTab === item.key ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(item.key);
                    setMobileDrawerVisible(false);
                  }}
                >
                  <span className="menu-icon">{item.icon}</span>
                  <span className="menu-label">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="drawer-footer">
              <div className="user-info">
                <div className="user-avatar">{currentUser.avatar}</div>
                <div className="user-details">
                  <div className="user-name">{currentUser.name}</div>
                  <div className="user-email">{currentUser.email}</div>
                </div>
              </div>
              <button 
                className="logout-btn"
                onClick={() => {
                  setActiveTab('logout');
                  setMobileDrawerVisible(false);
                }}
              >
                Log Out
              </button>
            </div>
          </div>
          <div 
            className="drawer-overlay" 
            onClick={() => setMobileDrawerVisible(false)}
          ></div>
        </div>
      )}

      {/* Main Content Area */}
      <div 
        className="main-content" 
        style={{ 
          marginLeft: !isMobile && collapsed ? '80px' : !isMobile ? '250px' : '0',
          paddingBottom: isMobile ? '80px' : '20px'
        }}
      >
        <header className="app-header">
          <div className="header-left">
            {isMobile && (
              <button 
                className="menu-toggle"
                onClick={() => setMobileDrawerVisible(true)}
              >
                ☰ 
              </button>
            )}
            <h2>Welcome to MarketPlace</h2>
          </div>
          <div className="header-right">
            <div className="cart-preview">
              🛒 {cart.length} items
            </div>
            <div className="notification-bell">
              🔔
              <span className="notification-count">3</span>
            </div>
          </div>
        </header>

        <main className="content-area">
          <div className="content-card">
            {renderActiveComponent()}
          </div>
        </main>
        
        {/* Mobile bottom navigation */}
        {isMobile && (
          <div className="mobile-bottom-nav">
            {mobileNavItems.map(item => (
              <div 
                key={item.key}
                className={`mobile-nav-item ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => {
                  if (item.key === 'more') {
                    setMobileDrawerVisible(true);
                  } else {
                    setActiveTab(item.key);
                  }
                }}
              >
                <span className="mobile-nav-icon">{item.icon}</span>
                <span className="mobile-nav-label">{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};