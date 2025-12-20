import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiTrash2, FiEdit2, FiPlus, FiVideo, FiImage, FiBarChart2, FiTrendingUp, FiUsers, FiMousePointer } from 'react-icons/fi';
import './AdvancedAdsManagement.css';

export default function AdvancedAdsManagement() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState('ads');
  const [adType, setAdType] = useState('image');
  const [uploading, setUploading] = useState(false);
  
  // Analytics state
  const [selectedAnalyticsAd, setSelectedAnalyticsAd] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [formData, setFormData] = useState({
    // Basic info
    title: '',
    adType: 'image',
    placement: 'homepage',
    
    // Image ad
    imageUrl: '',
    
    // Video ad
    videoUrl: '',
    videoDuration: 0,
    videoThumbnailUrl: '',
    
    // Common
    clickUrl: '',
    ctaText: 'Learn More',
    ctaButtonColor: '#00a884',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    countdownSeconds: 10,
    isSkippable: true,
    
    // Advanced
    budget: '',
    dailyBudget: '',
    costPerClick: 0.5,
    minAge: 0,
    maxAge: 100,
    targetGender: 'all',
    targetDevices: ['mobile', 'tablet', 'desktop'],
    frequencyCap: 0,
    conversionTracking: false,
    conversionUrl: '',
    status: 'draft',
    priority: 0,
    abTestGroup: 'control',
  });

  // Fetch all ads
  const fetchAds = async () => {
    try {
      setLoading(true);
      console.log('🔄 [FETCH_ADS] Fetching ads from backend...');
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/ads/all`);
      console.log('✅ [FETCH_ADS] Response:', response.data);
      console.log('✅ [FETCH_ADS] Ads array:', response.data.data);
      setAds(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error('❌ [FETCH_ADS] Error:', err);
      setError('Failed to load ads. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };


  // Analytics functions
  const fetchAnalytics = async (adId) => {
    try {
      setAnalyticsLoading(true);
      console.log('📈 [Analytics] Fetching detailed metrics for ad:', adId);
      const response = await axios.get(`http://localhost:5000/api/admin/analytics/${adId}`);
      console.log('✅ [Analytics] Metrics received:', response.data.data);
      setAnalytics(response.data.data);
    } catch (err) {
      console.error('❌ [Analytics] Failed to fetch analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchEngagement = async (adId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/admin/analytics/${adId}/engagement`,
        {
          params: {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
          }
        }
      );
      setEngagement(response.data.data);
    } catch (err) {
      console.error('Failed to fetch engagement:', err);
    }
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const refreshEngagement = () => {
    if (selectedAnalyticsAd) {
      fetchEngagement(selectedAnalyticsAd.id);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  // Fetch analytics when selected ad changes
  useEffect(() => {
    if (selectedAnalyticsAd) {
      fetchAnalytics(selectedAnalyticsAd.id);
      fetchEngagement(selectedAnalyticsAd.id);
    }
  }, [selectedAnalyticsAd]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError(null);
  };

  // Handle device selection
  const handleDeviceChange = (device) => {
    setFormData(prev => ({
      ...prev,
      targetDevices: prev.targetDevices.includes(device)
        ? prev.targetDevices.filter(d => d !== device)
        : [...prev.targetDevices, device]
    }));
  };

  // Handle file upload
  const handleFileUpload = async (e, fileType = 'image') => {
    const file = e.target.files[0];
    console.log('📤 [UPLOAD] File selected:', { fileType, fileName: file?.name, fileSize: file?.size });
    if (!file) {
      console.warn('⚠️ [UPLOAD] No file selected');
      return;
    }

    try {
      setUploading(true);
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const base64Data = event.target.result.split(',')[1];
        console.log('📸 [UPLOAD] Base64 ready, size:', base64Data.length);
        
        try {
          const mimeType = fileType === 'video' ? 'video/mp4' : file.type;
          console.log('🚀 [UPLOAD] Sending to backend:', { fileType, mimeType });
          const response = await axios.post(`http://localhost:5000/api/upload/${fileType}`, {
            fileName: file.name,
            fileData: base64Data,
            mimeType: mimeType
          });

          console.log('✅ [UPLOAD] Response:', response.data);
          console.log('✅ [UPLOAD] Response keys:', Object.keys(response.data));
          console.log('✅ [UPLOAD] filePath value:', response.data.filePath);

          if (response.data.success) {
            if (fileType === 'video') {
              setFormData(prev => ({
                ...prev,
                videoUrl: response.data.filePath || response.data.imagePath,
                videoDuration: response.data.duration || 0
              }));
              console.log('✅ [UPLOAD] Video URL set:', response.data.filePath || response.data.imagePath);
            } else if (fileType === 'thumbnail') {
              setFormData(prev => ({
                ...prev,
                videoThumbnailUrl: response.data.filePath || response.data.imagePath
              }));
              console.log('✅ [UPLOAD] Thumbnail URL set:', response.data.filePath || response.data.imagePath);
            } else {
              setFormData(prev => ({
                ...prev,
                imageUrl: response.data.filePath || response.data.imagePath
              }));
              console.log('✅ [UPLOAD] Image URL set:', response.data.filePath || response.data.imagePath);
            }
            setSuccess(`${fileType.charAt(0).toUpperCase() + fileType.slice(1)} uploaded successfully!`);
            setTimeout(() => setSuccess(null), 3000);
          } else {
            console.error('❌ [UPLOAD] Response not successful:', response.data);
          }
        } catch (err) {
          console.error('❌ [UPLOAD] Error:', err);
          console.error('❌ [UPLOAD] Response:', err.response?.data);
          setError(err.response?.data?.error || `Failed to upload ${fileType}`);
        } finally {
          setUploading(false);
        }
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error('❌ [FILE_READ] Error:', err);
      setError('Failed to read file');
      setUploading(false);
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title) {
      setError('Please enter ad title');
      return;
    }

    if (formData.adType === 'image' && !formData.imageUrl) {
      setError('Please upload an image');
      return;
    }

    if (formData.adType === 'video' && !formData.videoUrl) {
      setError('Please upload a video');
      return;
    }

    try {
      const payload = {
        title: formData.title,
        adType: formData.adType,
        imageUrl: formData.imageUrl || null,
        videoUrl: formData.videoUrl || null,
        videoDuration: parseInt(formData.videoDuration) || 0,
        videoThumbnailUrl: formData.videoThumbnailUrl || null,
        clickUrl: formData.clickUrl || null,
        ctaText: formData.ctaText,
        ctaButtonColor: formData.ctaButtonColor,
        placement: formData.placement,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        countdownSeconds: parseInt(formData.countdownSeconds) || 10,
        isSkippable: formData.isSkippable,
        budget: parseFloat(formData.budget) || 0,
        dailyBudget: parseFloat(formData.dailyBudget) || 0,
        costPerClick: parseFloat(formData.costPerClick) || 0.5,
        minAge: parseInt(formData.minAge) || 0,
        maxAge: parseInt(formData.maxAge) || 100,
        targetGender: formData.targetGender,
        targetDevices: JSON.stringify(formData.targetDevices),
        frequencyCap: parseInt(formData.frequencyCap) || 0,
        conversionTracking: formData.conversionTracking,
        conversionUrl: formData.conversionUrl || null,
        status: formData.status,
        priority: parseInt(formData.priority) || 0,
        abTestGroup: formData.abTestGroup,
      };

      console.log('📤 [SAVE_AD] FULL Payload:', JSON.stringify(payload, null, 2));
      console.log('📤 [SAVE_AD] FormData state:', formData);
      console.log('📤 [SAVE_AD] FormData.placement:', formData.placement);

      if (editingId) {
        const response = await axios.put(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/ads/${editingId}`,
          payload
        );
        setAds(ads.map(ad => ad.id === editingId ? response.data.data : ad));
        setSuccess('Ad updated successfully!');
      } else {
        console.log('📤 [SAVE_AD] POSTing to backend...');
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/ads`,
          payload
        );
        console.log('✅ [SAVE_AD] Response:', response.data);
        setAds([...ads, response.data.data]);
        setSuccess('Ad created successfully!');
      }

      resetForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('❌ [SAVE_AD] Error:', err);
      console.error('❌ [SAVE_AD] Error response:', err.response?.data);
      console.error('❌ [SAVE_AD] Full error:', err.response);
      setError(err.response?.data?.error || 'Failed to save ad');
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ad?')) return;

    try {
      await axios.delete(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/ads/${id}`);
      setAds(ads.filter(ad => ad.id !== id));
      setSuccess('Ad deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to delete ad:', err);
      setError('Failed to delete ad');
    }
  };

  // Handle edit
  const handleEdit = (ad) => {
    setAdType(ad.ad_type || 'image');
    setFormData({
      title: ad.title,
      adType: ad.ad_type || 'image',
      imageUrl: ad.image_url || '',
      videoUrl: ad.video_url || '',
      videoDuration: ad.video_duration || 0,
      videoThumbnailUrl: ad.video_thumbnail_url || '',
      clickUrl: ad.click_url || '',
      ctaText: ad.cta_text || 'Learn More',
      ctaButtonColor: ad.cta_button_color || '#00a884',
      placement: ad.placement,
      startDate: ad.start_date ? ad.start_date.split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: ad.end_date ? ad.end_date.split('T')[0] : '',
      countdownSeconds: ad.countdown_seconds || 10,
      isSkippable: ad.is_skippable !== undefined ? ad.is_skippable : true,
      budget: ad.budget || '',
      dailyBudget: ad.daily_budget || '',
      costPerClick: ad.cost_per_click || 0.5,
      minAge: ad.min_age || 0,
      maxAge: ad.max_age || 100,
      targetGender: ad.target_gender || 'all',
      targetDevices: ad.target_devices ? JSON.parse(ad.target_devices) : ['mobile', 'tablet', 'desktop'],
      frequencyCap: ad.frequency_cap || 0,
      conversionTracking: ad.conversion_tracking || false,
      conversionUrl: ad.conversion_url || '',
      status: ad.status || 'draft',
      priority: ad.priority || 0,
      abTestGroup: ad.ab_test_group || 'control',
    });
    setEditingId(ad.id);
    setShowForm(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      adType: 'image',
      placement: 'homepage',
      imageUrl: '',
      videoUrl: '',
      videoDuration: 0,
      videoThumbnailUrl: '',
      clickUrl: '',
      ctaText: 'Learn More',
      ctaButtonColor: '#00a884',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      countdownSeconds: 10,
      isSkippable: true,
      budget: '',
      dailyBudget: '',
      costPerClick: 0.5,
      minAge: 0,
      maxAge: 100,
      targetGender: 'all',
      targetDevices: ['mobile', 'tablet', 'desktop'],
      frequencyCap: 0,
      conversionTracking: false,
      conversionUrl: '',
      status: 'draft',
      priority: 0,
      abTestGroup: 'control',
    });
    setAdType('image');
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="ads-management">
        <div className="ads-loading">Loading ads...</div>
      </div>
    );
  }

  return (
    <div className="ads-management advanced">
      {/* Enhanced Header with Stats */}
      <div className="ads-header-enhanced">
        <div className="header-main">
          <div className="header-title-section">
            <h1>Ad Management</h1>
            <p>Create, edit, and manage advertisements with video support</p>
          </div>
          
          {/* Quick Stats */}
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-label">Total Ads</span>
              <span className="stat-value">{ads.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active</span>
              <span className="stat-value">{ads.filter(a => a.status === 'active').length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Views</span>
              <span className="stat-value">{ads.reduce((sum, a) => sum + (a.total_impressions || 0), 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="ads-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {success && (
        <div className="ads-success">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}>×</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="ads-tabs-container">
        <div className="ads-tabs">
          <button 
            className={`tab ${activeTab === 'ads' ? 'active' : ''}`}
            onClick={() => { setActiveTab('ads'); setShowForm(false); }}
          >
            <span className="tab-icon">📊</span>
            <span className="tab-text">Ads</span>
            <span className="tab-count">{ads.length}</span>
          </button>
          <button 
            className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <span className="tab-icon">📈</span>
            <span className="tab-text">Analytics</span>
            <span className="tab-count">{selectedAnalyticsAd ? '1' : '-'}</span>
          </button>
        </div>
      </div>

      {/* Create Ad Button - Left Aligned Below Tabs */}
      {!showForm && activeTab === 'ads' && (
        <div className="header-actions">
          <button className="btn-create-ad" onClick={() => setShowForm(true)}>
            <FiPlus size={18} />
            <span>Create Ad</span>
          </button>
        </div>
      )}

      {/* Form */}
      {showForm && activeTab === 'ads' && (
        <div className="ads-form-container">
          <h2>{editingId ? 'Edit Ad' : 'Create Ad'}</h2>
          
          {/* Ad Type Selection */}
          <div className="ad-type-selection">
            <button
              type="button"
              className={`type-btn ${formData.adType === 'image' ? 'active' : ''}`}
              onClick={() => {
                setFormData({ ...formData, adType: 'image' });
                setAdType('image');
              }}
            >
              <FiImage /> Image Ad
            </button>
            <button
              type="button"
              className={`type-btn ${formData.adType === 'video' ? 'active' : ''}`}
              onClick={() => {
                setFormData({ ...formData, adType: 'video' });
                setAdType('video');
              }}
            >
              <FiVideo /> Video Ad
            </button>
          </div>

          <form onSubmit={handleSubmit} className="ads-form">
            {/* Basic Information & Timing Section */}
            <fieldset className="form-section">
              <legend>📋 Basic Information & Timing</legend>
              
              {/* Row 1: Title, Placement, Status, Priority */}
              <div className="form-row">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Ad title"
                    required
                    style={{ minWidth: '180px' }}
                  />
                </div>

                <div className="form-group">
                  <label>Placement *</label>
                  <select
                    name="placement"
                    value={formData.placement}
                    onChange={handleInputChange}
                    required
                  >
                    <optgroup label="Regular Placements">
                      <option value="homepage">Homepage</option>
                      <option value="books">Books</option>
                      <option value="authors">Authors</option>
                      <option value="categories">Categories</option>
                      <option value="pastpapers">Past Papers</option>
                      <option value="papers">Papers</option>
                    </optgroup>
                    <optgroup label="Grid Card Placements">
                      <option value="grid-books">Grid - Books</option>
                      <option value="grid-authors">Grid - Authors</option>
                      <option value="grid-categories">Grid - Categories</option>
                      <option value="grid-pastpapers">Grid - Past Papers</option>
                      <option value="grid-campus">Grid - Campus/Universities</option>
                      <option value="grid-papers">Grid - Papers</option>
                    </optgroup>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <input
                    type="number"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    placeholder="0-100"
                    style={{ width: '80px' }}
                  />
                </div>
              </div>

              {/* Row 2: Start Date, End Date, Countdown, Skippable */}
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Countdown (sec)</label>
                  <input
                    type="number"
                    name="countdownSeconds"
                    value={formData.countdownSeconds}
                    onChange={handleInputChange}
                    min="3"
                    max="60"
                    style={{ width: '80px' }}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      name="isSkippable"
                      checked={formData.isSkippable}
                      onChange={handleInputChange}
                    />
                    Skippable
                  </label>
                </div>
              </div>
            </fieldset>

            {/* Media & CTA Section */}
            <fieldset className="form-section">
              <legend>🎨 Media & CTA</legend>

              {formData.adType === 'image' && (
                <div className="form-group">
                  <label>Image *</label>
                  <div className="upload-section">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'image')}
                      disabled={uploading}
                      className="file-input"
                    />
                    {uploading && <span className="upload-status">Uploading...</span>}
                  </div>
                </div>
              )}

              {formData.adType === 'video' && (
                <>
                  <div className="form-group">
                    <label>Video File *</label>
                    <div className="upload-section">
                      <input
                        type="file"
                        accept="video/mp4"
                        onChange={(e) => handleFileUpload(e, 'video')}
                        disabled={uploading}
                        className="file-input"
                      />
                      {uploading && <span className="upload-status">Uploading...</span>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Thumbnail Image</label>
                    <div className="upload-section">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'thumbnail')}
                        disabled={uploading}
                        className="file-input"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>CTA Text</label>
                  <input
                    type="text"
                    name="ctaText"
                    value={formData.ctaText}
                    onChange={handleInputChange}
                    placeholder="Learn More"
                    style={{ minWidth: '120px' }}
                  />
                </div>

                <div className="form-group">
                  <label>CTA Color</label>
                  <input
                    type="color"
                    name="ctaButtonColor"
                    value={formData.ctaButtonColor}
                    onChange={handleInputChange}
                    style={{ height: '28px', width: '50px', cursor: 'pointer' }}
                  />
                </div>

                <div className="form-group">
                  <label>Click URL</label>
                  <input
                    type="url"
                    name="clickUrl"
                    value={formData.clickUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                    style={{ minWidth: '180px' }}
                  />
                </div>
              </div>
            </fieldset>

            {/* Budget & Conversion Section */}
            <fieldset className="form-section">
              <legend>💰 Budget & Conversion</legend>

              {/* Row 1: Budget Fields */}
              <div className="form-row">
                <div className="form-group">
                  <label>Total Budget</label>
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    style={{ width: '90px' }}
                  />
                </div>

                <div className="form-group">
                  <label>Daily Budget</label>
                  <input
                    type="number"
                    name="dailyBudget"
                    value={formData.dailyBudget}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    style={{ width: '90px' }}
                  />
                </div>

                <div className="form-group">
                  <label>Cost Per Click</label>
                  <input
                    type="number"
                    name="costPerClick"
                    value={formData.costPerClick}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    style={{ width: '90px' }}
                  />
                </div>

                <div className="form-group">
                  <label>A/B Test</label>
                  <select
                    name="abTestGroup"
                    value={formData.abTestGroup}
                    onChange={handleInputChange}
                  >
                    <option value="control">Control</option>
                    <option value="variant_a">Variant A</option>
                    <option value="variant_b">Variant B</option>
                    <option value="variant_c">Variant C</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Conversion Tracking */}
              <div className="form-row">
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      name="conversionTracking"
                      checked={formData.conversionTracking}
                      onChange={handleInputChange}
                    />
                    Enable Conversion Tracking
                  </label>
                </div>

                {formData.conversionTracking && (
                  <div className="form-group">
                    <label>Conversion URL</label>
                    <input
                      type="url"
                      name="conversionUrl"
                      value={formData.conversionUrl}
                      onChange={handleInputChange}
                      placeholder="https://analytics.example.com/pixel"
                      style={{ minWidth: '200px' }}
                    />
                  </div>
                )}
              </div>
            </fieldset>

            {/* Targeting & Advanced Section */}
            <fieldset className="form-section">
              <legend>🎯 Targeting</legend>

              {/* Row 1: Demographics */}
              <div className="form-row">
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    name="targetGender"
                    value={formData.targetGender}
                    onChange={handleInputChange}
                  >
                    <option value="all">All</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Min Age</label>
                  <input
                    type="number"
                    name="minAge"
                    value={formData.minAge}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    style={{ width: '70px' }}
                  />
                </div>

                <div className="form-group">
                  <label>Max Age</label>
                  <input
                    type="number"
                    name="maxAge"
                    value={formData.maxAge}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    style={{ width: '70px' }}
                  />
                </div>

                <div className="form-group">
                  <label>Frequency Cap</label>
                  <input
                    type="number"
                    name="frequencyCap"
                    value={formData.frequencyCap}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="Unlimited"
                    style={{ width: '80px' }}
                  />
                </div>
              </div>

              {/* Row 2: Devices */}
              <div className="form-row">
                <div className="form-group">
                  <label>Target Devices</label>
                  <div className="checkbox-group">
                    {['mobile', 'tablet', 'desktop'].map(device => (
                      <label key={device} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.targetDevices.includes(device)}
                          onChange={() => handleDeviceChange(device)}
                        />
                        {device.charAt(0).toUpperCase() + device.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </fieldset>

            {/* Form Actions */}
            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingId ? '✏️ Update' : '➕ Create Ad'}
              </button>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={resetForm}
              >
                ✕ Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ads List - Compact Table */}
      {activeTab === 'ads' && !showForm && (
        <div className="ads-list">
          {ads.length === 0 ? (
            <div className="no-ads">
              <p>No ads yet. Create your first ad!</p>
            </div>
          ) : (
            <table className="ads-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Placement</th>
                  <th>Status</th>
                  <th>Impressions</th>
                  <th>Clicks</th>
                  <th>CTR</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ads.map(ad => (
                  <tr key={ad.id} className={`ad-row ${ad.status}`}>
                    <td className="title-cell">
                      <div className="title-with-thumb">
                        {ad.ad_type === 'video' ? (
                          <div className="ad-thumb video">🎥</div>
                        ) : (
                          <>
                            {ad.image_url && (
                              <img src={ad.image_url} alt={ad.title} className="ad-thumb" />
                            )}
                          </>
                        )}
                        <span>{ad.title}</span>
                      </div>
                    </td>
                    <td className="type-cell">
                      <span className="badge-type">{ad.ad_type?.toUpperCase() || 'IMAGE'}</span>
                    </td>
                    <td>{ad.placement}</td>
                    <td>
                      <span className={`status-badge ${ad.status}`}>
                        {ad.status?.charAt(0).toUpperCase() + ad.status?.slice(1) || 'Active'}
                      </span>
                    </td>
                    <td className="number">{ad.total_impressions || 0}</td>
                    <td className="number">{ad.total_clicks || 0}</td>
                    <td className="number">
                      {ad.total_impressions > 0 
                        ? (((ad.total_clicks || 0) / ad.total_impressions) * 100).toFixed(2) 
                        : 0}%
                    </td>
                    <td className="date-cell">
                      {ad.start_date ? new Date(ad.start_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : '—'}
                    </td>
                    <td className="date-cell">
                      {ad.end_date ? new Date(ad.end_date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : '—'}
                    </td>
                    <td className="actions-cell">
                      <div className="actions">
                        <button 
                          className="btn-small edit"
                          onClick={() => handleEdit(ad)}
                          title="Edit ad"
                        >
                          <FiEdit2 />
                        </button>
                        <button 
                          className="btn-small delete"
                          onClick={() => handleDelete(ad.id)}
                          title="Delete ad"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="analytics-section">
          <div className="analytics-header-section">
            <h3>� Ad Performance Analytics</h3>
            <p>Real-time tracking of impressions, clicks, and engagement metrics</p>
          </div>

          {/* Enhanced Ads Performance Table */}
          <div className="ads-performance-table-wrapper">
            <h2>All Ads Performance Overview</h2>
            <div className="ads-performance-table">
              <div className="table-header">
                <div className="col-title">Ad Title</div>
                <div className="col-placement">Placement</div>
                <div className="col-impressions">Impressions</div>
                <div className="col-clicks">Clicks</div>
                <div className="col-dismisses">Dismisses</div>
                <div className="col-ctr">CTR %</div>
                <div className="col-engagement">Engagement %</div>
              </div>
              <div className="table-body">
                {ads.map(ad => (
                  <div 
                    key={ad.id} 
                    className={`table-row ${selectedAnalyticsAd?.id === ad.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedAnalyticsAd(ad);
                      fetchAnalytics(ad.id);
                      fetchEngagement(ad.id);
                    }}
                  >
                    <div className="col-title">{ad.title}</div>
                    <div className="col-placement">
                      <span className="placement-badge">{ad.placement}</span>
                    </div>
                    <div className="col-impressions">{ad.total_impressions || 0}</div>
                    <div className="col-clicks">{ad.total_clicks || 0}</div>
                    <div className="col-dismisses">{ad.total_dismisses || 0}</div>
                    <div className="col-ctr">
                      {ad.total_impressions > 0 
                        ? (((ad.total_clicks || 0) / ad.total_impressions) * 100).toFixed(1)
                        : 0}%
                    </div>
                    <div className="col-engagement">
                      {ad.total_impressions > 0 
                        ? (((ad.total_clicks + ad.total_dismisses) / ad.total_impressions) * 100).toFixed(1)
                        : 0}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {selectedAnalyticsAd && (
            <>
              {/* Selected Ad Details Panel */}
              <div className="selected-ad-analytics-panel">
                <h2>📈 Analytics Details: {selectedAnalyticsAd.title}</h2>

                {/* Key Metrics Grid */}
                <div className="key-metrics-grid">
                  <div className="key-metric">
                    <span className="label">Total Impressions</span>
                    <span className="value">{selectedAnalyticsAd.total_impressions || 0}</span>
                  </div>
                  <div className="key-metric">
                    <span className="label">Total Clicks</span>
                    <span className="value highlight-blue">{selectedAnalyticsAd.total_clicks || 0}</span>
                  </div>
                  <div className="key-metric">
                    <span className="label">Total Dismisses</span>
                    <span className="value highlight-red">{selectedAnalyticsAd.total_dismisses || 0}</span>
                  </div>
                  <div className="key-metric">
                    <span className="label">Click-Through Rate</span>
                    <span className="value highlight-green">
                      {selectedAnalyticsAd.total_impressions > 0 
                        ? (((selectedAnalyticsAd.total_clicks || 0) / selectedAnalyticsAd.total_impressions) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="key-metric">
                    <span className="label">Engagement Rate</span>
                    <span className="value highlight-purple">
                      {selectedAnalyticsAd.total_impressions > 0 
                        ? (((selectedAnalyticsAd.total_clicks + selectedAnalyticsAd.total_dismisses) / selectedAnalyticsAd.total_impressions) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="key-metric">
                    <span className="label">Completion Rate</span>
                    <span className="value highlight-yellow">
                      {selectedAnalyticsAd.total_impressions > 0
                        ? (((selectedAnalyticsAd.total_impressions - selectedAnalyticsAd.total_dismisses) / selectedAnalyticsAd.total_impressions) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>

                {/* Ad Info & Device Breakdown */}
                <div className="analytics-grid">
                  {/* Ad Information */}
                  <div className="ad-info-card">
                    <h3>Ad Information</h3>
                    <div className="info-row">
                      <span className="label">Status:</span>
                      <span className={`value status-badge ${selectedAnalyticsAd.is_active ? 'active' : 'inactive'}`}>
                        {selectedAnalyticsAd.is_active ? '● Active' : '○ Inactive'}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="label">Dismiss Rate:</span>
                      <span className="value">{selectedAnalyticsAd.dismissRate || 0}%</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Avg View Duration:</span>
                      <span className="value">{analytics?.metrics?.avgViewDuration || 0}s</span>
                    </div>
                  </div>

                  {/* Device Breakdown */}
                  <div className="device-breakdown-card">
                    <h3>Device Breakdown</h3>
                    {(() => {
                      const mobile = analytics?.metrics?.deviceBreakdown?.mobile || 0;
                      const tablet = analytics?.metrics?.deviceBreakdown?.tablet || 0;
                      const desktop = analytics?.metrics?.deviceBreakdown?.desktop || 0;
                      const total = mobile + tablet + desktop;
                      return (
                        <div className="device-rows">
                          <div className="device-item">
                            <span className="device-name">📱 Mobile</span>
                            <span className="device-count">{mobile}</span>
                            <div className="device-bar-small">
                              <div className="bar mobile" style={{width: total > 0 ? ((mobile / total) * 100) : 0 + '%'}}></div>
                            </div>
                            <span className="device-pct">{total > 0 ? ((mobile / total) * 100).toFixed(1) : 0}%</span>
                          </div>
                          <div className="device-item">
                            <span className="device-name">📱 Tablet</span>
                            <span className="device-count">{tablet}</span>
                            <div className="device-bar-small">
                              <div className="bar tablet" style={{width: total > 0 ? ((tablet / total) * 100) : 0 + '%'}}></div>
                            </div>
                            <span className="device-pct">{total > 0 ? ((tablet / total) * 100).toFixed(1) : 0}%</span>
                          </div>
                          <div className="device-item">
                            <span className="device-name">🖥️ Desktop</span>
                            <span className="device-count">{desktop}</span>
                            <div className="device-bar-small">
                              <div className="bar desktop" style={{width: total > 0 ? ((desktop / total) * 100) : 0 + '%'}}></div>
                            </div>
                            <span className="device-pct">{total > 0 ? ((desktop / total) * 100).toFixed(1) : 0}%</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Date Range & Engagement Timeline */}
                <div className="engagement-section">
                  <div className="engagement-header-row">
                    <h3>Daily Engagement Timeline</h3>
                    <div className="date-selector-inline">
                      <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                        title="Start Date"
                      />
                      <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                        title="End Date"
                      />
                      <button className="btn-refresh" onClick={refreshEngagement}>
                        Refresh
                      </button>
                    </div>
                  </div>

                  {engagement && Object.keys(engagement).length > 0 ? (
                    <div className="engagement-table">
                      <div className="table-header-row">
                        <div className="col date">Date</div>
                        <div className="col impressions">Impressions</div>
                        <div className="col clicks">Clicks</div>
                        <div className="col dismisses">Dismisses</div>
                        <div className="col avgTime">Avg Time</div>
                      </div>
                      <div className="table-body-rows">
                        {Object.entries(engagement).map(([date, data]) => (
                          <div key={date} className="table-row-item">
                            <div className="col date">{date}</div>
                            <div className="col impressions">{data.impressions || 0}</div>
                            <div className="col clicks">{data.clicks || 0}</div>
                            <div className="col dismisses">{data.dismisses || 0}</div>
                            <div className="col avgTime">
                              {data.totalViewTime > 0 
                                ? (data.totalViewTime / Math.max(data.impressions, 1)).toFixed(1) 
                                : 0}s
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="no-data">No engagement data for selected date range</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
