import './DetailsPanel.css';
import { useState } from 'react';
import { FaGithub, FaLinkedin, FaXTwitter, FaGlobe, FaInstagram, FaFacebook, FaTiktok, FaWhatsapp, FaUser, FaEnvelope, FaPhone, FaLocationDot, FaDollarSign, FaBriefcase, FaCalendar, FaAward, FaStar } from 'react-icons/fa6';

function DetailsPanel({ profile, onClose, onToggleFollowing, followingItems, isFromFollowing = false }) {
  const [activeTab, setActiveTab] = useState('basic');
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submittedRatings, setSubmittedRatings] = useState(profile.userRatings || []);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Check if this profile is already being followed
  const isFollowing = followingItems?.[profile.id] || false;

  // Helper function to convert to proper case
  const toProperCase = (str) => {
    if (!str) return 'N/A';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Handle rating submission
  const handleSubmitRating = () => {
    if (userRating === 0) {
      alert('Please select a rating');
      return;
    }
    
    const newRating = {
      rating: userRating,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setSubmittedRatings([...submittedRatings, newRating]);
    setUserRating(0);
    setShowRatingModal(false);
    alert('Rating submitted successfully!');
  };

  return (
    <div className="details-panel-wrapper" onClick={onClose}>
      <div className="details-panel" onClick={e => e.stopPropagation()}>
        {/* Close Button */}
        <button className="close-panel-btn" onClick={onClose} aria-label="Close panel">
          ✕
        </button>
        
        {/* Premium Header - BASIC INFORMATION */}
        <div className="details-header-premium">
          <div className="header-inner">
            <div className="avatar-section">
              <div className="avatar-wrapper">
                <img src={profile.avatar} alt={profile.name} className="panel-avatar" />
                <div className="status-indicator"></div>
              </div>
            </div>
            <div className="profile-section">
              <h2 className="profile-name">{toProperCase(profile.name)}</h2>
              <p className="profile-email">{profile.email?.toLowerCase()}</p>
              <p className="profile-title">{toProperCase(profile.title)}</p>
              {profile.bio && <p className="profile-bio">{profile.bio}</p>}
              <div className="header-stats">
                <span className="header-stat-label">Rating</span>
                <span className="header-stat-value">{profile.rating}</span>
                <span className="header-divider">|</span>
                <span className="header-stat-label">Followers</span>
                <span className="header-stat-value">{profile.followers || 0}</span>
                <span className="header-divider">|</span>
                <span className="header-stat-label">Status</span>
                <span className="header-stat-badge">{toProperCase(profile.availability || 'Available')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            Basic
          </button>
          <button 
            className={`tab-btn ${activeTab === 'professional' ? 'active' : ''}`}
            onClick={() => setActiveTab('professional')}
          >
            Skills
          </button>
          <button 
            className={`tab-btn ${activeTab === 'work' ? 'active' : ''}`}
            onClick={() => setActiveTab('work')}
          >
            Work
          </button>
          <button 
            className={`tab-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
            onClick={() => setActiveTab('portfolio')}
          >
            Portfolio
          </button>
          <button 
            className={`tab-btn ${activeTab === 'media' ? 'active' : ''}`}
            onClick={() => setActiveTab('media')}
          >
            Media
          </button>
        </div>

        <div className="details-content">
          {/* BASIC INFORMATION TAB */}
          {activeTab === 'basic' && (
            <div className="tab-content-grid">
              <div className="info-section">
                <div className="info-item">
                  <FaUser className="item-icon" />
                  <div className="info-label">
                    <span>Full Name</span>
                    <span>{toProperCase(profile.name)}</span>
                  </div>
                </div>
                <div className="info-item">
                  <FaBriefcase className="item-icon" />
                  <div className="info-label">
                    <span>Title</span>
                    <span>{toProperCase(profile.title)}</span>
                  </div>
                </div>
                  <div className="info-item">
                  <FaEnvelope className="item-icon" />
                  <div className="info-label">
                    <span>Email</span>
                    <a href={`mailto:${profile.email}`} className="info-link">{profile.email?.toLowerCase()}</a>
                  </div>
                </div>
                <div className="info-item">
                  <FaPhone className="item-icon" />
                  <div className="info-label">
                    <span>Phone</span>
                    <span>{profile.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <div className="info-item">
                  <FaLocationDot className="item-icon" />
                  <div className="info-label">
                    <span>Location</span>
                    <span>{toProperCase(profile.location || 'N/A')}</span>
                  </div>
                </div>
                <div className="info-item">
                  <FaCalendar className="item-icon" />
                  <div className="info-label">
                    <span>Experience</span>
                    <span>{toProperCase(profile.experience)}</span>
                  </div>
                </div>
                {profile.languages && profile.languages.length > 0 && (
                  <>
                    <div className="info-item">
                      <FaGlobe className="item-icon" />
                      <div className="info-label">
                        <span>Languages</span>
                        <span className="languages-value">{Array.isArray(profile.languages) && profile.languages.map((lang, idx) => (
                          <span key={idx}>
                            {idx > 0 && <span className="language-separator">|</span>}
                            <span className="language-item">{lang}</span>
                          </span>
                        ))}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* PROFESSIONAL EXPERTISE TAB */}
          {activeTab === 'professional' && (
            <div className="tab-content-grid">
              {profile.skills && profile.skills.length > 0 && (
                <div className="info-section">
                  <div className="info-item">
                    <FaBriefcase className="item-icon" />
                    <div className="info-label">
                      <span>Skills</span>
                      <span className="skills-value">{Array.isArray(profile.skills) && profile.skills.map((skill, idx) => (
                        <span key={idx}>
                          {idx > 0 && <span className="skill-separator">|</span>}
                          <span className="skill-item">{skill}</span>
                        </span>
                      ))}</span>
                    </div>
                  </div>
                </div>
              )}

              {profile.certifications && profile.certifications.length > 0 && (
                <div className="info-section">
                  <div className="info-item">
                    <FaAward className="item-icon" />
                    <div className="info-label">
                      <span>Certifications</span>
                      <span className="certifications-value">{Array.isArray(profile.certifications) && profile.certifications.map((cert, idx) => (
                        <span key={idx}>
                          {idx > 0 && <span className="certification-separator">|</span>}
                          <span className="certification-item">{cert}</span>
                        </span>
                      ))}</span>
                    </div>
                  </div>
                </div>
              )}

              {profile.reviews && profile.reviews.length > 0 && (
                <div className="info-section">
                  <div className="info-item">
                    <FaStar className="item-icon" />
                    <div className="info-label">
                      <span>Client Reviews</span>
                      <span className="reviews-value">{Array.isArray(profile.reviews) && profile.reviews.map((r, idx) => (
                        <span key={idx}>
                          {idx > 0 && <span className="review-separator">|</span>}
                          <span className="review-item">{r.client} - {Math.floor(r.rating)}★</span>
                        </span>
                      ))}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* WORK PREFERENCES TAB */}
          {activeTab === 'work' && (
            <div className="tab-content-grid">
              <div className="info-section">
                <div className="info-item">
                  <FaBriefcase className="item-icon" />
                  <div className="info-label">
                    <span>Availability</span>
                    <span className="availability-badge">{profile.availability || 'Available'}</span>
                  </div>
                </div>
                <div className="info-item">
                  <FaGlobe className="item-icon" />
                  <div className="info-label">
                    <span>Work Style</span>
                    <span>{profile.workStyle || 'Remote'}</span>
                  </div>
                </div>
                <div className="info-item">
                  <FaDollarSign className="item-icon" />
                  <div className="info-label">
                    <span>Rate</span>
                    <span className="info-value-highlight">{toProperCase(profile.hourlyRate)}</span>
                  </div>
                </div>
                <div className="info-item">
                  <FaAward className="item-icon" />
                  <div className="info-label">
                    <span>Completed Projects</span>
                    <span>{profile.completedProjects || '0'}</span>
                  </div>
                </div>
              </div>

              {profile.projectTypes && profile.projectTypes.length > 0 && (
                <div className="info-item">
                  <FaBriefcase className="item-icon" />
                  <div className="info-label">
                    <span>Project Types</span>
                    <span className="project-types-value">{Array.isArray(profile.projectTypes) && profile.projectTypes.map((type, idx) => (
                      <span key={idx}>
                        {idx > 0 && <span className="project-type-separator">|</span>}
                        <span className="project-type-item">{type}</span>
                      </span>
                    ))}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PORTFOLIO & SOCIAL LINKS TAB */}
          {activeTab === 'portfolio' && (
            <div className="tab-content-grid">
              <div className="full-width-section">
                <span className="section-title">Social Links</span>
                <div className="social-icons-grid">
                  {profile.github && (
                    <a href={profile.github} target="_blank" rel="noopener noreferrer" className="social-icon-btn social-icon-github" title="GitHub">
                      <FaGithub />
                    </a>
                  )}
                  {profile.linkedin && (
                    <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="social-icon-btn social-icon-linkedin" title="LinkedIn">
                      <FaLinkedin />
                    </a>
                  )}
                  {profile.twitter && (
                    <a href={profile.twitter} target="_blank" rel="noopener noreferrer" className="social-icon-btn social-icon-twitter" title="Twitter">
                      <FaXTwitter />
                    </a>
                  )}
                  {profile.instagram && (
                    <a href={profile.instagram} target="_blank" rel="noopener noreferrer" className="social-icon-btn social-icon-instagram" title="Instagram">
                      <FaInstagram />
                    </a>
                  )}
                  {profile.facebook && (
                    <a href={profile.facebook} target="_blank" rel="noopener noreferrer" className="social-icon-btn social-icon-facebook" title="Facebook">
                      <FaFacebook />
                    </a>
                  )}
                  {profile.tiktok && (
                    <a href={profile.tiktok} target="_blank" rel="noopener noreferrer" className="social-icon-btn social-icon-tiktok" title="TikTok">
                      <FaTiktok />
                    </a>
                  )}
                  {profile.whatsapp && (
                    <a href={profile.whatsapp} target="_blank" rel="noopener noreferrer" className="social-icon-btn social-icon-whatsapp" title="WhatsApp">
                      <FaWhatsapp />
                    </a>
                  )}
                  {profile.portfolioWebsite && (
                    <a href={profile.portfolioWebsite} target="_blank" rel="noopener noreferrer" className="social-link-modern website-link" title="Website">
                      <span className="link-label">Website</span>
                      <span className="link-icon">🌐</span>
                      <span>{profile.portfolioWebsite}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MEDIA PORTFOLIO TAB */}
          {activeTab === 'media' && (
            <div className="tab-content-grid">
              {Array.isArray(profile.portfolio) && profile.portfolio.length > 0 && (
                <div className="full-width-section">
                  <span className="section-title">Media Gallery</span>
                  <div className="portfolio-grid-modern">
                    {profile.portfolio.map((item, idx) => (
                      <div key={idx} className="portfolio-item-modern">
                        <img src={item.image} alt={item.title} />
                        <p>{item.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Premium Footer */}
        <div className="cta-footer">
          <button className="btn-secondary"><FaEnvelope /> Message</button>
          <button className="btn-primary"><FaBriefcase /> Hire Now</button>
          <button 
            className={`btn-follow ${isFollowing ? 'following' : ''}`}
            onClick={() => {
              if (onToggleFollowing) {
                onToggleFollowing(profile.id);
              }
            }}
            title={isFollowing ? (isFromFollowing ? "Unfollow" : "Following") : "Follow"}
          >
            <FaUser /> {isFollowing ? (isFromFollowing ? 'Unfollow' : 'Following') : 'Follow'}
          </button>
          <button 
            className="btn-rate"
            onClick={() => setShowRatingModal(true)}
            title="Rate this professional"
          >
            <FaStar /> Rate
          </button>
        </div>

        {/* Rating Modal Overlay */}
        {showRatingModal && (
          <div className="rating-modal-overlay" onClick={() => {
            setShowRatingModal(false);
            setUserRating(0);
          }}>
            <div className="rating-modal" onClick={(e) => e.stopPropagation()}>
              <div className="rating-header-compact">
                <h3 className="rating-modal-title">Rate {toProperCase(profile.name)}</h3>
                <button 
                  className="close-rating-modal"
                  onClick={() => {
                    setShowRatingModal(false);
                    setUserRating(0);
                  }}
                >
                  ✕
                </button>
              </div>
              
              <div className="rating-form-compact">
                <div className="stars-wrapper-compact">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className={`star-btn-compact ${star <= (hoverRating || userRating) ? 'active' : ''}`}
                      onClick={() => setUserRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      title={`Rate ${star} stars`}
                    >
                      <FaStar className="star-icon-compact" />
                    </button>
                  ))}
                </div>

                <div className="rating-actions-compact">
                  <button 
                    className="btn-submit-rating-compact"
                    onClick={handleSubmitRating}
                  >
                    Submit
                  </button>
                  <button 
                    className="btn-cancel-rating-compact"
                    onClick={() => {
                      setShowRatingModal(false);
                      setUserRating(0);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {submittedRatings && submittedRatings.length > 0 && (
                <div className="previous-ratings-compact">
                  <div className="ratings-list-compact">
                    {submittedRatings.map((rating, idx) => (
                      <div key={idx} className="rating-item-compact">
                        <div className="rating-stars-display-compact">
                          {[...Array(5)].map((_, i) => (
                            <FaStar 
                              key={i} 
                              className={`star-display-compact ${i < rating.rating ? 'filled' : 'empty'}`}
                            />
                          ))}
                        </div>
                        <span className="rating-date-compact">{rating.date}</span>
                      </div>
                    ))}
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

export default DetailsPanel;
