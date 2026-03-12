import React from 'react';
import { 
  FaUser, FaStore, FaComment, FaBell, FaCog, FaShoppingCart, 
  FaTruck, FaCheckCircle, FaHeart, FaRegHeart, FaChartBar, 
  FaReceipt, FaBoxes, FaShippingFast, FaMoneyCheckAlt, 
  FaHandHoldingUsd, FaFileInvoiceDollar, FaTags, FaPercentage, 
  FaCalendarAlt, FaClock, FaUserShield, FaUserCheck, FaUserClock, 
  FaUserEdit, FaUserPlus, FaUserMinus, FaUserCog, FaUserMd, 
  FaUserGraduate, FaUserFriends, FaUserAstronaut, FaUserNinja, 
  FaUserSecret, FaCrown, FaSignOutAlt, FaBoxOpen, FaStar, 
  FaPaperPlane, FaTimes, FaSearch, FaEllipsisH, FaPlus, FaEdit
} from 'react-icons/fa';
import {DashboardTab} from './DashboardTab';
import {SellerTab} from './SellerTab';
import {MessagesTab} from './MessagesTab';
import {NotificationsTab} from './NotificationsTab';
import {SettingsTab} from './SettingsTab';

export const ProfileSection = ({
  profile,
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
  handleIncognitoModeToggle,
  orders,
  products,
  setActiveTab,
  handleAddToWishlist,
  handleAddToCart
}) => {
  return (
    <div className="profile-section">
      <div className="profile-header">
        <div className="user-info">
          <img src={profile.avatar} alt={profile.name} />
          <div>
            <h2>{profile.name}</h2>
            <p>{profile.email}</p>
            <div className="user-badges">
              {profile.verified && (
                <span className="verified-badge">
                  <FaCheckCircle /> Verified
                </span>
              )}
              {profile.premium && (
                <span className="premium-badge">
                  <FaCrown /> Premium Member
                </span>
              )}
              {profile.seller && (
                <span className="seller-badge">
                  <FaStore /> Seller
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="profile-stats">
          <div className="stat-item">
            <span className="count">{profile.wishlist.length}</span>
            <span className="label">Wishlist</span>
          </div>
          <div className="stat-item">
            <span className="count">{orders.length}</span>
            <span className="label">Orders</span>
          </div>
          <div className="stat-item">
            <span className="count">{notifications.filter(n => !n.read).length}</span>
            <span className="label">Notifications</span>
          </div>
        </div>
      </div>

      <div className="profile-tabs">
        <button 
          className={`profile-tab ${activeProfileTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveProfileTab('dashboard')}
        >
          <FaUser />
          <span>Dashboard</span>
        </button>
        <button 
          className={`profile-tab ${activeProfileTab === 'seller' ? 'active' : ''}`}
          onClick={() => setActiveProfileTab('seller')}
          disabled={!profile.seller}
        >
          <FaStore />
          <span>Seller Center</span>
        </button>
        <button 
          className={`profile-tab ${activeProfileTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveProfileTab('messages')}
        >
          <FaComment />
          <span>Messages</span>
          {Object.values(messages).flat().filter(m => !m.read && m.senderId !== 'user').length > 0 && (
            <span className="tab-badge">
              {Object.values(messages).flat().filter(m => !m.read && m.senderId !== 'user').length}
            </span>
          )}
        </button>
        <button 
          className={`profile-tab ${activeProfileTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveProfileTab('notifications')}
        >
          <FaBell />
          <span>Notifications</span>
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="tab-badge">
              {notifications.filter(n => !n.read).length}
            </span>
          )}
        </button>
        <button 
          className={`profile-tab ${activeProfileTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveProfileTab('settings')}
        >
          <FaCog />
          <span>Settings</span>
        </button>
      </div>

      {activeProfileTab === 'dashboard' ? (
        <DashboardTab 
          profile={profile}
          orders={orders}
          notifications={notifications}
          handleMarkNotificationAsRead={handleMarkNotificationAsRead}
          products={products}
          handleAddToWishlist={handleAddToWishlist}
          handleAddToCart={handleAddToCart}
          setActiveProfileTab={setActiveProfileTab}
          setActiveTab={setActiveTab}
        />
      ) : activeProfileTab === 'seller' ? (
        <SellerTab 
          profile={profile}
          sellerStats={sellerStats}
          sellerProducts={sellerProducts}
          sellerOrders={sellerOrders}
          setShowNewProductForm={setShowNewProductForm}
          setShowSellerVerification={setShowSellerVerification}
          setShowPremiumModal={setShowPremiumModal}
        />
      ) : activeProfileTab === 'messages' ? (
        <MessagesTab 
          messages={messages}
          products={products}
          activeChat={activeChat}
          setActiveChat={setActiveChat}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          handleSendMessage={handleSendMessage}
          messagesEndRef={messagesEndRef}
        />
      ) : activeProfileTab === 'notifications' ? (
        <NotificationsTab 
          notifications={notifications}
          handleMarkNotificationAsRead={handleMarkNotificationAsRead}
        />
      ) : (
        <SettingsTab 
          profile={profile}
          darkMode={darkMode}
          handleDarkModeToggle={handleDarkModeToggle}
          incognitoMode={incognitoMode}
          handleIncognitoModeToggle={handleIncognitoModeToggle}
          setShowSellerVerification={setShowSellerVerification}
          setShowPremiumModal={setShowPremiumModal}
        />
      )}
    </div>
  );
};