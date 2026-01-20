import React, { useState, useEffect, useRef } from "react";
import { UserCircle, SignOut, Bookmark, IdentificationCard } from "@phosphor-icons/react";
import { useNavigate } from 'react-router-dom';
import { FiTrendingUp, FiUpload, FiBarChart2 } from 'react-icons/fi';
import { statsCache, userCache } from "../Books/utils/cacheManager";
import { supabase } from "../Books/supabaseClient";
import { ProfileAvatar } from "./ProfileAvatar";
import { AuthModals } from "./AuthModals";
import VerificationTierModal from "../Books/VerificationTierModal";
import QRCodeShare from "../../components/QRCodeShare";
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
      const nowIso = new Date().toISOString();
      // Non-blocking fire-and-forget profile update
      await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || null,
            is_active: true,
            last_active_at: nowIso,
            deactivated_at: null,
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
      const nowIso = new Date().toISOString();
      // Non-blocking fire-and-forget profile update
      await supabase
        .from('profiles')
        .update({
          is_active: false,
          deactivated_at: nowIso,
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

  // Fetch subscription tier
  useEffect(() => {
    const fetchUserTier = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setCurrentUserTier('basic');
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('subscription_tier')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching subscription tier:', error);
          setCurrentUserTier('basic');
          return;
        }

        setCurrentUserTier(profile?.subscription_tier || 'basic');
      } catch (err) {
        console.error('Error fetching user tier:', err);
        setCurrentUserTier('basic');
      }
    };

    if (authUser?.id) {
      fetchUserTier();
    }
  }, [authUser?.id]);

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
        
        // Sync avatar from auth metadata to profiles table if not already there (non-blocking)
        if (avatarFromAuth) {
          (async () => {
            try {
              const { error } = await supabase
                .from('profiles')
                .update({ avatar_url: avatarFromAuth })
                .eq('id', user.id);
              if (!error) console.log('✅ Avatar synced to profiles table');
              else console.warn('⚠️ Failed to sync avatar to profiles table:', error);
            } catch (e) {
              console.warn('⚠️ Avatar sync error:', e);
            }
          })();
        }
        
        if (avatarFromAuth) {
          await loadAvatar(avatarFromAuth);
        } else {
          try {
            const { data: prof } = await supabase
              .from('profiles')
              .select('avatar_url')
              .eq('id', user.id)
              .single();
            if (prof?.avatar_url) {
              await loadAvatar(prof.avatar_url);
            } else {
              const stored = JSON.parse(localStorage.getItem('userProfile') || '{}');
              if (stored.avatar) setProfileImage(stored.avatar);
            }
          } catch (_) {}
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
              display: 'flex',
              gap: '24px',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}>
              {/* Grid Actions Button */}
              {authUser && (
                <button
                  onClick={() => setShowActionsGrid(!showActionsGrid)}
                  style={{
                    padding: '4px 6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#00a884',
                    backgroundColor: showActionsGrid ? 'rgba(0, 168, 132, 0.2)' : 'transparent',
                    border: '1px solid #00a884',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 168, 132, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = showActionsGrid ? 'rgba(0, 168, 132, 0.2)' : 'transparent';
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
              background: '#0d1217',
              borderRadius: '8px',
              border: 'none',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              marginTop: '12px'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '16px',
                justifyContent: 'space-between'
              }}>
                {/* Left Column - 2 buttons */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  flex: 1
                }}>
                {/* Stats */}
                <button
                  onClick={() => {
                    setShowActionsGrid(false);
                    setIsOpen(false);
                    navigate('/books/reading-dashboard');
                  }}
                  style={{
                    padding: '5px 9px',
                    background: 'transparent',
                    border: '1px solid #00a884',
                    color: '#00a884',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '10px',
                    fontWeight: '600',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                    width: '100%',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 168, 132, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <FiBarChart2 size={13} />
                  Stats
                </button>

                {/* Upload */}
                <button
                  onClick={() => {
                    setShowActionsGrid(false);
                    setIsOpen(false);
                    navigate('/user/upload');
                  }}
                  style={{
                    padding: '5px 9px',
                    background: 'transparent',
                    border: '1px solid #34B7F1',
                    color: '#34B7F1',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '10px',
                    fontWeight: '600',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                    width: '100%',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(52, 183, 241, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <FiUpload size={13} />
                  Upload
                </button>
                </div>

                {/* Right Column - 3 buttons */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  flex: 1
                }}>

                {/* QR Code */}
                <button
                  onClick={() => {
                    setShowActionsGrid(false);
                    setShowQRCode(true);
                  }}
                  style={{
                    padding: '5px 9px',
                    background: 'transparent',
                    border: '1px solid #a78bfa',
                    color: '#a78bfa',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '10px',
                    fontWeight: '600',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                    width: '100%',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(167, 139, 250, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  📱
                  <span>QR Code</span>
                </button>

                {/* Upgrade */}
                {currentUserTier === 'basic' && (
                  <button
                    onClick={() => {
                      setShowActionsGrid(false);
                      setShowVerificationModal(true);
                    }}
                    style={{
                      padding: '5px 9px',
                      background: 'transparent',
                      border: '1px solid #f59e0b',
                      color: '#f59e0b',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '10px',
                      fontWeight: '600',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                      width: '100%',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    ⬆️
                    <span>Upgrade</span>
                  </button>
                )}

                {/* Sign Out */}
                <button
                  onClick={() => {
                    setShowActionsGrid(false);
                    setShowSignOutModal(true);
                  }}
                  style={{
                    padding: '5px 9px',
                    background: 'transparent',
                    border: '1px solid #ff6b6b',
                    color: '#ff6b6b',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '10px',
                    fontWeight: '600',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                    width: '100%',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  🚪
                  <span>Sign Out</span>
                </button>
                </div>
              </div>
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
    </>
  );

};