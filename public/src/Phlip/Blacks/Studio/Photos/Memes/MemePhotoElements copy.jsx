import React, { useCallback, useState } from 'react';

export const MemePhotoElements = ({
  photos,
  activeElement,
  handleDrag,
  startDragging,
  stopDragging,
  handleElementClick,
  updatePhotoProperties,
}) => {
  const [croppingPhotoId, setCroppingPhotoId] = useState(null);

  const renderPhotos = useCallback(() => {
    return photos.map((photo) => {
      const isActive = activeElement.type === 'photo' && activeElement.id === photo.id;
      const aspectRatio = photo.aspectRatio || photo.width / photo.height;

      const containerStyle = {
        position: 'absolute',
        left: `${photo.x}px`,
        top: `${photo.y}px`,
        cursor: isActive ? 'move' : 'default', // Mimics Publisher’s move cursor when selected
        userSelect: 'none',
        transform: 'translate(-50%, -50%)',
        willChange: 'transform, width, height',
        transition: 'none',
        width: `${photo.width}px`,
        height: `${photo.height}px`,
        overflow: 'hidden',
        margin: 0,
        padding: 0,
      };

      const imageStyle = {
        width: '100%',
        height: '100%',
        objectFit: 'fill', // Ensures image fills the container/boundary box
        opacity: photo.opacity || 1,
        filter: `brightness(${photo.brightness * 100 || 100}%)`,
      };

      // Publisher-like contextual controls (Corrections, Recolor, Reset)
      const handleContextMenu = (e) => {
        e.preventDefault();
        if (isActive) {
          // Simulate Publisher’s contextual menu with simplified actions
          const action = prompt(
            'Choose an action: \n1. Adjust Brightness (+10%)\n2. Adjust Brightness (-10%)\n3. Recolor (Grayscale)\n4. Reset',
            '1'
          );
          if (action === '1') {
            updatePhotoProperties(photo.id, { brightness: (photo.brightness || 1) + 0.1 });
          } else if (action === '2') {
            updatePhotoProperties(photo.id, { brightness: (photo.brightness || 1) - 0.1 });
          } else if (action === '3') {
            updatePhotoProperties(photo.id, { filter: 'grayscale(100%)' });
          } else if (action === '4') {
            updatePhotoProperties(photo.id, { brightness: 1, filter: 'none' });
          }
        }
      };

      // Crop handler
      const handleCrop = () => {
        setCroppingPhotoId(croppingPhotoId === photo.id ? null : photo.id);
        // In a real implementation, toggle a cropping UI (e.g., adjustable crop rectangle)
        alert(`Crop mode ${croppingPhotoId === photo.id ? 'deactivated' : 'activated'} for photo ${photo.id}`);
      };

      return (
        <div
          key={photo.id}
          className={`photo-element ${isActive ? 'active' : ''}`}
          style={containerStyle}
          onPointerDown={(e) => {
            handleElementClick('photo', photo.id, e); // Select the photo
            startDragging('photo', photo.id, e); // Enable drag
          }}
          onPointerMove={handleDrag}
          onPointerUp={stopDragging}
          onContextMenu={handleContextMenu} // Publisher-like right-click menu
        >
          <img src={photo.src} alt="Overlay photo" style={imageStyle} />

          {isActive && (
            <>
              {/* Crop Button (Publisher-like) */}
              <button
                style={{
                  position: 'absolute',
                  top: '-30px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '2px 8px',
                  fontSize: '12px',
                  backgroundColor: '#4285f4',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  zIndex: 10,
                }}
                onClick={handleCrop}
              >
                {croppingPhotoId === photo.id ? 'Stop Crop' : 'Crop'}
              </button>

              {/* Resize Handles (Publisher-like: corners for proportional, edges for freeform) */}
              {['nw', 'ne', 'sw', 'se', 'n', 's', 'w', 'e'].map((handle) => {
                const handleStyle = {
                  position: 'absolute',
                  width: '8px', // Larger for usability, like Publisher
                  height: '8px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #4285f4', // Thicker border for visibility
                  borderRadius: '2px',
                  zIndex: 10,
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

                        // Corner handles maintain aspect ratio (Publisher default)
                        if (['nw', 'ne', 'sw', 'se'].includes(handleId)) {
                          newWidth = Math.max(20, initialWidth + (handleId === 'nw' || handleId === 'sw' ? -deltaX : deltaX) * 2);
                          newHeight = Math.max(20, newWidth / aspectRatio);
                        }
                        // Edge handles allow freeform resizing (Publisher flexibility)
                        else if (handleId === 'n' || handleId === 's') {
                          newHeight = Math.max(20, initialHeight + (handleId === 'n' ? -deltaY : deltaY) * 2);
                        } else if (handleId === 'w' || handleId === 'e') {
                          newWidth = Math.max(20, initialWidth + (handleId === 'w' ? -deltaX : deltaX) * 2);
                        }

                        updatePhotoProperties(photo.id, {
                          width: newWidth,
                          height: newHeight,
                        });
                      }
                    }}
                  />
                );
              })}

              {/* Boundary Box */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  border: '1px dashed #4285f4',
                  pointerEvents: 'none',
                  boxSizing: 'border-box',
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
    handleDrag,
    startDragging,
    stopDragging,
    handleElementClick,
    updatePhotoProperties,
  ]);

  return <>{renderPhotos()}</>;
};