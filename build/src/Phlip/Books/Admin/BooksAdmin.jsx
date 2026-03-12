import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { FiBarChart2, FiBookOpen, FiUpload, FiFolder, FiSettings, FiUsers, FiDatabase, FiChevronLeft, FiChevronRight, FiEdit3, FiRefreshCw, FiGrid, FiHome, FiCheckCircle, FiClock, FiDollarSign, FiStar, FiMapPin, FiMoreVertical } from 'react-icons/fi';
import { MdAdminPanelSettings } from "react-icons/md";
import { getCurrentUserProfile } from './api';
import './admin.css';
import { AdminUIProvider } from './AdminUIContext';
import { supabase } from '../supabaseClient';

// Notification Badge Component
const NotificationBadge = ({ count }) => {
  if (!count || count === 0) return null;
  return (
    <span className="notification-badge">
      {count > 99 ? '99+' : count}
    </span>
  );
};

// Books Admin Pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ContentManagement = React.lazy(() => import('./pages/ContentManagement'));
const Upload = React.lazy(() => import('./pages/Upload'));
const AutoUpload = React.lazy(() => import('./pages/AutoUpload'));
const Categories = React.lazy(() => import('./pages/Categories'));
const Storage = React.lazy(() => import('./pages/Storage'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Users = React.lazy(() => import('./pages/Users'));

// Rentals Admin Pages
const RentalsDashboard = React.lazy(() => import('./pages/rentals/RentalsDashboard'));
const ListingsManagement = React.lazy(() => import('./pages/rentals/ListingsManagement'));
const BookingsManagement = React.lazy(() => import('./pages/rentals/BookingsManagement'));
const ReviewsModeration = React.lazy(() => import('./pages/rentals/ReviewsModeration'));
const LandlordVerification = React.lazy(() => import('./pages/rentals/LandlordVerification'));
const RentalsAnalytics = React.lazy(() => import('./pages/rentals/RentalsAnalytics'));
const QuotaRequests = React.lazy(() => import('./pages/rentals/QuotaRequests'));

export const BooksAdmin = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [notifications, setNotifications] = useState({
    listings: 0,
    bookings: 0,
    quotas: 0,
    reviews: 0,
    landlords: 0
  });

  // Load user profile
  useEffect(() => {
    (async () => {
      try {
        const profile = await getCurrentUserProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error('Failed to load user profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, []);

  // Load notification counts
  useEffect(() => {
    if (!userProfile || userProfile.role !== 'admin') return;

    const loadNotifications = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        if (!token) return;

        // Fetch all notification counts in parallel
        const [listingsRes, bookingsRes, quotasRes, reviewsRes, landlordsRes] = await Promise.all([
          fetch('http://localhost:5000/api/rentals/admin/listings?status=pending', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:5000/api/rentals/admin/bookings?status=pending', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:5000/api/rentals/admin/quota-requests?status=pending', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:5000/api/rentals/admin/reviews?status=pending', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:5000/api/rentals/admin/landlords?status=pending', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        const [listings, bookings, quotas, reviews, landlords] = await Promise.all([
          listingsRes.ok ? listingsRes.json() : { listings: [] },
          bookingsRes.ok ? bookingsRes.json() : { bookings: [] },
          quotasRes.ok ? quotasRes.json() : { requests: [] },
          reviewsRes.ok ? reviewsRes.json() : { reviews: [] },
          landlordsRes.ok ? landlordsRes.json() : { landlords: [] }
        ]);

        setNotifications({
          listings: listings.listings?.length || 0,
          bookings: bookings.bookings?.length || 0,
          quotas: quotas.requests?.length || 0,
          reviews: reviews.reviews?.length || 0,
          landlords: landlords.landlords?.length || 0
        });
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };

    loadNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [userProfile]);

  // initialize collapsed based on current width: collapsed for <=860
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 860) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Role-based access control
  const isAdmin = userProfile?.role === 'admin';
  const isEditor = userProfile?.role === 'editor';

  // More menu state and outside-click handling
  const MoreMenu = ({ isAdmin, notifications }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
      const onDoc = (e) => {
        if (!ref.current) return;
        if (!ref.current.contains(e.target)) setOpen(false);
      };
      document.addEventListener('mousedown', onDoc);
      return () => document.removeEventListener('mousedown', onDoc);
    }, []);

    const extraItems = [
      ...(isAdmin ? [
        { to: '/books/admin/auto-upload', icon: <FiRefreshCw />, label: 'Auto', badge: 0 },
        { to: '/books/admin/storage', icon: <FiDatabase />, label: 'Storage', badge: 0 },
        { to: '/books/admin/users', icon: <FiUsers />, label: 'Users', badge: 0 },
        { to: '/books/admin/settings', icon: <FiSettings />, label: 'Settings', badge: 0 },
      ] : []),
      // Rentals-specific deeper items
      ...(isAdmin ? [
        { to: '/books/admin/rentals/listings', icon: <FiHome />, label: 'Listings', badge: notifications.listings },
        { to: '/books/admin/rentals/bookings', icon: <FiCheckCircle />, label: 'Bookings', badge: notifications.bookings },
        { to: '/books/admin/rentals/quotas', icon: <FiClock />, label: 'Quotas', badge: notifications.quotas },
        { to: '/books/admin/rentals/reviews', icon: <FiStar />, label: 'Reviews', badge: notifications.reviews },
        { to: '/books/admin/rentals/landlords', icon: <FiUsers />, label: 'Landlords', badge: notifications.landlords },
        { to: '/books/admin/rentals/analytics', icon: <FiDollarSign />, label: 'Analytics', badge: 0 },
      ] : []),
    ];

    const totalBadge = extraItems.reduce((sum, item) => sum + (item.badge || 0), 0);

    return (
      <div className="bottom-more" ref={ref}>
        <button className={`bottom-item more-btn ${open ? 'active' : ''}`} onClick={() => setOpen(s => !s)} aria-expanded={open} aria-label="More">
          <FiMoreVertical />
          <NotificationBadge count={totalBadge} />
        </button>
        {open && (
          <div className="more-dropup" role="menu">
            {extraItems.map((it) => (
              <NavLink key={it.to} to={it.to} className={({ isActive }) => `dropup-item ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}>
                <span className="dropup-icon">{it.icon}</span>
                <span className="dropup-label">{it.label}</span>
                <NotificationBadge count={it.badge} />
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loadingProfile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0b141a', color: '#8696a0' }}>
        Loading...
      </div>
    );
  }
  return (
    <AdminUIProvider>
    <div className="admin-root">
      <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`} aria-expanded={!collapsed}>
        <div className="admin-brand" onClick={() => navigate('/books/admin')}>
          <span className="brand-dot" />
          <span className="brand-text">CampusLife Admin</span>
        </div>
        <nav className="admin-nav">
          {/* Main Dashboard */}
          {isAdmin && (
            <NavLink to="/books/admin" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FiBarChart2 /> <span className="nav-label">Overview</span>
            </NavLink>
          )}

          {/* Books Section */}
          <div className="nav-section-header">
            <FiBookOpen /> <span className="nav-label">BOOKS</span>
          </div>
          <NavLink to="/books/admin/content" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FiGrid /> <span className="nav-label">Content</span>
          </NavLink>
          <NavLink to="/books/admin/upload" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FiUpload /> <span className="nav-label">Upload</span>
          </NavLink>
          {isAdmin && (
            <>
              <NavLink to="/books/admin/auto-upload" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <FiRefreshCw /> <span className="nav-label">Auto Upload</span>
              </NavLink>
              <NavLink to="/books/admin/categories" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <FiFolder /> <span className="nav-label">Categories</span>
              </NavLink>
            </>
          )}

          {/* Rentals Section */}
          {isAdmin && (
            <>
              <div className="nav-section-header">
                <FiHome /> <span className="nav-label">RENTALS</span>
              </div>
              <NavLink to="/books/admin/rentals" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <FiBarChart2 /> <span className="nav-label">Rentals Dashboard</span>
              </NavLink>
              <NavLink to="/books/admin/rentals/listings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <FiHome /> <span className="nav-label">Listings</span>
                <NotificationBadge count={notifications.listings} />
              </NavLink>
              <NavLink to="/books/admin/rentals/bookings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <FiCheckCircle /> <span className="nav-label">Bookings</span>
                <NotificationBadge count={notifications.bookings} />
              </NavLink>
              <NavLink to="/books/admin/rentals/quotas" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <FiClock /> <span className="nav-label">Quota Requests</span>
                <NotificationBadge count={notifications.quotas} />
              </NavLink>
              <NavLink to="/books/admin/rentals/reviews" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <FiStar /> <span className="nav-label">Reviews</span>
                <NotificationBadge count={notifications.reviews} />
              </NavLink>
              <NavLink to="/books/admin/rentals/landlords" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <FiUsers /> <span className="nav-label">Landlords</span>
                <NotificationBadge count={notifications.landlords} />
              </NavLink>
              <NavLink to="/books/admin/rentals/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <FiDollarSign /> <span className="nav-label">Analytics</span>
              </NavLink>
            </>
          )}

          {/* System Section */}
          {isAdmin && (
            <>
              <div className="nav-section-header">
                <FiSettings /> <span className="nav-label">SYSTEM</span>
              </div>
              <NavLink to="/books/admin/storage" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <FiDatabase /> <span className="nav-label">Storage</span>
              </NavLink>
              <NavLink to="/books/admin/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <FiUsers /> <span className="nav-label">Users</span>
              </NavLink>
              <NavLink to="/books/admin/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <FiSettings /> <span className="nav-label">Settings</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* sidebar toggle button (visible when collapsed or on small screens) */}
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(s => !s)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </aside>

      {/* bottom bar for very small screens (<600px) - shows icons and names */}
      <nav className="admin-bottombar">
        {/* Primary items shown directly on the bottom bar */}
        {isAdmin && (
          <NavLink to="/books/admin" end className={({ isActive }) => `bottom-item ${isActive ? 'active' : ''}`}>
            <FiBarChart2 /> <span>Overview</span>
          </NavLink>
        )}
        <NavLink to="/books/admin/content" className={({ isActive }) => `bottom-item ${isActive ? 'active' : ''}`}>
          <FiGrid /> <span>Content</span>
        </NavLink>
        <NavLink to="/books/admin/upload" className={({ isActive }) => `bottom-item ${isActive ? 'active' : ''}`}>
          <FiUpload /> <span>Upload</span>
        </NavLink>
        <NavLink to="/books/admin/categories" className={({ isActive }) => `bottom-item ${isActive ? 'active' : ''}`}>
          <FiFolder /> <span>Categories</span>
        </NavLink>
        {isAdmin && (
          <NavLink to="/books/admin/rentals" end className={({ isActive }) => `bottom-item ${isActive ? 'active' : ''}`}>
            <FiHome /> <span>Rentals</span>
          </NavLink>
        )}

        {/* More kebab - shows a dropup with remaining items */}
        <MoreMenu isAdmin={isAdmin} notifications={notifications} />
      </nav>

      <div className="admin-main">
        <header className="admin-topbar">
          <button className="back-link" onClick={() => navigate(-1)}>
            <FiChevronLeft /> Back
          </button>
          {userProfile?.display_name && (
            <div style={{ 
              color: '#e9edef', 
              fontSize: '15px',
              fontWeight: '500',
              background: 'rgba(134, 150, 160, 0.1)',
              padding: '6px 12px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#00a884',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                {userProfile.display_name.charAt(0).toUpperCase()}
              </div>
              {userProfile.display_name}
            </div>
          )}
          <div className="spacer" />
          <button className="admin-link" onClick={() => navigate("/books/admin")}>
            {userProfile?.role === 'admin' ? (
              <MdAdminPanelSettings size={20} style={{ marginRight: "6px" }} />
            ) : userProfile?.role === 'editor' ? (
              <FiEdit3 size={20} style={{ marginRight: "6px" }} />
            ) : (
              <FiUsers size={20} style={{ marginRight: "6px" }} />
            )}
            {userProfile?.role ? userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1) : 'Admin'}
          </button>
        </header>

        <main className="admin-content">
          <React.Suspense fallback={<div className="admin-loading">Loading...</div>}>
            <Routes>
              {/* Main Dashboard */}
              {isAdmin ? (
                <Route index element={<Dashboard />} />
              ) : (
                <Route index element={<Navigate to="content" replace />} />
              )}
              
              {/* Books Routes */}
              <Route path="content" element={<ContentManagement userProfile={userProfile} />} />
              <Route path="upload" element={<Upload userProfile={userProfile} />} />
              {isAdmin && (
                <>
                  <Route path="auto-upload" element={<AutoUpload userProfile={userProfile} />} />
                  <Route path="categories" element={<Categories />} />
                </>
              )}

              {/* Rentals Routes */}
              {isAdmin && (
                <>
                  <Route path="rentals" element={<RentalsDashboard userProfile={userProfile} />} />
                  <Route path="rentals/listings" element={<ListingsManagement userProfile={userProfile} />} />
                  <Route path="rentals/bookings" element={<BookingsManagement userProfile={userProfile} />} />
                  <Route path="rentals/quotas" element={<QuotaRequests />} />
                  <Route path="rentals/reviews" element={<ReviewsModeration userProfile={userProfile} />} />
                  <Route path="rentals/landlords" element={<LandlordVerification userProfile={userProfile} />} />
                  <Route path="rentals/analytics" element={<RentalsAnalytics userProfile={userProfile} />} />
                </>
              )}

              {/* System Routes */}
              {isAdmin && (
                <>
                  <Route path="storage" element={<Storage />} />
                  <Route path="users" element={<Users />} />
                  <Route path="settings" element={<Settings userProfile={userProfile} />} />
                </>
              )}

              <Route path="*" element={<Navigate to={isAdmin ? "." : "content"} replace />} />
            </Routes>
          </React.Suspense>
        </main>
      </div>
    </div>
    </AdminUIProvider>
  );
};

export default BooksAdmin;
