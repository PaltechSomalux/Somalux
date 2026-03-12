import React, { useCallback } from 'react';
import "./Memes.css";
export const MemeEmojiElements = ({
  emojis,
  activeElement,
  dragging,
  isRotating,
  isCropping,
  handleDrag,
  handleTouchMove,
  handleTouchEnd,
  handleEmojiZoom,
  startDragging,
  stopDragging,
  startRotation,
  handleRotation,
  stopRotation,
  handleElementClick,
  handleDoubleClick,
  handleMouseWheelRotation,
  handleTouchZoom,
}) => {
  const renderEmojis = useCallback(() => {
    return emojis.map((emoji) => {
      return (
        <div
          key={emoji.id}
          className={`emoji-element ${activeElement.type === 'emoji' && activeElement.id === emoji.id ? 'active' : ''}`}
          style={{
            position: 'absolute',
            left: `${emoji.x}px`,
            top: `${emoji.y}px`,
            fontSize: `${emoji.size}px`,
            cursor: dragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            transform: `translate(-50%, -50%) rotate(${emoji.rotation}deg)`,
            transformOrigin: 'center center',
            touchAction: 'none',
            willChange: 'left, top, transform',
            transition: dragging || isRotating ? 'none' : 'left 0.05s, top 0.05s, transform 0.05s',
            pointerEvents: isCropping ? 'none' : 'auto',
          }}
          onPointerDown={(e) => startDragging('emoji', emoji.id, e)}
          onTouchStart={(e) => {
            handleTouchZoom('emoji', emoji.id, e);
          }}
          onTouchMove={handleTouchMove}
          onPointerMove={handleDrag}
          onPointerUp={stopDragging}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => handleElementClick('emoji', emoji.id, e)}
          onDoubleClick={(e) => handleDoubleClick('emoji', emoji.id, e)}
          onWheel={(e) => {
            handleEmojiZoom(emoji.id, e);
            if (e.ctrlKey) {
              handleMouseWheelRotation(e);
            }
          }}
        >
          {emoji.emoji}
          {activeElement.type === 'emoji' && activeElement.id === emoji.id && (
            <div
              className="rotation-handle"
              onPointerDown={(e) => startRotation('emoji', emoji.id, e)}
              onTouchStart={(e) => startRotation('emoji', emoji.id, e)}
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
                background: '#007bff',
                borderRadius: '50%',
                cursor: 'pointer',
                boxShadow: '0 0 4px rgba(0, 0, 0, 0.3)',
              }}
            />
          )}
        </div>
      );
    });
  }, [
    emojis,
    activeElement,
    dragging,
    isRotating,
    isCropping,
    handleDrag,
    handleTouchMove,
    handleTouchEnd,
    handleEmojiZoom,
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

  return renderEmojis();
};