import React from 'react';
import './PremiumLoader.css';

/**
 * GalaxyLoader Component - Cosmic Edition
 * 
 * A stunning cosmic loading animation featuring:
 * - Central sun with radiant glow
 * - Orbiting planets/stars
 * - Twinkling stars scattered throughout
 * - Galaxy nebula effects
 * - Smooth orbital motion
 * - Cosmic color scheme
 */

const PremiumLoader = ({ 
  containerMinHeight = '60vh'
}) => {
  return (
    <div className="premium-loader-container" style={{ minHeight: containerMinHeight }}>
      <div className="premium-loader-wrapper">
        
        {/* Galaxy background with nebula */}
        <div className="galaxy-nebula"></div>

        {/* Twinkling stars background */}
        <div className="stars-field">
          <div className="star star-1"></div>
          <div className="star star-2"></div>
          <div className="star star-3"></div>
          <div className="star star-4"></div>
          <div className="star star-5"></div>
          <div className="star star-6"></div>
          <div className="star star-7"></div>
          <div className="star star-8"></div>
          <div className="star star-9"></div>
          <div className="star star-10"></div>
        </div>

        {/* Central sun */}
        <div className="sun-container">
          <div className="sun-core"></div>
          <div className="sun-glow"></div>
          <div className="sun-rays"></div>
        </div>

        {/* Orbital rings - like planetary orbits */}
        <div className="orbits">
          <div className="orbit orbit-1"></div>
          <div className="orbit orbit-2"></div>
          <div className="orbit orbit-3"></div>
        </div>

        {/* Orbiting planets */}
        <div className="planets">
          <div className="planet planet-1">
            <div className="planet-core"></div>
          </div>
          <div className="planet planet-2">
            <div className="planet-core"></div>
          </div>
          <div className="planet planet-3">
            <div className="planet-core"></div>
          </div>
        </div>

        {/* Cosmic dust particles */}
        <div className="cosmic-dust">
          <div className="dust-particle dust-1"></div>
          <div className="dust-particle dust-2"></div>
          <div className="dust-particle dust-3"></div>
          <div className="dust-particle dust-4"></div>
          <div className="dust-particle dust-5"></div>
        </div>
      </div>
    </div>
  );
};

export default PremiumLoader;
