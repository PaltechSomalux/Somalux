import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { UserCircle, SignOut, Bookmark, IdentificationCard } from "@phosphor-icons/react";
import { useNavigate } from 'react-router-dom';
import { FiTrendingUp, FiUpload, FiDownload, FiBarChart2, FiStar, FiEdit3, FiPlusCircle } from 'react-icons/fi';
import { statsCache, userCache } from "../Books/utils/cacheManager";
import { supabase } from "../Books/supabaseClient";
import { ProfileAvatar } from "./ProfileAvatar";
import { AuthModals } from "./AuthModals";
import VerificationTierModal from "../Books/VerificationTierModal";
import VerificationBadge from "../Books/Admin/components/VerificationBadge";
import QRCodeShare from "../../components/QRCodeShare";
import { API_URL } from "../../config";
import { fetchBooks, fetchCategories, createBookSubmission } from "../Books/Admin/api";
import { fetchPastPapers, getUniversitiesForDropdown, getFacultiesByUniversity, getUnitNamesByUniversityAndFaculty, getYearsByUniversityFacultyAndUnitName, createPastPaperSubmission } from "../Books/Admin/pastPapersApi";
import "./Profile.css";
import { toast } from 'react-toastify';

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
  const [showRequestModal, setShowRequestModal] = useState(false);
  // Questionnaire fields
  const [requestType, setRequestType] = useState('book');
  const [itemTitle, setItemTitle] = useState('');
  const [itemAuthor, setItemAuthor] = useState('');
  const [itemYear, setItemYear] = useState('');
  const [priority, setPriority] = useState('normal');
  const [externalLink, setExternalLink] = useState('');
  const [isbn, setIsbn] = useState('');
  const [edition, setEdition] = useState('');
  const [publisher, setPublisher] = useState('');
  const [preferredFormats, setPreferredFormats] = useState({ pdf: true, epub: false, hardcopy: false });
  const [courseOrFaculty, setCourseOrFaculty] = useState('');
  const [semester, setSemester] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [requestText, setRequestText] = useState('');
  const [requestSending, setRequestSending] = useState(false);
  const [existingBooks, setExistingBooks] = useState([]);
  const [existingPapers, setExistingPapers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [unitNames, setUnitNames] = useState([]);
  const [yearsOptions, setYearsOptions] = useState([]);
  const [bookFile, setBookFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [paperFile, setPaperFile] = useState(null);
  const [categoryId, setCategoryId] = useState('');

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

  const sendRequestToAdmin = async () => {
    if (!authUser) {
      setShowAuthModal(true);
      return;
    }

    // Basic validation depending on type
    if (!requestType) {
      alert('Please select a request type.');
      return;
    }
    if ((requestType === 'book' || requestType === 'paper') && !itemTitle.trim()) {
      alert('Please enter the title of the book or paper.');
      return;
    }

    try {
      setRequestSending(true);
      if (requestType === 'book') {
        if (!bookFile) {
          alert('Please attach the book PDF file.');
          setRequestSending(false);
          return;
        }
        const metadata = {
          title: itemTitle || '',
          author: itemAuthor || '',
          description: requestText || '',
          category_id: categoryId || null,
          isbn: isbn || '',
          year: itemYear ? Number(itemYear) : null,
          publisher: publisher || '',
          language: 'English'
        };
        // createBookSubmission uploads files and inserts into submissions table
        await createBookSubmission({ metadata, pdfFile: bookFile, coverFile });
        setShowRequestModal(false);
        setBookFile(null);
      } else if (requestType === 'paper') {
        if (!paperFile) {
          alert('Please attach the past paper PDF.');
          setRequestSending(false);
          return;
        }
        const metadata = {
          university_id: courseOrFaculty || null,
          faculty: publisher || '',
          unit_code: itemAuthor || '',
          unit_name: itemTitle || '',
          year: itemYear ? Number(itemYear) : null,
          semester: semester || '',
          exam_type: priority || 'Main Exam'
        };
        await createPastPaperSubmission({ metadata, pdfFile: paperFile });
        setShowRequestModal(false);
        setPaperFile(null);
      } else {
        // feature/other fallback to existing requests endpoint
        const payload = {
          userId: authUser?.id || null,
          userEmail: authUser?.email || null,
          userName: authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || 'User',
          type: requestType,
          title: itemTitle?.trim() || null,
          notes: requestText?.trim() || null,
          link: externalLink?.trim() || null,
          createdAt: new Date().toISOString()
        };
        const res = await fetch(`${API_BASE.replace(/\/$/, '')}/api/requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `Failed to send request (${res.status})`);
        }
        setShowRequestModal(false);
      }

      // Reset common fields
      setRequestText('');
      setItemTitle('');
      setItemAuthor('');
      setItemYear('');
      setExternalLink('');
      setPriority('normal');
      setRequestType('book');
      setIsbn('');
      setEdition('');
      setPublisher('');
      setPreferredFormats({ pdf: true, epub: false, hardcopy: false });
      setCourseOrFaculty('');
      setSemester('');
      setAttachments([]);
      
      // Show success toast (prefer admin-style toast if present)
      try {
        const adminPresent = !!document.querySelector('.toast-container');
        const successMessage = '✓ Request submitted — Thank you! Our admin team will review it shortly.';
        if (adminPresent) {
          window.dispatchEvent(new CustomEvent('SomaLux:showToast', { detail: { type: 'success', message: successMessage } }));
        } else {
          toast.success(successMessage);
        }
      } catch (e) {
        try { toast.success('✓ Request submitted — Thank you! Our admin team will review it shortly.'); } catch (_) {}
      }
    } catch (e) {
      console.error('Request send error', e);
      try {
        const adminPresent = !!document.querySelector('.toast-container');
        const errMsg = e?.message || '✗ Failed to send request. Please try again later.';
        if (adminPresent) {
          window.dispatchEvent(new CustomEvent('SomaLux:showToast', { detail: { type: 'error', message: errMsg } }));
        } else {
          toast.error(errMsg);
        }
      } catch (_) {
        try { toast.error(e.message || '✗ Failed to send request. Please try again later.'); } catch (_) {}
      }
    } finally {
      setRequestSending(false);
    }
  };

  // Load available content for dropdowns when modal opens
  useEffect(() => {
    if (!showRequestModal) return;
    (async () => {
      try {
        const booksResp = await fetchBooks({ page: 1, pageSize: 200 });
        // fetchBooks returns { data, count }
        if (booksResp) {
          const list = booksResp.data || booksResp.items || booksResp;
          if (Array.isArray(list)) setExistingBooks(list);
        }
      } catch (e) {
        console.warn('Failed to load existing books', e);
      }

      try {
        const papersResp = await fetchPastPapers({ page: 1, pageSize: 200 });
        if (papersResp) {
          const list = papersResp.data || papersResp.items || papersResp;
          if (Array.isArray(list)) setExistingPapers(list);
        }
      } catch (e) {
        console.warn('Failed to load existing past papers', e);
      }

      // fetch categories and universities for dropdowns
      try {
        const cats = await fetchCategories();
        if (Array.isArray(cats)) setCategories(cats);
      } catch (e) {
        console.warn('Failed to fetch categories', e);
      }

      try {
        const unis = await getUniversitiesForDropdown({ forceRefresh: false });
        if (Array.isArray(unis)) setUniversities(unis);
      } catch (e) {
        console.warn('Failed to fetch universities', e);
      }
    })();
  }, [showRequestModal]);

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
              background: '#111b21',
              borderRadius: '0',
              border: 'none',
              boxShadow: 'none',
              marginTop: '8px',
              marginLeft: '-10px',
              marginRight: '-10px',
              marginBottom: '-10px',
              paddingLeft: '22px',
              paddingRight: '22px',
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

              {/* Request (send message to admin) */}
              <button
                onClick={() => {
                  setShowActionsGrid(false);
                  if (!authUser) setShowAuthModal(true);
                  else navigate('/user/request');
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
                  gap: '4px'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1a2332'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0b1216'; }}
                title="Send request to admin"
              >
                <FiEdit3 size={14} />
                Request
              </button>

              {/* Create Ad */}
              <button
                onClick={() => {
                  setShowActionsGrid(false);
                  if (!authUser) setShowAuthModal(true);
                  else navigate('/user/ad');
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
                  gap: '4px'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1a2332'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0b1216'; }}
                title="Create ad for approval"
              >
                <FiPlusCircle size={14} />
                Create Ad
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

      {/* Request Modal */}
      {showRequestModal && (
        <div className="qr-modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div
            className="qr-modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '600px', overflow: 'visible', position: 'relative' }}
          >
            <button
              className="qr-modal-close-btn"
              onClick={() => setShowRequestModal(false)}
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

            <div style={{ padding: '18px', background: '#071015', borderRadius: '8px' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>Send a request to admin</h3>
              <p style={{ margin: '6px 0 12px 0', color: '#8696a0', fontSize: '12px' }}>
                Use the form below to request books, past papers, or suggest improvements. Filling the fields helps us fulfil requests faster.
              </p>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <label style={{ color: '#e9edef', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="radio" name="reqType" checked={requestType === 'book'} onChange={() => setRequestType('book')} />
                  Book
                </label>
                <label style={{ color: '#e9edef', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="radio" name="reqType" checked={requestType === 'paper'} onChange={() => setRequestType('paper')} />
                  Past Paper
                </label>
                <label style={{ color: '#e9edef', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="radio" name="reqType" checked={requestType === 'feature'} onChange={() => setRequestType('feature')} />
                  Feature / Improvement
                </label>
                <label style={{ color: '#e9edef', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="radio" name="reqType" checked={requestType === 'other'} onChange={() => setRequestType('other')} />
                  Other
                </label>
              </div>

              {/* Conditional fields: Book vs Past Paper vs Feature/Other */}
              {requestType === 'book' && (
                <>
                  {/* Book upload style request */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                    <div>
                      <label style={{ color: '#8696a0', fontSize: '12px', display: 'block', marginBottom: '6px' }}>PDF File *</label>
                      <div style={{ border: '1px dashed #2a3942', borderRadius: 6, padding: 12, background: '#071014' }}>
                        <input type="file" accept=".pdf" onChange={(e)=>{ const f = e.target.files?.[0]; setBookFile(f); }} />
                        {bookFile && <div style={{ color: '#e9edef', marginTop: 8 }}>{bookFile.name} ({Math.round(bookFile.size/1024)} KB)</div>}
                      </div>

                      <div style={{ marginTop: 12 }}>
                        <label style={{ color: '#8696a0', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Cover Image (optional)</label>
                        <div style={{ border: '1px dashed #2a3942', borderRadius: 6, padding: 12, background: '#071014' }}>
                          <input type="file" accept="image/*" onChange={(e)=>{ const f = e.target.files?.[0]; setCoverFile(f); }} />
                          {coverFile && <div style={{ color: '#e9edef', marginTop: 8 }}>{coverFile.name} ({Math.round(coverFile.size/1024)} KB)</div>}
                        </div>
                      </div>
                    </div>

                    <div>
                      <input value={itemTitle} onChange={(e)=>setItemTitle(e.target.value)} placeholder="Title" style={{ width: '100%', padding: 8, marginBottom: 8 }} />
                      <input value={itemAuthor} onChange={(e)=>setItemAuthor(e.target.value)} placeholder="Author" style={{ width: '100%', padding: 8, marginBottom: 8 }} />
                      <textarea value={requestText} onChange={(e)=>setRequestText(e.target.value)} placeholder="Short description" style={{ width: '100%', padding: 8, minHeight: 80, marginBottom: 8 }} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <select value={priority} onChange={(e)=>setPriority(e.target.value)} style={{ flex: 1 }}>
                          <option value="low">Low</option>
                          <option value="normal">Normal</option>
                          <option value="high">High</option>
                        </select>
                        <select value={String(preferredFormats.pdf)} onChange={(e)=>setPreferredFormats({...preferredFormats, pdf: e.target.value === 'true'})} style={{ width: 120 }}>
                          <option value={true}>PDF</option>
                          <option value={false}>Other</option>
                        </select>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                        <select value={categoryId} onChange={(e)=>{ const id = e.target.value; setCategoryId(id); const cat = categories.find(c=>String(c.id)===String(id)); if(cat) setCourseOrFaculty(cat.name); }}>
                          <option value="">Category</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <input value={publisher} onChange={(e)=>setPublisher(e.target.value)} placeholder="Publisher" />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                        <input value={itemYear} onChange={(e)=>setItemYear(e.target.value)} placeholder="Year" />
                        <input value={isbn} onChange={(e)=>setIsbn(e.target.value)} placeholder="ISBN" />
                      </div>
                    </div>
                  </div>
                  {/* Existing books dropdown to help users pick an already-available item */}
                  {existingBooks && existingBooks.length > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ color: '#8696a0', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Match existing book (optional)</label>
                      <select
                        onChange={(e) => {
                          const id = e.target.value;
                          const b = existingBooks.find(x => String(x.id) === String(id));
                          if (b) {
                            setItemTitle(b.title || '');
                            setItemAuthor(b.author || '');
                            setPublisher(b.publisher || '');
                            setIsbn(b.isbn || '');
                            setEdition(b.edition || '');
                          }
                        }}
                        defaultValue=""
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #2a3942', background: '#0b1216', color: '#e9edef' }}
                      >
                        <option value="">-- select existing book --</option>
                        {existingBooks.map(b => <option key={b.id} value={b.id}>{b.title}{b.author ? ` — ${b.author}` : ''}</option>)}
                      </select>
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <input
                      value={itemTitle}
                      onChange={(e) => setItemTitle(e.target.value)}
                      placeholder={'Book title (required)'}
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #2a3942', background: '#0b1216', color: '#e9edef' }}
                    />
                    <input
                      value={itemAuthor}
                      onChange={(e) => setItemAuthor(e.target.value)}
                      placeholder={'Author'}
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #2a3942', background: '#0b1216', color: '#e9edef' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <input
                      value={publisher}
                      onChange={(e) => setPublisher(e.target.value)}
                      placeholder="Publisher"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #2a3942', background: '#0b1216', color: '#e9edef' }}
                    />
                    <input
                      value={itemYear}
                      onChange={(e) => setItemYear(e.target.value)}
                      placeholder="Year"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #2a3942', background: '#0b1216', color: '#e9edef' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <input
                      value={isbn}
                      onChange={(e) => setIsbn(e.target.value)}
                      placeholder="ISBN"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #2a3942', background: '#0b1216', color: '#e9edef' }}
                    />
                    <input
                      value={edition}
                      onChange={(e) => setEdition(e.target.value)}
                      placeholder="Edition"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #2a3942', background: '#0b1216', color: '#e9edef' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <input
                      value={courseOrFaculty}
                      onChange={(e) => setCourseOrFaculty(e.target.value)}
                      placeholder="Category / Subject"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #2a3942', background: '#0b1216', color: '#e9edef' }}
                    />
                    <input
                      value={publisher}
                      onChange={(e) => setPublisher(e.target.value)}
                      placeholder="Language"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #2a3942', background: '#0b1216', color: '#e9edef' }}
                    />
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ color: '#8696a0', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Cover image (optional)</label>
                    <input type="file" accept="image/*" onChange={(e)=>{ const f = e.target.files?.[0]; if (f) setAttachments([f]); }} />
                  </div>

                </>
              )}

              {requestType === 'paper' && (
                <>
                  {/* Past paper upload style request */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                    <div>
                      <label style={{ color: '#8696a0', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Past Paper PDF *</label>
                      <div style={{ border: '1px dashed #2a3942', borderRadius: 6, padding: 12, background: '#071014' }}>
                        <input type="file" accept=".pdf" onChange={(e)=>{ const f = e.target.files?.[0]; setPaperFile(f); }} />
                        {paperFile && <div style={{ color: '#e9edef', marginTop: 8 }}>{paperFile.name} ({Math.round(paperFile.size/1024)} KB)</div>}
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <select value={courseOrFaculty} onChange={async (e)=>{ const v=e.target.value; setCourseOrFaculty(v); try{ const facs = await getFacultiesByUniversity(v); setFaculties(Array.isArray(facs)?facs:[]); }catch(e){console.warn(e);} }}>
                          <option value="">Select University</option>
                          {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                        <select value={publisher} onChange={async (e)=>{ const v=e.target.value; setPublisher(v); try{ const unitNamesData = await getUnitNamesByUniversityAndFaculty(courseOrFaculty, v); setUnitNames(Array.isArray(unitNamesData)?unitNamesData:[]); }catch(e){console.warn(e);} }}>
                          <option value="">Select Faculty</option>
                          {faculties.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                        <select value={itemTitle} onChange={async (e)=>{ const v=e.target.value; setItemTitle(v); try{ const yrs = await getYearsByUniversityFacultyAndUnitName(courseOrFaculty, publisher, v); setYearsOptions(Array.isArray(yrs)?yrs:[]); }catch(e){console.warn(e);} }}>
                          <option value="">Select Unit Name</option>
                          {unitNames.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                        <input value={itemAuthor} onChange={(e)=>setItemAuthor(e.target.value)} placeholder="Unit Code e.g., CS101" />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                        <select value={itemYear} onChange={(e)=>setItemYear(e.target.value)}>
                          <option value="">Select Year</option>
                          {yearsOptions.map(y => <option key={y} value={String(y)}>{y}</option>)}
                        </select>
                        <select value={semester} onChange={(e)=>setSemester(e.target.value)}>
                          <option value="">Select Semester</option>
                          <option value="First">First</option>
                          <option value="Second">Second</option>
                        </select>
                      </div>

                      <div style={{ marginTop: 8 }}>
                        <label style={{ color: '#8696a0', fontSize: '12px' }}>Exam Type</label>
                        <select value={priority} onChange={(e)=>setPriority(e.target.value)}>
                          <option value="Main Exam">Main Exam</option>
                          <option value="Resit">Resit</option>
                          <option value="Midterm">Midterm</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  {/* Existing past papers dropdown */}
                  {existingPapers && existingPapers.length > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ color: '#8696a0', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Match existing past paper (optional)</label>
                      <select
                        onChange={(e) => {
                          const id = e.target.value;
                          const p = existingPapers.find(x => String(x.id) === String(id));
                          if (p) {
                            setCourseOrFaculty(p.university || '');
                            setPublisher(p.faculty || '');
                            setItemTitle(p.unit_name || '');
                            setItemAuthor(p.unit_code || '');
                            setItemYear(p.year ? String(p.year) : '');
                            setSemester(p.semester || '');
                          }
                        }}
                        defaultValue=""
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #2a3942', background: '#0b1216', color: '#e9edef' }}
                      >
                        <option value="">-- select existing paper --</option>
                        {existingPapers.map(p => <option key={p.id} value={p.id}>{p.university} • {p.unit_name} ({p.year})</option>)}
                      </select>
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <input
                      value={courseOrFaculty}
                      onChange={(e) => setCourseOrFaculty(e.target.value)}
                      placeholder="University"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #2a3942', background: '#0b1216', color: '#e9edef' }}
                    />
                    <input
                      value={publisher}
                      onChange={(e) => setPublisher(e.target.value)}
                      placeholder="Faculty"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #2a3942', background: '#0b1216', color: '#e9edef' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <input
                      value={itemTitle}
                      onChange={(e) => setItemTitle(e.target.value)}
                      placeholder="Unit Name"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #2a3942', background: '#0b1216', color: '#e9edef' }}
                    />
                    <input
                      value={itemAuthor}
                      onChange={(e) => setItemAuthor(e.target.value)}
                      placeholder="Unit Code (e.g., CS101)"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #2a3942', background: '#0b1216', color: '#e9edef' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <input
                      value={itemYear}
                      onChange={(e) => setItemYear(e.target.value)}
                      placeholder="Year"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #2a3942', background: '#0b1216', color: '#e9edef' }}
                    />
                    <input
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      placeholder="Semester"
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #2a3942', background: '#0b1216', color: '#e9edef' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ color: '#8696a0', fontSize: '12px', marginRight: '8px' }}>Exam Type:</label>
                    <select value={priority} onChange={(e)=>setPriority(e.target.value)} style={{ background: '#0b1216', color: '#e9edef', border: '1px solid #2a3942', borderRadius: '6px', padding: '6px' }}>
                      <option value="Main Exam">Main Exam</option>
                      <option value="Resit">Resit</option>
                      <option value="Midterm">Midterm</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ color: '#8696a0', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Past Paper PDF (optional)</label>
                    <input type="file" accept=".pdf" onChange={(e)=>{ const f = e.target.files?.[0]; if (f) setAttachments([f]); }} />
                  </div>
                </>
              )}

              {(requestType === 'feature' || requestType === 'other') && (
                <div style={{ marginBottom: '8px' }}>
                  <input
                    value={externalLink}
                    onChange={(e) => setExternalLink(e.target.value)}
                    placeholder="(Optional) Short link or screenshot URL"
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #2a3942', background: '#0b1216', color: '#e9edef', width: '100%' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <label style={{ color: '#8696a0', fontSize: '12px' }}>Priority:</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ background: '#0b1216', color: '#e9edef', border: '1px solid #2a3942', borderRadius: '6px', padding: '6px' }}>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <label style={{ color: '#8696a0', fontSize: '12px' }}>Preferred formats:</label>
                  <label style={{ color: '#e9edef', fontSize: '12px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input type="checkbox" checked={preferredFormats.pdf} onChange={(e) => setPreferredFormats({...preferredFormats, pdf: e.target.checked})} /> PDF
                  </label>
                  <label style={{ color: '#e9edef', fontSize: '12px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input type="checkbox" checked={preferredFormats.epub} onChange={(e) => setPreferredFormats({...preferredFormats, epub: e.target.checked})} /> EPUB
                  </label>
                  <label style={{ color: '#e9edef', fontSize: '12px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input type="checkbox" checked={preferredFormats.hardcopy} onChange={(e) => setPreferredFormats({...preferredFormats, hardcopy: e.target.checked})} /> Hardcopy
                  </label>
                </div>
              </div>

              <textarea
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
                placeholder={'Additional notes (describe exactly what you want, max 1000 chars)'}
                maxLength={1000}
                style={{
                  width: '100%',
                  minHeight: '120px',
                  background: '#0b1216',
                  color: '#e9edef',
                  border: '1px solid #2a3942',
                  borderRadius: '6px',
                  padding: '10px',
                  fontSize: '13px',
                }}
              />

              {/* Attachments */}
              <div style={{ marginTop: '10px', marginBottom: '8px' }}>
                <label style={{ color: '#8696a0', fontSize: '12px', display: 'block', marginBottom: '6px' }}>Attachments (optional) — up to 3 files</label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,image/*,application/epub+zip"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setAttachments(files.slice(0,3));
                  }}
                  style={{ color: '#e9edef' }}
                />
                {attachments && attachments.length > 0 && (
                  <div style={{ marginTop: '8px', color: '#e9edef', fontSize: '13px' }}>
                    {attachments.map((f, i) => <div key={i}>{f.name} ({Math.round(f.size/1024)} KB)</div>)}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right', color: '#8696a0', fontSize: '12px', marginTop: '6px' }}>{requestText.length}/1000</div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', marginTop: '12px', alignItems: 'center' }}>
                <div style={{ color: '#8696a0', fontSize: '13px' }}>
                  <strong>Preview:</strong>
                  <div style={{ fontSize: '12px', color: '#a7b2b8' }}>{requestType} • {priority} priority • {preferredFormats && Object.keys(preferredFormats).filter(k=>preferredFormats[k]).join(', ')}</div>
                  {itemTitle && <div style={{ fontSize: '12px', color: '#a7b2b8' }}>{itemTitle}{itemAuthor ? ` — ${itemAuthor}` : ''}</div>}
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowRequestModal(false)}
                    style={{ padding: '8px 12px', background: '#0b1216', color: '#e9edef', border: '1px solid #2a3942', borderRadius: '6px' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => sendRequestToAdmin()}
                    disabled={requestSending}
                    style={{ padding: '8px 12px', background: '#00a884', color: '#fff', border: 'none', borderRadius: '6px' }}
                  >
                    {requestSending ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </div>
            </div>
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