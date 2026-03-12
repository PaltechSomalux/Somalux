import React, { useCallback } from 'react';

export const MemePhotoElements = ({
  photos,
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
  updatePhotoProperties,
}) => {
  const renderPhotos = useCallback(() => {
    return photos.map((photo) => {
      const isActive = activeElement.type === 'photo' && activeElement.id === photo.id;

      const containerStyle = {
        position: 'absolute',
        left: `${photo.x}px`,
        top: `${photo.y}px`,
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        transform: `translate(-50%, -50%) rotate(${photo.rotation}deg)`,
        transformOrigin: 'center center',
        touchAction: 'none',
        willChange: 'transform, width, height',
        transition: 'none',
        pointerEvents: isCropping ? 'none' : 'auto',
        width: `${photo.width}px`,
        height: `${photo.height}px`,
        overflow: 'hidden', // Ensures the image doesn't overflow the container
      };

      const imageStyle = {
        width: '100%',
        height: '100%',
        objectFit: 'cover', // Makes the image fill the container while maintaining aspect ratio
        opacity: photo.opacity || 1,
        filter: `brightness(${photo.brightness * 100 || 100}%)`,
      };

      return (
        <div
          key={photo.id}
          className={`photo-element ${isActive ? 'active' : ''}`}
          style={containerStyle}
          onPointerDown={(e) => startDragging('photo', photo.id, e)}
          onTouchStart={(e) => handleTouchZoom('photo', photo.id, e)}
          onTouchMove={handleTouchMove}
          onPointerMove={handleDrag}
          onPointerUp={stopDragging}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => handleElementClick('photo', photo.id, e)}
          onDoubleClick={(e) => handleDoubleClick('photo', photo.id, e)}
          onWheel={(e) => {
            if (e.ctrlKey) {
              handleMouseWheelRotation(e);
            } else {
              const delta = e.deltaY > 0 ? -0.05 : 0.05;
              updatePhotoProperties(photo.id, { 
                width: Math.max(20, photo.width * (1 + delta)), 
                height: Math.max(20, photo.height * (1 + delta)) 
              });
            }
          }}
        >
          <img
            src={photo.src}
            alt="Overlay photo"
            style={imageStyle}
          />

          {isActive && (
            <>
              <div
                className="rotation-handle"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  startRotation('photo', photo.id, e);
                }}
                onPointerMove={handleRotation}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  stopRotation();
                }}
                style={{
                  position: 'absolute',
                  top: `-${photo.height / 5 + 8}px`,
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
              />
              
              {['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'].map((handle) => {
                const handleStyle = {
                  position: 'absolute',
                  width: '10px',
                  height: '10px',
                  backgroundColor: '#ffffff',
                  border: '2px solid #4285f4',
                  borderRadius: '2px',
                  zIndex: 10,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  transform: 'translate(-50%, -50%)',
                };

                if (handle === 'nw') {
                  handleStyle.left = 0;
                  handleStyle.top = 0;
                  handleStyle.cursor = 'nwse-resize';
                } else if (handle === 'ne') {
                  handleStyle.left = '100%';
                  handleStyle.top = 0;
                  handleStyle.cursor = 'nesw-resize';
                } else if (handle === 'sw') {
                  handleStyle.left = 0;
                  handleStyle.top = '100%';
                  handleStyle.cursor = 'nesw-resize';
                } else if (handle === 'se') {
                  handleStyle.left = '100%';
                  handleStyle.top = '100%';
                  handleStyle.cursor = 'nwse-resize';
                } else if (handle === 'n') {
                  handleStyle.left = '50%';
                  handleStyle.top = 0;
                  handleStyle.cursor = 'ns-resize';
                } else if (handle === 's') {
                  handleStyle.left = '50%';
                  handleStyle.top = '100%';
                  handleStyle.cursor = 'ns-resize';
                } else if (handle === 'w') {
                  handleStyle.left = 0;
                  handleStyle.top = '50%';
                  handleStyle.cursor = 'ew-resize';
                } else if (handle === 'e') {
                  handleStyle.left = '100%';
                  handleStyle.top = '50%';
                  handleStyle.cursor = 'ew-resize';
                }

                return (
                  <div
                    key={handle}
                    style={handleStyle}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.target.dataset.initialWidth = photo.width;
                      e.target.dataset.initialHeight = photo.height;
                      e.target.dataset.clientX = e.clientX;
                      e.target.dataset.clientY = e.clientY;
                      e.target.dataset.handleId = handle;
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
                        
                        updatePhotoProperties(photo.id, { 
                          width: newWidth, 
                          height: newHeight 
                        });
                      }
                    }}
                  />
                );
              })}
              
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  border: '2px dashed #4285f4',
                  pointerEvents: 'none',
                }}
              />
            </>
          )}
        </div>
      );
    });
  }, [
    photos,
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
    updatePhotoProperties,
  ]);

  return <>{renderPhotos()}</>;
}; 