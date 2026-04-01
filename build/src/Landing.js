import './Landing.css';
import { FiCheck } from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';

function Landing({ onGetStarted }) {
  const [activeSection, setActiveSection] = useState(0);
  const inactivityTimerRef = useRef(null);

  const sections = [
    { id: 'hero', name: 'Hero' },
    { id: 'features', name: 'Features' },
    { id: 'how', name: 'How It Works' },
    { id: 'testimonials', name: 'Testimonials' },
    { id: 'stats', name: 'Stats' },
    { id: 'cta', name: "Let's Go" }
  ];

  // Auto-scroll on inactivity (60 seconds)
  useEffect(() => {
    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    // Set new timer - advances to next section after 60 seconds of inactivity
    inactivityTimerRef.current = setTimeout(() => {
      setActiveSection(prev => (prev + 1) % sections.length);
    }, 60000); // 60 seconds
    
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [activeSection, sections.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        setActiveSection(prev => (prev + 1) % sections.length);
      } else if (e.key === 'ArrowLeft') {
        setActiveSection(prev => (prev - 1 + sections.length) % sections.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sections.length]);

  // Swipe and mouse drag
  useEffect(() => {
    let startX = 0;
    let endX = 0;

    const handleStart = (e) => {
      startX = e.touches ? e.touches[0].clientX : e.clientX;
    };

    const handleEnd = (e) => {
      endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
      handleSwipe();
    };

    const handleSwipe = () => {
      const swipeThreshold = 50;
      const diff = startX - endX;

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          setActiveSection(prev => (prev + 1) % sections.length);
        } else {
          setActiveSection(prev => (prev - 1 + sections.length) % sections.length);
        }
      }
    };

    const wrapper = document.querySelector('.sections-wrapper');
    if (wrapper) {
      wrapper.addEventListener('touchstart', handleStart, false);
      wrapper.addEventListener('touchend', handleEnd, false);
      wrapper.addEventListener('mousedown', handleStart, false);
      wrapper.addEventListener('mouseup', handleEnd, false);

      return () => {
        wrapper.removeEventListener('touchstart', handleStart);
        wrapper.removeEventListener('touchend', handleEnd);
        wrapper.removeEventListener('mousedown', handleStart);
        wrapper.removeEventListener('mouseup', handleEnd);
      };
    }
  }, [sections.length]);

  return (
    <div className="landing-page">
      {/* Sticky Header */}
      <header className="sticky-header">
        <div className="header-container">
          <div className="logo-brand">
            <span className="logo-text-simple">JobLink</span>
          </div>
          <div className="header-actions">
            <button className="btn-header" onClick={onGetStarted}>
              Let's Go
            </button>
          </div>
        </div>
      </header>

      {/* Scrolling Sections Container */}
      <div className="sections-wrapper">
        {/* Section 1: Hero */}
        <section 
          className="landing-section hero-section"
          style={{ 
            transform: `translateX(${(0 - activeSection) * 100}%)`,
            opacity: Math.abs(0 - activeSection) <= 1 ? 1 : 0,
            pointerEvents: activeSection === 0 ? 'auto' : 'none'
          }}
        >
          <div className="section-content">
            <div className="hero-left">
              <h1 className="hero-main-title">
                <span className="word">Find Your</span>
                <span className="word">Dream</span>
                <span className="word">Career</span>
                <span className="word">Today</span>
              </h1>
              <p className="hero-description">
                Discover the perfect job opportunity. Connect with top companies, grow your network, and accelerate your career journey on JobLink.
              </p>
              <div className="hero-actions">
                <button className="btn-large primary" onClick={onGetStarted}>
                  Let's Go
                </button>
                <button className="btn-large secondary" onClick={() => setActiveSection(1)}>
                  Learn More
                </button>
              </div>
              <div className="hero-stats-row">
                <div className="stat-item">
                  <span className="stat-value">50K+</span>
                  <span className="stat-name">Active Jobs</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">10K+</span>
                  <span className="stat-name">Companies</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">500K+</span>
                  <span className="stat-name">Users</span>
                </div>
              </div>
            </div>
            <div className="hero-right">
              <div className="creative-carousel-container">
                <div className="animated-background">
                  <div className="particle particle-1"></div>
                  <div className="particle particle-2"></div>
                  <div className="particle particle-3"></div>
                  <div className="particle particle-4"></div>
                  <div className="particle particle-5"></div>
                </div>
                <div className="carousel-3d-wrapper">
                  <div className="carousel-3d-inner">
                    <div className="carousel-face face-1">
                      <img src="/assets/images/I1.jpg" alt="50K+ Jobs" className="carousel-image" />
                      <div className="image-overlay"></div>
                      <div className="image-glow"></div>
                    </div>
                    <div className="carousel-face face-2">
                      <img src="/assets/images/I2.jpeg" alt="Growth Career" className="carousel-image" />
                      <div className="image-overlay"></div>
                      <div className="image-glow"></div>
                    </div>
                  </div>
                </div>
                <div className="floating-shapes">
                  <div className="shape shape-circle"></div>
                  <div className="shape shape-square"></div>
                  <div className="shape shape-triangle"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Features */}
        <section 
          className="landing-section features-section"
          style={{ 
            transform: `translateX(${(1 - activeSection) * 100}%)`,
            opacity: Math.abs(1 - activeSection) <= 1 ? 1 : 0,
            pointerEvents: activeSection === 1 ? 'auto' : 'none'
          }}
        >
          <div className="section-content">
            <div className="hero-left">
              <h2 className="creative-title">
                <span className="creative-word">Powerful</span>
                <span className="creative-word">Features</span>
                <span className="creative-word">Designed for You</span>
              </h2>
              <p className="creative-subtitle">
                JobLink provides all the tools you need to find, apply, and land your dream job with ease.
              </p>
              <div className="creative-features">
                <div className="creative-feature">
                  <div className="feature-dot"><FiCheck /></div>
                  <span>Smart Job Search & Filtering</span>
                </div>
                <div className="creative-feature">
                  <div className="feature-dot"><FiCheck /></div>
                  <span>Save & Bookmark Favorites</span>
                </div>
                <div className="creative-feature">
                  <div className="feature-dot"><FiCheck /></div>
                  <span>Real-time Trending Jobs</span>
                </div>
                <div className="creative-feature">
                  <div className="feature-dot"><FiCheck /></div>
                  <span>Network with Professionals</span>
                </div>
                <div className="creative-feature">
                  <div className="feature-dot"><FiCheck /></div>
                  <span>Personalized Recommendations</span>
                </div>
                <div className="creative-feature">
                  <div className="feature-dot"><FiCheck /></div>
                  <span>Career Insights & Analytics</span>
                </div>
              </div>
            </div>
            <div className="hero-right">
              <div className="floating-gallery">
                <div className="gallery-item item-1">
                  <img src="/assets/i5.jpg" alt="Browse Jobs" className="gallery-image" />
                </div>
                <div className="gallery-item item-2">
                  <img src="/assets/i6.jpg" alt="Connect" className="gallery-image" />
                </div>
                <div className="gallery-item item-3">
                  <img src="/assets/i7.jpg" alt="Trending" className="gallery-image" />
                </div>
                <div className="gallery-item item-4">
                  <img src="/assets/i8.jpg" alt="Quick Apply" className="gallery-image" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: How It Works */}
        <section 
          className="landing-section how-section"
          style={{ 
            transform: `translateX(${(2 - activeSection) * 100}%)`,
            opacity: Math.abs(2 - activeSection) <= 1 ? 1 : 0,
            pointerEvents: activeSection === 2 ? 'auto' : 'none'
          }}
        >
          <div className="section-content">
            <div className="how-container">
              <h2 className="how-title">How It Works</h2>
              <p className="how-subtitle">Get hired in 4 simple steps</p>
              <div className="steps-grid">
                <div className="how-step">
                  <div className="step-circle">1</div>
                  <h3>Create Your Profile</h3>
                  <p>Add your experience, skills, and career goals</p>
                </div>
                <div className="how-step">
                  <div className="step-circle">2</div>
                  <h3>Browse Opportunities</h3>
                  <p>Explore jobs matched to your preferences</p>
                </div>
                <div className="how-step">
                  <div className="step-circle">3</div>
                  <h3>Apply or Connect</h3>
                  <p>Reach out directly to employers</p>
                </div>
                <div className="how-step">
                  <div className="step-circle">4</div>
                  <h3>Get Hired</h3>
                  <p>Land your dream job and succeed</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Testimonials */}
        <section 
          className="landing-section testimonials-section"
          style={{ 
            transform: `translateX(${(3 - activeSection) * 100}%)`,
            opacity: Math.abs(3 - activeSection) <= 1 ? 1 : 0,
            pointerEvents: activeSection === 3 ? 'auto' : 'none'
          }}
        >
          <div className="section-content">
            <div className="testimonials-container">
              <h2 className="testimonials-title">Success Stories</h2>
              <p className="testimonials-subtitle">Hear from professionals who found their dream careers</p>
              <div className="testimonials-carousel">
                <div className="testimonial-item">
                  <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
                  <p className="testimonial-text">
                    "JobLink changed my career! Found an amazing role within 2 weeks. Highly recommend!"
                  </p>
                  <div className="testimonial-author">
                    <div className="author-avatar">JD</div>
                    <div>
                      <div className="author-name">Jane Doe</div>
                      <div className="author-role">Product Manager @ TechCorp</div>
                    </div>
                  </div>
                </div>
                <div className="testimonial-item">
                  <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
                  <p className="testimonial-text">
                    "The best platform for finding opportunities. Great community and authentic connections!"
                  </p>
                  <div className="testimonial-author">
                    <div className="author-avatar">SM</div>
                    <div>
                      <div className="author-name">Steve Miller</div>
                      <div className="author-role">Senior Developer @ StartupCo</div>
                    </div>
                  </div>
                </div>
                <div className="testimonial-item">
                  <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
                  <p className="testimonial-text">
                    "Refreshing approach to job hunting. The matching algorithm is incredible!"
                  </p>
                  <div className="testimonial-author">
                    <div className="author-avatar">AB</div>
                    <div>
                      <div className="author-name">Aisha Brown</div>
                      <div className="author-role">Design Lead @ TechVision</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Stats */}
        <section 
          className="landing-section stats-section"
          style={{ 
            transform: `translateX(${(4 - activeSection) * 100}%)`,
            opacity: Math.abs(4 - activeSection) <= 1 ? 1 : 0,
            pointerEvents: activeSection === 4 ? 'auto' : 'none'
          }}
        >
          <div className="section-content">
            <div className="stats-content">
              <h2 className="stats-title">By The Numbers</h2>
              <div className="mega-stats">
                <div className="mega-stat">
                  <div className="mega-stat-number">50K+</div>
                  <div className="mega-stat-label">Active Jobs</div>
                </div>
                <div className="mega-stat">
                  <div className="mega-stat-number">10K+</div>
                  <div className="mega-stat-label">Companies</div>
                </div>
                <div className="mega-stat">
                  <div className="mega-stat-number">500K+</div>
                  <div className="mega-stat-label">Happy Users</div>
                </div>
                <div className="mega-stat">
                  <div className="mega-stat-number">95%</div>
                  <div className="mega-stat-label">Satisfaction Rate</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: CTA */}
        <section 
          className="landing-section cta-section"
          style={{ 
            transform: `translateX(${(5 - activeSection) * 100}%)`,
            opacity: Math.abs(5 - activeSection) <= 1 ? 1 : 0,
            pointerEvents: activeSection === 5 ? 'auto' : 'none'
          }}
        >
          <div className="section-content">
            <div className="cta-container">
              <h2 className="cta-title">Ready to Transform Your Career?</h2>
              <p className="cta-description">
                Join thousands of professionals who've already found their dream roles on JobLink
              </p>
              <button className="btn-large primary" onClick={onGetStarted}>
                Let's Go
              </button>
              <p className="cta-footer">No credit card required. Join in seconds.</p>
            </div>
          </div>
        </section>
      </div>

      {/* Navigation Dots */}
      <div className="section-indicators">
        {sections.map((section, index) => (
          <button
            key={index}
            className={`indicator-dot ${activeSection === index ? 'active' : ''}`}
            onClick={() => setActiveSection(index)}
            aria-label={`Go to ${section.name}`}
          />
        ))}
      </div>

      {/* Navigation Arrows */}
      <>
        <button 
          className="nav-arrow prev"
          onClick={() => setActiveSection(prev => (prev - 1 + sections.length) % sections.length)}
          aria-label="Previous section"
        >
          &lt;
        </button>
        <button 
          className="nav-arrow next"
          onClick={() => setActiveSection(prev => (prev + 1) % sections.length)}
          aria-label="Next section"
        >
          &gt;
        </button>
      </>
    </div>
  );
}

export default Landing;
