import React, { useCallback } from 'react';
import './Memes.css';

const SHAPES = [
  'rectangle', 'rounded-rectangle', 'banner', 'arrow', 'double-arrow', 'circle', 'line',
  'flowchart-terminator', 'flowchart-preparation', 'speech-bubble-oval',
  'speech-bubble-rounded-rectangle', 'speech-bubble-rectangle',
  'ribbon-curved', 'double-wave', 'wave', 'scroll-horizontal', 'gothic-arch'
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
  applyGradient,
  fillColor,
  outlineColor,
}) => {
  const renderShapes = useCallback(() => {
    return shapes.map((shape) => {
      const isActive = activeElement.type === 'shape' && activeElement.id === shape.id;
      const isLineShape = ['line', 'arrow', 'double-arrow'].includes(shape.shapeType);
      // Adjust viewBox for complex shapes to ensure they fill the container
      const viewBox = isLineShape ? '0 0 100 20' : '0 0 100 100';

      const fillGradientId = `fill-gradient-${shape.id}`;
      const strokeGradientId = `stroke-gradient-${shape.id}`;

      const effectiveFillColor = shape.fillColor || fillColor || '#ff0000';
      const effectiveOutlineColor = shape.outlineColor || outlineColor || '#000000';

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

      let shapePath = '';
      // Adjust viewBox for shapes with protruding elements
      const needsExtendedViewBox = [
        'speech-bubble-oval',
        'speech-bubble-rounded-rectangle',
        'speech-bubble-rectangle',
        'ribbon-curved',
        'callout',
      ].includes(shape.shapeType);
      const extendedViewBox = needsExtendedViewBox ? '0 0 100 120' : viewBox;

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
        case 'arrow':
          shapePath = 'M0,10 H100 M100,10 L90,15 M100,10 L90,5';
          break;
        case 'double-arrow':
          shapePath = 'M0,10 H100 M0,10 L10,15 M0,10 L10,5 M100,10 L90,15 M100,10 L90,5';
          break;
        case 'circle':
          shapePath = 'M50,0 A50,50 0 1,1 50,100 A50,50 0 1,1 50,0 Z';
          break;
        case 'line':
          shapePath = 'M0,10 H100';
          break;
        case 'flowchart-terminator':
          shapePath = 'M20,0 H80 A20,50 0 0,1 100,50 A20,50 0 0,1 80,100 H20 A20,50 0 0,1 0,50 A20,50 0 0,1 20,0 Z';
          break;
        case 'flowchart-preparation':
          shapePath = 'M25,0 L75,0 A25,25 0 0,1 100,25 V75 A25,25 0 0,1 75,100 L25,100 A25,25 0 0,1 0,75 V25 A25,25 0 0,1 25,0 Z';
          break;
        case 'speech-bubble-oval':
          shapePath = 'M20,0 H80 A30,50 0 0,1 100,50 A30,50 0 0,1 80,100 H20 A30,50 0 0,1 0,50 A30,50 0 0,1 20,0 Z M50,100 L40,120 L60,120 Z';
          break;
        case 'speech-bubble-rounded-rectangle':
          shapePath = 'M20,0 H80 A20,20 0 0,1 100,20 V60 A20,20 0 0,1 80,80 H60 L40,100 L40,80 H20 A20,20 0 0,1 0,60 V20 A20,20 0 0,1 20,0 Z';
          break;
        case 'speech-bubble-rectangle':
          shapePath = 'M0,0 H100 V80 H60 L40,100 L40,80 H0 Z';
          break;
        case 'ribbon-curved':
          shapePath = 'M0,20 Q50,0 100,20 V80 Q50,100 0,80 Z M0,20 L30,40 L0,60 M100,20 L70,40 L100,60';
          break;
        case 'double-wave':
          shapePath = 'M0,30 Q25,10 50,30 Q75,50 100,30 V70 Q75,90 50,70 Q25,50 0,70 Z';
          break;
        case 'wave':
          shapePath = 'M0,80 Q25,60 50,80 Q75,100 100,80 V100 H0 Z';
          break;
        case 'scroll-horizontal':
          shapePath = 'M20,0 H80 A20,20 0 0,1 100,20 Q90,40 100,60 A20,20 0 0,1 80,80 H20 A20,20 0 0,1 0,60 Q10,40 0,20 A20,20 0 0,1 20,0 Z';
          break;
        case 'gothic-arch':
          shapePath = 'M0,100 H40 A60,60 0 0,1 50,0 A60,60 0 0,1 60,100 H100 V100 H0 Z';
          break;
        default:
          shapePath = 'M0,0 H100 V100 H0 Z';
      }

      const containerStyle = {
        position: 'absolute',
        left: `${shape.x}px`,
        top: `${shape.y}px`,
        cursor: dragging ? 'grabbing' : isRotating ? 'grabbing' : 'grab',
        userSelect: 'none',
        transform: `translate(-50%, -50%) rotate(${shape.rotation || 0}deg)`,
        transformOrigin: 'center center',
        touchAction: 'none',
        willChange: 'transform, width, height',
        transition: dragging || isRotating ? 'none' : 'left 0.05s, top 0.05s, transform 0.05s',
        pointerEvents: isCropping ? 'none' : 'auto',
        width: `${shape.width}px`,
        height: `${shape.height}px`,
        overflow: 'visible',
      };

      const svgStyle = {
        width: '100%',
        height: '100%',
        overflow: 'visible',
        preserveAspectRatio: 'none',
      };

      return (
        <div
          key={shape.id}
          className={`meme-element shape-element ${isActive ? 'active' : ''}`}
          style={containerStyle}
          onPointerDown={(e) => {
            handleElementClick('shape', shape.id, e);
            startDragging('shape', shape.id, e);
          }}
          onTouchStart={(e) => {
            handleElementClick('shape', shape.id, e);
            startDragging('shape', shape.id, e);
            handleTouchZoom('shape', shape.id, e);
          }}
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
            viewBox={extendedViewBox}
            style={svgStyle}
            aria-label={`Shape: ${shape.shapeType}`}
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
            />
            {isLineShape && (
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 Z" fill={effectiveOutlineColor.includes('gradient') ? `url(#${strokeGradientId})` : effectiveOutlineColor} />
                </marker>
              </defs>
            )}
          </svg>

          {isActive && (
            <>
              <div
                className="rotation-handle"
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
                onTouchStart={(e) => {
                  e.stopPropagation();
                  startRotation('shape', shape.id, e);
                }}
                onPointerMove={handleRotation}
                onTouchMove={handleRotation}
                onPointerUp={stopRotation}
                onTouchEnd={stopRotation}
                aria-label="Rotate shape"
              />
              {[
                { id: 'nw', left: '0%', top: '0%', cursor: 'nwse-resize' },
                { id: 'ne', left: '100%', top: '0%', cursor: 'nesw-resize' },
                { id: 'sw', left: '0%', top: '100%', cursor: 'nesw-resize' },
                { id: 'se', left: '100%', top: '100%', cursor: 'nwse-resize' },
                { id: 'n', left: '50%', top: '0%', cursor: 'ns-resize' },
                { id: 's', left: '50%', top: '100%', cursor: 'ns-resize' },
                { id: 'w', left: '0%', top: '50%', cursor: 'ew-resize' },
                { id: 'e', left: '100%', top: '50%', cursor: 'ew-resize' },
              ].map((handle) => (
                <div
                  key={handle.id}
                  className="resize-handle"
                  style={{
                    position: 'absolute',
                    left: handle.left,
                    top: handle.top,
                    transform: 'translate(-50%, -50%)',
                    width: '10px',
                    height: '10px',
                    backgroundColor: '#ffffff',
                    border: '2px solid #4285f4',
                    borderRadius: '2px',
                    cursor: handle.cursor,
                    zIndex: 10,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
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
                  onPointerUp={stopDragging}
                  onTouchEnd={stopDragging}
                  aria-label={`Resize shape ${handle.id}`}
                />
              ))}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  border: '2px dashed #4285f4',
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