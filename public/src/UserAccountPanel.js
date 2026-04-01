import './UserAccountPanel.css';
import { useState, useEffect } from 'react';
import { FaGithub, FaLinkedin, FaXTwitter, FaGlobe, FaInstagram, FaFacebook, FaTiktok, FaWhatsapp } from 'react-icons/fa6';
import EmployerAccountPanel from './EmployerAccountPanel';
import PremiumPanel from './PremiumPanel';
import PremiumProPanel from './PremiumProPanel';
import SubscriptionModal from './SubscriptionModal';
import LocationSelector from './LocationSelector';
import LanguageSelector from './LanguageSelector';
import RateSelector from './RateSelector';


function UserAccountPanel({ onClose, selectedAccount, onProfileCreated, onBack }) {
  // Check if this is a new account (no profile data) - declare before state that uses it
  const isNewAccount = !selectedAccount || (!selectedAccount.name && !selectedAccount.email && !selectedAccount.title);
  const isEditMode = !!selectedAccount && (selectedAccount.name || selectedAccount.email || selectedAccount.title || selectedAccount.userType === 'employee');
  
  // For new accounts, start with null to show account type. For existing, load their account type.
  const [accountType, setAccountType] = useState(() => {
    return selectedAccount?.userType || localStorage.getItem('accountType') || null;
  });
  
  // Get the profession name from localStorage
  const getProfessionName = () => {
    try {
      const profession = JSON.parse(localStorage.getItem('selectedProfession'));
      return profession?.name || 'Employee';
    } catch {
      return 'Employee';
    }
  };
  const [professionName] = useState(getProfessionName);
  
  const [activeTab] = useState('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [viewMode, setViewMode] = useState('steps'); // 'steps' or 'full'
  const [showPremiumPanel, setShowPremiumPanel] = useState(false);
  const [showPremiumProPanel, setShowPremiumProPanel] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const TOTAL_STEPS = 5;

  // Initialize profile data from selectedAccount or use empty defaults
  const getInitialProfileData = () => {
    if (selectedAccount) {
      return {
        // Basic Info
        name: selectedAccount.name || '',
        email: selectedAccount.email || '',
        phone: selectedAccount.phone || '',
        title: selectedAccount.title || '',
        bio: selectedAccount.bio || '',
        location: selectedAccount.location || '',
        
        // Professional Info
        skills: Array.isArray(selectedAccount.skills) ? selectedAccount.skills.join(', ') : (selectedAccount.skills || ''),
        certifications: Array.isArray(selectedAccount.certifications) ? selectedAccount.certifications.join(', ') : (selectedAccount.certifications || ''),
        languages: Array.isArray(selectedAccount.languages) ? selectedAccount.languages : (selectedAccount.languages ? [selectedAccount.languages] : []),
        experience: selectedAccount.experience || '',
        hourlyRate: selectedAccount.hourlyRate || '',
        availability: selectedAccount.availability || '',
        
        // Work Preferences
        projectTypes: Array.isArray(selectedAccount.projectTypes) ? selectedAccount.projectTypes.join(', ') : (selectedAccount.projectTypes || ''),
        workStyle: selectedAccount.workStyle || '',
        timezone: selectedAccount.timezone || '',
        
        // Portfolio & Social
        portfolioWebsite: selectedAccount.portfolioWebsite || '',
        github: selectedAccount.github || '',
        linkedin: selectedAccount.linkedin || '',
        twitter: selectedAccount.twitter || '',
        instagram: selectedAccount.instagram || '',
        facebook: selectedAccount.facebook || '',
        tiktok: selectedAccount.tiktok || '',
        whatsapp: selectedAccount.whatsapp || '',
        
        avatar: selectedAccount.avatar || localStorage.getItem('userAvatar') || 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        
        // Media Portfolio
        mediaFiles: []
      };
    }

    // Empty default profile data
    return {
      // Basic Info
      name: '',
      email: '',
      phone: '',
      title: '',
      bio: '',
      location: '',
      
      // Professional Info
      skills: '',
      certifications: '',
      languages: [],
      experience: '',
      hourlyRate: '',
      availability: '',
      
      // Work Preferences
      projectTypes: '',
      workStyle: '',
      timezone: '',
      
      // Portfolio & Social
      portfolioWebsite: '',
      github: '',
      linkedin: '',
      twitter: '',
      instagram: '',
      facebook: '',
      tiktok: '',
      whatsapp: '',
      
      avatar: localStorage.getItem('userAvatar') || 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
      
      // Media Portfolio
      mediaFiles: []
    };
  };

  const [profileData, setProfileData] = useState(getInitialProfileData());

  const [formData, setFormData] = useState(profileData);
  const [mediaFiles, setMediaFiles] = useState([]);

  useEffect(() => {
    // Update profile data when selectedAccount changes
    const newProfileData = getInitialProfileData();
    console.log('useEffect triggered - selectedAccount:', selectedAccount);
    console.log('newProfileData loaded:', newProfileData);
    setProfileData(newProfileData);
    setFormData(newProfileData);
    
    // Auto-enter edit mode for existing accounts
    if (accountType === 'employee' && !isNewAccount) {
      console.log('Entering edit mode for existing profile');
      setIsEditingProfile(true);
      setMediaFiles(newProfileData.mediaFiles || []);
      setViewMode('full');
    } else if (accountType === 'employee' && isNewAccount) {
      console.log('Entering creation mode for new profile');
      setIsEditingProfile(true);
      setViewMode('steps');
    } else {
      setIsEditingProfile(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount, accountType, isNewAccount]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLanguagesChange = (languages) => {
    setFormData(prev => ({
      ...prev,
      languages: languages
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAvatar = reader.result;
        // Save to localStorage
        localStorage.setItem('userAvatar', newAvatar);
        // Update form data
        setFormData(prev => ({
          ...prev,
          avatar: newAvatar
        }));
        // Save to profile data
        setProfileData(prev => ({
          ...prev,
          avatar: newAvatar
        }));
        // Close edit form to show updated avatar in header
        setTimeout(() => {
          setIsEditingProfile(false);
        }, 300);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaFiles(prev => [...prev, {
          name: file.name,
          preview: reader.result,
          type: file.type
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMediaFile = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveProfile = () => {
    const newProfileData = {
      ...formData,
      mediaFiles: mediaFiles,
      userType: accountType
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
    setMediaFiles(profileData.mediaFiles || []);
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
        )}
        
  
        {accountType === 'employer' && <EmployerAccountPanel onClose={onClose} onBack={() => setAccountType(null)} />}
        
        {accountType === 'employee' && (
          <>
            {!isEditingProfile ? (
              <>
                {/* Show Full Profile for Existing Accounts */}
                <>
                {/* Header */}
                <div className="new-header">
                  <div className="header-top">
                    <div className="avatar-section">
                      <img src={profileData.avatar} alt="Account" className="header-avatar" />
                    </div>
                    <div className="name-section">
                      <h1 className="profile-name">{profileData.name}</h1>
                      <p className="profile-email">{profileData.email}</p>
                    </div>
                    <button 
                      className="upgrade-btn"
                      onClick={() => setShowPremiumPanel(true)}
                      title="Upgrade to Premium or Premium Pro"
                    >
                      â­ Upgrade
                    </button>
                  </div>

              {/* Stats Row */}
              <div className="stats-row">
                <div className="stat-item">
                  <span className="stat-label">Rating</span>
                  <span className="stat-val">4.8</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <span className="stat-label">Followers</span>
                  <span className="stat-val">2.1k</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <span className="stat-label">Status</span>
                  <span className="stat-val active">â— Active</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <span className="stat-label">Experience</span>
                  <span className="stat-val">{profileData.experience}</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <span className="stat-label">Rate</span>
                  <span className="stat-val">{profileData.hourlyRate}</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <span className="stat-label">Location</span>
                  <span className="stat-val">{profileData.location}</span>
                </div>
              </div>
            </div>

            {/* Tab Navigation - Settings tab removed */}

            {/* Content */}
            <div className="panel-content">
              
              {activeTab === 'profile' && (
                <div className="profile-tab-content">
                  {/* Step 1: Basic Information Section */}
                  {(profileData.name || profileData.email || profileData.phone || profileData.title || profileData.location || profileData.timezone || profileData.bio) && (
                    <div className="details-section">
                      <h3 className="section-title">Basic Information</h3>
                      <div className="basic-info-list">
                        {profileData.name && (
                          <div className="basic-info-item">
                            <span className="basic-info-label">Full Name</span>
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
                        {profileData.title && (
                          <div className="basic-info-item">
                            <span className="basic-info-label">Professional Title</span>
                            <span className="basic-info-value">{profileData.title}</span>
                          </div>
                        )}
                        {profileData.location && (
                          <div className="basic-info-item">
                            <span className="basic-info-label">Location</span>
                            <span className="basic-info-value">{profileData.location}</span>
                          </div>
                        )}
                        {profileData.timezone && (
                          <div className="basic-info-item">
                            <span className="basic-info-label">Timezone</span>
                            <span className="basic-info-value">{profileData.timezone}</span>
                          </div>
                        )}
                      </div>
                      {profileData.bio && (
                        <div style={{marginTop: '12px', textAlign: 'center'}}>
                          <p style={{margin: '0 auto', fontSize: '10px', fontWeight: '700', color: '#00d9ff', lineHeight: '1.6', maxWidth: '80%'}}>{profileData.bio}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 2: Professional Expertise Section */}
                  {(profileData.skills || profileData.certifications || profileData.experience || profileData.languages) && (
                    <div className="details-section">
                      <h3 className="section-title">Professional Expertise</h3>
                      <div className="expertise-list">
                        {profileData.skills && (
                          <div className="expertise-item">
                            <span className="expertise-label">Skills</span>
                            <span className="expertise-value">{profileData.skills}</span>
                          </div>
                        )}
                        {profileData.certifications && (
                          <div className="expertise-item">
                            <span className="expertise-label">Certifications</span>
                            <span className="expertise-value">{profileData.certifications}</span>
                          </div>
                        )}
                        {profileData.experience && (
                          <div className="expertise-item">
                            <span className="expertise-label">Years of Experience</span>
                            <span className="expertise-value">{profileData.experience}</span>
                          </div>
                        )}
                        {profileData.languages && profileData.languages.length > 0 && (
                          <div className="expertise-item">
                            <span className="expertise-label">Languages</span>
                            <span className="expertise-value">{Array.isArray(profileData.languages) ? profileData.languages.join(', ') : profileData.languages}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Work Preferences Section */}
                  {(profileData.hourlyRate || profileData.availability || profileData.projectTypes || profileData.workStyle) && (
                    <div className="details-section">
                      <h3 className="section-title">Work Preferences</h3>
                      <div className="work-preferences-list">
                        {profileData.hourlyRate && (
                          <div className="work-pref-item">
                            <span className="work-pref-label">Rate</span>
                            <span className="work-pref-value">{profileData.hourlyRate}</span>
                          </div>
                        )}
                        {profileData.availability && (
                          <div className="work-pref-item">
                            <span className="work-pref-label">Availability</span>
                            <span className="work-pref-value">{profileData.availability}</span>
                          </div>
                        )}
                        {profileData.projectTypes && (
                          <div className="work-pref-item">
                            <span className="work-pref-label">Project Types</span>
                            <span className="work-pref-value">{profileData.projectTypes}</span>
                          </div>
                        )}
                        {profileData.workStyle && (
                          <div className="work-pref-item">
                            <span className="work-pref-label">Work Style</span>
                            <span className="work-pref-value">{profileData.workStyle}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 4: Social Links Section */}
                  {(profileData.portfolioWebsite || profileData.github || profileData.linkedin || profileData.twitter || profileData.instagram || profileData.facebook || profileData.tiktok || profileData.whatsapp) && (
                    <div className="details-section">
                      <h3 className="section-title">Social Links</h3>
                      <div className="social-links-display">
                        {profileData.portfolioWebsite && (
                          <a href={profileData.portfolioWebsite} target="_blank" rel="noopener noreferrer" className="social-link-item">
                            <FaGlobe className="social-link-icon" style={{color: '#00d9ff'}} /> Website
                          </a>
                        )}
                        {profileData.twitter && (
                          <a href={profileData.twitter} target="_blank" rel="noopener noreferrer" className="social-link-item">
                            <FaXTwitter className="social-link-icon" style={{color: '#000000'}} /> Twitter
                          </a>
                        )}
                        {profileData.github && (
                          <a href={profileData.github} target="_blank" rel="noopener noreferrer" className="social-link-item">
                            <FaGithub className="social-link-icon" style={{color: '#ffffff'}} /> GitHub
                          </a>
                        )}
                        {profileData.linkedin && (
                          <a href={profileData.linkedin} target="_blank" rel="noopener noreferrer" className="social-link-item">
                            <FaLinkedin className="social-link-icon" style={{color: '#0A66C2'}} /> LinkedIn
                          </a>
                        )}
                        {profileData.instagram && (
                          <a href={profileData.instagram} target="_blank" rel="noopener noreferrer" className="social-link-item">
                            <FaInstagram className="social-link-icon" style={{color: '#E4405F'}} /> Instagram
                          </a>
                        )}
                        {profileData.facebook && (
                          <a href={profileData.facebook} target="_blank" rel="noopener noreferrer" className="social-link-item">
                            <FaFacebook className="social-link-icon" style={{color: '#1877F2'}} /> Facebook
                          </a>
                        )}
                        {profileData.tiktok && (
                          <a href={profileData.tiktok} target="_blank" rel="noopener noreferrer" className="social-link-item">
                            <FaTiktok className="social-link-icon" style={{color: '#000000'}} /> TikTok
                          </a>
                        )}
                        {profileData.whatsapp && (
                          <a href={profileData.whatsapp} target="_blank" rel="noopener noreferrer" className="social-link-item">
                            <FaWhatsapp className="social-link-icon" style={{color: '#25D366'}} /> WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 5: Media Portfolio Section */}
                  {profileData.mediaFiles && profileData.mediaFiles.length > 0 && (
                    <div className="details-section">
                      <h3 className="section-title">Media Portfolio</h3>
                      <div className="media-gallery-grid">
                        {profileData.mediaFiles.map((file, index) => (
                          <div key={index} className="media-item-display">
                            {file.type.startsWith('image/') ? (
                              <img src={file.preview} alt={file.name} style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px'}} />
                            ) : file.type === 'application/pdf' ? (
                              <div style={{width: '100%', height: '100%', background: 'rgba(255, 165, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', flexDirection: 'column', gap: '8px'}}>
                                <span style={{fontSize: '24px'}}>📋</span>
                                <span style={{fontSize: '10px', color: '#a0a8b8', textAlign: 'center'}}>{file.name.substring(0, 15)}...</span>
                              </div>
                            ) : (
                              <div style={{width: '100%', height: '100%', background: 'rgba(0, 217, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', flexDirection: 'column', gap: '8px'}}>
                                <span style={{fontSize: '24px'}}>🎬</span>
                                <span style={{fontSize: '10px', color: '#a0a8b8', textAlign: 'center'}}>{file.name.substring(0, 15)}...</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Edit Profile Button */}
                  <button 
                    className="edit-profile-btn-new"
                    onClick={() => {
                      setIsEditingProfile(true);
                      setFormData(profileData);
                      setMediaFiles(profileData.mediaFiles || []);
                      setCurrentStep(1);
                      setViewMode('full'); // Use full form for editing existing profiles
                    }}
                  >
                    ✏️ Edit Profile
                  </button>
                </div>
              )}



            </div>
                </>
          </>
        ) : (
          // Edit Profile Form with Steps
          <div className="edit-profile-view">
            <div className="edit-profile-header">
              <div className="edit-profile-title-section">
                <div className="edit-profile-title-wrapper">
                  <h2>{isEditMode ? 'Edit Your Profile' : 'Create Your Profile'}</h2>
                  <p className="profession-tag">(Job Seeker ~ {professionName})</p>
                </div>
                <div className="view-mode-toggle">
                  <button 
                    className={`view-toggle-btn ${viewMode === 'steps' ? 'active' : ''}`}
                    onClick={() => setViewMode('steps')}
                  >
                    Steps
                  </button>
                  <button 
                    className={`view-toggle-btn ${viewMode === 'full' ? 'active' : ''}`}
                    onClick={() => setViewMode('full')}
                  >
                    Full View
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

            {/* Form Content - Steps View */}
            {viewMode === 'steps' && (
              <div className="edit-form-content">
              
              {/* STEP 1: Basic Information */}
              {currentStep === 1 && (
                <div className="form-step" data-step="1">
                  <h3 className="form-section-title">Basic Information</h3>
                  
                  {/* Avatar Upload Section */}
                  <div className="avatar-upload-section">
                    <div className="avatar-preview">
                      <label className="avatar-upload-image-label">
                        <img src={formData.avatar} alt="Profile Preview" className="avatar-preview-img" />
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

                  <div className="form-two-col">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <textarea
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                        rows="1"
                      />
                    </div>
                    <div className="form-group">
                      <label>Professional Title *</label>
                      <textarea
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g., Senior React Developer"
                        rows="1"
                      />
                    </div>
                  </div>

                  <div className="form-two-col">
                    <div className="form-group">
                      <label>Email *</label>
                      <textarea
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="yourname@gmail.com"
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
                        onTimezoneChange={(timezone) => setFormData(prev => ({ ...prev, timezone }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Timezone</label>
                      <textarea
                        value={formData.timezone}
                        readOnly
                        placeholder="Timezone (auto-filled from country)"
                        className="timezone-display"
                        rows="1"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Professional Bio</label>
                    <textarea 
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Tell us about yourself and your expertise..."
                      rows="3"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Professional Expertise */}
              {currentStep === 2 && (
                <div className="form-step" data-step="2">
                  <h3 className="form-section-title">Professional Expertise</h3>
                  
                  <div className="form-group">
                    <label>Skills (comma-separated)</label>
                    <textarea 
                      name="skills"
                      value={formData.skills}
                      onChange={handleInputChange}
                      placeholder="React, JavaScript, Node.js, TypeScript, PostgreSQL..."
                      rows="2"
                    />
                  </div>

                  <div className="form-group">
                    <label>Certifications & Credentials</label>
                    <textarea 
                      name="certifications"
                      value={formData.certifications}
                      onChange={handleInputChange}
                      placeholder="AWS Certified, Google Cloud Certified, React Advanced..."
                      rows="2"
                    />
                  </div>

                  <div className="form-two-col">
                    <div className="form-group">
                      <label>Years of Experience</label>
                      <select name="experience" value={formData.experience} onChange={handleInputChange}>
                        <option value="0-1 years">0-1 years</option>
                        <option value="1-2 years">1-2 years</option>
                        <option value="3-4 years">3-4 years</option>
                        <option value="5-6 years">5-6 years</option>
                        <option value="7+ years">7+ years</option>
                        <option value="10+ years">10+ years</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <LanguageSelector 
                        value={formData.languages}
                        onChange={handleLanguagesChange}
                        placeholder="Add Language"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Work Preferences */}
              {currentStep === 3 && (
                <div className="form-step" data-step="3">
                  <h3 className="form-section-title">Work Preferences</h3>
                  
                  <div className="form-two-col">
                    <div className="form-group">
                      <label>Rate</label>
                      <RateSelector 
                        value={formData.hourlyRate}
                        onChange={(value) => handleInputChange({target: {name: 'hourlyRate', value}})}
                        currency="Ksh"
                      />
                    </div>
                    <div className="form-group">
                      <label>Availability Status</label>
                      <select name="availability" value={formData.availability} onChange={handleInputChange}>
                        <option value="Available">Available</option>
                        <option value="Open to Offers">Open to Offers</option>
                        <option value="Busy">Busy</option>
                        <option value="Unavailable">Unavailable</option>
                        <option value="Part-time Available">Part-time Available</option>
                        <option value="Contract Available">Contract Available</option>
                        <option value="Limited Hours">Limited Hours</option>
                        <option value="Negotiable">Negotiable</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-two-col">
                    <div className="form-group">
                      <label>Project Types</label>
                      <select name="projectTypes" value={formData.projectTypes} onChange={handleInputChange}>
                        <option value="Full-time">Full-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Temporary">Temporary</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Work Style</label>
                      <select name="workStyle" value={formData.workStyle} onChange={handleInputChange}>
                        <option value="Remote">Remote</option>
                        <option value="On-site">On-site</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Flexible">Flexible</option>
                        <option value="Distributed">Distributed</option>
                        <option value="Co-working Space">Co-working Space</option>
                        <option value="Client Site">Client Site</option>
                        <option value="Field-based">Field-based</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Portfolio & Social Links */}
              {currentStep === 4 && (
                <div className="form-step" data-step="4">
                  <h3 className="form-section-title">Portfolio & Social Links</h3>
                  
                  <div className="form-two-col">
                    <div className="form-group">
                      <label><FaGlobe className="social-icon globe" /> Portfolio Website</label>
                      <textarea
                        name="portfolioWebsite"
                        value={formData.portfolioWebsite}
                        onChange={handleInputChange}
                        placeholder="https://yourportfolio.com"
                        rows="1"
                      />
                    </div>
                    <div className="form-group">
                      <label><FaXTwitter className="social-icon twitter" /> Twitter</label>
                      <textarea
                        name="twitter"
                        value={formData.twitter}
                        onChange={handleInputChange}
                        placeholder="https://twitter.com/yourprofile"
                        rows="1"
                      />
                    </div>
                  </div>

                  <div className="form-two-col">
                    <div className="form-group">
                      <label><FaGithub className="social-icon github" /> GitHub Profile</label>
                      <textarea
                        name="github"
                        value={formData.github}
                        onChange={handleInputChange}
                        placeholder="https://github.com/yourprofile"
                        rows="1"
                      />
                    </div>
                    <div className="form-group">
                      <label><FaLinkedin className="social-icon linkedin" /> LinkedIn Profile</label>
                      <textarea
                        name="linkedin"
                        value={formData.linkedin}
                        onChange={handleInputChange}
                        placeholder="https://linkedin.com/in/yourprofile"
                        rows="1"
                      />
                    </div>
                  </div>

                  <div className="form-two-col">
                    <div className="form-group">
                      <label><FaInstagram className="social-icon instagram" /> Instagram</label>
                      <textarea
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleInputChange}
                        placeholder="https://instagram.com/yourprofile"
                        rows="1"
                      />
                    </div>
                    <div className="form-group">
                      <label><FaFacebook className="social-icon facebook" /> Facebook</label>
                      <textarea
                        name="facebook"
                        value={formData.facebook}
                        onChange={handleInputChange}
                        placeholder="https://facebook.com/yourprofile"
                        rows="1"
                      />
                    </div>
                  </div>

                  <div className="form-two-col">
                    <div className="form-group">
                      <label><FaTiktok className="social-icon tiktok" /> TikTok</label>
                      <textarea
                        name="tiktok"
                        value={formData.tiktok}
                        onChange={handleInputChange}
                        placeholder="https://tiktok.com/@yourprofile"
                        rows="1"
                      />
                    </div>
                    <div className="form-group">
                      <label><FaWhatsapp className="social-icon whatsapp" /> WhatsApp</label>
                      <textarea
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleInputChange}
                        placeholder="https://wa.me/1234567890"
                        rows="1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: Media Portfolio */}
              {currentStep === 5 && (
                <div className="form-step" data-step="5">
                  <h3 className="form-section-title">Media Portfolio</h3>
                  
                  <div className="media-upload-container">
                    {/* Images Upload */}
                    <div className="media-column">
                      <h4>Images</h4>
                      <label className="media-upload-label">
                        <div className="media-upload-box">
                          <span className="media-upload-icon">🖼️ | Images</span>
                          <span className="media-upload-text">Click to upload</span>
                          <span className="media-upload-hint">or drag & drop</span>
                          <p className="media-upload-info">PNG, JPG, GIF</p>
                        </div>
                        <input 
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleMediaUpload}
                          style={{display: 'none'}}
                        />
                      </label>

                      {/* Images Gallery Grid */}
                      {mediaFiles.filter(f => f.type.startsWith('image/')).length > 0 && (
                        <div className="media-gallery-grid">
                          {mediaFiles.filter(f => f.type.startsWith('image/')).map((file, index) => (
                            <div key={index} className="media-item">
                              <img src={file.preview} alt={file.name} className="media-thumbnail" />
                              <button 
                                className="media-remove-btn"
                                onClick={() => removeMediaFile(mediaFiles.indexOf(file))}
                                type="button"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Videos Upload */}
                    <div className="media-column">
                      <h4>Videos</h4>
                      <label className="media-upload-label">
                        <div className="media-upload-box">
                          <span className="media-upload-icon">🎬 | Videos</span>
                          <span className="media-upload-text">Click to upload</span>
                          <span className="media-upload-hint">or drag & drop</span>
                          <p className="media-upload-info">MP4, WebM, MOV</p>
                        </div>
                        <input 
                          type="file"
                          multiple
                          accept="video/*"
                          onChange={handleMediaUpload}
                          style={{display: 'none'}}
                        />
                      </label>

                      {/* Videos Gallery Grid */}
                      {mediaFiles.filter(f => f.type.startsWith('video/')).length > 0 && (
                        <div className="media-gallery-grid">
                          {mediaFiles.filter(f => f.type.startsWith('video/')).map((file, index) => (
                            <div key={index} className="media-item">
                              <div className="media-file-placeholder">
                                <span className="file-icon">🎥</span>
                                <span className="file-name">{file.name.substring(0, 10)}...</span>
                              </div>
                              <button 
                                className="media-remove-btn"
                                onClick={() => removeMediaFile(mediaFiles.indexOf(file))}
                                type="button"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* PDFs Upload */}
                    <div className="media-column">
                      <h4>PDFs</h4>
                      <label className="media-upload-label">
                        <div className="media-upload-box">
                          <span className="media-upload-icon">📋 | PDFs</span>
                          <span className="media-upload-text">Click to upload</span>
                          <span className="media-upload-hint">or drag & drop</span>
                          <p className="media-upload-info">PDF</p>
                        </div>
                        <input 
                          type="file"
                          multiple
                          accept="application/pdf"
                          onChange={handleMediaUpload}
                          style={{display: 'none'}}
                        />
                      </label>

                      {/* PDFs Gallery Grid */}
                      {mediaFiles.filter(f => f.type === 'application/pdf').length > 0 && (
                        <div className="media-gallery-grid">
                          {mediaFiles.filter(f => f.type === 'application/pdf').map((file, index) => (
                            <div key={index} className="media-item">
                              <div className="media-file-placeholder pdf-placeholder">
                                <span className="file-icon">ðŸ“„</span>
                                <span className="file-name">{file.name.substring(0, 10)}...</span>
                              </div>
                              <button 
                                className="media-remove-btn"
                                onClick={() => removeMediaFile(mediaFiles.indexOf(file))}
                                type="button"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              </div>
            )}

            {/* Form Content - Full View */}
            {viewMode === 'full' && (
              <div className="edit-form-content-full">
                
                {/* BASIC INFORMATION SECTION */}
                <div className="edit-form-section">
                  <h3 className="form-section-title">Basic Information</h3>
                  
                  {/* Avatar Upload Section */}
                  <div className="avatar-upload-section">
                    <div className="avatar-preview">
                      <label className="avatar-upload-image-label">
                        <img src={formData.avatar} alt="Profile Preview" className="avatar-preview-img" />
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

                  <div className="form-two-col">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <textarea
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                        rows="1"
                      />
                    </div>
                    <div className="form-group">
                      <label>Professional Title *</label>
                      <textarea
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g., Senior React Developer"
                        rows="1"
                      />
                    </div>
                  </div>

                  <div className="form-two-col">
                    <div className="form-group">
                      <label>Email *</label>
                      <textarea
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="yourname@gmail.com"
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
                        onTimezoneChange={(timezone) => setFormData(prev => ({ ...prev, timezone }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Timezone</label>
                      <textarea
                        value={formData.timezone}
                        readOnly
                        placeholder="Timezone (auto-filled from country)"
                        className="timezone-display"
                        rows="1"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Professional Bio</label>
                    <textarea 
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Tell us about yourself and your expertise..."
                      rows="3"
                    />
                  </div>
                </div>

                {/* PROFESSIONAL EXPERTISE SECTION */}
                <div className="edit-form-section">
                  <h3 className="form-section-title">Professional Expertise</h3>
                  
                  <div className="form-group">
                    <label>Skills (comma-separated)</label>
                    <textarea 
                      name="skills"
                      value={formData.skills}
                      onChange={handleInputChange}
                      placeholder="React, JavaScript, Node.js, TypeScript, PostgreSQL..."
                      rows="2"
                    />
                  </div>

                  <div className="form-group">
                    <label>Certifications & Credentials</label>
                    <textarea 
                      name="certifications"
                      value={formData.certifications}
                      onChange={handleInputChange}
                      placeholder="AWS Certified, Google Cloud Certified, React Advanced..."
                      rows="2"
                    />
                  </div>

                  <div className="form-two-col">
                    <div className="form-group">
                      <label>Years of Experience</label>
                      <select name="experience" value={formData.experience} onChange={handleInputChange}>
                        <option value="0-1 years">0-1 years</option>
                        <option value="1-2 years">1-2 years</option>
                        <option value="3-4 years">3-4 years</option>
                        <option value="5-6 years">5-6 years</option>
                        <option value="7+ years">7+ years</option>
                        <option value="10+ years">10+ years</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <LanguageSelector 
                        value={formData.languages}
                        onChange={handleLanguagesChange}
                        placeholder="Add Language"
                      />
                    </div>
                  </div>
                </div>

                {/* WORK PREFERENCES SECTION */}
                <div className="edit-form-section">
                  <h3 className="form-section-title">Work Preferences</h3>
                  
                  <div className="form-two-col">
                    <div className="form-group">
                      <label>Rate</label>
                      <RateSelector 
                        value={formData.hourlyRate}
                        onChange={(value) => handleInputChange({target: {name: 'hourlyRate', value}})}
                        currency="Ksh"
                      />
                    </div>
                    <div className="form-group">
                      <label>Availability Status</label>
                      <select name="availability" value={formData.availability} onChange={handleInputChange}>
                        <option value="Available">Available</option>
                        <option value="Open to Offers">Open to Offers</option>
                        <option value="Busy">Busy</option>
                        <option value="Unavailable">Unavailable</option>
                        <option value="Part-time Available">Part-time Available</option>
                        <option value="Contract Available">Contract Available</option>
                        <option value="Limited Hours">Limited Hours</option>
                        <option value="Negotiable">Negotiable</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-two-col">
                    <div className="form-group">
                      <label>Project Types</label>
                      <select name="projectTypes" value={formData.projectTypes} onChange={handleInputChange}>
                        <option value="Full-time">Full-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Temporary">Temporary</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Work Style</label>
                      <select name="workStyle" value={formData.workStyle} onChange={handleInputChange}>
                        <option value="Remote">Remote</option>
                        <option value="On-site">On-site</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Flexible">Flexible</option>
                        <option value="Distributed">Distributed</option>
                        <option value="Co-working Space">Co-working Space</option>
                        <option value="Client Site">Client Site</option>
                        <option value="Field-based">Field-based</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* PORTFOLIO & SOCIAL SECTION */}
                <div className="edit-form-section">
                  <h3 className="form-section-title">Portfolio & Social Links</h3>
                  
                  <div className="form-two-col">
                    <div className="form-group">
                      <label><FaGlobe className="social-icon globe" /> Portfolio Website</label>
                      <textarea
                        name="portfolioWebsite"
                        value={formData.portfolioWebsite}
                        onChange={handleInputChange}
                        placeholder="https://yourportfolio.com"
                        rows="1"
                      />
                    </div>
                    <div className="form-group">
                      <label><FaXTwitter className="social-icon twitter" /> Twitter</label>
                      <textarea
                        name="twitter"
                        value={formData.twitter}
                        onChange={handleInputChange}
                        placeholder="https://twitter.com/yourprofile"
                        rows="1"
                      />
                    </div>
                  </div>

                  <div className="form-two-col">
                    <div className="form-group">
                      <label><FaGithub className="social-icon github" /> GitHub Profile</label>
                      <textarea
                        name="github"
                        value={formData.github}
                        onChange={handleInputChange}
                        placeholder="https://github.com/yourprofile"
                        rows="1"
                      />
                    </div>
                    <div className="form-group">
                      <label><FaLinkedin className="social-icon linkedin" /> LinkedIn Profile</label>
                      <textarea
                        name="linkedin"
                        value={formData.linkedin}
                        onChange={handleInputChange}
                        placeholder="https://linkedin.com/in/yourprofile"
                        rows="1"
                      />
                    </div>
                  </div>

                  <div className="form-two-col">
                    <div className="form-group">
                      <label><FaInstagram className="social-icon instagram" /> Instagram</label>
                      <textarea
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleInputChange}
                        placeholder="https://instagram.com/yourprofile"
                        rows="1"
                      />
                    </div>
                    <div className="form-group">
                      <label><FaFacebook className="social-icon facebook" /> Facebook</label>
                      <textarea
                        name="facebook"
                        value={formData.facebook}
                        onChange={handleInputChange}
                        placeholder="https://facebook.com/yourprofile"
                        rows="1"
                      />
                    </div>
                  </div>

                  <div className="form-two-col">
                    <div className="form-group">
                      <label><FaTiktok className="social-icon tiktok" /> TikTok</label>
                      <textarea
                        name="tiktok"
                        value={formData.tiktok}
                        onChange={handleInputChange}
                        placeholder="https://tiktok.com/@yourprofile"
                        rows="1"
                      />
                    </div>
                    <div className="form-group">
                      <label><FaWhatsapp className="social-icon whatsapp" /> WhatsApp</label>
                      <textarea
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleInputChange}
                        placeholder="https://wa.me/1234567890"
                        rows="1"
                      />
                    </div>
                  </div>
                </div>

                {/* MEDIA PORTFOLIO SECTION */}
                <div className="edit-form-section">
                  <h3 className="form-section-title">Media Portfolio</h3>
                  
                  <div className="media-upload-container">
                    {/* Images Upload */}
                    <div className="media-column">
                      <h4>Images</h4>
                      <label className="media-upload-label">
                        <div className="media-upload-box">
                          <span className="media-upload-icon">🖼️ | Images</span>
                          <span className="media-upload-text">Click to upload</span>
                          <span className="media-upload-hint">or drag & drop</span>
                          <p className="media-upload-info">PNG, JPG, GIF</p>
                        </div>
                        <input 
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleMediaUpload}
                          style={{display: 'none'}}
                        />
                      </label>

                      {mediaFiles.filter(f => f.type.startsWith('image/')).length > 0 && (
                        <div className="media-gallery-grid">
                          {mediaFiles.filter(f => f.type.startsWith('image/')).map((file, index) => (
                            <div key={index} className="media-item">
                              <img src={file.preview} alt={file.name} className="media-thumbnail" />
                              <button 
                                className="media-remove-btn"
                                onClick={() => removeMediaFile(mediaFiles.indexOf(file))}
                                type="button"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Videos Upload */}
                    <div className="media-column">
                      <h4>Videos</h4>
                      <label className="media-upload-label">
                        <div className="media-upload-box">
                          <span className="media-upload-icon">🎬 | Videos</span>
                          <span className="media-upload-text">Click to upload</span>
                          <span className="media-upload-hint">or drag & drop</span>
                          <p className="media-upload-info">MP4, WebM, MOV</p>
                        </div>
                        <input 
                          type="file"
                          multiple
                          accept="video/*"
                          onChange={handleMediaUpload}
                          style={{display: 'none'}}
                        />
                      </label>

                      {mediaFiles.filter(f => f.type.startsWith('video/')).length > 0 && (
                        <div className="media-gallery-grid">
                          {mediaFiles.filter(f => f.type.startsWith('video/')).map((file, index) => (
                            <div key={index} className="media-item">
                              <div className="media-file-placeholder">
                                <span className="file-icon">🎥</span>
                                <span className="file-name">{file.name.substring(0, 10)}...</span>
                              </div>
                              <button 
                                className="media-remove-btn"
                                onClick={() => removeMediaFile(mediaFiles.indexOf(file))}
                                type="button"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* PDFs Upload */}
                    <div className="media-column">
                      <h4>PDFs</h4>
                      <label className="media-upload-label">
                        <div className="media-upload-box">
                          <span className="media-upload-icon">📋 | PDFs</span>
                          <span className="media-upload-text">Click to upload</span>
                          <span className="media-upload-hint">or drag & drop</span>
                          <p className="media-upload-info">PDF</p>
                        </div>
                        <input 
                          type="file"
                          multiple
                          accept="application/pdf"
                          onChange={handleMediaUpload}
                          style={{display: 'none'}}
                        />
                      </label>

                      {mediaFiles.filter(f => f.type === 'application/pdf').length > 0 && (
                        <div className="media-gallery-grid">
                          {mediaFiles.filter(f => f.type === 'application/pdf').map((file, index) => (
                            <div key={index} className="media-item">
                              <div className="media-file-placeholder pdf-placeholder">
                                <span className="file-icon">ðŸ“„</span>
                                <span className="file-name">{file.name.substring(0, 10)}...</span>
                              </div>
                              <button 
                                className="media-remove-btn"
                                onClick={() => removeMediaFile(mediaFiles.indexOf(file))}
                                type="button"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons - Steps View */}
            {viewMode === 'steps' && (
              <div className="form-navigation">
                <button 
                  className="btn-nav-prev" 
                  onClick={handlePrevStep}
                  disabled={currentStep === 1}
                >
                  &lt; Previous
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
                    Next &gt;
                  </button>
                )}
              </div>
            )}

            {/* Navigation Buttons - Full View */}
            {viewMode === 'full' && (
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
            )}
          </div>
            )}
          </>
        )}

        {/* Premium Panel Modal */}
        {showPremiumPanel && (
          <PremiumPanel 
            onClose={() => setShowPremiumPanel(false)}
            onUpgradeToPro={() => {
              setShowPremiumPanel(false);
              setShowPremiumProPanel(true);
            }}
            onSelectPlan={(selectedPlan) => {
              setShowPremiumPanel(false);
              setSelectedUpgradePlan(selectedPlan);
              setShowSubscriptionModal(true);
            }}
          />
        )}

        {/* Premium Pro Panel Modal */}
        {showPremiumProPanel && (
          <PremiumProPanel 
            onClose={() => setShowPremiumProPanel(false)}
            isPro={true}
          />
        )}

        <SubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={() => {
            setShowSubscriptionModal(false);
            setSelectedUpgradePlan(null);
          }}
          user={selectedAccount}
          product="joblink"
          selectedPlan={selectedUpgradePlan}
        />


      </div>
    </div>
  );
}

export default UserAccountPanel;
