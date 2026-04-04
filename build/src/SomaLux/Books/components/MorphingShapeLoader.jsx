import React from 'react';
import './MorphingShapeLoader.css';

/**
 * MorphingShapeLoader Component
 * 
 * A sophisticated loading animation featuring smooth shape morphing transitions.
 * The shape transitions between circle → rounded square → star → back to circle
 * with fluid SVG path animations.
 * 
 * DESIGN:
 * - SVG-based morphing with smooth transitions
 * - Color gradient with animated gradient offset
 * - Multiple morph states with 2-second transitions
 * - Professional dark background
 */

const MorphingShapeLoader = ({ 
  showText = true, 
  text = 'Loading',
  svgSize = 100,
  containerMinHeight = '60vh'
}) => {
  return (
    <div className="morphing-loader-container" style={{ minHeight: containerMinHeight }}>
      <div className="morphing-loader-spinner">
        <svg 
          width={svgSize} 
          height={svgSize} 
          viewBox="0 0 100 100" 
          className="morphing-svg"
        >
          <defs>
            {/* Gradient definition for animated fill */}
            <linearGradient id="morphingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#003d82" />
              <stop offset="50%" stopColor="#00a8d8" />
              <stop offset="100%" stopColor="#003d82" />
            </linearGradient>
          </defs>

          {/* Main morphing shape */}
          <g className="morphing-shape-group">
            <path
              className="morphing-shape"
              fill="url(#morphingGradient)"
              d="M 50 20 C 35 20 25 30 25 45 C 25 60 35 70 50 70 C 65 70 75 60 75 45 C 75 30 65 20 50 20 Z"
            />
          </g>

          {/* Rotating ring around shape */}
          <circle
            className="morphing-ring"
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="url(#morphingGradient)"
            strokeWidth="2"
          />
        </svg>
      </div>
      
      {showText && <p className="morphing-loader-text">{text}</p>}
    </div>
  );
};

export default MorphingShapeLoader;
