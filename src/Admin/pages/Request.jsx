import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCategories } from '../api';
import { getUniversitiesForDropdown, getFacultiesByUniversity, getUnitNamesByUniversityAndFaculty, getYearsByUniversityFacultyAndUnitName } from '../pastPapersApi';
import { FiBook, FiFileText, FiZap, FiAlertCircle, FiStar, FiMoreVertical } from 'react-icons/fi';
import { useAdminUI } from '../AdminUIContext';

const dropzoneStyles = `
  .dropzone {
    border: 1px dotted #374151;
    border-radius: 4px;
    padding: 6px 8px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 12px;
    color: #5a6b77;
  }
  .dropzone:hover {
    border-color: #00a884;
    background: rgba(0, 168, 132, 0.03);
    color: #5a6b77;
  }
  .dropzone.drag-over {
    border-color: #00a884;
    background: rgba(0, 168, 132, 0.06);
    color: #5a6b77;
  }

  /* Wrapper holds optional nav buttons and the scrollable tabs */
  .upload-tabs-wrapper {
    display: flex;
    align-items: center;
    gap: 0;
    margin-bottom: 0;
    padding: 0 6px;
    position: relative;
  }
  /* hide nav buttons on all screens */
  .tab-nav-btn { display: none !important; }
  .tab-nav-btn.visible { display: none !important; }
  .tab-nav-btn.left { display: none !important; }
  .tab-nav-btn.right { display: none !important; }
  .more-btn { display: none !important; }
  .more-menu { display: none !important; }

  /* The tabs container should take remaining width and allow scrolling */
  .upload-tabs {
    display: flex;
    gap: 4px;
    border: none;
    overflow-x: auto;
    overflow-y: hidden;
    flex-wrap: nowrap;
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
    padding: 0;
    flex: 1 1 auto;
    min-width: 0; /* important for flex child to allow scrolling */
    justify-content: flex-start;
    width: 100%;
    -ms-overflow-style: none; /* hide scrollbar IE/Edge */
    scrollbar-width: none; /* hide scrollbar Firefox */
  }
  .upload-tabs::-webkit-scrollbar { height: 6px; }
  .upload-tabs::-webkit-scrollbar-track { background: transparent; }
  .upload-tabs::-webkit-scrollbar-thumb { background: rgba(55,65,81,0.45); border-radius: 4px; }

  .upload-tabs.mobile-hidden-scrollbar::-webkit-scrollbar { display: none; }

  .upload-tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    background: transparent;
    border: none;
    color: #8696a0;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    transition: all 0.15s ease;
    border-bottom: none;
    margin-bottom: 0;
    white-space: nowrap;
    flex-shrink: 0;
    min-width: 40px;
  }
  .upload-tab:hover { color: #8696a0 !important; background: transparent !important; }
  .upload-tab.active { color: #00a884; border-bottom: none; background: transparent !important; }

  /* Smaller spacing on narrow viewports so many tabs are visible */
  @media (max-width: 768px) {
    .upload-tabs-wrapper { margin-bottom: 0 !important; }
    .upload-tabs { gap: 8px; border: none !important; padding: 0 !important; }
    .upload-tab { padding: 10px 16px; font-size: 13px; border: none !important; margin: 0 !important; }
    .upload-tab > svg { display: none; }
    .tab-nav-btn { display: none; }
    /* Remove space below tabs */
    .grid-2 { margin-top: 0 !important; }
    /* Button sizing on tablet */
    .actions { width: 100% !important; margin-top: 16px !important; }
    .actions .btn { width: 100% !important; padding: 8px 12px !important; font-size: 12px !important; }
  }
  @media (max-width: 480px) {
    .upload-tabs-wrapper { margin-bottom: 0 !important; }
    .upload-tabs { gap: 10px; border: none !important; padding: 0 !important; width: 100% !important; overflow-x: auto !important; -ms-overflow-style: none; scrollbar-width: none; }
    .upload-tabs::-webkit-scrollbar { display: none; }
    .upload-tab { padding: 10px 16px; font-size: 12px; min-width: 65px; max-width: 140px; border: none !important; margin: 0 !important; }
    .upload-tab > svg { display: none; }
    /* Ensure nav buttons stay hidden on mobile */
    .tab-nav-btn { display: none; }
    /* show labels on mobile */
    .tab-label { display: inline-block; }
    /* Remove space below tabs */
    .grid-2 { margin-top: 0 !important; }
    /* Button sizing on mobile */
    .actions { width: 100% !important; justify-content: stretch !important; margin-top: 16px !important; padding: 0 !important; }
    .actions .btn { width: 100% !important; padding: 10px 12px !important; font-size: 13px !important; flex: 1 !important; margin-bottom: 4px !important; }
  }
  /* default label display, hidden on very small screens */
  .tab-label { display: inline-block; }

  @media (min-width: 769px) {
    .upload-tabs { border-bottom: 2px solid #374151; }
    .upload-tab { border-bottom: 3px solid transparent; margin-bottom: -2px; }
    .upload-tab.active { border-bottom-color: #00a884; }
  }
  /* checkbox fixes for mobile appearance inside this component */
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    margin: 0 6px 0 0;
    accent-color: #00a884;
    vertical-align: middle;
  }

  /* Remove all borders from panels in this component */
  .panel { border: none !important; background: transparent !important; box-shadow: none !important; }
  .panel + .panel { margin-top: 8px; border: none !important; background: transparent !important; }
  .panel-title { display: none !important; }
  .grid-2 .panel { border: none !important; background: transparent !important; box-shadow: none !important; }
  div.panel { border: none !important; background: transparent !important; outline: none !important; }
  
  /* Remove all bottom/top borders */
  .grid-2 { border: none !important; border-bottom: none !important; border-top: none !important; }
  .actions { border: none !important; margin-top: 16px !important; width: 100% !important; justify-content: stretch !important; }
  .actions .btn { width: 100% !important; padding: 8px 12px !important; font-size: 13px !important; flex: 1 !important; }
  .table { border: none !important; }
  .table th, .table td { border: none !important; }
`;

