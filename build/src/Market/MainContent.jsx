import React from 'react';
import { 
  FaBoxOpen, FaShoppingCart, FaList, FaUser, FaStore, FaComment, 
  FaBell, FaCog, FaHeadset, FaTruck, FaCheckCircle, FaHeart, 
  FaRegHeart, FaChartBar, FaReceipt, FaBoxes, FaShippingFast, 
  FaMoneyCheckAlt, FaHandHoldingUsd, FaFileInvoiceDollar, FaTags, 
  FaPercentage, FaCalendarAlt, FaClock, FaUserShield, FaUserCheck, 
  FaUserClock, FaUserEdit, FaUserPlus, FaUserMinus, FaUserCog, 
  FaUserMd, FaUserGraduate, FaUserFriends, FaUserAstronaut, 
  FaUserNinja, FaUserSecret, FaCrown, FaLeaf, FaRegCompass, 
  FaRegSmile, FaStar, FaFilter, FaSearch, FaEllipsisH, FaSignOutAlt
} from 'react-icons/fa';
import {BrowseSection} from './BrowseSection';
import {OrdersSection} from './OrdersSection';
import {ProfileSection} from './ProfileSection';
import "./MainContent.css";
export const MainContent = ({
  activeTab,
  selectedCategory,
  setSelectedCategory,
  categories,
  filteredProducts,
  products,
  profile,
  handleAddToWishlist,
  handleAddToCart,
  setCurrentProductIndex,
  setShowProductModal,
  orders,
  activeOrderTab,
  setActiveOrderTab,
  setShowOrderDetails,
  setSelectedProductForReview,
  setShowReviewModal,
  setActiveTab,
  activeProfileTab,
  setActiveProfileTab,
  notifications,
  handleMarkNotificationAsRead,
  messages,
  activeChat,
  setActiveChat,
  newMessage,
  setNewMessage,
  handleSendMessage,
  messagesEndRef,
  sellerStats,
  sellerProducts,
  sellerOrders,
  setShowNewProductForm,
  setShowSellerVerification,
  setShowVerificationModal,
  setShowPremiumModal,
  darkMode,
  handleDarkModeToggle,
  incognitoMode,
  handleIncognitoModeToggle
}) => {
  return (
    <main className="app-content">
      {activeTab === 'browse' && (
        <BrowseSection 
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
        />
      )}

      {activeTab === 'orders' && (
        <OrdersSection 
          orders={orders}
          profile={profile}
          activeOrderTab={activeOrderTab}
          setActiveOrderTab={setActiveOrderTab}
          setShowOrderDetails={setShowOrderDetails}
          products={products}
          setSelectedProductForReview={setSelectedProductForReview}
          setShowReviewModal={setShowReviewModal}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === 'profile' && (
        <ProfileSection 
          profile={profile}
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
          orders={orders}
          products={products}
          setActiveTab={setActiveTab}
        />
      )}
    </main>
  );
};

