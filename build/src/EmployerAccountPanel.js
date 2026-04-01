import './EmployerAccountPanel.css';
import { useState, useEffect } from 'react';
import { FaLinkedin, FaXTwitter, FaInstagram, FaFacebook } from 'react-icons/fa6';
import LocationSelector from './LocationSelector';

function EmployerAccountPanel({ onClose, onProfileCreated, selectedAccount, onBack }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [viewMode, setViewMode] = useState('steps');
  const TOTAL_STEPS = 5;
  
  // Get the profession name from localStorage
  const getProfessionName = () => {
    try {
      const profession = JSON.parse(localStorage.getItem('selectedProfession'));
      return profession?.name || 'Employer';
    } catch {
      return 'Employer';
    }
  };
  const [professionName] = useState(getProfessionName);
  
  // Check if this is a new employer account or editing an existing one
  // selectedAccount with data = editing mode; no data or undefined = creation mode
  const isNewEmployer = !selectedAccount || (!selectedAccount.name && !selectedAccount.email && !selectedAccount.industry);
  const isEditMode = !!selectedAccount && (selectedAccount.name || selectedAccount.email || selectedAccount.industry || selectedAccount.userType === 'employer');
  
  const getInitialProfileData = () => {
    if (selectedAccount) {
      return {
        // Company Basic Info
        name: selectedAccount.name || '',
        email: selectedAccount.email || '',
        phone: selectedAccount.phone || '',
        avatar: selectedAccount.avatar || localStorage.getItem('employerAvatar') || 'https://api.dicebear.com/7.x/bottts/svg?seed=Company',
        title: selectedAccount.title || '',
        
        // Company Details
        industry: selectedAccount.industry || '',
        companySize: selectedAccount.companySize || '',
        founded: selectedAccount.founded || '',
        website: selectedAccount.website || '',
        location: selectedAccount.location || '',
        
        // About
        bio: selectedAccount.bio || '',
        description: selectedAccount.description || '',
        
        // HR & Hiring
        rating: selectedAccount.rating || 0,
        activeJobs: selectedAccount.activeJobs || 0,
        totalHired: selectedAccount.totalHired || 0,
        hiringManager: selectedAccount.hiringManager || '',
        
        // Culture
        culture: selectedAccount.culture || '',
        benefits: selectedAccount.benefits || '',
        
        // Social Links
        linkedin: selectedAccount.linkedin || '',
        twitter: selectedAccount.twitter || '',
        facebook: selectedAccount.facebook || '',
        instagram: selectedAccount.instagram || '',
      };
    }

    return {
      // Company Basic Info
      name: '',
      email: '',
      phone: '',
      avatar: localStorage.getItem('employerAvatar') || 'https://api.dicebear.com/7.x/bottts/svg?seed=Company',
      title: '',
      
      // Company Details
      industry: '',
      companySize: '',
      founded: '',
      website: '',
      location: '',
      
      // About
      bio: '',
      description: '',
      
      // HR & Hiring
      rating: 0,
      activeJobs: 0,
      totalHired: 0,
      hiringManager: '',
      
      // Culture
      culture: '',
      benefits: '',
      
      // Social Links
      linkedin: '',
      twitter: '',
      facebook: '',
      instagram: '',
    };
  };
  
  const [profileData, setProfileData] = useState(getInitialProfileData());
  const [formData, setFormData] = useState(profileData);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    // Update profile data when selectedAccount changes
    const newProfileData = getInitialProfileData();
    setProfileData(newProfileData);
    setFormData(newProfileData);
    
    // Auto-enter edit mode for new employer accounts
    if (isNewEmployer) {
      setIsEditingProfile(true);
      setViewMode('steps'); // New accounts use step-by-step
    } else {
      setIsEditingProfile(false);
      setViewMode('full'); // Existing accounts use full form
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAvatar = reader.result;
        localStorage.setItem('employerAvatar', newAvatar);
        setFormData(prev => ({
          ...prev,
          avatar: newAvatar
        }));
        setProfileData(prev => ({
          ...prev,
          avatar: newAvatar
        }));
        setTimeout(() => {
          setIsEditingProfile(false);
        }, 300);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    const newProfileData = {
      ...formData,
      userType: 'employer'
    };
    setProfileData(newProfileData);
    setShowSuccessMessage(true);
    
    // Auto-close success message and return to home page after 2 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
      // Notify parent component about the created profile
      if (onProfileCreated) {
        onProfileCreated(newProfileData);
      }
      onClose();
    }, 2000);
  };

  const handleCancel = () => {
    setFormData(profileData);
    setIsEditingProfile(false);
    setCurrentStep(1);
  };

  const handleNextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="account-panel-wrapper" onClick={onClose}>
      <div className="account-panel" onClick={(e) => e.stopPropagation()}>
        <button className="close-panel-btn" onClick={onClose}>✕</button>
        
        {/* Success Message Popup */}
        {showSuccessMessage && (
          <div className="success-message-overlay">
            <div className="success-message-popup">
              <div className="success-icon">✓</div>
              <h2>{isEditMode ? 'Profile Updated Successfully!' : 'Profile Created Successfully!'}</h2>
            </div>
          </div>
        )}}
        
        {!isEditingProfile ? (
          <>
            {/* Header */}
            <div className="new-header employer-header">
            <div className="header-top">
              <div className="avatar-section">
                <img src={profileData.avatar} alt="Company" className="header-avatar" />
              </div>
              <div className="name-section">
                <h1 className="profile-name">{profileData.name}</h1>
                <p className="profile-email">{profileData.email}</p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="stats-row">
              <div className="stat-item">
                <span className="stat-label">Rating</span>
                <span className="stat-val">{profileData.rating}</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-label">Active Jobs</span>
                <span className="stat-val">{profileData.activeJobs}</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-label">Employees Hired</span>
                <span className="stat-val">{profileData.totalHired}</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-label">Founded</span>
                <span className="stat-val">{profileData.founded}</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-label">Industry</span>
                <span className="stat-val">{profileData.industry}</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-label">Size</span>
                <span className="stat-val">{profileData.companySize}</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="clean-tabs">
            <button 
              className={`clean-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Overview
            </button>
            <button 
              className={`clean-tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          </div>

          {/* Content */}
          <div className="panel-content">
            
            {activeTab === 'profile' && (
              <div className="profile-tab-content">
                
                {/* Company Information Section */}
                {(profileData.name || profileData.email || profileData.phone || profileData.location || profileData.website) && (
                  <div className="details-section">
                    <h3 className="section-title">Company Information</h3>
                    <div className="basic-info-list">
                      {profileData.name && (
                        <div className="basic-info-item">
                          <span className="basic-info-label">Company Name</span>
                          <span className="basic-info-value">{profileData.name}</span>
                        </div>
                      )}
                      {profileData.email && (
                        <div className="basic-info-item">
                          <span className="basic-info-label">Email</span>
                          <span className="basic-info-value">{profileData.email}</span>
                        </div>
                      )}
                      {profileData.phone && (
                        <div className="basic-info-item">
                          <span className="basic-info-label">Phone</span>
                          <span className="basic-info-value">{profileData.phone}</span>
                        </div>
                      )}
                      {profileData.location && (
                        <div className="basic-info-item">
                          <span className="basic-info-label">Location</span>
                          <span className="basic-info-value">{profileData.location}</span>
                        </div>
                      )}
                      {profileData.website && (
                        <div className="basic-info-item">
                          <span className="basic-info-label">Website</span>
                          <span className="basic-info-value">
                            <a href={profileData.website} target="_blank" rel="noopener noreferrer">{profileData.website}</a>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Company Profile Section */}
                {(profileData.industry || profileData.companySize || profileData.founded) && (
                  <div className="details-section">
                    <h3 className="section-title">Company Profile</h3>
                    <div className="expertise-list">
                      {profileData.industry && (
                        <div className="expertise-item">
                          <span className="expertise-label">Industry</span>
                          <span className="expertise-value">{profileData.industry}</span>
                        </div>
                      )}
                      {profileData.companySize && (
                        <div className="expertise-item">
                          <span className="expertise-label">Company Size</span>
                          <span className="expertise-value">{profileData.companySize}</span>
                        </div>
                      )}
                      {profileData.founded && (
                        <div className="expertise-item">
                          <span className="expertise-label">Founded</span>
                          <span className="expertise-value">{profileData.founded}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* About Company Section */}
                {profileData.bio && (
                  <div className="details-section">
                    <h3 className="section-title">About Company</h3>
                    <p style={{margin: '0 auto', fontSize: '10px', fontWeight: '700', color: '#00d973', lineHeight: '1.6'}}>{profileData.bio}</p>
                  </div>
                )}

                {/* Culture & Benefits Section */}
                {(profileData.culture || profileData.benefits) && (
                  <div className="details-section">
                    <h3 className="section-title">Culture & Benefits</h3>
                    {profileData.culture && (
                      <div className="expertise-item">
                        <span className="expertise-label">Company Culture</span>
                        <span className="expertise-value">{profileData.culture}</span>
                      </div>
                    )}
                    {profileData.benefits && (
                      <div className="expertise-item">
                        <span className="expertise-label">Benefits</span>
                        <span className="expertise-value">{profileData.benefits}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Edit Profile Button */}
                <button 
                  className="edit-profile-btn-new"
                  onClick={() => {
                    setIsEditingProfile(true);
                    setFormData(profileData);
                    setCurrentStep(1);
                    setViewMode('full'); // Use full form for editing existing profiles
                  }}
                >
                  ✏️ Edit Company Profile
                </button>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="settings-tab-content">
                <div className="settings-section">
                  <div className="setting-item danger-item">
                    <div className="setting-text">
                      <p className="setting-name">Sign Out</p>
                      <p className="setting-desc">Logout from your account</p>
                    </div>
                    <span className="setting-arrow">›</span>
                  </div>
                </div>
              </div>
            )}

          </div>
          </>
        ) : (
        // Edit Company Profile Form
        <div className="edit-profile-view">
          <div className="edit-profile-header">
            <div className="edit-profile-title-section">
              <div className="edit-profile-title-wrapper">
                <h2>{isEditMode ? 'Edit Company Profile' : 'Create Company Profile'}</h2>
                <p className="profession-tag">(Employer ~ {professionName})</p>
              </div>
              <div className="view-mode-toggle">
                <button 
                  className={`view-toggle-btn ${viewMode === 'steps' ? 'active' : ''}`}
                  onClick={() => setViewMode('steps')}
                >
                  📋 Steps
                </button>
                <button 
                  className={`view-toggle-btn ${viewMode === 'full' ? 'active' : ''}`}
                  onClick={() => setViewMode('full')}
                >
                  📄 Full View
                </button>
              </div>
            </div>
          </div>

          {/* Progress Bar - Only for Steps View */}
          {viewMode === 'steps' && (
            <div className="progress-bar-container">
              <div className="progress-bar-wrapper">
                <div className="progress-bar-fill" style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}></div>
              </div>
              <div className="progress-percentage">{Math.round((currentStep / TOTAL_STEPS) * 100)}%</div>
              <div className="step-indicators">
                {[1, 2, 3, 4, 5].map(step => (
                  <div 
                    key={step} 
                    className={`step-indicator ${step <= currentStep ? 'completed' : ''} ${step === currentStep ? 'active' : ''}`}
                    onClick={() => setCurrentStep(step)}
                  >
                    {step < currentStep ? '✓' : step}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Content */}
          <div className="edit-form-container">
            {viewMode === 'steps' ? (
              <div className="edit-form-content">
                {/* STEP 1: Company Basic Information */}
                {currentStep === 1 && (
                  <div className="form-step" data-step="1">
                    <h3 className="form-section-title">Company Information</h3>
                    
                    <div className="form-group avatar-upload-section">
                      <div className="avatar-preview">
                        <label className="avatar-upload-image-label">
                          <img src={formData.avatar} alt="Company Avatar" className="avatar-preview-img" />
                          <span className="avatar-edit-icon">+</span>
                          <input 
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            style={{display: 'none'}}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Company Name</label>
                      <textarea
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g., TechCorp Solutions"
                        rows="1"
                      />
                    </div>

                    <div className="form-two-col">
                      <div className="form-group">
                        <label>Email</label>
                        <textarea
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="company@gmail.com"
                        rows="1"
                      />
                      </div>
                      <div className="form-group">
                        <label>Phone</label>
                        <textarea
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+254 712 345 678"
                        rows="1"
                      />
                      </div>
                    </div>

                    <div className="form-two-col">
                      <div className="form-group">
                        <label>Location</label>
                        <LocationSelector 
                          value={formData.location}
                          onChange={(location) => setFormData(prev => ({ ...prev, location }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>Website</label>
                        <textarea
                          name="website"
                          value={formData.website}
                          onChange={handleInputChange}
                          placeholder="https://company.com"
                        rows="1"
                      />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Company Title/Role</label>
                      <textarea
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g., Hiring for Multiple Positions"
                        rows="1"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 2: Company Profile */}
                {currentStep === 2 && (
                  <div className="form-step" data-step="2">
                    <h3 className="form-section-title">Company Profile</h3>
                    
                    <div className="form-two-col">
                      <div className="form-group">
                        <label>Industry</label>
                        <textarea
                          name="industry"
                          value={formData.industry}
                          onChange={handleInputChange}
                          placeholder="e.g., Software Development"
                        rows="1"
                      />
                      </div>
                      <div className="form-group">
                        <label>Company Size</label>
                        <select name="companySize" value={formData.companySize} onChange={handleInputChange}>
                          <option value="1-10 employees">1-10 employees</option>
                          <option value="10-50 employees">10-50 employees</option>
                          <option value="50-100 employees">50-100 employees</option>
                          <option value="100-500 employees">100-500 employees</option>
                          <option value="500+ employees">500+ employees</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Year Founded</label>
                      <textarea
                        name="founded"
                        value={formData.founded}
                        onChange={handleInputChange}
                        placeholder="2010"
                        rows="1"
                      />
                    </div>

                    <div className="form-group">
                      <label>Company Description</label>
                      <textarea 
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Tell potential employees about your company..."
                        rows="3"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 3: Hiring Info & Culture */}
                {currentStep === 3 && (
                  <div className="form-step" data-step="3">
                    <h3 className="form-section-title">Hiring Info & Company Culture</h3>
                    
                    <div className="form-two-col">
                      <div className="form-group">
                        <label>Active Job Postings</label>
                        <textarea
                          name="activeJobs"
                          value={formData.activeJobs}
                          onChange={handleInputChange}
                          placeholder="12"
                        rows="1"
                      />
                      </div>
                      <div className="form-group">
                        <label>Total Employees Hired</label>
                        <textarea
                          name="totalHired"
                          value={formData.totalHired}
                          onChange={handleInputChange}
                          placeholder="145"
                        rows="1"
                      />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Hiring Manager Name</label>
                      <textarea
                        name="hiringManager"
                        value={formData.hiringManager}
                        onChange={handleInputChange}
                        placeholder="e.g., Sarah Johnson"
                        rows="1"
                      />
                    </div>

                    <div className="form-group">
                      <label>Company Culture (comma-separated)</label>
                      <textarea
                        name="culture"
                        value={formData.culture}
                        onChange={handleInputChange}
                        placeholder="e.g., Innovation, Collaboration, Excellence, Growth"
                        rows="1"
                      />
                    </div>

                    <div className="form-group">
                      <label>Benefits & Perks (comma-separated)</label>
                      <textarea
                        name="benefits"
                        value={formData.benefits}
                        onChange={handleInputChange}
                        placeholder="e.g., Health Insurance, Remote Work, Stock Options, Professional Development"
                        rows="2"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 4: About Company */}
                {currentStep === 4 && (
                  <div className="form-step" data-step="4">
                    <h3 className="form-section-title">About Your Company</h3>
                    
                    <div className="form-group">
                      <label>Company Description</label>
                      <textarea 
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Tell potential employees about your company..."
                        rows="3"
                      />
                    </div>

                    <div className="form-group">
                      <label>Company Bio/Mission</label>
                      <textarea 
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Describe your company mission and vision..."
                        rows="4"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 5: Social Links */}
                {currentStep === 5 && (
                  <div className="form-step" data-step="5">
                    <h3 className="form-section-title">Social Media & Online Presence</h3>
                    
                    <div className="form-two-col">
                      <div className="form-group">
                        <label><FaLinkedin className="social-icon linkedin" /> LinkedIn Company</label>
                        <textarea
                          name="linkedin"
                          value={formData.linkedin}
                          onChange={handleInputChange}
                          placeholder="https://linkedin.com/company/yourcompany"
                        rows="1"
                      />
                      </div>
                      <div className="form-group">
                        <label><FaXTwitter className="social-icon twitter" /> Twitter/X</label>
                        <textarea
                          name="twitter"
                          value={formData.twitter}
                          onChange={handleInputChange}
                          placeholder="https://twitter.com/yourcompany"
                        rows="1"
                      />
                      </div>
                    </div>

                    <div className="form-two-col">
                      <div className="form-group">
                        <label><FaFacebook className="social-icon facebook" /> Facebook</label>
                        <textarea
                          name="facebook"
                          value={formData.facebook}
                          onChange={handleInputChange}
                          placeholder="https://facebook.com/yourcompany"
                        rows="1"
                      />
                      </div>
                      <div className="form-group">
                        <label><FaInstagram className="social-icon instagram" /> Instagram</label>
                        <textarea
                          name="instagram"
                          value={formData.instagram}
                          onChange={handleInputChange}
                          placeholder="https://instagram.com/yourcompany"
                        rows="1"
                      />
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-navigation">
                  <button 
                    className="btn-nav-prev" 
                    onClick={handlePrevStep}
                    disabled={currentStep === 1}
                  >
                    ← Previous
                  </button>
                  
                  <button className="btn-cancel-new" onClick={handleCancel}>
                    Cancel
                  </button>

                  {currentStep === TOTAL_STEPS ? (
                    <button className="btn-save-new" onClick={handleSaveProfile}>
                      {isEditMode ? 'Update Profile' : 'Create Profile'}
                    </button>
                  ) : (
                    <button className="btn-nav-next" onClick={handleNextStep}>
                      Next →
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Full View Form */
              <div className="edit-form-content-full">
                <div className="edit-form-section">
                  <h3 className="form-section-title">Company Information</h3>
                  
                  <div className="form-group avatar-upload-section">
                    <div className="avatar-preview">
                      <label className="avatar-upload-image-label">
                        <img src={formData.avatar} alt="Company Avatar" className="avatar-preview-img" />
                        <span className="avatar-edit-icon">+</span>
                        <input 
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          style={{display: 'none'}}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Company Name</label>
                    <textarea
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="TechCorp Solutions"
                        rows="1"
                      />
                  </div>

                  <div className="form-two-col">
                    <div className="form-group">
                      <label>Email</label>
                      <textarea
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="company@gmail.com"
                        rows="1"
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <textarea
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+254 712 345 678"
                        rows="1"
                      />
                    </div>
                  </div>

                  <div className="form-two-col">
                    <div className="form-group">
                      <label>Location</label>
                      <LocationSelector 
                        value={formData.location}
                        onChange={(location) => setFormData(prev => ({ ...prev, location }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Website</label>
                      <textarea
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        placeholder="https://company.com"
                        rows="1"
                      />
                    </div>
                  </div>
                </div>

                <div className="edit-form-section">
                  <h3 className="form-section-title">Company Profile</h3>
                  
                  <div className="form-two-col">
                    <div className="form-group">
                      <label>Industry</label>
                      <textarea
                        name="industry"
                        value={formData.industry}
                        onChange={handleInputChange}
                        placeholder="Software Development"
                        rows="1"
                      />
                    </div>
                    <div className="form-group">
                      <label>Company Size</label>
                      <select name="companySize" value={formData.companySize} onChange={handleInputChange}>
                        <option value="1-10 employees">1-10 employees</option>
                        <option value="10-50 employees">10-50 employees</option>
                        <option value="50-100 employees">50-100 employees</option>
                        <option value="100-500 employees">100-500 employees</option>
                        <option value="500+ employees">500+ employees</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-two-col">
                    <div className="form-group">
                      <label>Year Founded</label>
                      <textarea
                        name="founded"
                        value={formData.founded}
                        onChange={handleInputChange}
                        placeholder="2010"
                        rows="1"
                      />
                    </div>
                    <div className="form-group">
                      <label>Company Title/Role</label>
                      <textarea
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g., Hiring for Multiple Positions"
                        rows="1"
                      />
                    </div>
                  </div>
                </div>

                <div className="edit-form-section">
                  <h3 className="form-section-title">Hiring Information</h3>
                  
                  <div className="form-two-col">
                    <div className="form-group">
                      <label>Active Job Postings</label>
                      <textarea
                        name="activeJobs"
                        value={formData.activeJobs}
                        onChange={handleInputChange}
                        placeholder="12"
                        rows="1"
                      />
                    </div>
                    <div className="form-group">
                      <label>Total Employees Hired</label>
                      <textarea
                        name="totalHired"
                        value={formData.totalHired}
                        onChange={handleInputChange}
                        placeholder="145"
                        rows="1"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Hiring Manager Name</label>
                    <textarea
                      name="hiringManager"
                      value={formData.hiringManager}
                      onChange={handleInputChange}
                      placeholder="e.g., Sarah Johnson"
                        rows="1"
                      />
                  </div>
                </div>

                <div className="edit-form-section">
                  <h3 className="form-section-title">About Company</h3>
                  
                  <div className="form-group">
                    <label>Company Description</label>
                    <textarea 
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Tell potential employees about your company..."
                      rows="2"
                    />
                  </div>

                  <div className="form-group">
                    <label>Company Bio/Mission</label>
                    <textarea 
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Describe your company mission and vision..."
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label>Company Culture (comma-separated)</label>
                    <textarea
                      name="culture"
                      value={formData.culture}
                      onChange={handleInputChange}
                      placeholder="Innovation, Collaboration, Excellence, Growth"
                        rows="1"
                      />
                  </div>

                  <div className="form-group">
                    <label>Benefits & Perks (comma-separated)</label>
                    <textarea
                      name="benefits"
                      value={formData.benefits}
                      onChange={handleInputChange}
                      placeholder="Health Insurance, Remote Work, Stock Options, Professional Development"
                      rows="2"
                    />
                  </div>
                </div>

                <div className="edit-form-section">
                  <h3 className="form-section-title">Social Media & Online Presence</h3>
                  
                  <div className="form-two-col">
                    <div className="form-group">
                      <label><FaLinkedin className="social-icon linkedin" /> LinkedIn Company</label>
                      <textarea
                        name="linkedin"
                        value={formData.linkedin}
                        onChange={handleInputChange}
                        placeholder="https://linkedin.com/company/yourcompany"
                        rows="1"
                      />
                    </div>
                    <div className="form-group">
                      <label><FaXTwitter className="social-icon twitter" /> Twitter/X</label>
                      <textarea
                        name="twitter"
                        value={formData.twitter}
                        onChange={handleInputChange}
                        placeholder="https://twitter.com/yourcompany"
                        rows="1"
                      />
                    </div>
                  </div>

                  <div className="form-two-col">
                    <div className="form-group">
                      <label><FaFacebook className="social-icon facebook" /> Facebook</label>
                      <textarea
                        name="facebook"
                        value={formData.facebook}
                        onChange={handleInputChange}
                        placeholder="https://facebook.com/yourcompany"
                        rows="1"
                      />
                    </div>
                    <div className="form-group">
                      <label><FaInstagram className="social-icon instagram" /> Instagram</label>
                      <textarea
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleInputChange}
                        placeholder="https://instagram.com/yourcompany"
                        rows="1"
                      />
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons - Full View */}
                <div className="form-navigation form-navigation-full">
                  <div className="form-actions-new">
                    <button className="btn-save-new" onClick={handleSaveProfile}>
                      {isEditMode ? 'Update Profile' : 'Create Profile'}
                    </button>
                    <button className="btn-cancel-new" onClick={handleCancel}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default EmployerAccountPanel;
