import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiImage, FiVideo, FiX } from 'react-icons/fi';
import { useAdminUI } from '../Admin/AdminUIContext';
import { supabase } from '../SomaLux/Books/supabaseClient';

const dropzoneStyles = `
  .user-ads .dropzone {
    border: 1px dotted #374151;
    border-radius: 4px;
    padding: 6px 8px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 12px;
    color: #5a6b77;
  }
  .user-ads .dropzone:hover {
    border-color: #00a884;
    background: rgba(0, 168, 132, 0.03);
    color: #5a6b77;
  }
  .user-ads .dropzone.drag-over {
    border-color: #00a884;
    background: rgba(0, 168, 132, 0.06);
    color: #5a6b77;
  }
  /* Scope panel styling to avoid affecting admin pages */
  .user-ads .panel { border: none !important; background: transparent !important; box-shadow: none !important; }
  .user-ads .panel + .panel { margin-top: 8px; border: none !important; background: transparent !important; }
  .user-ads .panel-title { display: none !important; }
  .user-ads .grid-2 .panel { border: none !important; background: transparent !important; box-shadow: none !important; }
  .user-ads div.panel { border: none !important; background: transparent !important; outline: none !important; }

  /* Remove all bottom/top borders inside this component only */
  .user-ads .grid-2 { border: none !important; border-bottom: none !important; border-top: none !important; }
  .user-ads .actions { border: none !important; margin-top: 16px !important; width: 100% !important; justify-content: stretch !important; }
  .user-ads .actions .btn { width: 100% !important; padding: 8px 12px !important; font-size: 13px !important; flex: 1 !important; }
  .user-ads .table { border: none !important; }
  .user-ads .table th, .user-ads .table td { border: none !important; }

  /* Admin-style checkbox */
  .user-ads input[type="checkbox"] {
    appearance: none;
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    background: #0b1216;
    border: 2px solid #2a3942;
    border-radius: 4px;
    cursor: pointer;
    position: relative;
    transition: all 0.2s ease;
  }
  
  .user-ads input[type="checkbox"]:hover {
    border-color: #00a884;
  }
  
  .user-ads input[type="checkbox"]:checked {
    background: #00a884;
    border-color: #00a884;
  }
  
  .user-ads input[type="checkbox"]:checked::after {
    content: '✓';
    position: absolute;
    color: #0b1216;
    font-size: 12px;
    font-weight: bold;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  
  .user-ads .checkbox-label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }
`;

