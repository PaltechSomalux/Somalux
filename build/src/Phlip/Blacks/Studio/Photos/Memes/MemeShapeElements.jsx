import React, { useCallback } from 'react';
import './Memes.css';

export const SHAPES = [
  'rectangle', 'rounded-rectangle', 'banner', 'arrow', 'double-arrow', 'circle', 'line',
  'flowchart-terminator', 'flowchart-preparation', 'speech-bubble-oval',
  'speech-bubble-rounded-rectangle', 'speech-bubble-rectangle',
  'ribbon-curved', 'double-wave', 'wave', 'scroll-horizontal',
  'star', 'heart', 'cloud', 'hexagon', 'triangle'
];

export const MemeShapeElements = ({
  shapes,
  activeElement,
  dragging,
  isRotating,
  isCropping,
  handleDrag,
  handleTouchMove,
  handleTouchEnd,
  handleShapeResize,
  startDragging,
  stopDragging,
  startRotation,
  handleRotation,
  stopRotation,
  handleElementClick,
  handleDoubleClick,
  handleMouseWheelRotation,
  handleTouchZoom,
  updateShapeProperties,
  applyGradient, // Added for gradient support
  fillColor, // Added for default fill color
  outlineColor, // Added for default outline color
}) => {
  const renderShapes = useCallback(() => {
    return shapes.map((shape) => {
      const isActive = activeElement.type === 'shape' && activeElement.id === shape.id;

      // Base container style
      const containerStyle = {
        position: 'absolute',
        left: `${shape.x}px`,
        top: `${shape.y}px`,
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        transform: `translate(-50%, -50%) rotate(${shape.rotation}deg)`,
        transformOrigin: 'center center',
        touchAction: 'none',
        willChange: 'transform, width, height',
        transition: 'none',
        pointerEvents: isCropping ? 'none' : 'auto',
        width: `${shape.width}px`,
        height: `${shape.height}px`,
        overflow: 'visible',
      };

      // Gradient IDs
      const fillGradientId = `fill-gradient-${shape.id}`;
      const strokeGradientId = `stroke-gradient-${shape.id}`;

      // Effective colors
      const effectiveFillColor = shape.fillColor || fillColor || '#ff0000';
      const effectiveOutlineColor = shape.outlineColor || outlineColor || '#000000';

      // Gradient definitions
      let gradientDefs = null;
      if (effectiveFillColor.includes('gradient')) {
        const isRadial = effectiveFillColor.startsWith('radial-gradient');
        const colors = effectiveFillColor.match(/#[0-9A-Fa-f]{6}|rgb\(\d+,\s*\d+,\s*\d+\)/g) || ['#ff0000', '#000000'];
        const angle = effectiveFillColor.match(/(\d+)deg/)?.[1] || '0';
        gradientDefs = (
          <defs>
            {isRadial ? (
              <radialGradient id={fillGradientId} cx="50%" cy="50%" r="50%">
                {colors.map((color, index) => (
                  <stop key={index} offset={`${(index / (colors.length - 1)) * 100}%`} stopColor={color} />
                ))}
              </radialGradient>
            ) : (
              <linearGradient id={fillGradientId} gradientTransform={`rotate(${angle})`}>
                {colors.map((color, index) => (
                  <stop key={index} offset={`${(index / (colors.length - 1)) * 100}%`} stopColor={color} />
                ))}
              </linearGradient>
            )}
          </defs>
        );
      }
      if (effectiveOutlineColor.includes('gradient')) {
        const isRadial = effectiveOutlineColor.startsWith('radial-gradient');
        const colors = effectiveOutlineColor.match(/#[0-9A-Fa-f]{6}|rgb\(\d+,\s*\d+,\s*\d+\)/g) || ['#000000', '#ffffff'];
        const angle = effectiveOutlineColor.match(/(\d+)deg/)?.[1] || '0';
        gradientDefs = (
          <defs>
            {gradientDefs}
            {isRadial ? (
              <radialGradient id={strokeGradientId} cx="50%" cy="50%" r="50%">
                {colors.map((color, index) => (
                  <stop key={index} offset={`${(index / (colors.length - 1)) * 100}%`} stopColor={color} />
                ))}
              </radialGradient>
            ) : (
              <linearGradient id={strokeGradientId} gradientTransform={`rotate(${angle})`}>
                {colors.map((color, index) => (
                  <stop key={index} offset={`${(index / (colors.length - 1)) * 100}%`} stopColor={color} />
                ))}
              </linearGradient>
            )}
          </defs>
        );
      }

      // SVG path definitions for designer shapes
      let shapePath = '';
      let isLineShape = ['line', 'arrow', 'double-arrow'].includes(shape.shapeType);
      const needsExtendedViewBox = [
        'speech-bubble-oval',
        'speech-bubble-rounded-rectangle',
        'speech-bubble-rectangle',
        'ribbon-curved',
      ].includes(shape.shapeType);
      const viewBox = isLineShape ? '0 0 100 20' : needsExtendedViewBox ? '0 0 100 120' : '0 0 100 100';

      switch (shape.shapeType) {
        case 'rectangle':
          shapePath = 'M0,0 H100 V100 H0 Z';
          break;
        case 'rounded-rectangle':
          shapePath = 'M20,0 H80 A20,20 0 0,1 100,20 V80 A20,20 0 0,1 80,100 H20 A20,20 0 0,1 0,80 V20 A20,20 0 0,1 20,0 Z';
          break;
        case 'banner':
          shapePath = 'M0,20 Q50,0 100,20 V80 Q50,100 0,80 Z';
          break;
        case 'circle':
          shapePath = 'M50,0 A50,50 0 1,1 50,100 A50,50 0 1,1 50,0 Z';
          break;
        case 'arrow':
          shapePath = 'M0,10 H100';
          break;
        case 'double-arrow':
          shapePath = 'M0,10 H100';
          break;
        case 'line':
          shapePath = 'M0,10 H100';
          break;
        case 'flowchart-terminator':
          shapePath = 'M20,0 H80 A20,20 0 0,1 100,20 V80 A20,20 0 0,1 80,100 H20 A20,20 0 0,1 0,80 V20 A20,20 0 0,1 20,0 Z M20,0 Q50,-20 80,0 M80,100 Q50,120 20,100';
          break;
        case 'flowchart-preparation':
          shapePath = 'M20,0 L80,0 L100,50 L80,100 L20,100 L0,50 Z';
          break;
        case 'speech-bubble-oval':
          shapePath = 'M30,0 H70 A30,30 0 0,1 100,30 V70 A30,30 0 0,1 70,100 H50 L40,120 L30,100 H30 A30,30 0 0,1 0,70 V30 A30,30 0 0,1 30,0 Z';
          break;
        case 'speech-bubble-rounded-rectangle':
          shapePath = 'M20,0 H80 A20,20 0 0,1 100,20 V60 A20,20 0 0,1 80,80 H60 L40,100 L40,80 H20 A20,20 0 0,1 0,60 V20 A20,20 0 0,1 20,0 Z';
          break;
        case 'speech-bubble-rectangle':
          shapePath = 'M0,0 H100 V80 H60 L40,100 L40,80 H0 Z';
          break;
        case 'ribbon-curved':
          shapePath = 'M0,20 Q10,0 20,20 Q30,40 40,20 Q50,0 60,20 Q70,40 80,20 Q90,0 100,20 V80 Q90,100 80,80 Q70,60 60,80 Q50,100 40,80 Q30,60 20,80 Q10,100 0,80 Z';
          break;
        case 'double-wave':
          shapePath = 'M0,50 C10,10 20,90 30,50 C40,10 50,90 60,50 C70,10 80,90 90,50 C100,10 100,90 100,50 V100 H0 Z';
          break;
        case 'wave':
          shapePath = 'M0,50 C20,10 40,90 60,50 C80,10 100,90 100,50 V100 H0 Z';
          break;
        case 'scroll-horizontal':
          shapePath = 'M0,20 Q10,0 20,20 Q30,40 40,20 L60,20 Q70,0 80,20 Q90,40 100,20 V80 Q90,100 80,80 Q70,60 60,80 L40,80 Q30,100 20,80 Q10,60 0,80 Z';
          break;
        case 'star':
          shapePath = 'M50,0 L61,35 L98,35 L67,57 L78,92 L50,70 L22,92 L33,57 L2,35 L39,35 Z';
          break;
        case 'heart':
          shapePath = 'M50,30 A20,20 0 0,1 70,10 A20,20 0 0,1 90,30 Q90,50 50,80 Q10,50 10,30 A20,20 0 0,1 30,10 A20,20 0 0,1 50,30 Z';
          break;
        case 'cloud':
          shapePath = 'M20,40 A20,20 0 0,1 40,20 A20,20 0 0,1 60,20 A20,20 0 0,1 80,40 A20,20 0 0,1 60,60 A20,20 0 0,1 40,60 A20,20 0 0,1 20,40 Z';
          break;
        case 'hexagon':
          shapePath = 'M25,0 L75,0 L100,50 L75,100 L25,100 L0,50 Z';
          break;
        case 'triangle':
          shapePath = 'M50,0 L100,100 L0,100 Z';
          break;
        default:
          shapePath = 'M0,0 H100 V100 H0 Z';
      }

      // SVG styling
      const svgStyle = {
        width: '100%',
        height: '100%',
        overflow: 'visible',
        transform: 'none',
        preserveAspectRatio: 'none',
      };

      return (
        <div
          key={shape.id}
          className={`shape-element ${isActive ? 'active' : ''}`}
          style={containerStyle}
          onPointerDown={(e) => startDragging('shape', shape.id, e)}
          onTouchStart={(e) => handleTouchZoom('shape', shape.id, e)}
          onTouchMove={handleTouchMove}
          onPointerMove={handleDrag}
          onPointerUp={stopDragging}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => handleElementClick('shape', shape.id, e)}
          onDoubleClick={(e) => handleDoubleClick('shape', shape.id, e)}
          onWheel={(e) => {
            if (e.ctrlKey) {
              handleMouseWheelRotation(e);
            } else {
              const delta = e.deltaY > 0 ? -0.05 : 0.05;
              updateShapeProperties(shape.id, {
                width: Math.max(20, shape.width * (1 + delta)),
                height: Math.max(20, shape.height * (1 + delta)),
              });
            }
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox={viewBox}
            preserveAspectRatio="none"
            style={svgStyle}
          >
            {gradientDefs}
            <path
              d={shapePath}
              fill={shape.fillColor === 'none' ? 'transparent' : effectiveFillColor.includes('gradient') ? `url(#${fillGradientId})` : effectiveFillColor}
              stroke={shape.outlineWidth === 0 ? 'none' : effectiveOutlineColor.includes('gradient') ? `url(#${strokeGradientId})` : effectiveOutlineColor}
              strokeWidth={shape.outlineWidth || 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              markerStart={isLineShape && shape.shapeType === 'double-arrow' ? 'url(#arrow)' : ''}
              markerEnd={isLineShape && ['arrow', 'double-arrow'].includes(shape.shapeType) ? 'url(#arrow)' : ''}
            />
            {isLineShape && (
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path
                    d="M 0 0 L 10 5 L 0 10 Z"
                    fill={effectiveOutlineColor.includes('gradient') ? `url(#${strokeGradientId})` : effectiveOutlineColor}
                  />
                </marker>
              </defs>
            )}
          </svg>

          {isActive && (
            <>
              {/* Rotation handle */}
              <div
                style={{
                  position: 'absolute',
                  top: `-${shape.height / 5 + 8}px`,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '12px',
                  height: '12px',
                  backgroundColor: '#ffffff',
                  border: '2px solid #4285f4',
                  borderRadius: '50%',
                  cursor: 'crosshair',
                  zIndex: 10,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  startRotation('shape', shape.id, e);
                }}
                onPointerMove={handleRotation}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  stopRotation();
                }}
              />
              
              {/* Resize handles */}
              {[
                { id: 'nw', left: 0, top: 0, cursor: 'nwse-resize' },
                { id: 'ne', left: '100%', top: 0, cursor: 'nesw-resize' },
                { id: 'sw', left: 0, top: '100%', cursor: 'nesw-resize' },
                { id: 'se', left: '100%', top: '100%', cursor: 'nwse-resize' },
                { id: 'n', left: '50%', top: 0, cursor: 'ns-resize' },
                { id: 's', left: '50%', top: '100%', cursor: 'ns-resize' },
                { id: 'w', left: 0, top: '50%', cursor: 'ew-resize' },
                { id: 'e', left: '100%', top: '50%', cursor: 'ew-resize' },
              ].map((handle) => (
                <div
                  key={handle.id}
                  style={{
                    position: 'absolute',
                    left: handle.left,
                    top: handle.top,
                    transform: 'translate(-50%, -50%)',
                    width: '5px',
                    height: '5px',
                    backgroundColor: '#ffffff',
                    border: '0.1px solid #4285f4',
                    borderRadius: '2px',
                    cursor: handle.cursor,
                    zIndex: 10,
                  
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.target.dataset.initialWidth = shape.width;
                    e.target.dataset.initialHeight = shape.height;
                    e.target.dataset.clientX = e.clientX;
                    e.target.dataset.clientY = e.clientY;
                    e.target.dataset.handleId = handle.id;
                  }}
                  onPointerMove={(e) => {
                    if (e.buttons === 1) {
                      const handleId = e.target.dataset.handleId;
                      const initialWidth = parseFloat(e.target.dataset.initialWidth);
                      const initialHeight = parseFloat(e.target.dataset.initialHeight);
                      const startX = parseFloat(e.target.dataset.clientX);
                      const startY = parseFloat(e.target.dataset.clientY);
                      
                      const deltaX = e.clientX - startX;
                      const deltaY = e.clientY - startY;
                      
                      let newWidth = initialWidth;
                      let newHeight = initialHeight;
                      
                      switch (handleId) {
                        case 'nw':
                          newWidth = Math.max(20, initialWidth - deltaX * 2);
                          newHeight = Math.max(20, initialHeight - deltaY * 2);
                          break;
                        case 'ne':
                          newWidth = Math.max(20, initialWidth + deltaX * 2);
                          newHeight = Math.max(20, initialHeight - deltaY * 2);
                          break;
                        case 'sw':
                          newWidth = Math.max(20, initialWidth - deltaX * 2);
                          newHeight = Math.max(20, initialHeight + deltaY * 2);
                          break;
                        case 'se':
                          newWidth = Math.max(20, initialWidth + deltaX * 2);
                          newHeight = Math.max(20, initialHeight + deltaY * 2);
                          break;
                        case 'n':
                          newHeight = Math.max(20, initialHeight - deltaY * 2);
                          break;
                        case 's':
                          newHeight = Math.max(20, initialHeight + deltaY * 2);
                          break;
                        case 'w':
                          newWidth = Math.max(20, initialWidth - deltaX * 2);
                          break;
                        case 'e':
                          newWidth = Math.max(20, initialWidth + deltaX * 2);
                          break;
                      }
                      
                      updateShapeProperties(shape.id, {
                        width: newWidth,
                        height: newHeight,
                      });
                    }
                  }}
                />
              ))}
              
              {/* Bounding box */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  border: '0.1px dashed #4285f4',
                  pointerEvents: 'none',
                  borderRadius: shape.shapeType === 'circle' ? '50%' : '0',
                }}
              />
            </>
          )}
        </div>
      );
    });
  }, [
    shapes,
    activeElement,
    dragging,
    isRotating,
    isCropping,
    handleDrag,
    handleTouchMove,
    handleTouchEnd,
    startDragging,
    stopDragging,
    startRotation,
    handleRotation,
    stopRotation,
    handleElementClick,
    handleDoubleClick,
    handleMouseWheelRotation,
    handleTouchZoom,
    updateShapeProperties,
    applyGradient,
    fillColor,
    outlineColor,
  ]);

  return <>{renderShapes()}</>;
};