const Request = ({ userProfile, initialTab = 'books' }) => {
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = dropzoneStyles;
    document.head.appendChild(styleTag);
    return () => styleTag.remove();
  }, []);

  const [activeTab, setActiveTab] = useState(initialTab);
  const navigate = useNavigate();
  const { showToast } = useAdminUI();

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Tabs scrolling and touch support
  const tabsRef = useRef(null);
  const tabsWrapperRef = useRef(null);
  const [showLeftNav, setShowLeftNav] = useState(false);
  const [showRightNav, setShowRightNav] = useState(false);
  const touchStateRef = useRef({ startX: 0, currentX: 0, isTouching: false });

  const checkTabsOverflow = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    setShowLeftNav(el.scrollLeft > 0);
    setShowRightNav(el.scrollWidth > el.clientWidth + el.scrollLeft + 1);
  }, []);

  useEffect(() => {
    checkTabsOverflow();
    const onResize = () => checkTabsOverflow();
    window.addEventListener('resize', onResize);
    const el = tabsRef.current;
    if (el) el.addEventListener('scroll', checkTabsOverflow);
    const mo = new MutationObserver(checkTabsOverflow);
    if (el) mo.observe(el, { childList: true, subtree: true });
    return () => {
      window.removeEventListener('resize', onResize);
      if (el) el.removeEventListener('scroll', checkTabsOverflow);
      mo.disconnect();
    };
  }, [checkTabsOverflow]);

  const scrollTabsBy = (amt) => {
    const el = tabsRef.current;
    if (!el) return;
    el.scrollBy({ left: amt, behavior: 'smooth' });
  };

  const scrollLeft = () => scrollTabsBy(-Math.floor((tabsRef.current?.clientWidth || 240) * 0.7));
  const scrollRight = () => scrollTabsBy(Math.floor((tabsRef.current?.clientWidth || 240) * 0.7));

  // touch handlers for swipe
  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchStateRef.current.startX = t.clientX;
    touchStateRef.current.isTouching = true;
  };
  const onTouchMove = (e) => {
    if (!touchStateRef.current.isTouching) return;
    const t = e.touches[0];
    touchStateRef.current.currentX = t.clientX;
  };
  const onTouchEnd = () => {
    if (!touchStateRef.current.isTouching) return;
    const delta = touchStateRef.current.startX - touchStateRef.current.currentX;
    if (Math.abs(delta) > 30) {
      scrollTabsBy(delta > 0 ? Math.floor((tabsRef.current?.clientWidth || 240) * 0.7) : -Math.floor((tabsRef.current?.clientWidth || 240) * 0.7));
    }
    touchStateRef.current.isTouching = false;
    touchStateRef.current.startX = 0;
    touchStateRef.current.currentX = 0;
  };

  // Books request state
  const [categories, setCategories] = useState([]);
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    description: '',
    category_id: '',
    year: '',
    language: '',
    isbn: '',
    publisher: ''
  });
  const [bookAttachments, setBookAttachments] = useState([]);

  // Past Papers request state
  const [universities, setUniversities] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [unitNames, setUnitNames] = useState([]);
  const [years, setYears] = useState([]);
  const [paperForm, setPaperForm] = useState({
    university_id: '',
    faculty: '',
    unit_code: '',
    unit_name: '',
    year: '',
    semester: '',
    exam_type: ''
  });
  const [useCustomFaculty, setUseCustomFaculty] = useState(false);
  const [customFaculty, setCustomFaculty] = useState('');
  const [useCustomUnitName, setUseCustomUnitName] = useState(false);
  const [customUnitName, setCustomUnitName] = useState('');
  const [useCustomYear, setUseCustomYear] = useState(false);
  const [customYear, setCustomYear] = useState('');
  const [paperAttachments, setPaperAttachments] = useState([]);

  // Feature Request state
  const [featureForm, setFeatureForm] = useState({
    title: '',
    description: '',
    affectedArea: 'general',
    useCase: '',
    priority: 'medium',
    targetUsers: 'all'
  });
  const [featureAttachments, setFeatureAttachments] = useState([]);

  // Complaint/Issue state
  const [complaintForm, setComplaintForm] = useState({
    type: 'bug',
    severity: 'medium',
    affectedFeature: 'general',
    description: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    actualBehavior: ''
  });
  const [complaintAttachments, setComplaintAttachments] = useState([]);

  // Feedback/Rating state
  const [feedbackForm, setFeedbackForm] = useState({
    feedbackType: 'feature',
    featureRated: 'books_search',
    rating: '5',
    pros: '',
    cons: '',
    suggestions: '',
    wouldRecommend: 'yes'
  });
  const [feedbackAttachments, setFeedbackAttachments] = useState([]);

  // Other Request state
  const [otherForm, setOtherForm] = useState({
    subject: '',
    category: 'other',
    message: '',
    preferredResolution: ''
  });
  const [otherAttachments, setOtherAttachments] = useState([]);

  const [busy, setBusy] = useState(false);

  // Initialize dropdowns
  useEffect(() => {
    (async () => {
      try {
        setCategories(await fetchCategories());
        setUniversities(await getUniversitiesForDropdown());
      } catch (e) {
        console.warn('Failed to load dropdown data:', e);
      }
    })();
  }, []);

  // Handle book form changes
  const onBookChange = useCallback((field) => (e) => {
    setBookForm(prev => ({ ...prev, [field]: e.target.value }));
  }, []);

  // Handle paper form changes
  const onPaperChange = useCallback((field) => (e) => {
    setPaperForm(prev => ({ ...prev, [field]: e.target.value }));
  }, []);

  // Handle faculty dropdown change (with cascading)
  const handleFacultyChange = useCallback(async (value) => {
    onPaperChange('faculty')({ target: { value } });
    if (value && paperForm.university_id) {
      try {
        const unitNamesData = await getUnitNamesByUniversityAndFaculty(paperForm.university_id, value);
        setUnitNames(Array.isArray(unitNamesData) ? unitNamesData : []);
      } catch (e) {
        console.warn('Failed to fetch unit names:', e);
      }
    }
  }, [paperForm.university_id, onPaperChange]);

  // Handle university dropdown change (with cascading)
  const handleUniversityChange = useCallback(async (value) => {
    onPaperChange('university_id')({ target: { value } });
    if (value) {
      try {
        const facultiesData = await getFacultiesByUniversity(value);
        setFaculties(Array.isArray(facultiesData) ? facultiesData : []);
        setPaperForm(prev => ({ ...prev, faculty: '', unit_code: '', unit_name: '', year: '' }));
        setUnitNames([]);
        setYears([]);
      } catch (e) {
        console.warn('Failed to fetch faculties:', e);
      }
    }
  }, [onPaperChange]);

  // Handle unit name change (with cascading)
  const handleUnitNameChange = useCallback(async (value) => {
    onPaperChange('unit_name')({ target: { value } });
    const faculty = useCustomFaculty ? customFaculty : paperForm.faculty;
    if (value && paperForm.university_id && faculty) {
      try {
        const yearsData = await getYearsByUniversityFacultyAndUnitName(paperForm.university_id, faculty, value);
        setYears(Array.isArray(yearsData) ? yearsData : []);
      } catch (e) {
        console.warn('Failed to fetch years:', e);
      }
    }
  }, [paperForm.university_id, paperForm.faculty, useCustomFaculty, customFaculty, onPaperChange]);

  // Handle attachment file selection
  const handleAttachmentChange = (e, isBook) => {
    const files = Array.from(e.target.files || []);
    if (isBook) {
      setBookAttachments(files.slice(0, 3));
    } else {
      setPaperAttachments(files.slice(0, 3));
    }
  };

  // Render attachment dropzone
  const renderAttachmentZone = (files, setFiles, fileType) => {
    const handleDragOver = (e) => {
      e.preventDefault();
      e.currentTarget.classList.add('drag-over');
    };
    const handleDragLeave = (e) => {
      e.currentTarget.classList.remove('drag-over');
    };
    const handleDrop = (e) => {
      e.preventDefault();
      e.currentTarget.classList.remove('drag-over');
      const droppedFiles = Array.from(e.dataTransfer.files || []);
      setFiles(droppedFiles.slice(0, 3));
    };
    const handleClick = () => {
      document.getElementById(`${fileType}-input`).click();
    };

    return (
      <div
        className="dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      >
        <input
          id={`${fileType}-input`}
          type="file"
          multiple
          accept=".pdf,image/*,application/epub+zip"
          onChange={(e) => handleAttachmentChange(e, fileType === 'book-attachments')}
          style={{ display: 'none' }}
        />
        {files && files.length > 0 ? (
          <div style={{ color: '#00a884' }}>
            <div>{files.length} file(s) selected</div>
            {files.map((f, i) => <div key={i} style={{ fontSize: '12px', color: '#8696a0' }}>{f.name}</div>)}
          </div>
        ) : (
          <div>
            <div style={{ color: '#a0b0b8' }}>Drag and drop or click to add attachments</div>
            <div style={{ color: '#7a8a96', fontSize: '0.85em', marginTop: '2px' }}>
              PDF, images, EPUB (optional — up to 3 files)
            </div>
          </div>
        )}
      </div>
    );
  };

  // Submit book request
  const submitBookRequest = async () => {
    if (!bookForm.title.trim()) {
      showToast({ type: 'error', message: 'Please enter the book title.' });
      return;
    }

    setBusy(true);
    try {
      const payload = {
        userId: userProfile?.id || null,
        userEmail: userProfile?.email || null,
        userName: userProfile?.display_name || userProfile?.email?.split('@')[0] || 'User',
        type: 'book',
        title: bookForm.title,
        author: bookForm.author || null,
        year: bookForm.year || null,
        isbn: bookForm.isbn || null,
        publisher: bookForm.publisher || null,
        category_id: bookForm.category_id || null,
        language: bookForm.language || null,
        description: bookForm.description || null
      };

      let res;
      if (bookAttachments && bookAttachments.length > 0) {
        const form = new FormData();
        form.append('payload', JSON.stringify(payload));
        bookAttachments.forEach((f, i) => {
          form.append('files', f, f.name || `attachment-${i}`);
        });
        res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/requests`, {
          method: 'POST',
          body: form
        });
      } else {
        res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        showToast({ type: 'success', message: 'Book request submitted successfully!' });
        setBookForm({ title: '', author: '', description: '', category_id: '', year: '', language: '', isbn: '', publisher: '' });
        setBookAttachments([]);
        navigate('/BookManagement');
      } else {
        const txt = await res.text();
        console.warn('Request failed', res.status, txt);
        showToast({ type: 'error', message: 'Failed to submit request. Try again later.' });
      }
    } catch (e) {
      console.error('Request error:', e);
      showToast({ type: 'error', message: 'Failed to submit request. Try again later.' });
    } finally {
      setBusy(false);
    }
  };

  // Submit feature request
  const submitFeatureRequest = async () => {
    if (!featureForm.title.trim()) {
      showToast({ type: 'error', message: 'Please enter feature title.' });
      return;
    }
    if (!featureForm.description.trim()) {
      showToast({ type: 'error', message: 'Please describe the feature.' });
      return;
    }

    setBusy(true);
    try {
      const payload = {
        userId: userProfile?.id || null,
        userEmail: userProfile?.email || null,
        userName: userProfile?.display_name || userProfile?.email?.split('@')[0] || 'User',
        type: 'feature_request',
        title: featureForm.title,
        description: featureForm.description,
        affectedArea: featureForm.affectedArea,
        useCase: featureForm.useCase,
        priority: featureForm.priority,
        targetUsers: featureForm.targetUsers,
        status: 'open'
      };

      let res;
      if (featureAttachments && featureAttachments.length > 0) {
        const form = new FormData();
        form.append('payload', JSON.stringify(payload));
        featureAttachments.forEach((f, i) => {
          form.append('files', f, f.name || `attachment-${i}`);
        });
        res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/requests`, {
          method: 'POST',
          body: form
        });
      } else {
        res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        showToast({ type: 'success', message: 'Feature request submitted successfully!' });
        setFeatureForm({ title: '', description: '', affectedArea: 'general', useCase: '', priority: 'medium', targetUsers: 'all' });
        setFeatureAttachments([]);
        navigate('/BookManagement');
      } else {
        const txt = await res.text();
        console.warn('Feature request failed', res.status, txt);
        showToast({ type: 'error', message: `Failed to submit feature request (${res.status}). Try again later.` });
      }
    } catch (e) {
      console.error('Feature request error:', e);
      showToast({ type: 'error', message: 'Failed to submit feature request. Try again later.' });
    } finally {
      setBusy(false);
    }
  };

  // Submit complaint/issue
  const submitComplaint = async () => {
    if (!complaintForm.description.trim()) {
      showToast({ type: 'error', message: 'Please describe the issue.' });
      return;
    }

    setBusy(true);
    try {
      const payload = {
        userId: userProfile?.id || null,
        userEmail: userProfile?.email || null,
        userName: userProfile?.display_name || userProfile?.email?.split('@')[0] || 'User',
        type: 'complaint',
        complaintType: complaintForm.type,
        severity: complaintForm.severity,
        affectedFeature: complaintForm.affectedFeature,
        description: complaintForm.description,
        stepsToReproduce: complaintForm.stepsToReproduce,
        expectedBehavior: complaintForm.expectedBehavior,
        actualBehavior: complaintForm.actualBehavior,
        status: 'open'
      };

      let res;
      if (complaintAttachments && complaintAttachments.length > 0) {
        const form = new FormData();
        form.append('payload', JSON.stringify(payload));
        complaintAttachments.forEach((f, i) => {
          form.append('files', f, f.name || `attachment-${i}`);
        });
        res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/requests`, {
          method: 'POST',
          body: form
        });
      } else {
        res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        showToast({ type: 'success', message: 'Issue reported successfully! We will investigate it.' });
        setComplaintForm({ type: 'bug', severity: 'medium', affectedFeature: 'general', description: '', stepsToReproduce: '', expectedBehavior: '', actualBehavior: '' });
        setComplaintAttachments([]);
        navigate('/BookManagement');
      } else {
        const txt = await res.text();
        console.warn('Complaint failed', res.status, txt);
        showToast({ type: 'error', message: `Failed to submit report (${res.status}). Try again later.` });
      }
    } catch (e) {
      console.error('Complaint error:', e);
      showToast({ type: 'error', message: 'Failed to submit report. Try again later.' });
    } finally {
      setBusy(false);
    }
  };

  // Submit feedback/rating
  const submitFeedback = async () => {
    if (!feedbackForm.rating) {
      showToast({ type: 'error', message: 'Please select a rating.' });
      return;
    }
    if (!feedbackForm.suggestions.trim()) {
      showToast({ type: 'error', message: 'Please share your feedback or suggestions.' });
      return;
    }

    setBusy(true);
    try {
      const payload = {
        userId: userProfile?.id || null,
        userEmail: userProfile?.email || null,
        userName: userProfile?.display_name || userProfile?.email?.split('@')[0] || 'User',
        type: 'feedback',
        feedbackType: feedbackForm.feedbackType,
        featureRated: feedbackForm.featureRated,
        rating: parseInt(feedbackForm.rating),
        pros: feedbackForm.pros,
        cons: feedbackForm.cons,
        suggestions: feedbackForm.suggestions,
        wouldRecommend: feedbackForm.wouldRecommend,
        status: 'new'
      };

      let res;
      if (feedbackAttachments && feedbackAttachments.length > 0) {
        const form = new FormData();
        form.append('payload', JSON.stringify(payload));
        feedbackAttachments.forEach((f, i) => {
          form.append('files', f, f.name || `attachment-${i}`);
        });
        res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/requests`, {
          method: 'POST',
          body: form
        });
      } else {
        res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        showToast({ type: 'success', message: 'Thank you for your feedback! We value your input.' });
        setFeedbackForm({ feedbackType: 'feature', featureRated: 'books_search', rating: '5', pros: '', cons: '', suggestions: '', wouldRecommend: 'yes' });
        setFeedbackAttachments([]);
        navigate('/BookManagement');
      } else {
        showToast({ type: 'error', message: 'Failed to submit feedback. Try again later.' });
      }
    } catch (e) {
      console.error('Feedback error:', e);
      showToast({ type: 'error', message: 'Failed to submit feedback. Try again later.' });
    } finally {
      setBusy(false);
    }
  };

  // Submit other request
  const submitOtherRequest = async () => {
    if (!otherForm.subject.trim()) {
      showToast({ type: 'error', message: 'Please enter a subject.' });
      return;
    }
    if (!otherForm.message.trim()) {
      showToast({ type: 'error', message: 'Please provide details.' });
      return;
    }

    setBusy(true);
    try {
      const payload = {
        userId: userProfile?.id || null,
        userEmail: userProfile?.email || null,
        userName: userProfile?.display_name || userProfile?.email?.split('@')[0] || 'User',
        type: 'other',
        subject: otherForm.subject,
        category: otherForm.category,
        message: otherForm.message,
        preferredResolution: otherForm.preferredResolution,
        status: 'open'
      };

      let res;
      if (otherAttachments && otherAttachments.length > 0) {
        const form = new FormData();
        form.append('payload', JSON.stringify(payload));
        otherAttachments.forEach((f, i) => {
          form.append('files', f, f.name || `attachment-${i}`);
        });
        res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/requests`, {
          method: 'POST',
          body: form
        });
      } else {
        res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        showToast({ type: 'success', message: 'Request submitted successfully!' });
        setOtherForm({ subject: '', category: 'other', message: '', preferredResolution: '' });
        setOtherAttachments([]);
        navigate('/BookManagement');
      } else {
        showToast({ type: 'error', message: 'Failed to submit request. Try again later.' });
      }
    } catch (e) {
      console.error('Other request error:', e);
      showToast({ type: 'error', message: 'Failed to submit request. Try again later.' });
    } finally {
      setBusy(false);
    }
  };

  // Helper to handle general attachment changes
  const handleAttachmentChangeGeneral = (e, setter) => {
    const files = Array.from(e.target.files || []);
    setter(files.slice(0, 3));
  };

  // Submit past paper request
  const submitPaperRequest = async () => {
    if (!paperForm.university_id) {
      showToast({ type: 'error', message: 'Please select a university.' });
      return;
    }

    const faculty = useCustomFaculty ? customFaculty : paperForm.faculty;
    if (!faculty) {
      showToast({ type: 'error', message: 'Please enter faculty.' });
      return;
    }

    if (!paperForm.unit_code) {
      showToast({ type: 'error', message: 'Please enter unit code.' });
      return;
    }

    const unitName = useCustomUnitName ? customUnitName : paperForm.unit_name;
    if (!unitName) {
      showToast({ type: 'error', message: 'Please enter unit name.' });
      return;
    }

    const year = useCustomYear ? customYear : paperForm.year;
    if (!year) {
      showToast({ type: 'error', message: 'Please enter year.' });
      return;
    }

    setBusy(true);
    try {
      const payload = {
        userId: userProfile?.id || null,
        userEmail: userProfile?.email || null,
        userName: userProfile?.display_name || userProfile?.email?.split('@')[0] || 'User',
        type: 'past_paper',
        university_id: paperForm.university_id,
        faculty: faculty,
        unit_code: paperForm.unit_code,
        unit_name: unitName,
        year: year,
        semester: paperForm.semester || null,
        exam_type: paperForm.exam_type || 'Main'
      };

      let res;
      if (paperAttachments && paperAttachments.length > 0) {
        const form = new FormData();
        form.append('payload', JSON.stringify(payload));
        paperAttachments.forEach((f, i) => {
          form.append('files', f, f.name || `attachment-${i}`);
        });
        res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/requests`, {
          method: 'POST',
          body: form
        });
      } else {
        res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        showToast({ type: 'success', message: 'Past paper request submitted successfully!' });
        setPaperForm({ university_id: '', faculty: '', unit_code: '', unit_name: '', year: '', semester: '', exam_type: '' });
        setCustomFaculty('');
        setCustomUnitName('');
        setCustomYear('');
        setUseCustomFaculty(false);
        setUseCustomUnitName(false);
        setUseCustomYear(false);
        setPaperAttachments([]);
        navigate('/BookManagement');
      } else {
        const txt = await res.text();
        console.warn('Request failed', res.status, txt);
        showToast({ type: 'error', message: 'Failed to submit request. Try again later.' });
      }
    } catch (e) {
      console.error('Request error:', e);
      showToast({ type: 'error', message: 'Failed to submit request. Try again later.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel">
      {/* Tabs */}
      <div className="upload-tabs-wrapper" ref={tabsWrapperRef}>
        {showLeftNav && (
          <button type="button" className="tab-nav-btn left" onClick={scrollLeft} aria-label="Scroll left">‹</button>
        )}

        <div
          className="upload-tabs"
          ref={tabsRef}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <button
            className={`upload-tab ${activeTab === 'books' ? 'active' : ''}`}
            onClick={() => setActiveTab('books')}
          >
            <FiBook size={18} />
            <span className="tab-label">Books</span>
          </button>
          <button
            className={`upload-tab ${activeTab === 'pastpapers' ? 'active' : ''}`}
            onClick={() => setActiveTab('pastpapers')}
          >
            <FiFileText size={18} />
            <span className="tab-label">Past Papers</span>
          </button>
          <button
            className={`upload-tab ${activeTab === 'features' ? 'active' : ''}`}
            onClick={() => setActiveTab('features')}
          >
            <FiZap size={18} />
            <span className="tab-label">Feature Ideas</span>
          </button>
          <button
            className={`upload-tab ${activeTab === 'complaints' ? 'active' : ''}`}
            onClick={() => setActiveTab('complaints')}
          >
            <FiAlertCircle size={18} />
            <span className="tab-label">Issues</span>
          </button>
          <button
            className={`upload-tab ${activeTab === 'feedback' ? 'active' : ''}`}
            onClick={() => setActiveTab('feedback')}
          >
            <FiStar size={18} />
            <span className="tab-label">Feedback</span>
          </button>
          <button
            className={`upload-tab ${activeTab === 'other' ? 'active' : ''}`}
            onClick={() => setActiveTab('other')}
          >
            <FiMoreVertical size={18} />
            <span className="tab-label">Other</span>
          </button>
        </div>

        {showRightNav && (
          <button type="button" className="tab-nav-btn right" onClick={scrollRight} aria-label="Scroll right">›</button>
        )}
      </div>

      {/* Book Request Tab */}
      {activeTab === 'books' && (
        <div className="grid-2">
          <div className="panel">
            <label className="label">Book Title *</label>
            <input
              className="input"
              placeholder="Enter the book title"
              value={bookForm.title}
              onChange={onBookChange('title')}
            />

            <label className="label" style={{ marginTop: 10 }}>Author</label>
            <input
              className="input"
              placeholder="Author name"
              value={bookForm.author}
              onChange={onBookChange('author')}
            />

            <label className="label" style={{ marginTop: 10 }}>Description</label>
            <textarea
              className="input"
              style={{ minHeight: 80 }}
              placeholder="Why do you need this book?"
              value={bookForm.description}
              onChange={(e) => setBookForm(prev => ({ ...prev, description: e.target.value }))}
            />

            <label className="label" style={{ marginTop: 10 }}>Attachments (optional)</label>
            {renderAttachmentZone(bookAttachments, setBookAttachments, 'book-attachments')}
          </div>

          <div className="panel">
            <label className="label">Category</label>
            <select className="select" value={bookForm.category_id} onChange={onBookChange('category_id')}>
              <option value="">Uncategorized</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <label className="label" style={{ marginTop: 10 }}>Year</label>
            <input className="input" placeholder="Year" value={bookForm.year} onChange={onBookChange('year')} />

            <div className="grid-2" style={{ marginTop: 10 }}>
              <div>
                <label className="label">Language</label>
                <input className="input" placeholder="English" value={bookForm.language} onChange={onBookChange('language')} />
              </div>
              <div>
                <label className="label">ISBN</label>
                <input className="input" placeholder="978-0-123456-78-9" value={bookForm.isbn} onChange={onBookChange('isbn')} />
              </div>
            </div>

            <label className="label" style={{ marginTop: 10 }}>Publisher</label>
            <input className="input" placeholder="Publisher name" value={bookForm.publisher} onChange={onBookChange('publisher')} />

            <div className="actions" style={{ marginTop: 12 }}>
              <button className="btn primary" disabled={busy} onClick={submitBookRequest}>
                {busy ? 'Requesting...' : 'Request Book'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Past Paper Request Tab */}
      {activeTab === 'pastpapers' && (
        <div className="grid-2">
          <div className="panel">
            <label className="label">University *</label>
            <select className="select" value={paperForm.university_id} onChange={(e) => handleUniversityChange(e.target.value)}>
              <option value="">Select University</option>
              {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>

            <label className="label" style={{ marginTop: 10 }}>Faculty *</label>
            {!useCustomFaculty ? (
              <select
                className="select"
                value={paperForm.faculty}
                onChange={(e) => handleFacultyChange(e.target.value)}
                disabled={!paperForm.university_id || faculties.length === 0}
              >
                <option value="">
                  {!paperForm.university_id ? 'Select a university first' : faculties.length === 0 ? 'No faculties available' : 'Select Faculty'}
                </option>
                {faculties.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            ) : (
              <input
                className="input"
                placeholder="e.g., Engineering, Business"
                value={customFaculty}
                onChange={(e) => setCustomFaculty(e.target.value)}
              />
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
              <input
                type="checkbox"
                id="custom-faculty-toggle"
                checked={useCustomFaculty}
                onChange={(e) => setUseCustomFaculty(e.target.checked)}
              />
              <label htmlFor="custom-faculty-toggle" style={{ color: '#8696a0', fontSize: '12px', cursor: 'pointer' }}>
                Add custom
              </label>
            </div>

            <label className="label" style={{ marginTop: 10 }}>Attachments (optional)</label>
            {renderAttachmentZone(paperAttachments, setPaperAttachments, 'paper-attachments')}
          </div>

          <div className="panel">
            <label className="label">Unit Name *</label>
            {!useCustomUnitName ? (
              <select
                className="select"
                value={paperForm.unit_name}
                onChange={(e) => handleUnitNameChange(e.target.value)}
                disabled={!paperForm.faculty && !useCustomFaculty || unitNames.length === 0}
              >
                <option value="">
                  {(!paperForm.faculty && !useCustomFaculty) ? 'Select a faculty first' : unitNames.length === 0 ? 'No units available' : 'Select Unit Name'}
                </option>
                {unitNames.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            ) : (
              <input
                className="input"
                placeholder="e.g., Introduction to Programming"
                value={customUnitName}
                onChange={(e) => setCustomUnitName(e.target.value)}
              />
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
              <input
                type="checkbox"
                id="custom-unit-toggle"
                checked={useCustomUnitName}
                onChange={(e) => setUseCustomUnitName(e.target.checked)}
              />
              <label htmlFor="custom-unit-toggle" style={{ color: '#8696a0', fontSize: '12px', cursor: 'pointer' }}>
                Add custom
              </label>
            </div>

            <label className="label" style={{ marginTop: 10 }}>Unit Code *</label>
            <input
              className="input"
              placeholder="e.g., CS101"
              value={paperForm.unit_code}
              onChange={onPaperChange('unit_code')}
            />

            <div className="grid-2" style={{ marginTop: 10 }}>
              <div>
                <label className="label">Year *</label>
                {!useCustomYear ? (
                  <select
                    className="select"
                    value={paperForm.year}
                    onChange={(e) => onPaperChange('year')({ target: { value: e.target.value } })}
                    disabled={years.length === 0}
                  >
                    <option value="">Select Year</option>
                    {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
                  </select>
                ) : (
                  <input
                    className="input"
                    placeholder="e.g., 2023"
                    value={customYear}
                    onChange={(e) => setCustomYear(e.target.value)}
                  />
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                  <input
                    type="checkbox"
                    id="custom-year-toggle"
                    checked={useCustomYear}
                    onChange={(e) => setUseCustomYear(e.target.checked)}
                  />
                  <label htmlFor="custom-year-toggle" style={{ color: '#8696a0', fontSize: '12px', cursor: 'pointer' }}>
                    Add custom
                  </label>
                </div>
              </div>

              <div>
                <label className="label">Semester</label>
                <select className="select" value={paperForm.semester} onChange={onPaperChange('semester')}>
                  <option value="">Select Semester</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3">Semester 3</option>
                </select>
              </div>
            </div>

            <label className="label" style={{ marginTop: 10 }}>Exam Type</label>
            <select className="select" value={paperForm.exam_type} onChange={onPaperChange('exam_type')}>
              <option value="Main">Main Exam</option>
              <option value="Supplementary">Supplementary</option>
              <option value="CAT">CAT</option>
              <option value="Mock">Mock Exam</option>
            </select>

            <div className="actions" style={{ marginTop: 12 }}>
              <button className="btn primary" disabled={busy} onClick={submitPaperRequest}>
                {busy ? 'Requesting...' : 'Request Past Paper'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature Request Tab */}
      {activeTab === 'features' && (
        <div className="grid-2">
          <div className="panel">
            <label className="label">Feature Title *</label>
            <input
              className="input"
              placeholder="What feature would you like to see?"
              value={featureForm.title}
              onChange={(e) => setFeatureForm(prev => ({ ...prev, title: e.target.value }))}
            />

            <label className="label" style={{ marginTop: 10 }}>Description *</label>
            <textarea
              className="input"
              style={{ minHeight: 100 }}
              placeholder="Describe the feature in detail. Why would this be beneficial?"
              value={featureForm.description}
              onChange={(e) => setFeatureForm(prev => ({ ...prev, description: e.target.value }))}
            />

            <label className="label" style={{ marginTop: 10 }}>Use Case</label>
            <textarea
              className="input"
              style={{ minHeight: 70 }}
              placeholder="Describe how you would use this feature..."
              value={featureForm.useCase}
              onChange={(e) => setFeatureForm(prev => ({ ...prev, useCase: e.target.value }))}
            />

            <label className="label" style={{ marginTop: 10 }}>Attachments (optional)</label>
            {renderAttachmentZone(featureAttachments, setFeatureAttachments, 'feature-attachments')}
          </div>

          <div className="panel">
            <label className="label">Affected Area</label>
            <select className="select" value={featureForm.affectedArea} onChange={(e) => setFeatureForm(prev => ({ ...prev, affectedArea: e.target.value }))}>
              <option value="general">General/System</option>
              <option value="books_search">Books Search</option>
              <option value="past_papers">Past Papers</option>
              <option value="upload">Upload/Request</option>
              <option value="user_profile">User Profile</option>
              <option value="admin_panel">Admin Panel</option>
              <option value="mobile">Mobile Experience</option>
              <option value="performance">Performance</option>
              <option value="other">Other</option>
            </select>

            <label className="label" style={{ marginTop: 10 }}>Priority Level</label>
            <select className="select" value={featureForm.priority} onChange={(e) => setFeatureForm(prev => ({ ...prev, priority: e.target.value }))}>
              <option value="low">Low - Nice to have</option>
              <option value="medium">Medium - Useful improvement</option>
              <option value="high">High - Would improve daily usage</option>
              <option value="critical">Critical - Essential improvement</option>
            </select>

            <label className="label" style={{ marginTop: 10 }}>Who Benefits?</label>
            <select className="select" value={featureForm.targetUsers} onChange={(e) => setFeatureForm(prev => ({ ...prev, targetUsers: e.target.value }))}>
              <option value="all">All Users</option>
              <option value="students">Students</option>
              <option value="educators">Educators/Instructors</option>
              <option value="admins">System Administrators</option>
              <option value="mobile_users">Mobile Users</option>
            </select>

            <div className="actions" style={{ marginTop: 12 }}>
              <button className="btn primary" disabled={busy} onClick={submitFeatureRequest}>
                {busy ? 'Submitting...' : 'Submit Feature Idea'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complaints/Issues Tab */}
      {activeTab === 'complaints' && (
        <div className="grid-2">
          <div className="panel">
            <label className="label">Issue Type *</label>
            <select className="select" value={complaintForm.type} onChange={(e) => setComplaintForm(prev => ({ ...prev, type: e.target.value }))}>
              <option value="bug">Bug Report</option>
              <option value="crash">Crash/Error</option>
              <option value="performance">Performance Issue</option>
              <option value="complaint">Complaint</option>
              <option value="other">Other Issue</option>
            </select>

            <label className="label" style={{ marginTop: 10 }}>Severity Level *</label>
            <select className="select" value={complaintForm.severity} onChange={(e) => setComplaintForm(prev => ({ ...prev, severity: e.target.value }))}>
              <option value="low">Low - Minor inconvenience</option>
              <option value="medium">Medium - Affects usage</option>
              <option value="high">High - Major functionality broken</option>
              <option value="critical">Critical - System unusable</option>
            </select>

            <label className="label" style={{ marginTop: 10 }}>Affected Feature</label>
            <select className="select" value={complaintForm.affectedFeature} onChange={(e) => setComplaintForm(prev => ({ ...prev, affectedFeature: e.target.value }))}>
              <option value="general">General/Other</option>
              <option value="books_search">Books Search</option>
              <option value="books_download">Books Download</option>
              <option value="past_papers">Past Papers</option>
              <option value="upload">Upload Feature</option>
              <option value="user_auth">Login/Authentication</option>
              <option value="user_profile">User Profile</option>
              <option value="admin_panel">Admin Panel</option>
              <option value="mobile">Mobile App</option>
            </select>

            <label className="label" style={{ marginTop: 10 }}>Description *</label>
            <textarea
              className="input"
              style={{ minHeight: 80 }}
              placeholder="Describe the issue or problem in detail..."
              value={complaintForm.description}
              onChange={(e) => setComplaintForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="panel">
            <label className="label">Steps to Reproduce</label>
            <textarea
              className="input"
              style={{ minHeight: 70 }}
              placeholder="1. Step one&#10;2. Step two&#10;3. Step three...&#10;(Optional - helps us fix it faster)"
              value={complaintForm.stepsToReproduce}
              onChange={(e) => setComplaintForm(prev => ({ ...prev, stepsToReproduce: e.target.value }))}
            />

            <label className="label" style={{ marginTop: 10 }}>Expected Behavior</label>
            <input
              className="input"
              placeholder="What should happen?"
              value={complaintForm.expectedBehavior}
              onChange={(e) => setComplaintForm(prev => ({ ...prev, expectedBehavior: e.target.value }))}
            />

            <label className="label" style={{ marginTop: 10 }}>Actual Behavior</label>
            <input
              className="input"
              placeholder="What actually happens?"
              value={complaintForm.actualBehavior}
              onChange={(e) => setComplaintForm(prev => ({ ...prev, actualBehavior: e.target.value }))}
            />

            <label className="label" style={{ marginTop: 10 }}>Screenshots/Evidence (optional)</label>
            {renderAttachmentZone(complaintAttachments, setComplaintAttachments, 'complaint-attachments')}

            <div className="actions" style={{ marginTop: 12 }}>
              <button className="btn primary" disabled={busy} onClick={submitComplaint}>
                {busy ? 'Submitting...' : 'Report Issue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback/Rating Tab */}
      {activeTab === 'feedback' && (
        <div className="grid-2">
          <div className="panel">
            <label className="label">What are you rating?</label>
            <select className="select" value={feedbackForm.featureRated} onChange={(e) => setFeedbackForm(prev => ({ ...prev, featureRated: e.target.value }))}>
              <option value="books_search">Books Search Feature</option>
              <option value="books_download">Books Download</option>
              <option value="past_papers">Past Papers Section</option>
              <option value="upload">Upload System</option>
              <option value="user_interface">Overall User Interface</option>
              <option value="mobile_app">Mobile Experience</option>
              <option value="admin_panel">Admin Panel</option>
              <option value="search_results">Search Results Quality</option>
              <option value="overall">Overall Platform</option>
            </select>

            <label className="label" style={{ marginTop: 10 }}>Rating *</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setFeedbackForm(prev => ({ ...prev, rating: String(star) }))}
                  style={{
                    fontSize: '32px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: parseInt(feedbackForm.rating) >= star ? '#ffc107' : '#8696a0',
                    transition: 'all 0.2s'
                  }}
                >
                  ★
                </button>
              ))}
              <span style={{ color: '#8696a0', marginLeft: '8px' }}>
                {feedbackForm.rating}/5
              </span>
            </div>

            <label className="label" style={{ marginTop: 10 }}>What did you like? (Pros)</label>
            <textarea
              className="input"
              style={{ minHeight: 60 }}
              placeholder="What worked well for you?"
              value={feedbackForm.pros}
              onChange={(e) => setFeedbackForm(prev => ({ ...prev, pros: e.target.value }))}
            />

            <label className="label" style={{ marginTop: 10 }}>What could be improved? (Cons)</label>
            <textarea
              className="input"
              style={{ minHeight: 60 }}
              placeholder="What wasn't perfect?"
              value={feedbackForm.cons}
              onChange={(e) => setFeedbackForm(prev => ({ ...prev, cons: e.target.value }))}
            />
          </div>

          <div className="panel">
            <label className="label">Your Suggestions *</label>
            <textarea
              className="input"
              style={{ minHeight: 100 }}
              placeholder="Any specific suggestions or ideas for improvement?"
              value={feedbackForm.suggestions}
              onChange={(e) => setFeedbackForm(prev => ({ ...prev, suggestions: e.target.value }))}
            />

            <label className="label" style={{ marginTop: 10 }}>Would you recommend this to others?</label>
            <select className="select" value={feedbackForm.wouldRecommend} onChange={(e) => setFeedbackForm(prev => ({ ...prev, wouldRecommend: e.target.value }))}>
              <option value="yes">Yes, definitely!</option>
              <option value="maybe">Maybe, with improvements</option>
              <option value="no">No, not yet</option>
            </select>

            <label className="label" style={{ marginTop: 10 }}>Additional Files (optional)</label>
            {renderAttachmentZone(feedbackAttachments, setFeedbackAttachments, 'feedback-attachments')}

            <div className="actions" style={{ marginTop: 12 }}>
              <button className="btn primary" disabled={busy} onClick={submitFeedback}>
                {busy ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Other Request Tab */}
      {activeTab === 'other' && (
        <div className="grid-2">
          <div className="panel">
            <label className="label">Subject *</label>
            <input
              className="input"
              placeholder="Brief subject of your request..."
              value={otherForm.subject}
              onChange={(e) => setOtherForm(prev => ({ ...prev, subject: e.target.value }))}
            />

            <label className="label" style={{ marginTop: 10 }}>Category</label>
            <select className="select" value={otherForm.category} onChange={(e) => setOtherForm(prev => ({ ...prev, category: e.target.value }))}>
              <option value="other">General Inquiry</option>
              <option value="partnership">Partnership/Collaboration</option>
              <option value="integration">Integration Request</option>
              <option value="accessibility">Accessibility</option>
              <option value="security">Security Concern</option>
              <option value="privacy">Privacy Question</option>
              <option value="billing">Billing/Account</option>
              <option value="data_request">Data Request</option>
              <option value="other">Other</option>
            </select>

            <label className="label" style={{ marginTop: 10 }}>Message *</label>
            <textarea
              className="input"
              style={{ minHeight: 120 }}
              placeholder="Please provide details about your request..."
              value={otherForm.message}
              onChange={(e) => setOtherForm(prev => ({ ...prev, message: e.target.value }))}
            />
          </div>

          <div className="panel">
            <label className="label">What resolution would you prefer?</label>
            <textarea
              className="input"
              style={{ minHeight: 80 }}
              placeholder="What would resolve this for you?"
              value={otherForm.preferredResolution}
              onChange={(e) => setOtherForm(prev => ({ ...prev, preferredResolution: e.target.value }))}
            />

            <label className="label" style={{ marginTop: 10 }}>Supporting Files (optional)</label>
            {renderAttachmentZone(otherAttachments, setOtherAttachments, 'other-attachments')}

            <div className="actions" style={{ marginTop: 12 }}>
              <button className="btn primary" disabled={busy} onClick={submitOtherRequest}>
                {busy ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Request;
