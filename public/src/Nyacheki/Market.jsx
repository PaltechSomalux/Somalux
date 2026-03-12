import React, { useState, useEffect, useRef } from 'react';
import { 
  FaHome, FaSearch, FaHeart, FaComment, FaUser, FaCog, FaCheckCircle,
  FaStar, FaPaperPlane, FaMicrophone, FaVideo, FaCamera, FaTimes,
  FaFilter, FaBell, FaMapMarkerAlt, FaLock, FaQuestionCircle, FaSignOutAlt,
  FaShoppingCart, FaStore, FaMoneyBillWave, FaTruck, FaCreditCard, 
  FaGift, FaTag, FaPercent, FaHistory, FaList, FaBoxOpen,
  FaEllipsisH, FaUndo, FaExchangeAlt, FaShieldAlt, FaHeadset,
  FaRegCompass, FaRegClock, FaRegSun, FaRegMoon, FaRegSnowflake,
  FaLeaf, FaRegHeart, FaRegStar, FaRegSmile, FaRegLaughSquint,
  FaRegAngry, FaRegSadTear, FaRegSurprise, FaRegMeh, FaBarcode,
  FaChartLine, FaWarehouse, FaClipboardList, FaUserTie, FaQrcode,
  FaPlus, FaMinus, FaTrash, FaEdit, FaChevronDown, FaChevronUp,
  FaExclamationTriangle, FaShieldVirus, FaBolt, FaCrown, FaCoins,
  FaGem, FaAward, FaRocket, FaHandshake, FaChartBar, FaReceipt,
  FaBoxes, FaShippingFast, FaMoneyCheckAlt, FaHandHoldingUsd,
  FaFileInvoiceDollar, FaTags, FaPercentage, FaCalendarAlt,
  FaClock, FaUserShield, FaUserCheck, FaUserClock, FaUserEdit,
  FaUserPlus, FaUserMinus, FaUserCog, FaUserMd, FaUserGraduate,
  FaUserFriends, FaUserAstronaut, FaUserNinja, FaUserSecret
} from 'react-icons/fa';
import {Header} from './Header';
import {FiltersModal} from './FiltersModal';
import {ProductModal} from './ProductModal';
import {CartModal} from './CartModal';
import {AddressFormModal} from './AddressFormModal';
import {PaymentFormModal} from './PaymentFormModal';
import {ReviewModal} from './ReviewModal';
import {SellerVerificationModal} from './SellerVerificationModal';
import {NewProductFormModal} from './NewProductFormModal';
import {OrderDetailsModal} from './OrderDetailsModal';
import {PremiumModal} from './PremiumModal';
import {MainContent} from './MainContent';
import {BottomNav} from './BottomNav';
import {SideMenu} from './SideMenu';
import "./Market.css";