const UserAds = ({ userProfile, onAdCreated, onCancel, editingAd }) => {
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = dropzoneStyles;
    document.head.appendChild(styleTag);
    return () => styleTag.remove();
  }, []);

  const navigate = useNavigate();
  const { showToast } = useAdminUI();

  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    // Basic Info
    title: '',
    description: '',
    adType: 'image',
    imageUrl: '',
    videoUrl: '',
    videoDuration: 0,
    
    // Call to Action
    clickUrl: '',
    // CTA fields removed from user-created ads
    
    // Placement & Scheduling
    placement: 'homepage',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    
    // Budget & Performance
    budget: '',
    dailyBudget: '',
    costPerClick: '0.5',
    
    // Targeting
    minAge: '18',
    maxAge: '100',
    targetGender: 'all',
    targetDevices: ['mobile', 'tablet', 'desktop'],
    
    // Advanced Settings
    priority: 'medium',
    frequencyCap: '0',
    conversionTracking: false,
    conversionUrl: '',
    abTestGroup: 'control'
  });

  // If editingAd is provided, populate form with its values
  useEffect(() => {
    if (editingAd) {
      setFormData(prev => ({
        ...prev,
        title: editingAd.title || prev.title,
        description: editingAd.description || prev.description,
        adType: editingAd.ad_type || editingAd.adType || prev.adType,
        imageUrl: editingAd.image_url || editingAd.imageUrl || prev.imageUrl,
        videoUrl: editingAd.video_url || editingAd.videoUrl || prev.videoUrl,
        videoDuration: editingAd.video_duration || editingAd.videoDuration || prev.videoDuration,
        clickUrl: editingAd.click_url || editingAd.clickUrl || prev.clickUrl,
        placement: editingAd.placement || prev.placement,
        startDate: editingAd.start_date ? new Date(editingAd.start_date).toISOString().split('T')[0] : prev.startDate,
        endDate: editingAd.end_date ? new Date(editingAd.end_date).toISOString().split('T')[0] : prev.endDate,
        budget: editingAd.budget || prev.budget,
        dailyBudget: editingAd.daily_budget || prev.dailyBudget,
        costPerClick: editingAd.cost_per_click != null ? String(editingAd.cost_per_click) : prev.costPerClick,
        minAge: editingAd.min_age != null ? String(editingAd.min_age) : prev.minAge,
        maxAge: editingAd.max_age != null ? String(editingAd.max_age) : prev.maxAge,
        targetGender: editingAd.target_gender || prev.targetGender,
        targetDevices: editingAd.target_devices ? (Array.isArray(editingAd.target_devices) ? editingAd.target_devices : JSON.parse(editingAd.target_devices || '[]')) : prev.targetDevices,
        priority: editingAd.priority || prev.priority,
        frequencyCap: editingAd.frequency_cap != null ? String(editingAd.frequency_cap) : prev.frequencyCap,
        conversionTracking: editingAd.conversion_tracking || prev.conversionTracking,
        conversionUrl: editingAd.conversion_url || prev.conversionUrl,
        abTestGroup: editingAd.ab_test_group || prev.abTestGroup,
      }));
    }
  }, [editingAd]);

  const api_url = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleDeviceChange = (device) => {
    setFormData(prev => ({
      ...prev,
      targetDevices: prev.targetDevices.includes(device)
        ? prev.targetDevices.filter(d => d !== device)
        : [...prev.targetDevices, device]
    }));
  };

  // Step validation
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Please enter an ad title');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Please enter an ad description');
      return false;
    }
    if (formData.adType === 'image' && !formData.imageUrl) {
      setError('Please upload an image');
      return false;
    }
    if (formData.adType === 'video' && !formData.videoUrl) {
      setError('Please upload a video');
      return false;
    }
    if (!formData.clickUrl.trim()) {
      setError('Please enter a destination URL');
      return false;
    }
    if (formData.targetDevices.length === 0) {
      setError('Please select at least one device type');
      return false;
    }
    setError(null);
    return true;
  };

  // Handle file upload for images and videos
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
          const response = await fetch(`${api_url}/api/upload/${fileType}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              fileData: base64Data,
              mimeType: mimeType
            })
          });

          const data = await response.json();
          console.log('✅ [UPLOAD] Response:', data);

          if (data.success) {
            if (fileType === 'video') {
              setFormData(prev => ({
                ...prev,
                videoUrl: data.filePath || data.imagePath
              }));
              console.log('✅ [UPLOAD] Video URL set:', data.filePath || data.imagePath);
            } else {
              setFormData(prev => ({
                ...prev,
                imageUrl: data.filePath || data.imagePath
              }));
              console.log('✅ [UPLOAD] Image URL set:', data.filePath || data.imagePath);
            }
            showToast({ type: 'success', message: `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} uploaded successfully!` });
          } else {
            console.error('❌ [UPLOAD] Response not successful:', data);
            setError(data.error || `Failed to upload ${fileType}`);
          }
        } catch (err) {
          console.error('❌ [UPLOAD] Error:', err);
          setError(err.message || `Failed to upload ${fileType}`);
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

  // Render file upload dropzone
  const renderFileUploadZone = (fileKey, label, accept, icon) => {
    const hasFile = fileKey === 'imageUrl' ? formData.imageUrl : formData.videoUrl;
    const fileType = fileKey === 'imageUrl' ? 'image' : 'video';
    
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
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileUpload({ target: { files } }, fileType);
      }
    };
    const handleClick = () => {
      document.getElementById(`${fileKey}-input`).click();
    };

    return (
      <div
        className="dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        style={{ cursor: 'pointer', position: 'relative' }}
      >
        <input
          id={`${fileKey}-input`}
          type="file"
          accept={accept}
          onChange={(e) => handleFileUpload(e, fileType)}
          disabled={uploading}
          style={{ display: 'none' }}
        />
        {hasFile ? (
          <div style={{ color: '#00a884', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px' }}>✓ {label} uploaded</div>
              <div style={{ fontSize: '11px', color: '#8696a0', marginTop: '4px' }}>
                Click to change file
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFormData(prev => ({
                  ...prev,
                  [fileKey]: ''
                }));
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#f87171',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px'
              }}
              title="Remove file"
            >
              <FiX size={16} />
            </button>
          </div>
        ) : (
          <div>
            <div style={{ color: '#a0b0b8', marginBottom: '4px' }}>
              {uploading ? 'Uploading...' : `Drag and drop or click to upload ${label}`}
            </div>
            <div style={{ color: '#7a8a96', fontSize: '0.85em' }}>
              {fileType === 'video' ? 'MP4 video files' : 'PNG, JPG, or GIF images'}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Submit ad for approval to Supabase
  const submitAd = async () => {
    // Validation
    if (!validateForm()) {
      showToast({ type: 'error', message: error || 'Please fill in all required fields' });
      return;
    }

    setBusy(true);
    try {
      // Fetch the latest user profile data directly from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      let currentProfile = userProfile;
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, full_name, display_name')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          currentProfile = profile;
          console.log('📤 [AD_SUBMISSION] Retrieved latest profile:', profile);
        }
      }

      console.log('📤 [AD_SUBMISSION] User profile:', currentProfile);
      console.log('📤 [AD_SUBMISSION] Form data being submitted:', formData);

      // Extract display name - prioritize display_name, then full_name
      const displayName = currentProfile?.display_name || currentProfile?.full_name || currentProfile?.email?.split('@')[0] || 'User';

      // Prepare ad data
      const adData = {
        user_id: currentProfile?.id,
        user_email: currentProfile?.email,
        user_name: displayName,
        title: formData.title,
        description: formData.description,
        ad_type: formData.adType,
        image_url: formData.imageUrl || null,
        video_url: formData.videoUrl || null,
        video_duration: formData.videoDuration || 0,
        click_url: formData.clickUrl,
        placement: formData.placement,
        start_date: formData.startDate,
        end_date: formData.endDate || null,
        budget: formData.budget ? parseFloat(formData.budget) : 0,
        daily_budget: formData.dailyBudget ? parseFloat(formData.dailyBudget) : 0,
        cost_per_click: parseFloat(formData.costPerClick) || 0.5,
        min_age: parseInt(formData.minAge) || 18,
        max_age: parseInt(formData.maxAge) || 100,
        target_gender: formData.targetGender,
        target_devices: JSON.stringify(formData.targetDevices),
        priority: formData.priority,
        frequency_cap: parseInt(formData.frequencyCap) || 0,
        conversion_tracking: formData.conversionTracking,
        conversion_url: formData.conversionUrl || null,
        ab_test_group: formData.abTestGroup,
        status: 'pending'
      };

      console.log('📤 [AD_SUBMISSION] Prepared ad data:', adData);

      // If editingAd provided, attempt update instead
      if (editingAd && editingAd.id) {
        const { data: updatedData, error: updateError } = await supabase
          .from('user_ads')
          .update({
            title: adData.title,
            description: adData.description,
            ad_type: adData.ad_type,
            image_url: adData.image_url,
            video_url: adData.video_url,
            video_duration: adData.video_duration,
            click_url: adData.click_url,
            placement: adData.placement,
            start_date: adData.start_date,
            end_date: adData.end_date,
            budget: adData.budget,
            daily_budget: adData.daily_budget,
            cost_per_click: adData.cost_per_click,
            min_age: adData.min_age,
            max_age: adData.max_age,
            target_gender: adData.target_gender,
            target_devices: adData.target_devices,
            priority: adData.priority,
            frequency_cap: adData.frequency_cap,
            conversion_tracking: adData.conversion_tracking,
            conversion_url: adData.conversion_url,
            ab_test_group: adData.ab_test_group
          })
          .eq('id', editingAd.id)
          .select();

        if (updateError) throw updateError;
        console.log('✅ [AD_UPDATE] Ad updated:', updatedData);
      } else {
        // New insert path (as before)
        let { data: insertedData, error: insertError } = await supabase
          .from('user_ads')
          .insert([adData])
          .select();

        if (insertError) {
          console.error('❌ [AD_SUBMISSION] Failed to insert into user_ads table:', insertError);
          // Surface an error to the user instead of falling back to `requests`.
          throw insertError;
        }

        console.log('✅ [AD_SUBMISSION] Ad inserted into user_ads table:', insertedData);
      }

      showToast({ type: 'success', message: 'Ad submitted for admin approval!' });
      console.log('✅ [AD_SUBMISSION] Ad submitted successfully');

      // Reset form
      setFormData({
        title: '',
        description: '',
        adType: 'image',
        imageUrl: '',
        videoUrl: '',
        videoDuration: 0,
        clickUrl: '',
        placement: 'homepage',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        budget: '',
        dailyBudget: '',
        costPerClick: '0.5',
        minAge: '18',
        maxAge: '100',
        targetGender: 'all',
        targetDevices: ['mobile', 'tablet', 'desktop'],
        priority: 'medium',
        frequencyCap: '0',
        conversionTracking: false,
        conversionUrl: '',
        abTestGroup: 'control'
      });

      // Call callback to switch to analytics tab
      if (onAdCreated) {
        onAdCreated();
      }

      // Navigate back after a delay
      setTimeout(() => {
        navigate('/BookManagement');
      }, 2000);
    } catch (e) {
      console.error('❌ [AD_SUBMISSION] Error:', e);
      showToast({ type: 'error', message: 'Failed to submit ad. Try again later.' });
      setError(e.message || 'Failed to submit ad. Try again later.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel user-ads">
      {/* Header intentionally removed to simplify panel */}

      {error && (
        <div style={{
          padding: '12px 16px',
          background: '#f87171',
          color: '#fff',
          borderRadius: '6px',
          marginBottom: '16px',
          fontSize: '13px',
          border: '1px solid #f87171',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '16px' }}>⚠️</span>
          {error}
        </div>
      )}

      {/* BASIC INFO SECTION */}
      <div style={{
        background: '#0b1216',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #2a3942'
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#e9edef', margin: '0 0 16px 0' }}>Basics</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label className="label">Title *</label>
            <input
              className="input"
              placeholder="e.g., Learn Python Programming Online"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              style={{ marginBottom: '8px' }}
            />

            <label className="label" style={{ marginTop: 16 }}>Description *</label>
            <textarea
              className="input"
              style={{ minHeight: 100, marginBottom: '8px' }}
              placeholder="Describe your offer, product, or service in detail. What makes it special? What benefits does it provide?"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
            />
            {/* Ad Type moved to the right column to balance layout */}
          </div>

          <div>
            <label className="label">URL *</label>
            <input
              className="input"
              placeholder="https://example.com/special-offer"
              name="clickUrl"
              value={formData.clickUrl}
              onChange={handleInputChange}
              type="url"
              style={{ marginBottom: '8px' }}
            />
            {/* Replaced CTA area: include Ad Type and Placement here to fill space after removal */}
            <label className="label" style={{ marginTop: 16 }}>Type *</label>
            <select
              className="select"
              name="adType"
              value={formData.adType}
              onChange={handleInputChange}
              style={{ marginBottom: '8px' }}
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>

            <label className="label" style={{ marginTop: 16 }}>Placement *</label>
            <select className="select" name="placement" value={formData.placement} onChange={handleInputChange}>
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
        </div>
      </div>

      {/* CREATIVE SECTION */}
      <div style={{
        background: '#0b1216',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #2a3942'
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#e9edef', margin: '0 0 16px 0' }}>Media</h2>
        <div style={{ marginBottom: '20px' }}>

          {formData.adType === 'image' ? (
            <div>
              <label className="label">Upload *</label>
              <div style={{ marginBottom: '12px' }}>
                {renderFileUploadZone('imageUrl', 'Image', 'image/*', FiImage)}
              </div>
            </div>
          ) : (
            <div>
              <label className="label">Upload *</label>
              <div style={{ marginBottom: '12px' }}>
                {renderFileUploadZone('videoUrl', 'Video', 'video/mp4', FiVideo)}
              </div>
              <label className="label" style={{ marginTop: 16 }}>Video Duration (seconds)</label>
              <input
                className="input"
                type="number"
                placeholder="30"
                name="videoDuration"
                value={formData.videoDuration}
                onChange={handleInputChange}
                style={{ marginBottom: '8px' }}
              />
            </div>
          )}

          {/* Placement moved to Basic Information to improve layout after CTA removal */}
        </div>
      </div>

      {/* TARGETING SECTION */}
      <div style={{
        background: '#0b1216',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #2a3942'
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#e9edef', margin: '0 0 16px 0' }}>Audience</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label className="label">Age</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <input
                className="input"
                type="number"
                placeholder="Min"
                name="minAge"
                value={formData.minAge}
                onChange={handleInputChange}
                min="13"
                max="100"
                style={{ flex: 1 }}
              />
              <span style={{ color: '#8696a0' }}>to</span>
              <input
                className="input"
                type="number"
                placeholder="Max"
                name="maxAge"
                value={formData.maxAge}
                onChange={handleInputChange}
                min="13"
                max="100"
                style={{ flex: 1 }}
              />
            </div>
          </div>

          <div>
            <label className="label">Gender</label>
            <select className="select" name="targetGender" value={formData.targetGender} onChange={handleInputChange}>
              <option value="all">All</option>
              <option value="male">Men</option>
              <option value="female">Women</option>
            </select>
          </div>
        </div>

        <label className="label">Target Devices</label>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {['mobile', 'tablet', 'desktop'].map(device => (
            <label key={device} className="checkbox-label" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={formData.targetDevices.includes(device)}
                onChange={() => handleDeviceChange(device)}
              />
              <span style={{ color: '#e9edef', fontSize: '12px', fontWeight: '500' }}>
                {device === 'mobile' ? 'Mobile' : device === 'tablet' ? 'Tablet' : 'Desktop'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* BUDGET SECTION */}
      <div style={{
        background: '#0b1216',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #2a3942'
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#e9edef', margin: '0 0 16px 0' }}>Budget</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label className="label">Total</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: '#8696a0' }}>Ksh</span>
              <input
                className="input"
                type="number"
                placeholder="e.g., 5000"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                style={{ flex: 1 }}
              />
            </div>
          </div>

          <div>
            <label className="label">Daily</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: '#8696a0' }}>Ksh</span>
              <input
                className="input"
                type="number"
                placeholder="e.g., 200"
                name="dailyBudget"
                value={formData.dailyBudget}
                onChange={handleInputChange}
                style={{ flex: 1 }}
              />
            </div>
          </div>
        </div>

        <label className="label">CPC</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ color: '#8696a0' }}>Ksh</span>
          <input
            className="input"
            type="number"
            placeholder="0.5"
            name="costPerClick"
            value={formData.costPerClick}
            onChange={handleInputChange}
            step="0.1"
            style={{ flex: 1 }}
          />
        </div>
      </div>

      {/* ADVANCED SECTION */}
      <div style={{
        background: '#0b1216',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #2a3942'
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#e9edef', margin: '0 0 16px 0' }}>Additionals</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label className="label">Start</label>
            <input
              className="input"
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              style={{ marginBottom: '8px' }}
            />
          </div>

          <div>
            <label className="label">End</label>
            <input
              className="input"
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              style={{ marginBottom: '8px' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label className="label">Priority</label>
            <select className="select" name="priority" value={formData.priority} onChange={handleInputChange}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="label">Frequency</label>
            <input
              className="input"
              type="number"
              placeholder="0 (unlimited)"
              name="frequencyCap"
              value={formData.frequencyCap}
              onChange={handleInputChange}
              style={{ marginBottom: '8px' }}
            />
          </div>
        </div>

        <label className="checkbox-label" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            name="conversionTracking"
            checked={formData.conversionTracking}
            onChange={(e) => handleInputChange(e)}
          />
          <span style={{ color: '#e9edef' }}>Conversion</span>
        </label>

        {formData.conversionTracking && (
          <div style={{ marginBottom: '16px' }}>
            <label className="label">Conversion URL</label>
            <input
              className="input"
              placeholder="https://example.com/thank-you"
              name="conversionUrl"
              value={formData.conversionUrl}
              onChange={handleInputChange}
              type="url"
              style={{ marginBottom: '8px' }}
            />
          </div>
        )}

        <label className="label">AB Group</label>
        <select className="select" name="abTestGroup" value={formData.abTestGroup} onChange={handleInputChange}>
          <option value="control">Control</option>
          <option value="variant_a">Variant A</option>
          <option value="variant_b">Variant B</option>
        </select>
      </div>

      {/* Submit Button */}
      <div style={{
        display: 'flex',
        gap: '10px',
        justifyContent: 'flex-end',
        marginTop: '28px',
        alignItems: 'center'
      }}>
          <button
            onClick={() => onCancel ? onCancel() : navigate(-1)}
            style={{
              padding: '6px 14px',
              background: 'transparent',
              color: '#00a884',
              border: '1px solid rgba(0, 168, 132, 0.1)',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 168, 132, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Cancel
          </button>
          <button
            disabled={busy || uploading}
            onClick={submitAd}
            style={{
              padding: '6px 14px',
              background: '#1f9fff',
              color: '#001018',
              border: 'none',
              borderRadius: '5px',
              cursor: uploading || busy ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: '700',
              transition: 'all 0.2s',
              opacity: uploading || busy ? 0.6 : 1,
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (!busy && !uploading) {
                e.currentTarget.style.background = '#06d755';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1f9fff';
            }}
          >
            {busy ? 'Submitting...' : uploading ? 'Uploading...' : 'Submit'}
          </button>
      </div>
    </div>
  );
};

export default UserAds;

