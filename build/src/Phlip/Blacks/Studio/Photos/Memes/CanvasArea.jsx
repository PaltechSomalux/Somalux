import React from 'react';

export const CanvasArea = ({
  canvasRef,
  canvasContainerRef,
  transform,
  isDrawing,
  startDrawing,
  draw,
  stopDrawing,
  brushSettings
}) => (
  <div 
    className="canvas-container" 
    ref={canvasContainerRef}
    onMouseLeave={stopDrawing}
  >
    <div 
      className="canvas-wrapper" 
      style={{ 
        transform: `
          scale(${transform.zoom}) 
          rotate(${transform.rotation}deg)
          scaleX(${transform.flipX ? -1 : 1})
          scaleY(${transform.flipY ? -1 : 1})
        ` 
      }}
    >
      <canvas 
        ref={canvasRef} 
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        className={`${isDrawing ? 'drawing-cursor' : ''}`}
        style={{ 
          cursor: isDrawing ? 
            `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${brushSettings.size}" height="${brushSettings.size}" viewBox="0 0 ${brushSettings.size} ${brushSettings.size}"><circle cx="${brushSettings.size/2}" cy="${brushSettings.size/2}" r="${brushSettings.size/2}" fill="${brushSettings.color.replace('#', '%23')}" opacity="${brushSettings.opacity}"/></svg>') ${brushSettings.size/2} ${brushSettings.size/2}, auto` : 
            'auto' 
        }}
      />
    </div>
  </div>
);