export const Market = () => {
  // App state
  const [activeTab, setActiveTab] = useState('browse');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [incognitoMode, setIncognitoMode] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activeFilterTab, setActiveFilterTab] = useState('basic');
  const [activeProfileTab, setActiveProfileTab] = useState('dashboard');
  const [activeOrderTab, setActiveOrderTab] = useState('all');
  const [activeChatTab, setActiveChatTab] = useState('chat');
  const [messageReactions, setMessageReactions] = useState({});
  const [activeMessageMenu, setActiveMessageMenu] = useState(null);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponSelection, setCouponSelection] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA',
    default: false
  });
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: 'credit_card',
    cardNumber: '',
    expiry: '',
    cvv: '',
    name: '',
    default: false
  });
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: '',
    price: '',
    description: '',
    category: '',
    stock: '',
    images: []
  });
  const [imageUploading, setImageUploading] = useState(false);
  const [selectedProductForReview, setSelectedProductForReview] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    title: '',
    comment: '',
    anonymous: false
  });
  const [showOrderDetails, setShowOrderDetails] = useState(null);
  const [showSellerVerification, setShowSellerVerification] = useState(false);
  const [verificationData, setVerificationData] = useState({
    businessName: '',
    taxId: '',
    document: null
  });
  
  // Refs
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const documentInputRef = useRef(null);
  
  // User data
  const [profile, setProfile] = useState({
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    phone: '+1 (555) 123-4567',
    address: {
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zip: '94105',
      country: 'USA'
    },
    verified: false,
    seller: false,
    premium: false,
    paymentMethods: [
      {
        id: '1',
        type: 'credit_card',
        last4: '4242',
        brand: 'visa',
        expiry: '12/25',
        default: true
      },
      {
        id: '2',
        type: 'paypal',
        email: 'alex.johnson@example.com',
        default: false
      }
    ],
    shippingAddresses: [
      {
        id: '1',
        name: 'Home',
        street: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zip: '94105',
        country: 'USA',
        default: true
      },
      {
        id: '2',
        name: 'Work',
        street: '456 Market St',
        city: 'San Francisco',
        state: 'CA',
        zip: '94103',
        country: 'USA',
        default: false
      }
    ],
    wishlist: ['101', '205'],
    recentlyViewed: ['101', '205', '307'],
    preferences: {
      notifications: true,
      newsletter: true,
      darkMode: false,
      language: 'en',
      currency: 'USD'
    },
    businessInfo: {
      name: '',
      taxId: '',
      bankAccount: '',
      warehouseLocation: ''
    },
    stats: {
      totalOrders: 15,
      totalSpent: 1250.75,
      memberSince: '2022-01-15'
    }
  });

  // Marketplace data
  const [products, setProducts] = useState([
    // ... (same product data as before)
  ]);
  
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [filters, setFilters] = useState({
    priceRange: [0, 1000],
    categories: [],
    brands: [],
    ratings: [],
    shipping: 'any',
    sellers: [],
    availability: 'in-stock',
    deals: false
  });

  // Cart and orders
  const [cart, setCart] = useState([
    // ... (same cart data as before)
  ]);

  const [orders, setOrders] = useState([
    // ... (same orders data as before)
  ]);

  // Messages and notifications
  const [notifications, setNotifications] = useState([
    // ... (same notifications data as before)
  ]);

  const [messages, setMessages] = useState({
    // ... (same messages data as before)
  });
  
  const [activeChat, setActiveChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [typing, setTyping] = useState(false);
  const [messageMenuPosition, setMessageMenuPosition] = useState({ x: 0, y: 0 });
  const [activeMessageForReaction, setActiveMessageForReaction] = useState(null);

  // Seller dashboard data
  const [sellerStats, setSellerStats] = useState({
    // ... (same seller stats data as before)
  });

  const [sellerProducts, setSellerProducts] = useState([
    // ... (same seller products data as before)
  ]);

  const [sellerOrders, setSellerOrders] = useState([
    // ... (same seller orders data as before)
  ]);

  // Categories
  const categories = [
    // ... (same categories data as before)
  ];

  // Brands
  const brands = [
    // ... (same brands data as before)
  ];

  // Coupons
  const coupons = [
    // ... (same coupons data as before)
  ];

  // Effects
  useEffect(() => {
    // Simulate loading user data
    const timer = setTimeout(() => {
      setUser({
        id: '123',
        name: 'Alex',
        email: 'alex.johnson@example.com',
        premium: false,
        location: {
          city: 'San Francisco',
          country: 'USA'
        },
        lastActive: new Date().toISOString(),
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
      });
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Scroll to bottom of messages when new message arrives
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChat]);

  useEffect(() => {
    // Simulate typing indicator timeout
    if (typing) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 3000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [typing]);

  useEffect(() => {
    // Apply dark mode class to body
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Handlers
  const handleAddToCart = (productId, variationId = null) => {
    // ... (same implementation as before)
  };

  const handleRemoveFromCart = (itemId) => {
    // ... (same implementation as before)
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    // ... (same implementation as before)
  };

  const handleCheckout = () => {
    setShowPaymentModal(true);
  };

  const handlePlaceOrder = (paymentMethodId, shippingAddressId) => {
    // ... (same implementation as before)
  };

  const handleAddPaymentMethod = (method) => {
    // ... (same implementation as before)
  };

  const handleAddShippingAddress = (address) => {
    // ... (same implementation as before)
  };

  const handleAddToWishlist = (productId) => {
    // ... (same implementation as before)
  };

  const handleSendMessage = () => {
    // ... (same implementation as before)
  };

  const handleTyping = () => {
    // ... (same implementation as before)
  };

  const handleApplyCoupon = (couponCode) => {
    // ... (same implementation as before)
  };

  const handleStartSelling = () => {
    setShowSellerVerification(true);
  };

  const handleCompleteSellerVerification = () => {
    // ... (same implementation as before)
  };

  const handleAddProduct = (product) => {
    // ... (same implementation as before)
  };

  const handleUpdateProduct = (productId, updates) => {
    // ... (same implementation as before)
  };

  const handleDarkModeToggle = () => {
    // ... (same implementation as before)
  };

  const handleIncognitoModeToggle = () => {
    // ... (same implementation as before)
  };

  const handleSubmitReview = () => {
    // ... (same implementation as before)
  };

  const handleMarkNotificationAsRead = (notificationId) => {
    // ... (same implementation as before)
  };

  const handleUploadImage = (e) => {
    // ... (same implementation as before)
  };

  const handleRemoveImage = (index) => {
    // ... (same implementation as before)
  };

  const handleUploadDocument = (e) => {
    // ... (same implementation as before)
  };

  const handleSearch = (e) => {
    // ... (same implementation as before)
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading your marketplace...</p>
      </div>
    );
  }

  // Calculate cart total
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = cart.length > 0 ? (couponSelection?.type === 'shipping' ? 0 : 5.99) : 0;
  const discount = couponSelection ? 
    couponSelection.type === 'percent' ? 
      Math.min(subtotal * (couponSelection.discount / 100), subtotal) :
      couponSelection.type === 'fixed' ?
        Math.min(couponSelection.discount, subtotal) :
        0 :
    0;
  const tax = subtotal * 0.08; // 8% tax for demo
  const total = subtotal + shipping + tax - discount;

  // Filter products based on selected category
  const filteredProducts = selectedCategory 
    ? products.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase())
    : products;

  return (
    <div className={`marketplace-app ${darkMode ? 'dark-mode' : ''}`}>
      <Header 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showSearchBar={showSearchBar}
        setShowSearchBar={setShowSearchBar}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        setShowFilters={setShowFilters}
        setShowPaymentModal={setShowPaymentModal}
        cart={cart}
        setMenuOpen={setMenuOpen}
      />

      {showFilters && (
        <FiltersModal 
          setShowFilters={setShowFilters}
          activeFilterTab={activeFilterTab}
          setActiveFilterTab={setActiveFilterTab}
          filters={filters}
          setFilters={setFilters}
          categories={categories}
          brands={brands}
        />
      )}

      {showProductModal && currentProductIndex < products.length && (
        <ProductModal 
          product={products[currentProductIndex]}
          setShowProductModal={setShowProductModal}
          profile={profile}
          handleAddToWishlist={handleAddToWishlist}
          handleAddToCart={handleAddToCart}
        />
      )}

      {showPaymentModal && (
        <CartModal 
          setShowPaymentModal={setShowPaymentModal}
          cart={cart}
          products={products}
          handleUpdateQuantity={handleUpdateQuantity}
          handleRemoveFromCart={handleRemoveFromCart}
          couponSelection={couponSelection}
          setCouponSelection={setCouponSelection}
          coupons={coupons}
          handleApplyCoupon={handleApplyCoupon}
          subtotal={subtotal}
          shipping={shipping}
          tax={tax}
          discount={discount}
          total={total}
          profile={profile}
          setShowAddressForm={setShowAddressForm}
          setShowPaymentForm={setShowPaymentForm}
          handlePlaceOrder={handlePlaceOrder}
          setActiveTab={setActiveTab}
        />
      )}

      {showAddressForm && (
        <AddressFormModal 
          setShowAddressForm={setShowAddressForm}
          newAddress={newAddress}
          setNewAddress={setNewAddress}
          handleAddShippingAddress={handleAddShippingAddress}
        />
      )}

      {showPaymentForm && (
        <PaymentFormModal 
          setShowPaymentForm={setShowPaymentForm}
          newPaymentMethod={newPaymentMethod}
          setNewPaymentMethod={setNewPaymentMethod}
          handleAddPaymentMethod={handleAddPaymentMethod}
        />
      )}

      {showReviewModal && selectedProductForReview && (
        <ReviewModal 
          product={products.find(p => p.id === selectedProductForReview)}
          setShowReviewModal={setShowReviewModal}
          setSelectedProductForReview={setSelectedProductForReview}
          reviewData={reviewData}
          setReviewData={setReviewData}
          handleSubmitReview={handleSubmitReview}
        />
      )}

      {showSellerVerification && (
        <SellerVerificationModal 
          setShowSellerVerification={setShowSellerVerification}
          verificationData={verificationData}
          setVerificationData={setVerificationData}
          documentInputRef={documentInputRef}
          handleUploadDocument={handleUploadDocument}
          handleCompleteSellerVerification={handleCompleteSellerVerification}
        />
      )}

      {showNewProductForm && (
        <NewProductFormModal 
          setShowNewProductForm={setShowNewProductForm}
          newProduct={newProduct}
          setNewProduct={setNewProduct}
          categories={categories}
          fileInputRef={fileInputRef}
          handleUploadImage={handleUploadImage}
          imageUploading={imageUploading}
          handleRemoveImage={handleRemoveImage}
          handleAddProduct={handleAddProduct}
        />
      )}

      {showOrderDetails && (
        <OrderDetailsModal 
          setShowOrderDetails={setShowOrderDetails}
          order={showOrderDetails}
          products={products}
          setSelectedProductForReview={setSelectedProductForReview}
          setShowReviewModal={setShowReviewModal}
        />
      )}

      {showPremiumModal && (
        <PremiumModal 
          setShowPremiumModal={setShowPremiumModal}
          profile={profile}
        />
      )}

      <MainContent 
        activeTab={activeTab}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
        filteredProducts={filteredProducts}
        products={products}
        profile={profile}
        handleAddToWishlist={handleAddToWishlist}
        handleAddToCart={handleAddToCart}
        setCurrentProductIndex={setCurrentProductIndex}
        setShowProductModal={setShowProductModal}
        orders={orders}
        activeOrderTab={activeOrderTab}
        setActiveOrderTab={setActiveOrderTab}
        setShowOrderDetails={setShowOrderDetails}
        setSelectedProductForReview={setSelectedProductForReview}
        setShowReviewModal={setShowReviewModal}
        setActiveTab={setActiveTab}
        activeProfileTab={activeProfileTab}
        setActiveProfileTab={setActiveProfileTab}
        notifications={notifications}
        handleMarkNotificationAsRead={handleMarkNotificationAsRead}
        messages={messages}
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
        messagesEndRef={messagesEndRef}
        sellerStats={sellerStats}
        sellerProducts={sellerProducts}
        sellerOrders={sellerOrders}
        setShowNewProductForm={setShowNewProductForm}
        setShowSellerVerification={setShowSellerVerification}
        setShowVerificationModal={setShowVerificationModal}
        setShowPremiumModal={setShowPremiumModal}
        darkMode={darkMode}
        handleDarkModeToggle={handleDarkModeToggle}
        incognitoMode={incognitoMode}
        handleIncognitoModeToggle={handleIncognitoModeToggle}
      />

      <BottomNav 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        orders={orders}
        notifications={notifications}
      />

      {menuOpen && (
        <SideMenu 
          setMenuOpen={setMenuOpen}
          user={user}
          profile={profile}
          setActiveTab={setActiveTab}
          setActiveProfileTab={setActiveProfileTab}
          cart={cart}
          setShowPaymentModal={setShowPaymentModal}
          setShowFilters={setShowFilters}
          setShowSellerVerification={setShowSellerVerification}
          setShowPremiumModal={setShowPremiumModal}
        />
      )}
    </div>
  );
};