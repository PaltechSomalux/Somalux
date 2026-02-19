import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { UserCircle, SignOut, Bookmark, IdentificationCard } from "@phosphor-icons/react";
import { useNavigate } from 'react-router-dom';
import { FiTrendingUp, FiUpload, FiDownload, FiBarChart2, FiStar } from 'react-icons/fi';
import { statsCache, userCache } from "../Books/utils/cacheManager";
import { supabase } from "../Books/supabaseClient";
import { ProfileAvatar } from "./ProfileAvatar";
import { AuthModals } from "./AuthModals";
import VerificationTierModal from "../Books/VerificationTierModal";
import VerificationBadge from "../Books/Admin/components/VerificationBadge";
import QRCodeShare from "../../components/QRCodeShare";
import { API_URL } from "../../config";
import "./Profile.css";

export const Profile = ({ user: propUser = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [pendingUploads, setPendingUploads] = useState(0);
  const [authUser, setAuthUser] = useState(null);
  const [currentUserTier, setCurrentUserTier] = useState('basic');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showActionsGrid, setShowActionsGrid] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [savedItems, setSavedItems] = useState([]);
  const [loadingSavedItems, setLoadingSavedItems] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Local state
  const [localUser, setLocalUser] = useState(null);
  const [readingStats, setReadingStats] = useState(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);

  // Auth modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const FALLBACK = {
    name: "Please Sign In",
    email: "xxx@gmail.com",
    libraryId: "LBX-29475",
    membership: "Premium Plan",
    favorites: 0,
    wishlist: 0,
    notifications: 0,
  };

  const loadAvatar = async (url, retryCount = 0) => {
    if (!url) {
      console.log('⚠️ No URL provided to loadAvatar');
      return null;
    }
    
    console.log('📸 loadAvatar called with:', url.substring(0, 60) + '...');
    
    // For simplicity, just use the avatar URL directly
    // The backend will handle caching and proxy if needed
    setProfileImage(url);
    return url;
  };

  const refreshPending = async (userId) => {
    try {
      if (!userId) { setPendingUploads(0); return; }
      const url = `${API_BASE}/api/elib/submissions?status=pending&userId=${encodeURIComponent(userId)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok && json?.ok) {
        setPendingUploads(Array.isArray(json.submissions) ? json.submissions.length : 0);
      }
    } catch (_) {}
  };

  const markProfileActive = async (user) => {
    if (!user || !user.id) return;
    try {
      // Non-blocking fire-and-forget profile update
      // Only update fields that exist in the profiles table schema
      await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || null
          },
          { returning: 'minimal' }
        );
    } catch (e) {
      console.warn('Failed to mark profile active', e);
    }
  };

  const markProfileSignedOut = async (user) => {
    if (!user || !user.id) return;
    try {
      // Non-blocking fire-and-forget profile update
      // Only fields in profiles table schema: id, email, full_name, role, created_at, updated_at
      await supabase
        .from('profiles')
        .update({
          email: user.email
        })
        .eq('id', user.id);
    } catch (e) {
      console.warn('Failed to mark profile signed out', e);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Prevent body scroll when QR Code modal is open
  useEffect(() => {
    if (showQRCode) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showQRCode]);

  // Prevent body scroll when Actions Grid modal is open
  useEffect(() => {
    if (showActionsGrid) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showActionsGrid]);

  // Prevent body scroll when Saved modal is open
  useEffect(() => {
    if (showSavedModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showSavedModal]);

  // Load data from storage
  const loadDataFromStorage = () => {
    try {
      const stored = localStorage.getItem("userProfile");
      if (stored) setLocalUser(JSON.parse(stored));
      else setLocalUser(userCache.get("current_user") || null);
      try {
        const parsed = stored ? JSON.parse(stored) : null;
        if (parsed && parsed.avatar) setProfileImage(parsed.avatar);
      } catch (e) {}
    } catch (e) {}

    try {
      const wl = JSON.parse(localStorage.getItem("bookWishlist") || "[]");
      setWishlistCount(Array.isArray(wl) ? wl.length : 0);
    } catch (e) { setWishlistCount(0); }

    try {
      setReadingStats(statsCache.get("reading_stats"));
    } catch (e) {}

    try {
      setNotificationsCount(Number(localStorage.getItem("notifications") || 0));
    } catch (e) {}
  };

  useEffect(() => {
    loadDataFromStorage();

    const unsub = statsCache.subscribe("reading_stats", setReadingStats);
    const handleStorage = () => loadDataFromStorage();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("wishlistChanged", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("wishlistChanged", handleStorage);
      if (unsub) unsub();
    };
  }, []);

  useEffect(() => { refreshPending(authUser?.id); }, [authUser?.id]);

  // Set default tier (subscription_tier column doesn't exist in profiles table)
  useEffect(() => {
    setCurrentUserTier('basic');
  }, []);

  // Auth initialization
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user || null;
      setAuthUser(user);

      if (user) {
        const authUserData = {
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email,
          libraryId: user.id?.substring(0, 8).toUpperCase() || 'LBX-XXXX',
          membership: 'Premium Plan'
        };
        setLocalUser(authUserData);
        localStorage.setItem('userProfile', JSON.stringify(authUserData));

        markProfileActive(user);

        const avatarFromAuth = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
        
        // Note: avatar_url column doesn't exist in profiles table schema
        // Only sync profile with basic fields
        if (avatarFromAuth) {
          await loadAvatar(avatarFromAuth);
        } else {
          const stored = JSON.parse(localStorage.getItem('userProfile') || '{}');
          if (stored.avatar) setProfileImage(stored.avatar);
        }
      }
    })();

    let isMounted = true;
    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange((_event, session) => {
      // Prevent state updates on unmounted component
      if (!isMounted) return;
      
      const user = session?.user || null;
      setAuthUser(user);
      
      if (user) {
        const authUserData = {
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email,
          libraryId: user.id?.substring(0, 8).toUpperCase() || 'LBX-XXXX',
          membership: 'Premium Plan'
        };
        setLocalUser(authUserData);
        localStorage.setItem('userProfile', JSON.stringify(authUserData));

        const avatarFromAuth = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
        
        // Sync avatar from auth metadata to profiles table if not already there (non-blocking)
        if (avatarFromAuth) {
          (async () => {
            try {
              const { error } = await supabase
                .from('profiles')
                .update({ avatar_url: avatarFromAuth })
                .eq('id', user.id);
              if (!error) console.log('✅ Avatar synced to profiles table');
              else console.warn('⚠️ Failed to sync avatar:', error);
            } catch (e) {
              console.warn('⚠️ Avatar sync error:', e);
            }
          })();
        }
        
        if (avatarFromAuth) {
          // Non-blocking avatar load
          loadAvatar(avatarFromAuth).catch(e => console.warn('Avatar load failed:', e));
        } else {
          // Try to load from profiles table if not in auth metadata (non-blocking)
          supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single()
            .then(({ data: prof }) => {
              if (prof?.avatar_url) {
                loadAvatar(prof.avatar_url).catch(e => console.warn('Avatar load from DB failed:', e));
              }
            })
            .catch(e => console.warn('Failed to load avatar from profiles table:', e));
        }

        // Non-blocking profile marking
        markProfileActive(user);
      } else {
        // User logged out - only clear UI state, DO NOT mark as signed out in database
        // (markProfileSignedOut should only be called when user explicitly clicks sign out button)
        setLocalUser(null);
        localStorage.removeItem('userProfile');
        setProfileImage(null);
      }
      window.dispatchEvent(new CustomEvent("authChanged", { detail: { user } }));
    });


    return () => {
      isMounted = false;
      try {
        subscription?.unsubscribe?.();
      } catch (e) {}
    };
  }, []);

  // Display values
  const displayedName = authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || localUser?.name || propUser?.name || FALLBACK.name;
  const displayedEmail = authUser?.email || localUser?.email || propUser?.email || FALLBACK.email;
  const displayedLibraryId = authUser?.id?.substring(0, 8).toUpperCase() || localUser?.libraryId || propUser?.libraryId || FALLBACK.libraryId;
  const displayedMembership = localUser?.membership || propUser?.membership || (authUser ? 'Premium Plan' : FALLBACK.membership);

  const favorites = localUser?.favorites || 0;
  const liveWishlist = wishlistCount ?? localUser?.wishlist ?? 0;
  const notifications = notificationsCount || localUser?.notifications || 0;

  const totalBadgeCount = (favorites || 0) + (notifications || 0);

  // Handle body scroll when saved modal is open
  useEffect(() => {
    if (showSavedModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showSavedModal]);

  // Fetch saved items (downloaded books and papers)
  const fetchSavedItems = async () => {
    if (!authUser?.id) return;
    
    setLoadingSavedItems(true);
    try {
      // Fetch downloaded books
      const { data: bookDownloads, error: booksError } = await supabase
        .from('user_book_downloads')
        .select('*')
        .eq('user_id', authUser.id)
        .order('downloaded_at', { ascending: false });

      // Fetch downloaded papers
      const { data: paperDownloads, error: papersError } = await supabase
        .from('user_paper_downloads')
        .select('*')
        .eq('user_id', authUser.id)
        .order('downloaded_at', { ascending: false });

      const combined = [];

      // Batch fetch book details if we have book downloads
      if (bookDownloads && Array.isArray(bookDownloads) && bookDownloads.length > 0) {
        const bookIds = bookDownloads.map(b => b.book_id);
        const { data: booksData } = await supabase
          .from('books')
          .select('id, title, cover_image_url, author')
          .in('id', bookIds);

        const booksMap = {};
        if (booksData) {
          booksData.forEach(book => {
            booksMap[book.id] = book;
          });
        }

        bookDownloads.forEach(download => {
          const book = booksMap[download.book_id];
          combined.push({
            id: download.id,
            downloadId: download.id,
            type: 'book',
            title: book?.title || `Book #${download.book_id}`,
            author: book?.author || 'Unknown',
            image: book?.cover_image_url || null,
            downloadedAt: download.downloaded_at
          });
        });
      }

      // Batch fetch paper details if we have paper downloads
      if (paperDownloads && Array.isArray(paperDownloads) && paperDownloads.length > 0) {
        const paperIds = paperDownloads.map(p => p.paper_id);
        const { data: papersData } = await supabase
          .from('past_papers')
          .select('id, title, cover_image_url, universities(name)')
          .in('id', paperIds);

        const papersMap = {};
        if (papersData) {
          papersData.forEach(paper => {
            papersMap[paper.id] = paper;
          });
        }

        paperDownloads.forEach(download => {
          const paper = papersMap[download.paper_id];
          const universityName = paper?.universities?.name || 'Unknown';
          
          combined.push({
            id: download.id,
            downloadId: download.id,
            type: 'paper',
            title: paper?.title || `Paper #${download.paper_id}`,
            university: universityName,
            image: paper?.cover_image_url || null,
            downloadedAt: download.downloaded_at
          });
        });
      }

      setSavedItems(combined);
    } catch (error) {
      // Silently handle errors
      setSavedItems([]);
    } finally {
      setLoadingSavedItems(false);
    }
  };

  const handleDeleteSavedItem = async (item) => {
    try {
      const table = item.type === 'book' ? 'user_book_downloads' : 'user_paper_downloads';
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', item.downloadId);

      if (error) {
        console.error('Delete error:', error);
        return;
      }

      // Remove from UI
      setSavedItems(savedItems.filter(i => i.id !== item.id));
    } catch (error) {
      console.error('Error deleting saved item:', error);
    }
  };

  return (
    <>
      <div className="chrome-profile" ref={dropdownRef}>
      {/* Trigger */}
      <button className="profile-trigger" onClick={() => setIsOpen(!isOpen)}>
        {profileImage ? (
          <img
            src={profileImage}
            className="profile-avatar"
            alt="Profile"
            onError={() => {
              console.warn('Profile avatar failed to load, clearing image');
              setProfileImage(null);
            }}
            onLoad={() => {
              console.log('✅ Profile avatar loaded successfully');
            }}
          />
        ) : (
          <UserCircle size={34} weight="fill" color="#8696a0" />
        )}
        {totalBadgeCount > 0 && (
          <span className="notif-badge">{totalBadgeCount > 999 ? "999+" : totalBadgeCount}</span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="chrome-dropdown">
          {/* Profile Header */}
          <div style={{
            padding: '10px',
          }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              {/* Avatar & Info */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', flex: 1 }}>
                {/* Avatar */}
                <div style={{ flexShrink: 0, marginTop: '-18px', marginLeft: '-18px' }}>
                  <ProfileAvatar
                    profileImage={profileImage}
                    setProfileImage={setProfileImage}
                    authUser={authUser}
                    size={44}
                    showUploadButton={true}
                  />
                </div>

                {/* User Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: '0 0 1px 0', fontSize: '12px', color: '#fff' }}>{displayedName}</h4>
                  <p style={{ margin: 0, fontSize: '10px', color: '#8696a0', wordBreak: 'break-word' }}>{displayedEmail}</p>
                  {currentUserTier !== 'basic' && (
                    <div style={{ marginTop: '2px', fontSize: '9px', color: '#00a884', fontWeight: '600' }}>
                      {displayedMembership}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions & Auth Section - Right below profile */}
            <div style={{
              padding: '0',
              marginTop: '8px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
              rowGap: '8px',
              alignItems: 'stretch',
            }}>
              {/* Upload Button */}
              {authUser && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/user/upload');
                  }}
                  style={{
                    padding: '5px 6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#e9edef',
                    backgroundColor: '#0b1216',
                    border: '1px solid #2a3942',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a2332';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#0b1216';
                  }}
                  title="Upload content"
                >
                  <FiUpload size={14} />
                  Upload
                </button>
              )}

              {/* Upgrade Button */}
              {authUser && currentUserTier === 'basic' && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowVerificationModal(true);
                  }}
                  style={{
                    padding: '5px 6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#e9edef',
                    backgroundColor: '#0b1216',
                    border: '1px solid #2a3942',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a2332';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#0b1216';
                  }}
                  title="Upgrade account"
                >
                  <VerificationBadge tier="premium" size="sm" showLabel={false} showTooltip={false} />
                  Upgrade
                </button>
              )}

              {/* Grid Actions Button */}
              {authUser && (
                <button
                  onClick={() => setShowActionsGrid(!showActionsGrid)}
                  style={{
                    padding: '6px 6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#e9edef',
                    backgroundColor: showActionsGrid ? '#1a2332' : '#0b1216',
                    border: '1px solid #2a3942',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a2332';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = showActionsGrid ? '#1a2332' : '#0b1216';
                  }}
                  title="Quick actions"
                >
                  ⊞ {showActionsGrid ? 'Less' : 'More'}
                </button>
              )}

              {/* Auth Button */}
              {!authUser && (
                <button
                  onClick={() => setShowAuthModal(true)}
                  style={{
                    padding: '4px 6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#fff',
                    backgroundColor: '#00a884',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    whiteSpace: 'nowrap',
                    gridColumn: '1 / -1'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#008069';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#00a884';
                  }}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          {/* Actions Grid Dropdown - Inside Profile Dropdown */}
          {showActionsGrid && (
            <div style={{
              padding: '12px',
              background: '#0a0e11',
              borderRadius: '8px',
              border: 'none',
              boxShadow: 'none',
              marginTop: '-4px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
              rowGap: '14px'
            }}>
              {/* Stats */}
              <button
                onClick={() => {
                  setShowActionsGrid(false);
                  setIsOpen(false);
                  navigate('/books/reading-dashboard');
                }}
                style={{
                  padding: '5px 6px',
                  background: '#0b1216',
                  border: '1px solid #2a3942',
                  color: '#e9edef',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '11px',
                  fontWeight: '600',
                  borderRadius: '3px',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a2332';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#0b1216';
                }}
                title="View statistics"
              >
                📊 Stats
              </button>

              {/* QR Code */}
              <button
                onClick={() => {
                  setShowActionsGrid(false);
                  setShowQRCode(true);
                }}
                style={{
                  padding: '5px 6px',
                  background: '#0b1216',
                  border: '1px solid #2a3942',
                  color: '#e9edef',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '11px',
                  fontWeight: '600',
                  borderRadius: '3px',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a2332';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#0b1216';
                }}
                title="Show QR code"
              >
                📱 QR Code
              </button>

              {/* Saved - Takes full width */}
              <button
                onClick={() => {
                  setShowActionsGrid(false);
                  setShowSavedModal(true);
                  fetchSavedItems();
                }}
                style={{
                  padding: '5px 6px',
                  background: '#0b1216',
                  border: '1px solid #2a3942',
                  color: '#e9edef',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '11px',
                  fontWeight: '600',
                  borderRadius: '3px',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a2332';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#0b1216';
                }}
                title="View saved files"
              >
                <FiDownload size={14} />
                Saved
              </button>

              {/* Sign Out */}
              <button
                onClick={() => {
                  setShowActionsGrid(false);
                  setShowSignOutModal(true);
                }}
                style={{
                  padding: '5px 6px',
                  background: '#0b1216',
                  border: '1px solid #f87171',
                  color: '#f87171',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '11px',
                  fontWeight: '600',
                  borderRadius: '3px',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(248, 113, 113, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#0b1216';
                }}
                title="Sign out"
              >
                🚪 Sign Out
              </button>
            </div>
          )}

          {/* Main Content Area */}
        </div>
      )}

      {/* Auth Modals */}
      <AuthModals
        showAuthModal={showAuthModal}
        setShowAuthModal={setShowAuthModal}
        showSignOutModal={showSignOutModal}
        setShowSignOutModal={setShowSignOutModal}
        authUser={authUser}
        setAuthUser={setAuthUser}
        markProfileSignedOut={markProfileSignedOut}
      />

      {/* Verification Tier Modal */}
      <VerificationTierModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        userTier={currentUserTier || 'basic'}
        onSelectTier={(tier) => {
          // This will handle tier selection
          // In next phase: integrate payment processing
          setShowVerificationModal(false);
        }}
        isLoading={false}
      />
      </div>

      {/* QR Code Share Modal - Outside all containers for proper centering */}
      {showQRCode && (
        <div className="qr-modal-overlay" onClick={() => setShowQRCode(false)}>
          <div 
            className="qr-modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '450px', overflow: 'visible', position: 'relative' }}
          >
            {/* Close Button */}
            <button
              className="qr-modal-close-btn"
              onClick={() => setShowQRCode(false)}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: '10px',
                right: '-15px',
                background: 'none',
                border: 'none',
                fontSize: '28px',
                width: '38px',
                height: '38px',
                cursor: 'pointer',
                color: '#8696a0',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)';
                e.currentTarget.style.color = '#ff6b6b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = '#8696a0';
              }}
            >
              ×
            </button>

            <QRCodeShare 
              url="https://somalux.co.ke"
              title="Scan to Visit SomaLux"
              description="Share this QR code to help others discover our platform"
            />
          </div>
        </div>
      )}

      {/* Saved Items Panel - Using Portal for full-screen display */}
      {showSavedModal && ReactDOM.createPortal(
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#0a0e11',
            zIndex: 99999,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
          onClick={() => setShowSavedModal(false)}
        >
          <div 
            style={{
              width: '100%',
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#0a0e11',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '16px 24px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: '#0a0e11',
              position: 'sticky',
              top: 0,
              zIndex: 1001,
            }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <h1 style={{ margin: 0, color: '#8696a0', fontSize: 24, fontWeight: 700 }}>
                  Downloads
                </h1>
              </div>
              <button
                onClick={() => setShowSavedModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8696a0',
                  fontSize: 32,
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#e9edef'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#8696a0'}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{
              padding: '0 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
              overflowY: 'auto',
            }}>
            {loadingSavedItems ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '400px',
                color: '#8696a0',
                fontSize: '16px',
                width: '100%'
              }}>
                Loading...
              </div>
            ) : savedItems.length === 0 ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '16px',
                width: '100%',
                minHeight: '400px',
                padding: '40px 16px'
              }}>
                <div style={{
                  fontSize: '80px'
                }}>
                  📚
                </div>
                <p style={{ fontSize: '20px', margin: 0, color: '#e9edef', fontWeight: 600 }}>No saved files yet</p>
                <p style={{ fontSize: '15px', margin: 0, color: '#8696a0', textAlign: 'center', maxWidth: '400px' }}>
                  Start exploring books and papers, then click save to build your personal collection
                </p>
              </div>
            ) : (
              <div style={{
                width: '100%',
                overflow: 'auto',
                display: 'flex',
                justifyContent: 'center'
              }}>
                <div style={{
                  padding: '0',
                  width: '100%'
                }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '14px',
                    border: '1px solid #1f2937'
                  }}>
                    <thead>
                      <tr style={{ borderBottom: 'none', backgroundColor: '#050709' }}>
                        <th style={{ padding: '4px 6px', textAlign: 'left', color: '#8696a0', fontWeight: 500, fontSize: '12px', borderRight: '1px solid #1f2937' }}>Cover</th>
                        <th style={{ padding: '4px 6px', textAlign: 'left', color: '#8696a0', fontWeight: 500, fontSize: '12px', borderRight: '1px solid #1f2937' }}>Title</th>
                        <th style={{ padding: '4px 6px', textAlign: 'left', color: '#8696a0', fontWeight: 500, fontSize: '12px', borderRight: '1px solid #1f2937' }}>Author/University</th>
                        <th style={{ padding: '4px 6px', textAlign: 'center', color: '#8696a0', fontWeight: 500, fontSize: '12px', borderRight: '1px solid #1f2937' }}>Type</th>
                        <th style={{ padding: '4px 6px', textAlign: 'left', color: '#8696a0', fontWeight: 500, fontSize: '12px', borderRight: '1px solid #1f2937' }}>Downloaded</th>
                        <th style={{ padding: '4px 6px', textAlign: 'center', color: '#8696a0', fontWeight: 500, fontSize: '12px' }}>Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedItems.map((item) => (
                        <tr 
                          key={item.id}
                          style={{
                            borderBottom: '1px solid #0f1419',
                            transition: 'background-color 0.2s',
                            backgroundColor: 'transparent'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0a0e11'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <td style={{ padding: '4px 6px', textAlign: 'left', borderRight: '1px solid #1f2937' }}>
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.title}
                                style={{
                                  width: '40px',
                                  height: '50px',
                                  borderRadius: '4px',
                                  objectFit: 'cover',
                                  border: '1px solid #1f2937'
                                }}
                                onError={(e) => e.target.style.display = 'none'}
                              />
                            ) : (
                              <div style={{
                                width: '40px',
                                height: '50px',
                                borderRadius: '4px',
                                backgroundColor: '#1f2937',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px'
                              }}>
                                {item.type === 'book' ? '📕' : '📄'}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '4px 6px', textAlign: 'left', color: '#8696a0', fontWeight: 500, borderRight: '1px solid #1f2937' }}>
                            {item.title}
                          </td>
                          <td style={{ padding: '4px 6px', textAlign: 'left', color: '#a8b4ba', fontSize: '13px', borderRight: '1px solid #1f2937' }}>
                            {item.type === 'book' ? item.author : item.university}
                          </td>
                          <td style={{ padding: '4px 6px', textAlign: 'center', color: '#00a884', fontSize: '12px', fontWeight: 600, borderRight: '1px solid #1f2937' }}>
                            {item.type === 'book' ? 'Book' : 'Paper'}
                          </td>
                          <td style={{ padding: '4px 6px', textAlign: 'left', color: '#8696a0', fontSize: '13px', borderRight: '1px solid #1f2937' }}>
                            {new Date(item.downloadedAt).toLocaleString()}
                          </td>
                          <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteSavedItem(item)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ff4b4b',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '600',
                                transition: 'color 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#ff6b6b';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#ff4b4b';
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );

};