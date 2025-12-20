import React, { Suspense, useEffect, useState } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  FiBarChart2, FiBookOpen, FiUpload, FiFolder,
  FiSettings, FiUsers, FiChevronLeft, FiChevronRight,
  FiRefreshCw, FiGrid, FiSearch, FiHardDrive, FiCheck
} from 'react-icons/fi';
import { MdAdminPanelSettings } from "react-icons/md";
import { BiSpeaker } from 'react-icons/bi';
import { AiOutlineLineChart } from 'react-icons/ai';

import { getCurrentUserProfile } from './api';
import './admin.css';
import { AdminUIProvider } from './AdminUIContext';
import { supabase } from '../supabaseClient';

// NotificationBadge stays — now used for submissions and other alerts
const NotificationBadge = ({ count }) => {
  if (!count || count === 0) return null;
  return <span className="notification-badge">{count > 99 ? '99+' : count}</span>;
};

// Books-only admin pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ContentManagement = React.lazy(() => import('./pages/ContentManagement'));
const Upload = React.lazy(() => import('./pages/Upload'));
const AutoUpload = React.lazy(() => import('./pages/AutoUpload'));
const Categories = React.lazy(() => import('./pages/Categories'));
const Submissions = React.lazy(() => import('./pages/Submissions'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Users = React.lazy(() => import('./pages/Users'));
const Verify = React.lazy(() => import('./pages/Verify'));
const UserDetails = React.lazy(() => import('./pages/UserDetails'));
const SearchAnalytics = React.lazy(() => import('./pages/SearchAnalytics'));
const UserSearchDetails = React.lazy(() => import('./pages/UserSearchDetails'));
const AdsManagement = React.lazy(() => import('./pages/AdvancedAdsManagement'));
const AdAnalytics = React.lazy(() => import('./pages/AdAnalytics'));
const Rankings = React.lazy(() => import('./pages/Rankings'));
const StorageCleanup = React.lazy(() => import('./pages/StorageCleanup'));

export const BooksAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [pendingSubmissions, setPendingSubmissions] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [authUserEmail, setAuthUserEmail] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Load admin profile and auth user email
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setAuthUserEmail(user?.email);

        const profile = await getCurrentUserProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error('Failed to load user profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, []);

  // Fetch submissions summary for notification badges
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/elib/submissions/summary');
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to load submissions summary');
        setPendingSubmissions(json.totalPending || 0);
      } catch (e) {
        console.warn('Submissions summary failed:', e?.message || e);
      }
    };
    fetchSummary();
  }, []);

  // Collapse sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      setCollapsed(window.innerWidth <= 860);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const ADMIN_EMAILS = ['campuslives254@gmail.com', 'paltechsomalux@gmail.com'];
  const userEmail = userProfile?.email || authUserEmail;
  const isAdmin = userProfile?.role === 'admin' || ADMIN_EMAILS.includes(userEmail);
  const isEditor = userProfile?.role === 'editor' || ADMIN_EMAILS.includes(userEmail);
  const isSuperAdmin = ADMIN_EMAILS.includes(userEmail);
  const hasAdminAccess = isAdmin || isEditor;
  const canAccessContentFeatures = isEditor || isAdmin;

  // Build breadcrumb segments from current location
  const buildBreadcrumbs = () => {
    const basePath = '/books/admin';
    const path = location.pathname.startsWith(basePath)
      ? location.pathname.slice(basePath.length)
      : location.pathname;

    const segments = path.split('/').filter(Boolean);
    const crumbs = [];

    const pushCrumb = (label, to) => {
      crumbs.push({ label, to });
    };

    // Always start with Home
    pushCrumb('Home', basePath);

    if (segments.length === 0) return crumbs;

    const labels = {
      content: 'Content',
      upload: 'Upload',
      'auto-upload': 'Auto Upload',
      categories: 'Categories',
      storage: 'Storage',
      users: 'Users',
      settings: 'Settings',
      'search-analytics': 'Search Overview',
      search: 'Search Overview',
    };

    let currentPath = basePath;
    segments.forEach((seg, index) => {
      currentPath += `/${seg}`;
      let label = labels[seg];

      if (!label) {
        if (segments[index - 1] === 'users') {
          label = index === segments.length - 1 && seg === 'search' ? 'Search Overview' : 'Details';
        } else {
          label = seg.charAt(0).toUpperCase() + seg.slice(1);
        }
      }

      pushCrumb(label, index === segments.length - 1 ? null : currentPath);
    });

    return crumbs;
  };

  const breadcrumbs = buildBreadcrumbs();

  if (loadingProfile) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', background: '#0b141a', color: '#8696a0'
      }}>
        Loading...
      </div>
    );
  }

  // If not admin or editor, redirect to main page
  if (!hasAdminAccess) {
    navigate('/BookManagement');
    return null;
  }

  return (
    <AdminUIProvider>
      <div className="admin-root">
        
        {/* SIDEBAR */}
        <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
          <div className="admin-brand" onClick={() => navigate('/books/admin')}>
            <span className="brand-dot" />
            <span className="brand-text">Admin</span>
          </div>

          {/* −−− NAVIGATION −−− */}
          <nav className="admin-nav">

            {/* MAIN DASHBOARD */}
            {isAdmin && (
              <NavLink to="/books/admin" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <FiBarChart2 /> <span className="nav-label">Overview</span>
              </NavLink>
            )}

            {/* BOOKS SECTION */}
            <div className="nav-section-header">
              <FiBookOpen /> <span className="nav-label">BOOKS</span>
            </div>

            <NavLink to="/books/admin/content" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FiGrid /> <span className="nav-label">Content</span>
            </NavLink>

            <NavLink to="/books/admin/upload" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <FiUpload /> <span className="nav-label">Upload</span>
            </NavLink>

            {canAccessContentFeatures && (
              <>
                <NavLink to="/books/admin/auto-upload" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <FiRefreshCw /> <span className="nav-label">Auto Upload</span>
                </NavLink>

                <NavLink to="/books/admin/categories" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <FiFolder /> <span className="nav-label">Categories</span>
                </NavLink>
              </>
            )}

            {isAdmin && (
              <>
                <NavLink to="/books/admin/submissions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <FiUpload /> <span className="nav-label">Submissions</span>
                  <NotificationBadge count={pendingSubmissions} />
                </NavLink>
              </>
            )}

            {/* SYSTEM SECTION */}
            {isAdmin && (
              <>
                <div className="nav-section-header">
                  <FiSettings /> <span className="nav-label">SYSTEM</span>
                </div>

                <NavLink to="/books/admin/rankings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <FiBarChart2 /> <span className="nav-label">Rankings</span>
                </NavLink>

                <NavLink to="/books/admin/ads" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <BiSpeaker /> <span className="nav-label">Ads</span>
                </NavLink>

                <NavLink to="/books/admin/search-analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <FiSearch /> <span className="nav-label">Search Overview</span>
                </NavLink>

                <NavLink to="/books/admin/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <FiUsers /> <span className="nav-label">Users</span>
                </NavLink>

                <NavLink to="/books/admin/verify" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <FiCheck /> <span className="nav-label">Verify</span>
                </NavLink>

                <NavLink to="/books/admin/storage" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <FiHardDrive /> <span className="nav-label">Storage</span>
                </NavLink>

                <NavLink to="/books/admin/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  <FiSettings /> <span className="nav-label">Settings</span>
                </NavLink>
              </>
            )}
          </nav>

          {/* Collapse Button */}
          <button
            className="sidebar-toggle"
            onClick={() => setCollapsed(s => !s)}
          >
            {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </aside>

        {/* MOBILE BOTTOM BAR */}
        <nav className="admin-bottombar">
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

          {isAdmin && (
            <NavLink to="/books/admin/ads" className={({ isActive }) => `bottom-item ${isActive ? 'active' : ''}`}>
              <BiSpeaker /> <span>Ads</span>
            </NavLink>
          )}

          {isAdmin && (
            <NavLink to="/books/admin/verify" className={({ isActive }) => `bottom-item ${isActive ? 'active' : ''}`}>
              <FiCheck /> <span>Verify</span>
            </NavLink>
          )}

          {canAccessContentFeatures && (
            <NavLink to="/books/admin/auto-upload" className={({ isActive }) => `bottom-item ${isActive ? 'active' : ''}`}>
              <FiRefreshCw /> <span>Auto Upload</span>
            </NavLink>
          )}

          <NavLink to="/books/admin/categories" className={({ isActive }) => `bottom-item ${isActive ? 'active' : ''}`}>
            <FiFolder /> <span>Categories</span>
          </NavLink>
        </nav>

        {/* MAIN AREA */}
        <div className="admin-main">
          <header className="admin-topbar">
            <button className="back-link" onClick={() => navigate('/BookManagement')}>
              <FiChevronLeft />
              <span>Back to books</span>
            </button>

            <div className="admin-breadcrumbs">
              {breadcrumbs.map((crumb, idx) => (
                <span key={`${crumb.label}-${idx}`} className="breadcrumb-item">
                  {crumb.to ? (
                    <Link to={crumb.to} className="breadcrumb-link">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="breadcrumb-current">{crumb.label}</span>
                  )}
                  {idx < breadcrumbs.length - 1 && <span className="breadcrumb-separator">/</span>}
                </span>
              ))}
            </div>

            <div className="spacer" />

            {userProfile && (
              <div className="admin-user-summary">
                <div className="admin-user-info">
                  <div className="admin-user-name">{userProfile.display_name || userProfile.email}</div>
                  <div className="admin-user-role">{userProfile.role ? userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1) : 'Admin'}</div>
                </div>
                <div className="admin-user-avatar">
                  {userProfile.avatar_url ? (
                    <img src={userProfile.avatar_url} alt={userProfile.display_name || userProfile.email} />
                  ) : (
                    <span>{(userProfile.display_name || userProfile.email || '?').charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </div>
            )}
          </header>

          <main className="admin-content">
            <React.Suspense fallback={<div className="admin-loading">Loading...</div>}>
              <Routes>

                {/* Dashboard */}
                {isAdmin ? (
                  <Route index element={<Dashboard />} />
                ) : (
                  <Route index element={<Navigate to="content" replace />} />
                )}

                {/* Books Routes */}
                <Route path="content" element={<ContentManagement userProfile={userProfile} />} />
                <Route path="upload" element={<Upload userProfile={userProfile} />} />

                {canAccessContentFeatures && (
                  <>
                    <Route path="auto-upload" element={<AutoUpload userProfile={userProfile} />} />
                    <Route path="categories" element={<Categories />} />
                  </>
                )}

                {isAdmin && (
                  <>
                    <Route path="submissions" element={<Submissions userProfile={userProfile} />} />
                  </>
                )}

                {/* System Routes */}
                {isAdmin && (
                  <>
                    <Route path="rankings" element={<Rankings />} />
                    <Route path="ads" element={<AdsManagement />} />
                    <Route path="users" element={<Users isSuperAdmin={isSuperAdmin} />} />
                    <Route path="verify" element={<Verify userProfile={userProfile} />} />
                    <Route path="users/:id" element={<UserDetails />} />
                    <Route path="users/:id/search" element={<UserSearchDetails />} />
                    <Route path="search-analytics" element={<SearchAnalytics />} />
                    <Route path="storage" element={<StorageCleanup userProfile={userProfile} />} />
                    <Route path="settings" element={<Settings userProfile={userProfile} />} />
                  </>
                )}

                {/* Catch-all */}
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
