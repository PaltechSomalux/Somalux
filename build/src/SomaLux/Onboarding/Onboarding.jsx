import React, { useEffect, useRef, useState } from 'react';
import './Onboarding.css';

export const Onboarding = () => {
  const activities = [
    {
      title: 'Create your profile',
      desc:
        'Add your name and a profile picture so friends recognize you.',
      badge: '1',
      emoji: '👤',
    },
    {
      title: 'Start a chat',
      desc: 'Find friends on ConnectMe and start a conversation.',
      badge: '2',
      emoji: '💬',
    },
    {
      title: 'Join groups',
      desc: 'Discover communities for classes, clubs and interests.',
      badge: '3',
      emoji: '👥',
    },
    {
      title: 'View stories',
      desc: 'Catch up with campus vibes and daily moments.',
      badge: '4',
      emoji: '📸',
    },
    {
      title: 'Study smarter',
      desc: 'Manage materials, schedules and reminders with ease.',
      badge: '5',
      emoji: '📚',
    },
  ];

  const [index, setIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const trackRef = useRef(null);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  const goTo = (i) => setIndex((i + activities.length) % activities.length);
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  useEffect(() => {
    if (isHovering) return;
    const id = setInterval(next, 4500);
    return () => clearInterval(id);
  }, [index, isHovering]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const onTouchMove = (e) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const onTouchEnd = () => {
    const threshold = 50;
    if (touchDeltaX.current > threshold) prev();
    else if (touchDeltaX.current < -threshold) next();
  };

  return (
    <div className="onboard-container">
      <div
        className="onboard-card"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <img
          className="onboard-logo"
          src="https://i.postimg.cc/2jtts8NS/Paltech-White.png"
          alt="Paltech"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <h1 className="onboard-title">Welcome to Campuslife</h1>
        <p className="onboard-subtitle">
          Your hub for chats, groups, academics and vibes — all in one place.
        </p>

        <div
          className="onboard-carousel"
          role="region"
          aria-roledescription="carousel"
          aria-label="Campuslife activities"
        >
          <div
            className="carousel-track"
            ref={trackRef}
            style={{ transform: `translateX(-${index * 100}%)` }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {activities.map((item, i) => (
              <div
                key={i}
                className="carousel-slide"
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${activities.length}`}
              >
                <div className="onboard-steps">
                  <div className="onboard-step">
                    <div className="step-badge" aria-hidden="true">
                      {item.badge}
                    </div>
                    <div className="step-text">
                      <h3>
                        <span className="step-emoji" aria-hidden="true">{item.emoji}</span>{' '}
                        {item.title}
                      </h3>
                      <p>{item.desc}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="carousel-controls" aria-label="Carousel controls">
            <button className="ctrl left" onClick={prev} aria-label="Previous">
              <span aria-hidden="true">‹</span>
            </button>
            <button className="ctrl right" onClick={next} aria-label="Next">
              <span aria-hidden="true">›</span>
            </button>
          </div>

          <div className="carousel-dots" role="tablist" aria-label="Slides">
            {activities.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === index}
                aria-label={`Go to slide ${i + 1}`}
                className={`dot ${i === index ? 'active' : ''}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </div>

        <div className="onboard-actions">
          <a className="onboard-btn primary" href="/ConnectMe">
            Open ConnectMe
          </a>
          <a className="onboard-btn ghost" href="/MyProfile">
            Edit Profile
          </a>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
