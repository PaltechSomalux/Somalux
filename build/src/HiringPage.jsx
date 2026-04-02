import './HiringPage.css';
import { useState } from 'react';
import { FaArrowLeft, FaBriefcase, FaUser, FaCalendar, FaDollarSign, FaCircleCheck, FaAward, FaFileAlt, FaLink, FaPhone, FaEnvelope } from 'react-icons/fa6';

function HiringPage({ profile, onBack }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Job Details
    jobTitle: '',
    jobCategory: '',
    jobType: 'fulltime',
    
    // Description
    jobDescription: '',
    projectScope: '',
    deliverables: '',
    
    // Requirements
    requiredSkills: [],
    skillInput: '',
    experienceLevel: 'mid',
    minimumExperience: '',
    
    // Budget & Timeline
    budgetMin: '',
    budgetMax: '',
    currency: 'USD',
    timeline: '',
    duration: '',
    
    // Additional Details
    projectBudgetType: 'fixed', // fixed or hourly
    communicationPreference: 'email',
    additionalRequirements: '',
    attachmentUrl: '',
    
    // Contact Info
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    notes: ''
  });

  const TOTAL_STEPS = 4;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSkill = () => {
    if (formData.skillInput.trim() && !formData.requiredSkills.includes(formData.skillInput)) {
      setFormData(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, formData.skillInput.trim()],
        skillInput: ''
      }));
    }
  };

  const handleRemoveSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(s => s !== skill)
    }));
  };

  const handleNextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (!formData.jobTitle.trim()) {
      alert('Please enter a job title');
      return;
    }
    if (!formData.jobDescription.trim()) {
      alert('Please enter a job description');
      return;
    }
    if (!formData.contactEmail.trim()) {
      alert('Please enter your contact email');
      return;
    }

    const hireRequest = {
      candidateName: profile.name,
      candidateId: profile.id,
      candidateProfile: {
        avatar: profile.avatar,
        rate: profile.rate,
        skills: profile.skills
      },
      ...formData,
      submittedDate: new Date().toLocaleDateString(),
      submittedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    console.log('Detailed hire request submitted:', hireRequest);
    alert(`Hire request sent to ${profile.name} for "${formData.jobTitle}"\n\nWe'll notify you when they respond.`);
    onBack();
  };

  const isStep1Complete = formData.jobTitle && formData.jobDescription && formData.jobCategory;
  const isStep2Complete = formData.budgetMin && formData.timeline;

  return (
    <div className="hiring-page-wrapper">
      <div className="hiring-page-container">
        
        {/* Header */}
        <div className="hiring-page-header">
          <button className="back-button" onClick={onBack} title="Back to profile">
            <FaArrowLeft /> Back to Profile
          </button>
          <div className="header-title">
            <h1>Hire {profile.name || 'Professional'}</h1>
            <p>Post a detailed job opportunity and send a hire request</p>
          </div>
          <div className="step-indicator">
            Step {currentStep} of {TOTAL_STEPS}
          </div>
        </div>

        <div className="hiring-page-content">
          
          {/* Sidebar - Candidate Preview */}
          <div className="hiring-sidebar">
            <div className="candidate-preview">
              <img src={profile.avatar} alt={profile.name} className="preview-avatar" />
              <h3 className="preview-name">{profile.name}</h3>
              <p className="preview-title">{profile.title || 'Professional'}</p>
              
              <div className="preview-stats">
                {profile.rate && (
                  <div className="stat-item">
                    <span className="stat-label">Rate</span>
                    <span className="stat-value">${profile.rate}/hr</span>
                  </div>
                )}
                {profile.rating && (
                  <div className="stat-item">
                    <span className="stat-label">Rating</span>
                    <span className="stat-value">⭐ {profile.rating}</span>
                  </div>
                )}
                {profile.followers && (
                  <div className="stat-item">
                    <span className="stat-label">Followers</span>
                    <span className="stat-value">{profile.followers}</span>
                  </div>
                )}
              </div>

              {profile.skills && profile.skills.length > 0 && (
                <div className="preview-section">
                  <h4 className="preview-section-title">Top Skills</h4>
                  <div className="skills-tags">
                    {profile.skills.slice(0, 5).map((skill, idx) => (
                      <span key={idx} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="preview-bio">
                {profile.bio ? profile.bio : 'No bio provided'}
              </div>

              <a href="#" className="view-full-profile-link">View Full Profile →</a>
            </div>
          </div>

          {/* Main Form Content */}
          <div className="hiring-form-wrapper">
            
            {/* Step 1: Job Basics */}
            {currentStep === 1 && (
              <div className="form-step fade-in">
                <div className="step-header">
                  <FaBriefcase className="step-icon" />
                  <h2>Job Basics</h2>
                  <p>Tell us about the opportunity</p>
                </div>

                <div className="form-section">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Job Title *</label>
                      <input
                        type="text"
                        name="jobTitle"
                        className="form-input"
                        placeholder="e.g., Senior React Developer, UI/UX Designer"
                        value={formData.jobTitle}
                        onChange={handleInputChange}
                      />
                      <small>What is the position you're hiring for?</small>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Job Category *</label>
                      <select
                        name="jobCategory"
                        className="form-input"
                        value={formData.jobCategory}
                        onChange={handleInputChange}
                      >
                        <option value="">Select a category</option>
                        <option value="web-development">Web Development</option>
                        <option value="mobile-development">Mobile Development</option>
                        <option value="design">Design</option>
                        <option value="marketing">Marketing</option>
                        <option value="writing">Writing & Content</option>
                        <option value="data-science">Data Science</option>
                        <option value="devops">DevOps & Infrastructure</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Job Type</label>
                      <select
                        name="jobType"
                        className="form-input"
                        value={formData.jobType}
                        onChange={handleInputChange}
                      >
                        <option value="fulltime">Full-Time</option>
                        <option value="parttime">Part-Time</option>
                        <option value="contract">Contract</option>
                        <option value="freelance">Freelance</option>
                        <option value="internship">Internship</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group full-width">
                      <label className="form-label">Job Description *</label>
                      <textarea
                        name="jobDescription"
                        className="form-textarea"
                        placeholder="Describe the role, responsibilities, and what success looks like..."
                        rows="6"
                        value={formData.jobDescription}
                        onChange={handleInputChange}
                      />
                      <small>{formData.jobDescription.length} characters</small>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group full-width">
                      <label className="form-label">Project Scope</label>
                      <textarea
                        name="projectScope"
                        className="form-textarea"
                        placeholder="Outline the scope of work, what's included, and what's not..."
                        rows="4"
                        value={formData.projectScope}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Requirements */}
            {currentStep === 2 && (
              <div className="form-step fade-in">
                <div className="step-header">
                  <FaAward className="step-icon" />
                  <h2>Requirements & Skills</h2>
                  <p>What skills and experience are needed?</p>
                </div>

                <div className="form-section">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Experience Level</label>
                      <select
                        name="experienceLevel"
                        className="form-input"
                        value={formData.experienceLevel}
                        onChange={handleInputChange}
                      >
                        <option value="entry">Entry Level (0-2 years)</option>
                        <option value="mid">Mid Level (2-5 years)</option>
                        <option value="senior">Senior (5-10 years)</option>
                        <option value="expert">Expert (10+ years)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Minimum Years of Experience</label>
                      <input
                        type="number"
                        name="minimumExperience"
                        className="form-input"
                        placeholder="e.g., 3 years"
                        value={formData.minimumExperience}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group full-width">
                      <label className="form-label">Required Skills</label>
                      <div className="skill-input-group">
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Add a skill and press Add or Enter"
                          value={formData.skillInput}
                          onChange={(e) => setFormData(prev => ({ ...prev, skillInput: e.target.value }))}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSkill();
                            }
                          }}
                        />
                        <button 
                          type="button" 
                          className="btn-add-skill"
                          onClick={handleAddSkill}
                        >
                          Add
                        </button>
                      </div>

                      {formData.requiredSkills.length > 0 && (
                        <div className="skills-container">
                          {formData.requiredSkills.map((skill, idx) => (
                            <span key={idx} className="skill-badge">
                              {skill}
                              <button
                                type="button"
                                className="remove-skill"
                                onClick={() => handleRemoveSkill(skill)}
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <small>Add up to 10 key skills for this position</small>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group full-width">
                      <label className="form-label">Deliverables</label>
                      <textarea
                        name="deliverables"
                        className="form-textarea"
                        placeholder="What are the expected deliverables? (e.g., completed website, design mockups, reports)"
                        rows="4"
                        value={formData.deliverables}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group full-width">
                      <label className="form-label">Additional Requirements</label>
                      <textarea
                        name="additionalRequirements"
                        className="form-textarea"
                        placeholder="Any additional requirements? (e.g., specific certifications, portfolio requirements, background check)"
                        rows="3"
                        value={formData.additionalRequirements}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Budget & Timeline */}
            {currentStep === 3 && (
              <div className="form-step fade-in">
                <div className="step-header">
                  <FaDollarSign className="step-icon" />
                  <h2>Budget & Timeline</h2>
                  <p>Set the financial and time expectations</p>
                </div>

                <div className="form-section">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Budget Type</label>
                      <div className="radio-group">
                        <label className="radio-label">
                          <input
                            type="radio"
                            name="projectBudgetType"
                            value="fixed"
                            checked={formData.projectBudgetType === 'fixed'}
                            onChange={handleInputChange}
                          />
                          Fixed Price
                        </label>
                        <label className="radio-label">
                          <input
                            type="radio"
                            name="projectBudgetType"
                            value="hourly"
                            checked={formData.projectBudgetType === 'hourly'}
                            onChange={handleInputChange}
                          />
                          Hourly Rate
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Currency</label>
                      <select
                        name="currency"
                        className="form-input"
                        value={formData.currency}
                        onChange={handleInputChange}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="KES">KES (Ksh)</option>
                        <option value="INR">INR (₹)</option>
                        <option value="NGN">NGN (₦)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Minimum Budget *</label>
                      <input
                        type="number"
                        name="budgetMin"
                        className="form-input"
                        placeholder="Enter minimum budget"
                        value={formData.budgetMin}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Maximum Budget *</label>
                      <input
                        type="number"
                        name="budgetMax"
                        className="form-input"
                        placeholder="Enter maximum budget"
                        value={formData.budgetMax}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Timeline *</label>
                      <select
                        name="timeline"
                        className="form-input"
                        value={formData.timeline}
                        onChange={handleInputChange}
                      >
                        <option value="">Select timeline</option>
                        <option value="immediate">ASAP (Start immediately)</option>
                        <option value="1-week">Within 1 week</option>
                        <option value="2-weeks">Within 2 weeks</option>
                        <option value="1-month">Within 1 month</option>
                        <option value="1-3-months">1-3 months</option>
                        <option value="3-6-months">3-6 months</option>
                        <option value="flexible">Flexible</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Duration</label>
                      <select
                        name="duration"
                        className="form-input"
                        value={formData.duration}
                        onChange={handleInputChange}
                      >
                        <option value="">Select duration</option>
                        <option value="1-week">1 week</option>
                        <option value="1-month">1 month</option>
                        <option value="2-3-months">2-3 months</option>
                        <option value="3-6-months">3-6 months</option>
                        <option value="6-months-plus">6+ months</option>
                        <option value="ongoing">Ongoing</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Contact & Review */}
            {currentStep === 4 && (
              <div className="form-step fade-in">
                <div className="step-header">
                  <FaUser className="step-icon" />
                  <h2>Contact Details & Review</h2>
                  <p>Finalize your hire request</p>
                </div>

                <div className="form-section">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Your Name *</label>
                      <input
                        type="text"
                        name="contactName"
                        className="form-input"
                        placeholder="Full name"
                        value={formData.contactName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Email Address *</label>
                      <input
                        type="email"
                        name="contactEmail"
                        className="form-input"
                        placeholder="your.email@company.com"
                        value={formData.contactEmail}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        name="contactPhone"
                        className="form-input"
                        placeholder="+1 (555) 000-0000"
                        value={formData.contactPhone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Preferred Communication</label>
                      <select
                        name="communicationPreference"
                        className="form-input"
                        value={formData.communicationPreference}
                        onChange={handleInputChange}
                      >
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="video-call">Video Call</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group full-width">
                      <label className="form-label">Attachment URL</label>
                      <input
                        type="url"
                        name="attachmentUrl"
                        className="form-input"
                        placeholder="https://example.com/job-description.pdf or reference link"
                        value={formData.attachmentUrl}
                        onChange={handleInputChange}
                      />
                      <small>Link to job description, company info, or reference materials</small>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group full-width">
                      <label className="form-label">Additional Notes</label>
                      <textarea
                        name="notes"
                        className="form-textarea"
                        placeholder="Any final notes or special instructions for the candidate..."
                        rows="3"
                        value={formData.notes}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  {/* Review Summary */}
                  <div className="review-summary">
                    <h3>Request Summary</h3>
                    <div className="summary-grid">
                      <div className="summary-item">
                        <span className="summary-label">Position</span>
                        <span className="summary-value">{formData.jobTitle || 'Not specified'}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Budget</span>
                        <span className="summary-value">{formData.currency} {formData.budgetMin || '0'} - {formData.budgetMax || '0'}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Timeline</span>
                        <span className="summary-value">{formData.timeline || 'Flexible'}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Skills Required</span>
                        <span className="summary-value">{formData.requiredSkills.length || '0'} skills</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="form-navigation">
              <button
                className="btn-nav btn-nav-prev"
                onClick={handlePreviousStep}
                disabled={currentStep === 1}
              >
                ← Previous
              </button>

              <button
                className="btn-nav btn-nav-next"
                onClick={currentStep === TOTAL_STEPS ? handleSubmit : handleNextStep}
              >
                {currentStep === TOTAL_STEPS ? (
                  <>
                    <FaCircleCheck /> Send Hire Request
                  </>
                ) : (
                  <>
                    Next →
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HiringPage;
