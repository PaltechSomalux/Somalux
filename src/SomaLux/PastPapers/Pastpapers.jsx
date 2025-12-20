// Pastpapers.jsx - Updated with Auth and Real-time Data
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../Books/supabaseClient';
import {
  fetchPastPapers,
  subscribeToPastPapers,
  getFaculties,
  getUniversitiesForDropdown,
  createPastPaperSubmission,
  trackPastPaperView,
  togglePastPaperLike,
  togglePastPaperBookmark
} from '../Books/Admin/pastPapersApi';
import {
  fetchUniversities,
  rateUniversity,
  getUserUniversityRating,
  getUniversityRatingStats,
  trackUniversityView,
  toggleUniversityLike
} from '../Books/Admin/campusApi';
import { ShareButton } from './PastpaperShare';
import { Download } from './PastpaperDownload';
import { AuthModal } from '../Books/AuthModal';
import { RatingModal } from '../Books/RatingModal';
import { SubscriptionModal } from '../Books/SubscriptionModal';
import SecureReader from '../Books/SecureReader';
import SimpleScrollReader from '../Books/SimpleScrollReader';
import PDFCover from '../Books/PDFCover';
import { FaSearch } from 'react-icons/fa';
import { AdBanner } from '../Ads/AdBanner';
import { 
  FiSearch, FiFileText, FiFilter, FiChevronRight, FiChevronLeft, FiX, 
  FiTrendingUp, FiDownload, FiArrowLeft, FiEye, FiStar, FiMapPin, FiUpload, FiBook, FiBookmark
} from 'react-icons/fi';
import { BiCommentDetail } from 'react-icons/bi';
import { motion, AnimatePresence } from 'framer-motion';
import { CommentsSection } from './CommentsSection';
import { UniversityGrid } from './UniversityGrid';
import { API_URL } from '../../config';
import { PaperGrid } from './PaperGrid';
import './PaperPanel.css';

