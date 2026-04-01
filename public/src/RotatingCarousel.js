import './RotatingCarousel.css';
import { useState, useEffect } from 'react';

function RotatingCarousel({ profiles, onSelect }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRotating, setIsRotating] = useState(true);

  useEffect(() => {
    if (!isRotating) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % profiles.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isRotating, profiles.length]);

  const getVisibleCards = () => {
    const cards = [];
    const itemsToShow = 5;
    
    for (let i = 0; i < itemsToShow; i++) {
      const index = (currentIndex + i) % profiles.length;
      cards.push({
        profile: profiles[index],
        index: i,
        actualIndex: index
      });
    }
    return cards;
  };

  return (
    <div className="rotating-carousel-container">
      <div className="carousel-header">
        <h2>Featured Talents</h2>
        <button 
          className="rotate-toggle-btn"
          onClick={() => setIsRotating(!isRotating)}
        >
          {isRotating ? '⏸ Pause' : '▶ Play'}
        </button>
      </div>

      <div className="carousel-wrapper">
        <div className="rotating-carousel">
          {getVisibleCards().map((item) => (
            <div 
              key={item.actualIndex}
              className={`carousel-card ${item.index === 2 ? 'center-card' : ''}`}
              style={{
                '--rotation': `${item.index - 2}`,
                '--z-index': 5 - Math.abs(item.index - 2)
              }}
              onClick={() => onSelect(item.profile)}
            >
              <div className="carousel-card-inner">
                <img 
                  src={item.profile.avatar} 
                  alt={item.profile.name} 
                  className="carousel-avatar"
                />
                <div className="carousel-card-content">
                  <h3>{item.profile.name}</h3>
                  <p className="carousel-title">{item.profile.title}</p>
                  <p className="carousel-rating">⭐ {item.profile.rating}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="carousel-controls">
        <button 
          className="carousel-btn prev-btn"
          onClick={() => setCurrentIndex((prev) => (prev - 1 + profiles.length) % profiles.length)}
        >
          ‹ Prev
        </button>
        <div className="carousel-indicators">
          {profiles.map((_, idx) => (
            <span 
              key={idx}
              className={`indicator ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(idx)}
            />
          ))}
        </div>
        <button 
          className="carousel-btn next-btn"
          onClick={() => setCurrentIndex((prev) => (prev + 1) % profiles.length)}
        >
          Next ›
        </button>
      </div>
    </div>
  );
}

export default RotatingCarousel;
