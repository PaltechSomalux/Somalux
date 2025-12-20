import React, { useState, useEffect, useRef } from 'react';
import './MyProfile.css';

export const MyProfile = () => {
  // Enhanced user state with validation schema
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('userProfile');
    const defaultUser = {
      name: '',
      email: '',
      phone: '',
      bio: '',
      avatar: '',
      jobTitle: '',
      company: '',
      socialMedia: {
        x: '',
        linkedin: '',
        facebook: '',
        instagram: ''
      },
      skills: [],
      education: [],
      workExperience: []
    };
    
    return savedUser ? { ...defaultUser, ...JSON.parse(savedUser) } : defaultUser;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [mainTab, setMainTab] = useState('profile');
  const [profileTab, setProfileTab] = useState('basic');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [newSkill, setNewSkill] = useState('');
  const [newEducation, setNewEducation] = useState({
    institution: '',
    degree: '',
    field: '',
    startYear: '',
    endYear: '',
    current: false
  });
  const [newExperience, setNewExperience] = useState({
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    current: false,
    description: ''
  });
  const fileInputRef = useRef(null);

  // Form validation schema
  const validate = {
    name: value => !!value.trim() || 'Name is required',
    email: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Invalid email address',
    phone: value => !value || /^\+?[\d\s-]{10,}$/.test(value) || 'Invalid phone number'
  };

  // Load default avatar
  useEffect(() => {
    if (!user.avatar) {
      generateDefaultAvatar();
    }
  }, []);

  // Generate initials avatar
  const generateDefaultAvatar = () => {
    const initials = user.name 
      ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
      : 'US';
    const colors = ['FFAD08', 'EDD382', 'FC7174', '6DD3CE', 'C8E9A0'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newAvatar = `https://ui-avatars.com/api/?name=${initials}&background=${randomColor}&color=fff&size=256`;
    setUser(prev => ({ ...prev, avatar: newAvatar }));
  };

  // Enhanced input handler with validation
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const path = name.split('.');
    
    // Clear validation error when editing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setUser(prev => {
      const newUser = { ...prev };
      let current = newUser;
      
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) current[path[i]] = {};
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = type === 'checkbox' ? checked : value;
      return newUser;
    });
  };

  // Enhanced avatar handling with preview and validation
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    
    if (!file) return;
    
    // Validate file type and size
    if (!file.type.match('image.*')) {
      setStatusMessage({
        text: 'Only image files are allowed',
        type: 'error'
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setStatusMessage({
        text: 'Image size must be less than 5MB',
        type: 'error'
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Save avatar after preview
  const confirmAvatarChange = () => {
    if (avatarPreview) {
      setUser(prev => ({ ...prev, avatar: avatarPreview }));
      setStatusMessage({
        text: 'Avatar updated successfully',
        type: 'success'
      });
    }
  };

  // Save with comprehensive validation
  const saveProfile = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    
    // Validate required fields
    const errors = {};
    if (!user.name.trim()) errors.name = 'Name is required';
    if (!user.email) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      errors.email = 'Invalid email address';
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setIsLoading(false);
      setStatusMessage({
        text: 'Please fix the errors in the form',
        type: 'error'
      });
      return;
    }
    
    try {
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Update last modified timestamp
      const updatedUser = { 
        ...user,
        lastModified: new Date().toISOString()
      };
      
      localStorage.setItem('userProfile', JSON.stringify(updatedUser));
      setIsEditing(false);
      setStatusMessage({
        text: 'Profile saved successfully!',
        type: 'success'
      });
    } catch (error) {
      setStatusMessage({
        text: 'Failed to save profile. Please try again.',
        type: 'error',
        persistent: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add new skill
  const addSkill = () => {
    if (newSkill.trim() && !user.skills.includes(newSkill.trim())) {
      setUser(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  // Remove skill
  const removeSkill = (index) => {
    setUser(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  // Add education entry
  const addEducation = () => {
    if (newEducation.institution && newEducation.degree) {
      setUser(prev => ({
        ...prev,
        education: [...prev.education, { ...newEducation }]
      }));
      setNewEducation({
        institution: '',
        degree: '',
        field: '',
        startYear: '',
        endYear: '',
        current: false
      });
    }
  };

  // Add work experience
  const addExperience = () => {
    if (newExperience.company && newExperience.position) {
      setUser(prev => ({
        ...prev,
        workExperience: [...prev.workExperience, { ...newExperience }]
      }));
      setNewExperience({
        company: '',
        position: '', 
        startDate: '',
        endDate: '',
        current: false,
        description: ''
      });
    }
  };

  // Remove education entry
  const removeEducation = (index) => {
    setUser(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  // Remove work experience
  const removeExperience = (index) => {
    setUser(prev => ({
      ...prev,
      workExperience: prev.workExperience.filter((_, i) => i !== index)
    }));
  };

  // Render basic info section
  const renderBasicInfo = () => (
    <div className="basic-info-section">
      <div className="avatar-upload">
        <div 
          className={`avatar-preview ${isEditing ? 'editable' : ''}`}
          onClick={() => isEditing && fileInputRef.current?.click()}
        >
          <img 
            src={avatarPreview || user.avatar} 
            alt="Profile" 
            onError={() => generateDefaultAvatar()}
          />
          {isEditing && (
            <div className="avatar-edit-overlay">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 17V21H7L16 12L12 8L3 17Z" fill="currentColor"/>
                <path d="M19 7C19.5304 7 20.0391 6.78929 20.4142 6.41421C20.7893 6.03914 21 5.53043 21 5C21 4.46957 20.7893 3.96086 20.4142 3.58579C20.0391 3.21071 19.5304 3 19 3C18.4696 3 17.9609 3.21071 17.5858 3.58579C17.2107 3.96086 17 4.46957 17 5C17 5.53043 17.2107 6.03914 17.5858 6.41421C17.9609 6.78929 18.4696 7 19 7Z" fill="currentColor"/>
              </svg>
              <span>Change Photo</span>
            </div>
          )}
        </div>
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*"
          onChange={handleAvatarChange}
          style={{ display: 'none' }}
        />
        
        {isEditing && avatarPreview && (
          <div className="avatar-confirm-actions">
            <button 
              className="confirm-btn"
              onClick={confirmAvatarChange}
            >
              Confirm New Photo
            </button>
            <button 
              className="cancel-btn"
              onClick={() => setAvatarPreview('')}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="profile-fields">
        <div className="form-group">
          <label>Full Name <span className="required">*</span></label>
          {isEditing ? (
            <>
              <input
                type="text"
                name="name"
                value={user.name}
                onChange={handleChange}
                placeholder="Your full name"
                required
                className={validationErrors.name ? 'error' : ''}
              />
              {validationErrors.name && (
                <div className="error-message">{validationErrors.name}</div>
              )}
            </>
          ) : (
            <div className="profile-value">{user.name || 'Not provided'}</div>
          )}
        </div>

        <div className="form-group">
          <label>Professional Title</label>
          {isEditing ? (
            <input
              type="text"
              name="jobTitle"
              value={user.jobTitle}
              onChange={handleChange}
              placeholder="Your job title"
            />
          ) : (
            <div className="profile-value">{user.jobTitle || 'Not specified'}</div>
          )}
        </div>

        <div className="form-group">
          <label>Company</label>
          {isEditing ? (
            <input
              type="text"
              name="company"
              value={user.company}
              onChange={handleChange}
              placeholder="Where you work"
            />
          ) : (
            <div className="profile-value">{user.company || 'Not specified'}</div>
          )}
        </div>

        <div className="form-group">
          <label>Email <span className="required">*</span></label>
          {isEditing ? (
            <>
              <input
                type="email"
                name="email"
                value={user.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                required
                className={validationErrors.email ? 'error' : ''}
              />
              {validationErrors.email && (
                <div className="error-message">{validationErrors.email}</div>
              )}
            </>
          ) : (
            <div className="profile-value">
              {user.email || 'Not provided'}
              {user.email && (
                <span className={`verification-badge ${user.emailVerified ? 'verified' : 'unverified'}`}>
                  {user.emailVerified ? 'Verified' : 'Unverified'}
                  {!user.emailVerified && isEditing && (
                    <button className="verify-btn">Verify Now</button>
                  )}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          {isEditing ? (
            <>
              <input
                type="tel"
                name="phone"
                value={user.phone}
                onChange={handleChange}
                placeholder="+1 (123) 456-7890"
                className={validationErrors.phone ? 'error' : ''}
              />
              {validationErrors.phone && (
                <div className="error-message">{validationErrors.phone}</div>
              )}
            </>
          ) : (
            <div className="profile-value">{user.phone || 'Not provided'}</div>
          )}
        </div>

        <div className="form-group full-width">
          <label>Bio</label>
          {isEditing ? (
            <div className="bio-container">
              <textarea
                name="bio"
                value={user.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
                rows="4"
                maxLength="500"
              />
              <div className="char-count">{500 - user.bio.length} characters remaining</div>
            </div>
          ) : (
            <div className="profile-value">
              {user.bio || 'No bio yet'}
            </div>
          )}
        </div>

        <div className="form-group full-width">
          <label>Social Media</label>
          {isEditing ? (
            <div className="social-media-inputs">
              <div className="social-input">
                <span className="social-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#000000">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </span> 
                <input
                  type="text"
                  name="socialMedia.x"
                  value={user.socialMedia.x}
                  onChange={handleChange}
                  placeholder="X.com username"
                />
              </div>
              <div className="social-input">
                <span className="social-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#0077B5">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </span>
                <input
                  type="text"
                  name="socialMedia.linkedin"
                  value={user.socialMedia.linkedin}
                  onChange={handleChange}
                  placeholder="LinkedIn profile URL"
                />
              </div>
              <div className="social-input">
                <span className="social-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z"/>
                  </svg>
                </span>
                <input
                  type="text"
                  name="socialMedia.facebook"
                  value={user.socialMedia.facebook}
                  onChange={handleChange}
                  placeholder="Facebook profile URL"
                />
              </div>
              <div className="social-input">
                <span className="social-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#E4405F">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </span>
                <input
                  type="text"
                  name="socialMedia.instagram"
                  value={user.socialMedia.instagram}
                  onChange={handleChange}
                  placeholder="Instagram username"
                />
              </div>
            </div>
          ) : (
            <div className="social-media-links">
              {user.socialMedia.x && (
                <a href={`https://x.com/${user.socialMedia.x}`} target="_blank" rel="noopener noreferrer">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
              {user.socialMedia.linkedin && (
                <a href={user.socialMedia.linkedin} target="_blank" rel="noopener noreferrer">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#0077B5">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              )}
              {user.socialMedia.facebook && (
                <a href={user.socialMedia.facebook} target="_blank" rel="noopener noreferrer">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z"/>
                  </svg>
                </a>
              )}
              {user.socialMedia.instagram && (
                <a href={`https://instagram.com/${user.socialMedia.instagram}`} target="_blank" rel="noopener noreferrer">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#E4405F">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </a>
              )}
              {!user.socialMedia.x && !user.socialMedia.linkedin && 
               !user.socialMedia.facebook && !user.socialMedia.instagram && (
                <div className="no-social">No social links added</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render skills section
  const renderSkillsSection = () => (
    <div className="skills-section">
      <h3>Skills</h3>
      {user.skills.length > 0 ? (
        <div className="skills-container">
          {user.skills.map((skill, index) => (
            <div key={index} className="skill-tag">
              {skill}
              {isEditing && (
                <button 
                  className="remove-skill"
                  onClick={() => removeSkill(index)}
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="no-items-message">No skills added yet</div>
      )}
      
      {isEditing && (
        <div className="add-skill-form">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Add a new skill"
            onKeyPress={(e) => e.key === 'Enter' && addSkill()}
          />
          <button 
            className="add-skill-btn"
            onClick={addSkill}
            disabled={!newSkill.trim()}
          >
            Add Skill
          </button>
        </div>
      )}
    </div>
  );

  // Render education section
  const renderEducationSection = () => (
    <div className="education-section">
      <h3>Education</h3>
      {user.education.length > 0 ? (
        user.education.map((edu, index) => (
          <div key={index} className="education-item">
            <div className="education-header">
              <h4>{edu.institution}</h4>
              {isEditing && (
                <button 
                  className="remove-btn"
                  onClick={() => removeEducation(index)}
                >
                  Remove
                </button>
              )}
            </div>
            <div className="education-details">
              <span>{edu.degree}</span>
              {edu.field && <span> in {edu.field}</span>}
              <div className="education-dates">
                {edu.startYear} - {edu.current ? 'Present' : edu.endYear}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="no-items-message">No education history added</div>
      )}
      
      {isEditing && (
        <div className="add-education-form">
          <h4>Add Education</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Institution <span className="required">*</span></label>
              <input
                type="text"
                value={newEducation.institution}
                onChange={(e) => setNewEducation({...newEducation, institution: e.target.value})}
                placeholder="University or School"
              />
            </div>
            <div className="form-group">
              <label>Degree <span className="required">*</span></label>
              <input
                type="text"
                value={newEducation.degree}
                onChange={(e) => setNewEducation({...newEducation, degree: e.target.value})}
                placeholder="Bachelor's, Master's, etc."
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Field of Study</label>
              <input
                type="text"
                value={newEducation.field}
                onChange={(e) => setNewEducation({...newEducation, field: e.target.value})}
                placeholder="Computer Science, Business, etc."
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Year</label>
              <input
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                value={newEducation.startYear}
                onChange={(e) => setNewEducation({...newEducation, startYear: e.target.value})}
                placeholder="YYYY"
              />
            </div>
            <div className="form-group">
              <label>End Year</label>
              <input
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                value={newEducation.endYear}
                onChange={(e) => setNewEducation({...newEducation, endYear: e.target.value})}
                placeholder="YYYY"
                disabled={newEducation.current}
              />
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={newEducation.current}
                  onChange={(e) => setNewEducation({...newEducation, current: e.target.checked})}
                />
                Currently attending
              </label>
            </div>
          </div>
          <button 
            className="add-btn"
            onClick={addEducation}
            disabled={!newEducation.institution || !newEducation.degree}
          >
            Add Education
          </button>
        </div>
      )}
    </div>
  );

  // Render experience section
  const renderExperienceSection = () => (
    <div className="experience-section">
      <h3>Work Experience</h3>
      {user.workExperience.length > 0 ? (
        user.workExperience.map((exp, index) => (
          <div key={index} className="experience-item">
            <div className="experience-header">
              <h4>{exp.company}</h4>
              {isEditing && (
                <button 
                  className="remove-btn"
                  onClick={() => removeExperience(index)}
                >
                  Remove
                </button>
              )}
            </div>
            <div className="experience-details">
              <div className="experience-position">{exp.position}</div>
              <div className="experience-dates">
                {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
              </div>
              {exp.description && (
                <div className="experience-description">{exp.description}</div>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="no-items-message">No work experience added</div>
      )}
      
      {isEditing && (
        <div className="add-experience-form">
          <h4>Add Experience</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Company <span className="required">*</span></label>
              <input
                type="text"
                value={newExperience.company}
                onChange={(e) => setNewExperience({...newExperience, company: e.target.value})}
                placeholder="Company name"
              />
            </div>
            <div className="form-group">
              <label>Position <span className="required">*</span></label>
              <input
                type="text"
                value={newExperience.position}
                onChange={(e) => setNewExperience({...newExperience, position: e.target.value})}
                placeholder="Your job title"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="text"
                value={newExperience.startDate}
                onChange={(e) => setNewExperience({...newExperience, startDate: e.target.value})}
                placeholder="MM/YYYY or Month Year"
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input
                type="text"
                value={newExperience.endDate}
                onChange={(e) => setNewExperience({...newExperience, endDate: e.target.value})}
                placeholder="MM/YYYY or Month Year"
                disabled={newExperience.current}
              />
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={newExperience.current}
                  onChange={(e) => setNewExperience({...newExperience, current: e.target.checked})}
                />
                I currently work here
              </label>
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={newExperience.description}
              onChange={(e) => setNewExperience({...newExperience, description: e.target.value})}
              placeholder="Brief description of your role and responsibilities"
              rows="3"
            />
          </div>
          <button 
            className="add-btn"
            onClick={addExperience}
            disabled={!newExperience.company || !newExperience.position}
          >
            Add Experience
          </button>
        </div>
      )}
    </div>
  );

  // Render profile tabs content
  const renderProfileTabsContent = () => {
    switch (profileTab) {
      case 'basic':
        return renderBasicInfo();
      case 'skills':
        return renderSkillsSection();
      case 'education':
        return renderEducationSection();
      case 'experience':
        return renderExperienceSection();
      default:
        return null;
    }
  };

  // Render main content based on selected tab
  const renderMainContent = () => {
    return (
      <div className="profile-section">
        <div className="profile-tabs-nav">
          <button
            className={`profile-tab-btn ${profileTab === 'basic' ? 'active' : ''}`}
            onClick={() => setProfileTab('basic')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="currentColor"/>
              <path d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" fill="currentColor"/>
            </svg>
            Basic Info
          </button>
          <button
            className={`profile-tab-btn ${profileTab === 'skills' ? 'active' : ''}`}
            onClick={() => setProfileTab('skills')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M9 16.17L5.83 13l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
            </svg>
            Skills
          </button>
          <button
            className={`profile-tab-btn ${profileTab === 'education' ? 'active' : ''}`}
            onClick={() => setProfileTab('education')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" fill="currentColor"/>
            </svg>
            Education
          </button>
          <button
            className={`profile-tab-btn ${profileTab === 'experience' ? 'active' : ''}`}
            onClick={() => setProfileTab('experience')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" fill="currentColor"/>
            </svg>
            Experience
          </button>
        </div>
        <div className="profile-tab-content">
          {renderProfileTabsContent()}
        </div>
      </div>
    );
  };

  return (
    <div className="user-profile-container">
      <div className="profile-header">
        <h2>My Profile</h2>
        <div className="profile-actions">
          {isEditing ? (
            <>
              <button 
                className="cancel-btn" 
                onClick={() => {
                  setIsEditing(false);
                  setStatusMessage(null);
                  setValidationErrors({});
                  // Reload saved data to discard changes
                  const savedUser = localStorage.getItem('userProfile');
                  if (savedUser) {
                    setUser(JSON.parse(savedUser));
                  }
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                className="save-btn" 
                onClick={saveProfile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="spinner" viewBox="0 0 50 50">
                      <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                    </svg>
                    Saving...
                  </>
                ) : 'Save Changes'}
              </button>
            </>
          ) : (
            <button 
              className="edit-btn" 
              onClick={() => {
                setIsEditing(true);
                setProfileTab('basic');
              }}
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="main-content">
        {renderMainContent()}
      </div>

      {statusMessage && (
        <div 
          className={`status-message ${statusMessage.type}`}
          onClick={() => !statusMessage.persistent && setStatusMessage(null)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            {statusMessage.type === 'success' ? (
              <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7l-1.41-1.41L9 16.17Z" fill="currentColor"/>
            ) : (
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
            )}
          </svg>
          {statusMessage.text}
          {!statusMessage.persistent && (
            <button className="close-message">
              &times;
            </button>
          )}
        </div>
      )}
    </div>
  );
};