export const PaperPanel = ({ demoMode = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [papers, setPapers] = useState([]);
  const [displayedPapers, setDisplayedPapers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [universitySearchTerm, setUniversitySearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(8);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [welcomeMessage, setWelcomeMessage] = useState(demoMode);
  const [universityFilter, setUniversityFilter] = useState(null);
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authAction, setAuthAction] = useState('view');
  const [universities, setUniversities] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [showBookmarksPanel, setShowBookmarksPanel] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [ratingStats, setRatingStats] = useState({});
  const [userRatings, setUserRatings] = useState({});
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [universityLikes, setUniversityLikes] = useState(() => {
    try {
      const saved = localStorage.getItem('universityLikes');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [universityLikesCounts, setUniversityLikesCounts] = useState(() => {
    try {
      const saved = localStorage.getItem('universityLikesCounts');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [paperLikes, setPaperLikes] = useState(() => {
    try {
      const saved = localStorage.getItem('paperLikes');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [paperLikesCounts, setPaperLikesCounts] = useState(() => {
    try {
      const saved = localStorage.getItem('paperLikesCounts');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [paperBookmarks, setPaperBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem('paperBookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [paperBookmarksCounts, setpaperBookmarksCounts] = useState(() => {
    try {
      const saved = localStorage.getItem('paperBookmarksCounts');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadPdf, setUploadPdf] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    faculty: '',
    unit_code: '',
    unit_name: '',
    year: '',
    semester: '',
    exam_type: 'Main'
  });
  const [notification, setNotification] = useState(null);

  // Comments state for CommentsSection
  const [mediaComments, setMediaComments] = useState({});
  const [commentLikes, setCommentLikes] = useState({});
  const commentsRef = useRef(null);

  const carouselRef = useRef(null);

  const [showReader, setShowReader] = useState(false);
  const [readerUrl, setReaderUrl] = useState(null);

  const hasActiveSubscription = useMemo(() => {
    if (!subscription || !subscription.end_at) return false;
    return new Date(subscription.end_at) > new Date();
  }, [subscription]);

  // Check authentication status
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        setAuthModalOpen(false);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const fetchSubscription = useCallback(async (currentUser) => {
    if (!currentUser?.id) {
      setSubscription(null);
      return;
    }

    try {
      setCheckingSubscription(true);
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('product', 'past_papers')
        .eq('status', 'active')
        .order('end_date', { ascending: false })
        .limit(1);

      if (error) {
        console.warn('Failed to load past_papers subscription:', error?.message || error);
        // Subscription table may not exist or have RLS issues - set to null and continue
        setSubscription(null);
        return;
      }

      const row = data && data.length > 0 ? data[0] : null;
      if (row && row.end_date && new Date(row.end_date) > new Date()) {
        setSubscription(row);
      } else {
        setSubscription(null);
      }
    } catch (err) {
      console.warn('Past papers subscription check failed:', err?.message || err);
      setSubscription(null);
    } finally {
      setCheckingSubscription(false);
    }
  }, []);

  // Handle university filter from navigation
  useEffect(() => {
    if (location.state?.universityFilter) {
      setUniversityFilter(location.state.universityFilter);
      setSearchTerm(location.state.universityFilter);
      setActiveFilter('university');
    }
  }, [location.state]);

  // Load past papers from database
  useEffect(() => {
    loadPastPapers();
    loadUniversities();
    loadFaculties();
  }, []);

  // Reload papers when university filter changes
  useEffect(() => {
    if (universityFilter) {
      loadPastPapers();
    }
  }, [universityFilter]);

  // Refresh subscription whenever user changes
  useEffect(() => {
    if (user) {
      fetchSubscription(user);
      // Refresh user-specific university ratings when auth changes
      loadUniversities();
    } else {
      setSubscription(null);
    }
  }, [user, fetchSubscription]);

  // Real-time subscription to universities changes (likes_count updates)
  useEffect(() => {
    const subscription = supabase
      .channel('universities-likes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'universities',
          filter: 'likes_count=neq.null'
        },
        (payload) => {
          if (payload.new && payload.new.likes_count !== undefined) {
            // Update the university in our state with new likes_count
            setUniversities(prevUnis => prevUnis.map(u => 
              u.id === payload.new.id ? { ...u, likes_count: payload.new.likes_count } : u
            ));
            
            // Update the counts state
            setUniversityLikesCounts(counts => ({
              ...counts,
              [payload.new.id]: payload.new.likes_count
            }));
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleUniversityRateClick = (e, university) => {
    e.stopPropagation();
    if (!user) {
      setAuthAction('action');
      setAuthModalOpen(true);
      return;
    }
    setSelectedUniversity(university);
    setRatingModalOpen(true);
  };

  const handleUniversityRate = async (rating) => {
    if (!selectedUniversity || !user) return;

    try {
      await rateUniversity(selectedUniversity.id, rating);

      setUserRatings(prev => ({
        ...prev,
        [selectedUniversity.id]: rating
      }));

      const stats = await getUniversityRatingStats(selectedUniversity.id);
      setRatingStats(prev => ({
        ...prev,
        [selectedUniversity.id]: stats
      }));

      setRatingModalOpen(false);
    } catch (error) {
      console.error('Error submitting university rating:', error);
    }
  };

  const onUploadChange = (k) => (e) => {
    setUploadForm((f) => ({ ...f, [k]: e.target.value }));
  };

  const handleSubmitUpload = async () => {
    if (!user) {
      setNotification({ type: 'error', message: 'Please sign in to upload a past paper' });
      setTimeout(() => setNotification(null), 4000);
      setAuthAction('action');
      setAuthModalOpen(true);
      return;
    }
    if (!uploadPdf) {
      setNotification({ type: 'error', message: 'Please select a PDF file to upload' });
      setTimeout(() => setNotification(null), 4000);
      return;
    }
    if (!uploadForm.faculty || !uploadForm.unit_code || !uploadForm.unit_name) {
      setNotification({ type: 'error', message: 'Please fill in all required fields (Faculty, Unit Code, Unit Name)' });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    const currentUni = universities.find(
      (u) => u.name?.toLowerCase() === (universityFilter || '').toLowerCase()
    );

    setUploadBusy(true);
    try {
      const metadata = {
        university_id: currentUni?.id || null,
        faculty: uploadForm.faculty,
        unit_code: uploadForm.unit_code,
        unit_name: uploadForm.unit_name,
        year: uploadForm.year ? Number(uploadForm.year) : null,
        semester: uploadForm.semester || '',
        exam_type: uploadForm.exam_type || 'Main',
        uploaded_by: user?.id || null
      };

      await createPastPaperSubmission({ metadata, pdfFile: uploadPdf });

      setNotification({ 
        type: 'success', 
        message: '✓ Thank you! Your past paper has been submitted and is awaiting review.' 
      });
      
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadPdf(null);
        setUploadForm({
          faculty: '',
          unit_code: '',
          unit_name: '',
          year: '',
          semester: '',
          exam_type: 'Main'
        });
        setNotification(null);
      }, 2000);
    } catch (e) {
      console.error('Past paper submission failed:', e);
      setNotification({ 
        type: 'error', 
        message: e?.message || 'Failed to submit past paper. Please try again.' 
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setUploadBusy(false);
    }
  };

  const loadPastPapers = async () => {
    setLoading(true);
    try {
      const { data } = await fetchPastPapers({ page: 1, pageSize: 100 });
      console.log('Raw fetched papers:', data);
      
      // Transform data to match expected format
      const transformedData = data.map(paper => {
        // file_url now contains the properly generated public URL from the API
        const downloadUrl = paper.file_url || null;
        
        // Handle university name from nested object or field
        const universityName = paper.universities?.name || paper.university || 'Unknown';
        
        if (!downloadUrl) {
          console.warn('⚠️ Missing file_url for paper:', paper.id, paper.title);
        } else {
          console.log('✓ Paper URL generated:', downloadUrl);
        }

        return {
          id: paper.id,
          title: paper.title || `${paper.unit_code || ''} - ${paper.unit_name || ''}`,
          course: paper.unit_name,
          courseCode: paper.unit_code,
          faculty: paper.faculty || 'Unknown',
          university: universityName,
          year: paper.year,
          semester: paper.semester,
          examType: paper.exam_type,
          downloads: paper.downloads_count || 0,
          downloads_count: paper.downloads_count || 0,
          views: paper.views_count || 0,
          views_count: paper.views_count || 0,
          file_url: paper.file_url,
          downloadUrl: downloadUrl,
          created_at: paper.created_at
        };
      });
      console.log('Transformed papers:', transformedData);
      setPapers(transformedData);
    } catch (error) {
      console.error('Error loading past papers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUniversities = async () => {
    try {
      const { data } = await fetchUniversities({ page: 1, pageSize: 50 });
      setUniversities(data || []);

      // Load rating stats for these universities
      const stats = {};
      for (const uni of data || []) {
        const stat = await getUniversityRatingStats(uni.id);
        stats[uni.id] = stat;
      }
      setRatingStats(stats);

      // Load current user ratings if logged in
      if (user) {
        const userRatingsMap = {};
        for (const uni of data || []) {
          const rating = await getUserUniversityRating(uni.id);
          if (rating) userRatingsMap[uni.id] = rating;
        }
        setUserRatings(userRatingsMap);
      }
    } catch (error) {
      console.error('Error loading universities:', error);
    }
  };

  const loadFaculties = async () => {
    try {
      const data = await getFaculties();
      setFaculties(data);
    } catch (error) {
      console.error('Error loading faculties:', error);
    }
  };

  // Real-time subscription for past papers
  useEffect(() => {
    const subscription = subscribeToPastPapers((payload) => {
      console.log('Past paper change detected:', payload);
      loadPastPapers();
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Load persisted comments & replies for the selected paper
  useEffect(() => {
    const loadCommentsForPaper = async () => {
      if (!selectedPaper) return;
      try {
        const { data: comments, error: commentsError } = await supabase
          .from('past_paper_comments')
          .select('*')
          .eq('paper_id', selectedPaper.id)
          .order('created_at', { ascending: true });

        if (commentsError) throw commentsError;

        const commentRows = comments || [];
        const commentIds = commentRows.map(c => c.id);

        // Load replies for these comments
        let replyRows = [];
        if (commentIds.length > 0) {
          const { data: replies, error: repliesError } = await supabase
            .from('past_paper_replies')
            .select('*')
            .in('comment_id', commentIds)
            .order('created_at', { ascending: true });

          if (repliesError) throw repliesError;
          replyRows = replies || [];
        }

        // Load likes for these comments
        let likeRows = [];
        if (commentIds.length > 0) {
          const { data: likes, error: likesError } = await supabase
            .from('past_paper_comment_likes')
            .select('comment_id, user_id')
            .in('comment_id', commentIds);

          if (likesError) throw likesError;
          likeRows = likes || [];
        }

        const repliesByComment = {};
        replyRows.forEach(r => {
          if (!repliesByComment[r.comment_id]) repliesByComment[r.comment_id] = [];
          repliesByComment[r.comment_id].push({
            id: r.id,
            user: r.user_email || 'Anonymous',
            text: r.text,
            timestamp: r.created_at,
            liked: false,
            media: r.media_url ? { type: r.media_type, url: r.media_url } : null,
          });
        });

        // Build like counts (excluding current user) and user liked state
        const likeCountsExcludingSelf = {};
        const userLikedMap = {};
        likeRows.forEach(like => {
          const isSelf = user && like.user_id === user.id;
          if (isSelf) {
            userLikedMap[like.comment_id] = true;
          } else {
            likeCountsExcludingSelf[like.comment_id] = (likeCountsExcludingSelf[like.comment_id] || 0) + 1;
          }
        });

        const mappedComments = commentRows.map(c => ({
          id: c.id,
          user: c.user_email || 'Anonymous',
          text: c.text,
          timestamp: c.created_at,
          liked: false,
          likes: likeCountsExcludingSelf[c.id] || 0,
          media: c.media_url ? { type: c.media_type, url: c.media_url } : null,
          replies: repliesByComment[c.id] || [],
        }));

        // Set comments and current user's liked map
        setMediaComments(prev => ({
          ...prev,
          [selectedPaper.id]: mappedComments,
        }));

        setCommentLikes(userLikedMap);
      } catch (e) {
        console.error('Failed to load past paper comments:', e);
      }
    };

    loadCommentsForPaper();
  }, [selectedPaper]);

  // Comment handlers for CommentsSection
  const handleSubmitComment = async (commentData) => {
    if (!user) {
      setAuthAction('comment');
      setAuthModalOpen(true);
      return;
    }

    try {
      // Upload media to storage if present
      let mediaUrl = null;
      let mediaType = null;
      if (commentData.file) {
        const ext = commentData.file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase
          .storage
          .from('comment_media')
          .upload(path, commentData.file, {
            upsert: true,
            contentType: commentData.file.type,
          });
        if (uploadErr) throw uploadErr;

        const { data: publicData } = supabase
          .storage
          .from('comment_media')
          .getPublicUrl(path);
        mediaUrl = publicData?.publicUrl || null;
        mediaType = commentData.file.type.startsWith('image')
          ? 'image'
          : commentData.file.type.startsWith('video')
          ? 'video'
          : commentData.file.type.startsWith('audio')
          ? 'audio'
          : 'file';
      }

      const { data, error } = await supabase
        .from('past_paper_comments')
        .insert({
          paper_id: selectedPaper.id,
          user_id: user.id,
          user_email: user.email,
          text: commentData.text,
          media_url: mediaUrl,
          media_type: mediaType,
        })
        .select()
        .single();

      if (error) throw error;

      // Optimistic update with persisted values
      setMediaComments(prev => ({
        ...prev,
        [selectedPaper.id]: [
          ...(Array.isArray(prev[selectedPaper.id]) ? prev[selectedPaper.id] : []),
          {
            id: data.id,
            user: user.email || 'Anonymous',
            text: data.text,
            timestamp: data.created_at,
            liked: false,
            replies: [],
            likes: 0,
            media: data.media_url ? { type: data.media_type, url: data.media_url } : null,
          },
        ],
      }));
    } catch (err) {
      console.error('Failed to submit past paper comment:', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    // Optimistic local delete
    setMediaComments((prev) => ({
      ...prev,
      [selectedPaper.id]: (prev[selectedPaper.id] || []).filter((comment) => comment.id !== commentId),
    }));

    try {
      await supabase
        .from('past_paper_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user?.id || null);
    } catch (err) {
      console.warn('Failed to delete past paper comment:', err);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!user) {
      setAuthAction('action');
      setAuthModalOpen(true);
      return;
    }

    const isCurrentlyLiked = !!commentLikes[commentId];

    // Optimistic toggle
    setCommentLikes(prev => {
      const next = { ...prev };
      if (isCurrentlyLiked) {
        delete next[commentId];
      } else {
        next[commentId] = true;
      }
      return next;
    });

    try {
      if (isCurrentlyLiked) {
        // Unlike: remove row
        await supabase
          .from('past_paper_comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
      } else {
        // Like: insert row
        const { error } = await supabase
          .from('past_paper_comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id,
          });
        if (error && error.code !== '23505') {
          // 23505 = unique_violation; ignore if already liked
          throw error;
        }
      }
    } catch (err) {
      console.error('Failed to toggle like for past paper comment:', err);
    }
  };

  const handleReplyToComment = async (commentId, replyData) => {
    if (!user) {
      setAuthAction('comment');
      setAuthModalOpen(true);
      return;
    }

    try {
      // Upload media to storage if present
      let mediaUrl = null;
      let mediaType = null;
      if (replyData.file) {
        const ext = replyData.file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase
          .storage
          .from('comment_media')
          .upload(path, replyData.file, {
            upsert: true,
            contentType: replyData.file.type,
          });
        if (uploadErr) throw uploadErr;

        const { data: publicData } = supabase
          .storage
          .from('comment_media')
          .getPublicUrl(path);
        mediaUrl = publicData?.publicUrl || null;
        mediaType = replyData.file.type.startsWith('image')
          ? 'image'
          : replyData.file.type.startsWith('video')
          ? 'video'
          : replyData.file.type.startsWith('audio')
          ? 'audio'
          : 'file';
      }

      const { data, error } = await supabase
        .from('past_paper_replies')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          user_email: user.email,
          text: replyData.text,
          media_url: mediaUrl,
          media_type: mediaType,
        })
        .select()
        .single();

      if (error) throw error;

      // Optimistic update
      setMediaComments(prev => {
        const commentsForPaper = Array.isArray(prev[selectedPaper.id]) ? [...prev[selectedPaper.id]] : [];
        const idx = commentsForPaper.findIndex(c => c.id === commentId);
        if (idx !== -1) {
          const newReply = {
            id: data.id,
            user: user.email || 'Anonymous',
            text: data.text,
            timestamp: data.created_at,
            liked: false,
            media: data.media_url ? { type: data.media_type, url: data.media_url } : null,
          };
          commentsForPaper[idx] = {
            ...commentsForPaper[idx],
            replies: Array.isArray(commentsForPaper[idx].replies)
              ? [...commentsForPaper[idx].replies, newReply]
              : [newReply],
          };
        }
        return {
          ...prev,
          [selectedPaper.id]: commentsForPaper,
        };
      });
    } catch (err) {
      console.error('Failed to submit past paper reply:', err);
    }
  };

  const filteredPapers = useMemo(() => {
    let result = [...papers];
     
    // ALWAYS apply university filter if one is selected - papers are university-specific
    if (universityFilter) {
      result = result.filter(paper => 
        paper.university?.toLowerCase() === universityFilter.toLowerCase()
      );
    }
    
    // Apply search filter (works with university filter too)
    if (searchTerm) {
      const raw = searchTerm.trim().toLowerCase();

      // Try to interpret semester-style queries like "sem 1", "semester 2", "sem3"
      let semesterNumber = null;
      const semMatch = raw.match(/^(sem|semester)\s*([0-9]+)/i) || raw.match(/\bsem\s*([0-9]+)/i);
      if (semMatch && semMatch[2]) {
        semesterNumber = semMatch[2];
      } else {
        // Also allow just "1", "2", "3" if the word "sem" is not present but user typed a small digit
        if (/^[1-9]$/.test(raw)) {
          semesterNumber = raw;
        }
      }

      result = result.filter(paper => {
        const title = (paper.title || '').toLowerCase();
        const course = (paper.course || '').toLowerCase();
        const uni = (paper.university || '').toLowerCase();
        const faculty = (paper.faculty || '').toLowerCase();
        const code = (paper.courseCode || '').toLowerCase();
        const yearStr = String(paper.year || '');
        const semesterStr = String(paper.semester || '').toLowerCase();

        const textMatch =
          title.includes(raw) ||
          course.includes(raw) ||
          uni.includes(raw) ||
          faculty.includes(raw) ||
          code.includes(raw) ||
          yearStr.includes(raw);

        const semesterMatch = semesterNumber
          ? semesterStr.includes(semesterNumber) || semesterStr.includes(`sem ${semesterNumber}`) || semesterStr.includes(`semester ${semesterNumber}`)
          : false;

        return textMatch || semesterMatch;
      });
    }
    
    // Apply other filters
    if (activeFilter === 'recent') {
      result = result.filter(paper => paper.year >= new Date().getFullYear() - 2);
    }
    
    // Apply sorting
    if (sortBy === 'title') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'course') {
      result.sort((a, b) => (a.course || '').localeCompare(b.course || ''));
    } else if (sortBy === 'university') {
      result.sort((a, b) => (a.university || '').localeCompare(b.university || ''));
    } else if (sortBy === 'views') {
      result.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sortBy === 'downloads') {
      result.sort((a, b) => (b.downloads_count || 0) - (a.downloads_count || 0));
    } else if (sortBy === 'year') {
      result.sort((a, b) => (b.year || 0) - (a.year || 0));
    }
    
    return result;
  }, [papers, searchTerm, activeFilter, sortBy, universityFilter]);

  useEffect(() => {
    setDisplayedPapers(filteredPapers.slice(0, visibleCount));
  }, [filteredPapers, visibleCount]);

  const loadMore = () => {
    setVisibleCount(prev => prev + 4);
  };

  const handlePaperClick = async (paper) => {
    if (!user) {
      setAuthAction('view');
      setAuthModalOpen(true);
      return;
    }

    // Track view before showing details
    try {
      console.log('🔍 Tracking view for paper:', paper.id);
      await trackPastPaperView(paper.id);
      console.log('✅ View tracked successfully');
      
      // Update local state with new view count
      setPapers(prevPapers => prevPapers.map(p => {
        if (p.id === paper.id) {
          return {
            ...p,
            views: (p.views || 0) + 1,
            views_count: (p.views_count || 0) + 1
          };
        }
        return p;
      }));
    } catch (err) {
      console.error('❌ Failed to track past paper view:', err);
    }

    // Now show the paper details
    setSelectedPaper(paper);
    setWelcomeMessage(false);
  };

  const viewPaperDetails = async (paper) => {
    if (!user) {
      setAuthAction('view');
      setAuthModalOpen(true);
      return;
    }

    setSelectedPaper(paper);
    setWelcomeMessage(false);
    
    // Track view to database
    try {
      await trackPastPaperView(paper.id);
      // Update local state with new view count
      setPapers(prevPapers => prevPapers.map(p => {
        if (p.id === paper.id) {
          return {
            ...p,
            views: (p.views || 0) + 1,
            views_count: (p.views_count || 0) + 1
          };
        }
        return p;
      }));
    } catch (err) {
      console.error('Failed to track past paper view:', err);
    }
  };

  const openReader = async (paper) => {
    if (!paper) return;
    if (!user) {
      setAuthAction('view');
      setAuthModalOpen(true);
      return;
    }

    try {
      // Use the downloadUrl we already generated in loadPastPapers
      const url = paper.downloadUrl;

      if (!url) {
        console.warn('Unable to resolve reader URL for past paper', paper.id);
        return;
      }

      setSelectedPaper(paper);
      setReaderUrl(url);
      setShowReader(true);
      
      // Track view to database
      try {
        await trackPastPaperView(paper.id);
        // Update local state with new view count
        setPapers(prevPapers => prevPapers.map(p => {
          if (p.id === paper.id) {
            return {
              ...p,
              views: (p.views || 0) + 1,
              views_count: (p.views_count || 0) + 1
            };
          }
          return p;
        }));
      } catch (err) {
        console.error('Failed to track past paper view:', err);
      }
    } catch (e) {
      console.warn('Failed to open reader for past paper', e);
    }
  };

  const closeDetails = () => {
    setSelectedPaper(null);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setShowFilters(false);
    setVisibleCount(8);
    setWelcomeMessage(false);
    
    // Clear university filter if changing to another filter
    if (filter !== 'university') {
      setUniversityFilter(null);
    }
  };

  const handleSortChange = (sortType) => {
    setSortBy(sortType);
    setVisibleCount(8);
    setWelcomeMessage(false);
  };

  const handleToggleUniversityLike = async (uniId) => {
    // Optimistic update - update UI immediately
    setUniversityLikes(prev => {
      const updated = { ...prev };
      updated[uniId] = !updated[uniId];
      localStorage.setItem('universityLikes', JSON.stringify(updated));
      return updated;
    });
    
    // Sync to database and get authoritative count
    const userId = user?.id || 'anonymous-' + Math.random().toString(36).substr(2, 9);
    try {
      const result = await toggleUniversityLike(uniId, userId);
      if (result) {
        // Use the count from database (source of truth)
        setUniversityLikesCounts(counts => {
          const updatedCounts = { ...counts };
          updatedCounts[uniId] = result.count;
          localStorage.setItem('universityLikesCounts', JSON.stringify(updatedCounts));
          return updatedCounts;
        });
        
        // Update the university's likes_count in the universities list
        setUniversities(prevUnis => prevUnis.map(u => 
          u.id === uniId ? { ...u, likes_count: result.count } : u
        ));
      }
    } catch (err) {
      console.error('Failed to sync university like to database:', err);
    }
  };

  const handleTogglePaperLike = async (paperId) => {
    // Optimistic update
    setPaperLikes(prev => {
      const updated = { ...prev };
      updated[paperId] = !updated[paperId];
      localStorage.setItem('paperLikes', JSON.stringify(updated));
      return updated;
    });
    
    // Sync to database and get authoritative count
    const userId = user?.id || 'anonymous-' + Math.random().toString(36).substr(2, 9);
    try {
      const result = await togglePastPaperLike(paperId, userId);
      if (result) {
        // Use the count from database (source of truth)
        setPaperLikesCounts(counts => {
          const updatedCounts = { ...counts };
          updatedCounts[paperId] = result.count;
          localStorage.setItem('paperLikesCounts', JSON.stringify(updatedCounts));
          return updatedCounts;
        });
        
        // Update the paper's likes_count in the papers list
        setDisplayedPapers(prevPapers => prevPapers.map(p => 
          p.id === paperId ? { ...p, likes_count: result.count } : p
        ));
      }
    } catch (err) {
      console.error('Failed to sync paper like to database:', err);
    }
  };

  const handleTogglePaperBookmark = async (paperId) => {
    // Optimistic update
    setPaperBookmarks(prev => {
      if (prev.includes(paperId)) {
        const updated = prev.filter(id => id !== paperId);
        localStorage.setItem('paperBookmarks', JSON.stringify(updated));
        return updated;
      } else {
        const updated = [...prev, paperId];
        localStorage.setItem('paperBookmarks', JSON.stringify(updated));
        return updated;
      }
    });
    
    // Sync to database and get authoritative count
    const userId = user?.id || 'anonymous-' + Math.random().toString(36).substr(2, 9);
    try {
      const result = await togglePastPaperBookmark(paperId, userId);
      if (result) {
        // Use the count from database (source of truth)
        setpaperBookmarksCounts(counts => {
          const updatedCounts = { ...counts };
          updatedCounts[paperId] = result.count;
          localStorage.setItem('paperBookmarksCounts', JSON.stringify(updatedCounts));
          return updatedCounts;
        });
        
        // Update the paper's bookmarks_count in the papers list
        setDisplayedPapers(prevPapers => prevPapers.map(p => 
          p.id === paperId ? { ...p, bookmarks_count: result.count } : p
        ));
      }
    } catch (err) {
      console.error('Failed to sync paper bookmark to database:', err);
    }
  };

  const scrollCarousel = (direction) => {
    const carousel = carouselRef.current;
    if (carousel) {
      const scrollAmount = direction === 'left' ? -100 : 100;
      carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Helper: log past paper search events to backend
  const logSearchEvent = useCallback(
    async ({ queryText, resultsCount }) => {
      try {
        const trimmed = (queryText || '').trim();
        if (!trimmed || trimmed.length < 2) return;

        const { data } = await supabase.auth.getSession();
        const session = data?.session || null;
        const token = session?.access_token || null;
        const currentUserId = session?.user?.id || null;

        let origin = '';
        if (typeof window !== 'undefined') {
          const { protocol, hostname } = window.location || {};
          if (window.__API_ORIGIN__) {
            origin = window.__API_ORIGIN__;
          } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
            origin = `${protocol}//${hostname}:5000`;
          } else {
            origin = API_URL;
          }
        } else {
          origin = API_URL;
        }

        await fetch(`${origin}/api/elib/search-events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            scope: 'past_papers',
            queryText: trimmed,
            userId: currentUserId,
            categoryId: null,
            bookId: null,
            authorName: null,
            pastPaperId: null,
            resultsCount: typeof resultsCount === 'number' ? resultsCount : null,
          }),
        }).catch(() => {});
      } catch (e) {
        console.warn('logSearchEvent (past_papers) failed', e);
      }
    },
    []
  );

  // Debounced logging of past paper searches
  useEffect(() => {
    try {
      const q = (searchTerm || '').trim();
      if (!q || q.length < 2) return;

      const handle = setTimeout(() => {
        logSearchEvent({ queryText: q, resultsCount: filteredPapers.length });
      }, 800);

      return () => clearTimeout(handle);
    } catch {
      // ignore
    }
  }, [searchTerm, filteredPapers.length, logSearchEvent]);

  if (loading) {
    return (
      <div className="containerpast">
        <header className="headerpast">
          <h1 className="titlepast">Past Papers</h1>
          <p className="subtitlepast">Access past exam papers organized by university</p>
        </header>
        
        <div className="controlspast">
          <div className="search-containerpast">
            <input
              type="text"
              className="search-inputpast"
              placeholder="Search papers..."
              disabled
            />
          </div>
          <button className="filter-buttonpast" disabled>
            <FiFilter /> University
          </button>
        </div>
        
        <div className="gridpast">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="skeleton-cardpast">
              <div className="skeleton-iconpast"></div>
              <div className="skeleton-textpast" style={{ width: '70%' }}></div>
              <div className="skeleton-textpast" style={{ width: '90%' }}></div>
              <div className="skeleton-textpast" style={{ width: '50%' }}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="containerpast" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Feed Ad - Between Past Paper Items */}
      <AdBanner placement="papers" limit={1} />
      
      {/* Conditional Header - Show different header based on university selection */}
      {!universityFilter ? (
        <header className="headerpast">
          <h1 className="titlepast">Past Papers</h1>
          <p className="subtitlepast">Browse papers from your university</p>
        </header>
      ) : (
        <header className="headerpast">
          <h1 className="titlepast">{universityFilter} Past Papers</h1>
          <p className="subtitlepast">Access exam papers from {universityFilter}</p>
        </header>
      )}

      {/* Show Universities Grid if no university is selected */}
      {!universityFilter ? (
        <UniversityGrid
          universities={universities}
          universitySearchTerm={universitySearchTerm}
          setUniversitySearchTerm={setUniversitySearchTerm}
          ratingStats={ratingStats}
          userRatings={userRatings}
          papers={papers}
          onUniversitySelect={(uni) => {
            setUniversities(prevUnis => 
              prevUnis.map(u => 
                u.id === uni.id 
                  ? { ...u, views: (u.views || 0) + 1 }
                  : u
              )
            );
            trackUniversityView(uni.id);
            setUniversityFilter(uni.name);
            setSearchTerm('');
            setVisibleCount(8);
          }}
          setRatingModalOpen={setRatingModalOpen}
          setSelectedUniversity={setSelectedUniversity}
          user={user}
          universityLikes={universityLikes}
          universityLikesCounts={universityLikesCounts}
          onToggleLike={handleToggleUniversityLike}
        />
      ) : (
        <>
          {/* Back Button - Responsive Header */}
          <div className="back-header-pastpast" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(134, 150, 160, 0.2)' }}>
            <button 
              onClick={() => {
                setUniversityFilter(null);
                setSearchTerm('');
                setVisibleCount(8);
                setUniversitySearchTerm('');
              }}
              className="back-button-past"
              title="Back to universities"
            >
              <FiChevronLeft size={18} /> Back
            </button>
            <span style={{ color: '#8696a0' }}>|</span>
          </div>

          {/* Search and Filter Controls - Matching BookPanel Layout */}
          <PaperGrid
            displayedPapers={displayedPapers}
            visibleCount={visibleCount}
            setVisibleCount={setVisibleCount}
            filteredPapers={filteredPapers}
            showFilters={showFilters}
            activeFilter={activeFilter}
            sortBy={sortBy}
            searchTerm={searchTerm}
            toggleFilters={toggleFilters}
            handleFilterChange={handleFilterChange}
            handleSortChange={handleSortChange}
            setSearchTerm={setSearchTerm}
            user={user}
            onPaperSelect={handlePaperClick}
            onUploadClick={() => setShowUploadModal(true)}
            onAdminClick={() => navigate('/past-papers/admin')}
            paperLikes={paperLikes}
            paperLikesCounts={paperLikesCounts}
            onToggleLike={handleTogglePaperLike}
            paperBookmarks={paperBookmarks}
            paperBookmarksCounts={paperBookmarksCounts}
            onToggleBookmark={handleTogglePaperBookmark}
          />
        </>
      )}

      {/* Paper Details Modal */}
      <AnimatePresence>
        {selectedPaper && user && (
          <motion.div
            className="modal-overlaypast"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDetails}
          >
            <motion.div
              className="modal-contentpast"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="close-buttonpast" onClick={closeDetails} aria-label="Close">
                <FiX size={18} />
              </button>

              <div className="modal-headerpast">
                <div className="modal-icon-alonepast">
                  <FiFileText size={56} />
                </div>
                <h2 className="modal-titlepast">{selectedPaper.title}</h2>
                <p className="modal-course-namepast">{selectedPaper.course}</p>
                <div className="modal-metapast">
                  {
                    [
                      selectedPaper.university,
                      selectedPaper.year ? `Year: ${selectedPaper.year}` : null,
                      selectedPaper.semester ? `Semester ${selectedPaper.semester}` : null,
                      selectedPaper.examType || null
                    ].filter(Boolean).join(' • ')
                  }
                </div>
              </div>

              <div className="modal-actionspast">
                <button
                  className="wishlist-button-largepast"
                  onClick={() => openReader(selectedPaper)}
                >
                  <FiFileText size={18} />
                  Read
                </button>
                {hasActiveSubscription ? (
                  <Download paper={selectedPaper} />
                ) : (
                  <button
                    className="wishlist-button-largepast"
                    onClick={() => {
                      setShowSubscriptionModal(true);
                    }}
                  >
                    <FiDownload size={18} />
                    Download
                  </button>
                )}
                <div className="stat-itempast">
                  <FiEye size={18} />
                  <span>{selectedPaper.views || 0}</span>
                </div>
                <div className="stat-itempast">
                  <FiDownload size={18} />
                  <span>{selectedPaper.downloads_count || 0}</span>
                </div>
                <div className="stat-itempast">
                  <BiCommentDetail size={18} />
                  <span>{(mediaComments[selectedPaper.id] || []).length}</span>
                </div>
                <ShareButton paper={selectedPaper} variant="minimal" />
              </div>

              <div className="modal-comments-sectionpast">
                <CommentsSection
                  currentMedia={{ id: String(selectedPaper.id) }}
                  currentUser={user?.email || 'User'}
                  showComments={true}
                  commentsRef={commentsRef}
                  mediaComments={mediaComments}
                  commentLikes={commentLikes}
                  onSubmitComment={handleSubmitComment}
                  onDeleteComment={handleDeleteComment}
                  onLikeComment={handleLikeComment}
                  onReplyToComment={handleReplyToComment}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
        action={authAction}
      />

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => {
          setShowSubscriptionModal(false);
        }}
        user={user}
        product="past_papers"
        onSubscribed={(sub) => {
          setSubscription(sub);
          setShowSubscriptionModal(false);
        }}
      />

      {/* Enhanced User Upload Past Paper Modal - Simplified */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            className="upload-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !uploadBusy && setShowUploadModal(false)}
          >
            <motion.div
              className="upload-modal-container"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Simple Header */}
              <div className="upload-header-simple">
                <div>
                  <h2 className="upload-title-simple">Share a Past Paper</h2>
                  <p className="upload-subtitle-simple">Help your classmates succeed</p>
                </div>
                <button
                  className="upload-close-btn"
                  onClick={() => !uploadBusy && setShowUploadModal(false)}
                  aria-label="Close upload"
                  disabled={uploadBusy}
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* Main Form - Simplified */}
              <div className="upload-form-simple">
                {/* Step 1: PDF Upload */}
                <div className="form-section-simple">
                  <div className="step-label">Step 1: Upload PDF</div>
                  <div
                    className={`simple-dropzone ${uploadPdf ? 'has-file' : ''} ${uploadBusy ? 'disabled' : ''}`}
                    onClick={() => !uploadBusy && document.getElementById('user-paper-input')?.click()}
                    onDragOver={(e) => {
                      if (!uploadBusy) {
                        e.preventDefault();
                        e.currentTarget.classList.add('drag-active');
                      }
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('drag-active');
                    }}
                    onDrop={(e) => {
                      if (!uploadBusy) {
                        e.preventDefault();
                        e.currentTarget.classList.remove('drag-active');
                        const file = e.dataTransfer.files?.[0];
                        if (file?.type === 'application/pdf') {
                          setUploadPdf(file);
                        }
                      }
                    }}
                  >
                    <input
                      id="user-paper-input"
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setUploadPdf(e.target.files?.[0] || null)}
                      style={{ display: 'none' }}
                      disabled={uploadBusy}
                    />
                    {uploadPdf ? (
                      <div className="file-status">
                        <div className="success-badge">✓</div>
                        <div>
                          <p className="file-name-text">{uploadPdf.name}</p>
                          <p className="file-size-text">{(uploadPdf.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                    ) : (
                      <div className="dropzone-empty">
                        <FiUpload size={32} />
                        <p>Click to upload or drag & drop</p>
                        <span>PDF format</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2: Basic Info */}
                <div className="form-section-simple">
                  <div className="step-label">Step 2: Course Details</div>
                  
                  <div className="simple-input-group">
                    <label>University</label>
                    <input
                      className="simple-input"
                      value={universityFilter || ''}
                      disabled
                    />
                  </div>

                  <div className="simple-input-group">
                    <label>Faculty <span className="required">*</span></label>
                    <input
                      className="simple-input"
                      placeholder="e.g., Engineering, Business"
                      value={uploadForm.faculty}
                      onChange={onUploadChange('faculty')}
                      disabled={uploadBusy}
                    />
                  </div>

                  <div className="input-row-simple">
                    <div className="simple-input-group">
                      <label>Course Code <span className="required">*</span></label>
                      <input
                        className="simple-input"
                        placeholder="e.g., CS101"
                        value={uploadForm.unit_code}
                        onChange={onUploadChange('unit_code')}
                        disabled={uploadBusy}
                      />
                    </div>

                    <div className="simple-input-group">
                      <label>Course Name <span className="required">*</span></label>
                      <input
                        className="simple-input"
                        placeholder="e.g., Programming"
                        value={uploadForm.unit_name}
                        onChange={onUploadChange('unit_name')}
                        disabled={uploadBusy}
                      />
                    </div>
                  </div>
                </div>

                {/* Step 3: Optional Details */}
                <div className="form-section-simple">
                  <div className="step-label">Step 3: Optional Info</div>
                  
                  <div className="input-row-simple">
                    <div className="simple-input-group">
                      <label>Year</label>
                      <input
                        className="simple-input"
                        type="number"
                        placeholder="2023"
                        min="2000"
                        max={new Date().getFullYear()}
                        value={uploadForm.year}
                        onChange={onUploadChange('year')}
                        disabled={uploadBusy}
                      />
                    </div>

                    <div className="simple-input-group">
                      <label>Semester</label>
                      <select
                        className="simple-input"
                        value={uploadForm.semester}
                        onChange={onUploadChange('semester')}
                        disabled={uploadBusy}
                      >
                        <option value="">Select</option>
                        <option value="1">1st</option>
                        <option value="2">2nd</option>
                        <option value="3">3rd</option>
                      </select>
                    </div>

                    <div className="simple-input-group">
                      <label>Type</label>
                      <select
                        className="simple-input"
                        value={uploadForm.exam_type}
                        onChange={onUploadChange('exam_type')}
                        disabled={uploadBusy}
                      >
                        <option value="Main">Main</option>
                        <option value="Supplementary">Supplementary</option>
                        <option value="CAT">CAT</option>
                        <option value="Mock">Mock</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clean Actions */}
              <div className="upload-actions-simple">
                <button
                  className="btn-secondary-simple"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploadBusy}
                >
                  Cancel
                </button>
                <motion.button
                  className="btn-primary-simple"
                  disabled={uploadBusy || !uploadPdf || !uploadForm.faculty || !uploadForm.unit_code || !uploadForm.unit_name}
                  onClick={handleSubmitUpload}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {uploadBusy ? (
                    <>
                      <span className="spinner-small"></span>
                      Uploading...
                    </>
                  ) : (
                    <>Upload</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <RatingModal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        book={{ id: selectedUniversity?.id, title: selectedUniversity?.name }}
        onRate={handleUniversityRate}
        existingRating={selectedUniversity ? userRatings[selectedUniversity.id] : null}
      />

      {/* PDF Reader - Opens same way as Books */}
      {showReader && selectedPaper && readerUrl && (
        <SimpleScrollReader
          src={readerUrl}
          title={selectedPaper.title}
          author={selectedPaper.courseCode || ''}
          sampleText={`${selectedPaper.university} - ${selectedPaper.year}`}
          onClose={() => {
            setShowReader(false);
            setReaderUrl(null);
          }}
        />
      )}

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            className={`notification-toast notification-${notification.type}`}
            initial={{ opacity: 0, y: -20, x: -20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="notification-content">
              {notification.type === 'success' && (
                <span className="notification-icon">✓</span>
              )}
              {notification.type === 'error' && (
                <span className="notification-icon">✕</span>
              )}
              <p className="notification-message">{notification.message}</p>
            </div>
            <motion.div
              className="notification-progress"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 4, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bookmarks Toggle Button - Only show when university is selected */}
      {user && universityFilter && (() => {
        // Count bookmarks only for papers in the current university
        const currentUniversityBookmarkCount = paperBookmarks.filter(
          bookmarkId => displayedPapers.some(paper => paper.id === bookmarkId)
        ).length;
        
        return (
          <motion.button
            onClick={() => setShowBookmarksPanel(!showBookmarksPanel)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 999,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            title="Bookmarked Papers"
          >
            <FiBookmark size={24} color="#6366f1" />
            {currentUniversityBookmarkCount > 0 && (
              <span style={{
                color: '#ef4444',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {currentUniversityBookmarkCount}
              </span>
            )}
          </motion.button>
        );
      })()}

      {/* Bookmarks Sidebar Panel */}
      <AnimatePresence>
        {showBookmarksPanel && user && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', damping: 25 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '320px',
              height: '100vh',
              background: '#0b1216',
              boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.3)',
              zIndex: 1000,
              padding: '20px',
              overflowY: 'auto',
              borderLeft: '1px solid #2a3942'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#cbd5f5', fontSize: '1.1rem' }}>Bookmarked Papers</h3>
              <button
                onClick={() => setShowBookmarksPanel(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#8696a0',
                  fontSize: '1.2rem'
                }}
              >
                ✕
              </button>
            </div>

            {displayedPapers.filter(p => paperBookmarks.includes(p.id)).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {displayedPapers
                  .filter(p => paperBookmarks.includes(p.id))
                  .map(paper => (
                    <div
                      key={paper.id}
                      onClick={() => {
                        viewPaperDetails(paper);
                        setShowBookmarksPanel(false);
                      }}
                      style={{
                        padding: '12px',
                        background: '#1a2332',
                        border: '1px solid #2a3942',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#252f3c';
                        e.currentTarget.style.borderColor = '#34B7F1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#1a2332';
                        e.currentTarget.style.borderColor = '#2a3942';
                      }}
                    >
                      <div style={{ color: '#cbd5f5', fontSize: '0.9rem', fontWeight: '500', marginBottom: '4px' }}>
                        {paper.unit_name || 'Past Paper'}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                        {paper.year} • {paper.exam_type}
                      </div>
                      <div style={{ color: '#8696a0', fontSize: '0.75rem', marginTop: '4px' }}>
                        {paper.faculty || 'Faculty'}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#8696a0', padding: '40px 0' }}>
                <FiBookmark size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p>No bookmarked papers yet</p>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Bookmark papers to save them for later</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
