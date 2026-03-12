import React, { useCallback } from 'react';
import './Memes.css';

const SHAPES = [
  'rectangle', 'square', 'circle', 'oval', 'triangle', 'pentagon', 'hexagon', 'heptagon', 'octagon',
  'trapezoid', 'parallelogram', 'diamond', 'crescent', 'lightning', 'cross', 'heart',
  'line', 'line-arrow', 'line-double-arrow', 'callout-circle-arrow', 'callout-rectangle', 'callout-rounded-rectangle'
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
}) => {
  const renderShapes = useCallback(() => {
    return shapes.map((shape) => {
      // Common base style for the container div
      const baseStyle = {
        position: 'absolute',
        left: `${shape.x}px`,
        top: `${shape.y}px`,
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        transform: `translate(-50%, -50%) rotate(${shape.rotation}deg)`,
        transformOrigin: 'center center',
        touchAction: 'none',
        willChange: 'left, top, transform',
        transition: dragging || isRotating ? 'none' : 'left 0.05s, top 0.05s, transform 0.05s',
        pointerEvents: isCropping ? 'none' : 'auto',
        width: `${shape.width}px`,
        height: `${shape.height}px`,
      };

      // SVG rendering for shapes
      let shapePath = '';
      let isLineShape = ['line', 'line-arrow', 'line-double-arrow'].includes(shape.shapeType);
      const viewBox = isLineShape ? '0 0 100 20' : '0 0 100 100'; // Adjust viewBox for line shapes

      switch (shape.shapeType) {
        case 'rectangle':
        case 'square':
          shapePath = 'M0,0 H100 V100 H0 Z';
          break;
        case 'circle':
        case 'oval':
          shapePath = 'M50,50 A25,25 0 1,1 50,49.999 Z'; // Circle with slight adjustment to close path
          break;
        case 'triangle':
          shapePath = 'M50,0 L100,100 L0,100 Z';
          break;
        case 'pentagon':
          shapePath = 'M50,0 L100,38 L82,100 L18,100 L0,38 Z';
          break;
        case 'hexagon':
          shapePath = 'M25,0 L75,0 L100,50 L75,100 L25,100 L0,50 Z';
          break;
        case 'heptagon':
          shapePath = 'M50,0 L90,20 L100,60 L75,100 L25,100 L0,60 L10,20 Z';
          break;
        case 'octagon':
          shapePath = 'M30,0 L70,0 L100,30 L100,70 L70,100 L30,100 L0,70 L0,30 Z';
          break;
        case 'trapezoid':
          shapePath = 'M20,0 L80,0 L100,100 L0,100 Z';
          break;
        case 'parallelogram':
          shapePath = 'M25,0 L75,0 L100,100 L0,100 Z';
          break;
        case 'diamond':
          shapePath = 'M50,0 L100,50 L50,100 L0,50 Z';
          break;
        case 'crescent':
          shapePath = 'M50,0 A50,50 0 0,1 50,100 A30,40 0 0,0 50,0 Z';
          break;
        case 'lightning':
          shapePath = 'M40,0 L70,30 L50,30 L80,70 L50,40 L30,40 L60,100 L20,50 Z';
          break;
        case 'cross':
          shapePath = 'M40,0 H60 V40 H100 V60 H60 V100 H40 V60 H0 V40 H40 Z';
          break;
        case 'heart':
          shapePath = 'M50,30 Q60,10 80,30 Q100,10 100,30 Q100,60 50,100 Q0,60 0,30 Q0,10 20,30 Q40,10 50,30 Z';
          break;
        case 'line':
          shapePath = 'M0,10 H100';
          break;
        case 'line-arrow':
          shapePath = 'M0,10 H100 M100,10 L90,15 M100,10 L90,5';
          break;
        case 'line-double-arrow':
          shapePath = 'M0,10 H100 M0,10 L10,15 M0,10 L10,5 M100,10 L90,15 M100,10 L90,5';
          break;
        case 'callout-circle-arrow':
          shapePath = 'M50,50 A20,20 0 1,1 50,49.999 M50,70 L40,90 L60,90 Z';
          break;
        case 'callout-rectangle':
          shapePath = 'M20,20 H80 V80 H20 Z M50,80 L40,100 L60,100 Z';
          break;
        case 'callout-rounded-rectangle':
          shapePath = 'M30,20 A10,10 0 0,1 20,30 V70 A10,10 0 0,1 30,80 H50 L40,100 L60,100 H70 A10,10 0 0,1 80,70 V30 A10,10 0 0,1 70,20 Z';
          break;
        default:
          shapePath = 'M0,0 H100 V100 H0 Z'; // Fallback to rectangle
      }

      return (
        <div
          key={shape.id}
          className={`shape-element ${activeElement.type === 'shape' && activeElement.id === shape.id ? 'active' : ''}`}
          style={baseStyle}
          onPointerDown={(e) => startDragging('shape', shape.id, e)}
          onTouchStart={(e) => handleTouchZoom('shape', shape.id, e)}
          onTouchMove={handleTouchMove}
          onPointerMove={handleDrag}
          onPointerUp={stopDragging}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => handleElementClick('shape', shape.id, e)}
          onDoubleClick={(e) => handleDoubleClick('shape', shape.id, e)}
          onWheel={(e) => {
            handleShapeResize(shape.id, e);
            if (e.ctrlKey) {
              handleMouseWheelRotation(e);
            }
          }}
          role="img"
          aria-label={`Shape: ${shape.shapeType}`}
        >
          <svg
            width={shape.width}
            height={shape.height}
            viewBox={viewBox}
            preserveAspectRatio={isLineShape ? 'none' : 'xMidYMid meet'}
            style={{
              width: '100%',
              height: '100%',
              pointerEvents: 'none', // Prevent SVG from capturing pointer events
            }}
          >
            <path
              d={shapePath}
              fill={shape.fillColor === 'none' ? 'transparent' : shape.fillColor || '#ff0000'}
              stroke={shape.outlineWidth === 0 ? 'none' : shape.outlineColor || '#000000'}
              strokeWidth={shape.outlineWidth || 1}
            />
          </svg>
          {activeElement.type === 'shape' && activeElement.id === shape.id && (
            <>
              <div
                className="rotation-handle"
                onPointerDown={(e) => startRotation('shape', shape.id, e)}
                onTouchStart={(e) => startRotation('shape', shape.id, e)}
                onPointerMove={handleRotation}
                onTouchMove={handleRotation}
                onPointerUp={stopRotation}
                onTouchEnd={stopRotation}
                style={{
                  position: 'absolute',
                  top: '-20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '16px',
                  height: '16px',
                  background: '#00a884',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  boxShadow: '0 0 4px rgba(0, 0, 0, 0.3)',
                  zIndex: 10,
                }}
              />
              {/* Resize handles */}
              {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => (
                <div
                  key={corner}
                  className={`crop-handle ${corner}`}
                  style={{
                    position: 'absolute',
                    width: '12px',
                    height: '12px',
                    background: '#00a884',
                    borderRadius: '50%',
                    zIndex: 10,
                    top: corner.includes('top') ? '-6px' : undefined,
                    bottom: corner.includes('bottom') ? '-6px' : undefined,
                    left: corner.includes('left') ? '-6px' : undefined,
                    right: corner.includes('right') ? '-6px' : undefined,
                    cursor: corner === 'top-left' || corner === 'bottom-right' ? 'nwse-resize' : 'nesw-resize',
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    startDragging('shape', shape.id, e, corner);
                  }}
                />
              ))}
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
  ]);

  return <>{renderShapes()}</>;
};