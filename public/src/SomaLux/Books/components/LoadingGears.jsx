import React from 'react';
import './LoadingGears.css';

/**
 * LoadingGears Component
 * 
 * A professional loading animation featuring three interlocking gears
 * in navy blue, gray, and cyan colors with synchronized rotation animations.
 * 
 * DESIGN SPECIFICATIONS:
 * - SVG Canvas: 100x100 viewBox
 * - Gear 1 (Navy Blue): Position center (30, 28), rotates clockwise @ 4s
 * - Gear 2 (Gray): Position center (70, 28), rotates counter-clockwise @ 3s
 * - Gear 3 (Cyan): Position center (50, 62), rotates clockwise @ 3.5s
 * 
 * STYLING:
 * - Drop shadow filter for depth: 0 2px 8px rgba(0,0,0,0.3)
 * - Background: Dark gradient (135deg, #0b1216 to #0f1a1e)
 * - Text: "Opening" message with smooth animation
 */

const LoadingGears = ({ 
  showText = true, 
  text = 'Opening',
  svgSize = 100,
  containerMinHeight = '60vh'
}) => {
  return (
    <div className="loading-gears-container" style={{ minHeight: containerMinHeight }}>
      <div className="loading-gears-spinner">
        <svg 
          width={svgSize} 
          height={svgSize} 
          viewBox="0 0 100 100" 
          className="loading-gears-svg"
        >
          {/* GEAR 1 - TOP LEFT (NAVY BLUE) */}
          {/* 
            Design Logic:
            - Center: (30, 28), Radius: 18
            - 8 teeth positioned radially
            - Outer ring stroke for depth effect
            - Central hub with inner circle
            - Color: #003d82 (Navy Blue)
          */}
          <g className="gear gear-1">
            {/* Teeth - created with quadratic curves for smooth tooth edges */}
            <path d="M 28 6 Q 30 4 30 4 Q 30 4 32 6 L 32 12 Q 30 14 30 14 Q 30 14 28 12 Z" fill="#003d82"/>
            <path d="M 42 12 Q 44.5 8.5 44.5 8.5 Q 44.5 8.5 46.5 11 L 43.5 18 Q 41 17 40.5 18 Z" fill="#003d82"/>
            <path d="M 48 24 Q 50 22 50 22 Q 50 22 52 24 L 52 32 Q 50 34 50 34 Q 50 34 48 32 Z" fill="#003d82"/>
            <path d="M 43.5 40 Q 41 41 40.5 40 L 43.5 48 Q 44.5 47.5 44.5 47.5 Q 44.5 47.5 42 44 Z" fill="#003d82"/>
            <path d="M 32 42 Q 30 40 30 40 Q 30 40 28 42 L 28 48 Q 30 50 30 50 Q 30 50 32 48 Z" fill="#003d82"/>
            <path d="M 19.5 47 Q 17 45 16.5 46 L 19.5 38 Q 20.5 39.5 20.5 39.5 Q 20.5 39.5 18 44 Z" fill="#003d82"/>
            <path d="M 12 32 Q 10 34 10 34 Q 10 34 12 32 L 12 24 Q 10 22 10 22 Q 10 22 12 24 Z" fill="#003d82"/>
            <path d="M 19.5 16 Q 18 19.5 18.5 18 L 16.5 11 Q 17 10.5 17 10.5 Q 17 10.5 19.5 13 Z" fill="#003d82"/>
            
            {/* Outer ring for depth and visual interest */}
            <circle cx="30" cy="28" r="18" fill="none" stroke="#003d82" strokeWidth="1.5" opacity="0.4"/>
            
            {/* Center hub - main gear body */}
            <circle cx="30" cy="28" r="6.5" fill="#003d82"/>
            
            {/* Inner circle - gear axle */}
            <circle cx="30" cy="28" r="3" fill="#0b1216"/>
          </g>

          {/* GEAR 2 - TOP RIGHT (GRAY) */}
          {/* 
            Design Logic:
            - Center: (70, 28), Radius: 18
            - Mirror position of Gear 1
            - Rotates counter-clockwise (opposite to Gear 1)
            - 8 teeth with identical geometry
            - Color: #999999 (Gray)
          */}
          <g className="gear gear-2">
            {/* Teeth - identical tooth shapes, translated to position (70, 28) */}
            <path d="M 68 6 Q 70 4 70 4 Q 70 4 72 6 L 72 12 Q 70 14 70 14 Q 70 14 68 12 Z" fill="#999999"/>
            <path d="M 82 12 Q 84.5 8.5 84.5 8.5 Q 84.5 8.5 86.5 11 L 83.5 18 Q 81 17 80.5 18 Z" fill="#999999"/>
            <path d="M 88 24 Q 90 22 90 22 Q 90 22 92 24 L 92 32 Q 90 34 90 34 Q 90 34 88 32 Z" fill="#999999"/>
            <path d="M 83.5 40 Q 81 41 80.5 40 L 83.5 48 Q 84.5 47.5 84.5 47.5 Q 84.5 47.5 82 44 Z" fill="#999999"/>
            <path d="M 72 42 Q 70 40 70 40 Q 70 40 68 42 L 68 48 Q 70 50 70 50 Q 70 50 72 48 Z" fill="#999999"/>
            <path d="M 59.5 47 Q 57 45 56.5 46 L 59.5 38 Q 60.5 39.5 60.5 39.5 Q 60.5 39.5 58 44 Z" fill="#999999"/>
            <path d="M 52 32 Q 50 34 50 34 Q 50 34 52 32 L 52 24 Q 50 22 50 22 Q 50 22 52 24 Z" fill="#999999"/>
            <path d="M 59.5 16 Q 58 19.5 58.5 18 L 56.5 11 Q 57 10.5 57 10.5 Q 57 10.5 59.5 13 Z" fill="#999999"/>
            
            {/* Outer ring for depth */}
            <circle cx="70" cy="28" r="18" fill="none" stroke="#999999" strokeWidth="1.5" opacity="0.4"/>
            
            {/* Center hub */}
            <circle cx="70" cy="28" r="6.5" fill="#999999"/>
            
            {/* Inner circle */}
            <circle cx="70" cy="28" r="3" fill="#0b1216"/>
          </g>

          {/* GEAR 3 - BOTTOM CENTER (CYAN) */}
          {/* 
            Design Logic:
            - Center: (50, 62), Radius: 18
            - Positioned below Gear 1 & 2 to create interlocking effect
            - Rotates clockwise (same direction as Gear 1)
            - 8 teeth interlocking with upper gears
            - Color: #00a8d8 (Cyan)
          */}
          <g className="gear gear-3">
            {/* Teeth - positioned to interlock with Gear 1 & Gear 2 */}
            <path d="M 48 40 Q 50 38 50 38 Q 50 38 52 40 L 52 46 Q 50 48 50 48 Q 50 48 48 46 Z" fill="#00a8d8"/>
            <path d="M 62 46 Q 64.5 42.5 64.5 42.5 Q 64.5 42.5 66.5 45 L 63.5 52 Q 61 51 60.5 52 Z" fill="#00a8d8"/>
            <path d="M 68 58 Q 70 56 70 56 Q 70 56 72 58 L 72 66 Q 70 68 70 68 Q 70 68 68 66 Z" fill="#00a8d8"/>
            <path d="M 63.5 74 Q 61 75 60.5 74 L 63.5 82 Q 64.5 81.5 64.5 81.5 Q 64.5 81.5 62 78 Z" fill="#00a8d8"/>
            <path d="M 52 76 Q 50 74 50 74 Q 50 74 48 76 L 48 82 Q 50 84 50 84 Q 50 84 52 82 Z" fill="#00a8d8"/>
            <path d="M 39.5 81 Q 37 79 36.5 80 L 39.5 72 Q 40.5 73.5 40.5 73.5 Q 40.5 73.5 38 78 Z" fill="#00a8d8"/>
            <path d="M 32 66 Q 30 68 30 68 Q 30 68 32 66 L 32 58 Q 30 56 30 56 Q 30 56 32 58 Z" fill="#00a8d8"/>
            <path d="M 39.5 50 Q 38 53.5 38.5 52 L 36.5 45 Q 37 44.5 37 44.5 Q 37 44.5 39.5 47 Z" fill="#00a8d8"/>
            
            {/* Outer ring for depth */}
            <circle cx="50" cy="62" r="18" fill="none" stroke="#00a8d8" strokeWidth="1.5" opacity="0.4"/>
            
            {/* Center hub */}
            <circle cx="50" cy="62" r="6.5" fill="#00a8d8"/>
            
            {/* Inner circle */}
            <circle cx="50" cy="62" r="3" fill="#0b1216"/>
          </g>
        </svg>
      </div>
      
      {showText && <p className="loading-gears-text">{text}</p>}
    </div>
  );
};

export default LoadingGears;
