import React, { useCallback } from 'react';

export const SportsTextElements = ({
  texts,
  setTexts,
  activeElement,
  isEditing,
  textStyles,
  textColor = '#ff0000',
  strokeColor,
  fontFamily,
  dragging,
  isRotating,
  isCropping,
  handleDrag,
  handleTouchMove,
  handleTouchEnd,
  handleTextZoom,
  startDragging,
  stopDragging,
  startRotation,
  handleRotation,
  stopRotation,
  handleElementClick,
  handleDoubleClick,
  startLongPress,
  handleMouseWheelRotation,
  handleTextBlur,
  handleTextKeyDown,
  textInputRef,
  updateText,
  handleTouchZoom,
  updateTextProperties,
}) => {
  // Map underline styles to CSS text-decoration or custom styles
  const getTextDecoration = useCallback((underlineStyle) => {
    switch (underlineStyle) {
      case 'none':
        return 'none';
      case 'single':
      case 'thick':
        return 'underline';
      case 'double':
        return 'underline double';
      case 'dotted':
        return 'underline dotted';
      case 'dashed':
        return 'underline dashed';
      case 'wave':
        return 'underline wavy';
      case 'dash-dot':
      case 'dash-dot-dot':
      case 'double-wave':
      case 'heavy-wave':
      case 'long-dash':
      case 'thick-dash':
      case 'thick-dotted':
      case 'thick-dash-dot':
      case 'thick-dash-dot-dot':
        return 'none';
      default:
        return 'none';
    }
  }, []);

  // Get custom underline styles for unsupported CSS text-decoration values
  const getCustomUnderlineStyle = useCallback((underlineStyle, fontSize, color) => {
    const lineWidth = fontSize / 20;
    const thickLineWidth = fontSize / 10;
    const underlineY = fontSize / 2 + lineWidth;

    switch (underlineStyle) {
      case 'dash-dot':
        return {
          backgroundImage: `repeating-linear-gradient(to right, ${color} 0px, ${color} ${lineWidth * 3}px, transparent ${lineWidth * 3}px, transparent ${lineWidth * 4}px, ${color} ${lineWidth * 4}px, ${color} ${lineWidth * 5}px)`,
          backgroundSize: `100% ${lineWidth}px`,
          backgroundPosition: `0 ${underlineY}px`,
          backgroundRepeat: 'no-repeat',
        };
      case 'dash-dot-dot':
        return {
          backgroundImage: `repeating-linear-gradient(to right, ${color} 0px, ${color} ${lineWidth * 3}px, transparent ${lineWidth * 3}px, transparent ${lineWidth * 4}px, ${color} ${lineWidth * 4}px, ${color} ${lineWidth * 5}px, transparent ${lineWidth * 5}px, transparent ${lineWidth * 6}px, ${color} ${lineWidth * 6}px, ${color} ${lineWidth * 7}px)`,
          backgroundSize: `100% ${lineWidth}px`,
          backgroundPosition: `0 ${underlineY}px`,
          backgroundRepeat: 'no-repeat',
        };
      case 'double-wave':
      case 'wave':
      case 'heavy-wave':
        return {};
      case 'long-dash':
        return {
          backgroundImage: `repeating-linear-gradient(to right, ${color} 0px, ${color} ${lineWidth * 6}px, transparent ${lineWidth * 6}px, transparent ${lineWidth * 8}px)`,
          backgroundSize: `100% ${lineWidth}px`,
          backgroundPosition: `0 ${underlineY}px`,
          backgroundRepeat: 'no-repeat',
        };
      case 'thick':
        return {
          borderBottom: `${thickLineWidth}px solid ${color}`,
          position: 'relative',
          top: `${underlineY}px`,
        };
      case 'thick-dash':
        return {
          backgroundImage: `repeating-linear-gradient(to right, ${color} 0px, ${color} ${lineWidth * 3}px, transparent ${lineWidth * 3}px, transparent ${lineWidth * 5}px)`,
          backgroundSize: `100% ${thickLineWidth}px`,
          backgroundPosition: `0 ${underlineY}px`,
          backgroundRepeat: 'no-repeat',
        };
      case 'thick-dotted':
        return {
          backgroundImage: `repeating-linear-gradient(to right, ${color} 0px, ${color} ${lineWidth}px, transparent ${lineWidth}px, transparent ${lineWidth * 2}px)`,
          backgroundSize: `100% ${thickLineWidth}px`,
          backgroundPosition: `0 ${underlineY}px`,
          backgroundRepeat: 'no-repeat',
        };
      case 'thick-dash-dot':
        return {
          backgroundImage: `repeating-linear-gradient(to right, ${color} 0px, ${color} ${lineWidth * 3}px, transparent ${lineWidth * 3}px, transparent ${lineWidth * 4}px, ${color} ${lineWidth * 4}px, ${color} ${lineWidth * 5}px)`,
          backgroundSize: `100% ${thickLineWidth}px`,
          backgroundPosition: `0 ${underlineY}px`,
          backgroundRepeat: 'no-repeat',
        };
      case 'thick-dash-dot-dot':
        return {
          backgroundImage: `repeating-linear-gradient(to right, ${color} 0px, ${color} ${lineWidth * 3}px, transparent ${lineWidth * 3}px, transparent ${lineWidth * 4}px, ${color} ${lineWidth * 4}px, ${color} ${lineWidth * 5}px, transparent ${lineWidth * 5}px, transparent ${lineWidth * 6}px, ${color} ${lineWidth * 6}px, ${color} ${lineWidth * 7}px)`,
          backgroundSize: `100% ${thickLineWidth}px`,
          backgroundPosition: `0 ${underlineY}px`,
          backgroundRepeat: 'no-repeat',
        };
      default:
        return {};
    }
  }, []);

  // Measure text width and height for multi-line text
  const measureTextDimensions = (text, fontFamily, fontSize, fontStyle, fontWeight) => {
    const lines = text ? text.split('\n') : [' '];
    const span = document.createElement('span');
    span.style.fontFamily = fontFamily;
    span.style.fontSize = `${fontSize}px`;
    span.style.fontStyle = fontStyle;
    span.style.fontWeight = fontWeight;
    span.style.position = 'absolute';
    span.style.visibility = 'hidden';
    span.style.whiteSpace = 'pre';
    document.body.appendChild(span);

    let maxWidth = 0;
    const lineHeight = fontSize * 1.2; // Approximate line height
    lines.forEach((line) => {
      span.textContent = line || ' ';
      maxWidth = Math.max(maxWidth, span.offsetWidth);
    });
    const height = lines.length * lineHeight;

    document.body.removeChild(span);
    return { width: maxWidth, height };
  };

  const renderTexts = useCallback(() => {
    return texts.map((text) => {
      const fontStyle = text.italic ? 'italic' : 'normal';
      const fontWeight = text.bold ? 'bold' : 'normal';
      const textDecoration = getTextDecoration(text.underline);
      const isActive = activeElement.type === 'text' && activeElement.id === text.id;

      // Calculate text dimensions
      const { width, height } = measureTextDimensions(
        text.content,
        text.fontFamily,
        text.fontSize,
        fontStyle,
        fontWeight
      );

      // Base container style
      const containerStyle = {
        position: 'absolute',
        left: `${text.x}px`,
        top: `${text.y}px`,
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        transform: `translate(-50%, -50%) rotate(${text.rotation}deg)`,
        transformOrigin: 'center center',
        touchAction: 'none',
        willChange: 'left, top, transform, width, height',
        transition: dragging || isRotating ? 'none' : 'left 0.05s, top 0.05s, transform 0.05s',
        pointerEvents: isCropping ? 'none' : 'auto',
        width: `${width}px`,
        height: `${height}px`,
        overflow: 'visible',
      };

      // Common text styles
      const textStyleBase = {
        fontFamily: text.fontFamily,
        fontSize: `${text.fontSize}px`,
        color: text.color || textColor,
        fontStyle,
        fontWeight,
        textDecoration,
        WebkitTextStroke: `${text.fontSize / 40}px ${text.stroke || '#000000'}`,
        padding: 0,
        margin: 0,
        textAlign: 'left',
        ...getCustomUnderlineStyle(text.underline, text.fontSize, text.color || textColor),
      };

      return (
        <div
          key={text.id}
          className={`text-element ${isActive ? 'active' : ''}`}
          style={containerStyle}
          onPointerDown={(e) => startDragging('text', text.id, e)}
          onTouchStart={(e) => {
            startLongPress('text', text.id, e);
            handleTouchZoom('text', text.id, e);
          }}
          onTouchMove={handleTouchMove}
          onPointerMove={handleDrag}
          onPointerUp={stopDragging}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => handleElementClick('text', text.id, e)}
          onDoubleClick={(e) => handleDoubleClick('text', text.id, e)}
          onWheel={(e) => {
            handleTextZoom(text.id, e);
            if (e.ctrlKey) {
              handleMouseWheelRotation(e);
            }
          }}
        >
          {isEditing && isActive ? (
            <textarea
              ref={textInputRef}
              defaultValue={text.content}
              autoFocus
              style={{
                ...textStyleBase,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                width: `${width}px`,
                minHeight: `${height}px`,
                resize: 'none',
                lineHeight: 1.2,
                overflow: 'hidden',
                whiteSpace: 'pre-wrap',
              }}
              onChange={(e) => {
                if (typeof updateText === 'function') {
                  updateText(text.id, { content: e.target.value });
                  const newDimensions = measureTextDimensions(
                    e.target.value,
                    text.fontFamily,
                    text.fontSize,
                    fontStyle,
                    fontWeight
                  );
                  e.target.style.width = `${newDimensions.width}px`;
                  e.target.style.minHeight = `${newDimensions.height}px`;
                  if (typeof updateTextProperties === 'function') {
                    updateTextProperties(text.id, {
                      width: newDimensions.width,
                      height: newDimensions.height,
                    });
                  }
                } else {
                  console.error('updateText is not a function');
                }
              }}
              onBlur={(e) => handleTextBlur(text.id, e)}
              onKeyDown={(e) => handleTextKeyDown(text.id, e)}
              aria-label="Edit text"
            />
          ) : (
            <div
              style={{
                ...textStyleBase,
                whiteSpace: 'pre-wrap',
                lineHeight: 1.2,
              }}
            >
              {text.content.split('\n').map((line, index) => (
                <span
                  key={`${text.id}-line-${index}`}
                  style={{
                    display: 'block',
                    ...getCustomUnderlineStyle(text.underline, text.fontSize, text.color || textColor),
                  }}
                >
                  {line || '\u00A0'} {/* Non-breaking space for empty lines */}
                </span>
              ))}
            </div>
          )}
          {isActive && !isEditing && (
            <>
              {/* Rotation handle */}
              <div
                style={{
                  position: 'absolute',
                  top: `-${height / 5 + 8}px`,
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
                  startRotation('text', text.id, e);
                }}
                onPointerMove={handleRotation}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  stopRotation();
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  startRotation('text', text.id, e);
                }}
                onTouchMove={handleRotation}
                onTouchEnd={(e) => {
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
                    e.target.dataset.initialFontSize = text.fontSize;
                    e.target.dataset.clientX = e.clientX;
                    e.target.dataset.clientY = e.clientY;
                    e.target.dataset.handleId = handle.id;
                  }}
                  onPointerMove={(e) => {
                    if (e.buttons === 1 && typeof updateTextProperties === 'function') {
                      const handleId = e.target.dataset.handleId;
                      const initialFontSize = parseFloat(e.target.dataset.initialFontSize);
                      const startX = parseFloat(e.target.dataset.clientX);
                      const startY = parseFloat(e.target.dataset.clientY);

                      const deltaX = e.clientX - startX;
                      const deltaY = e.clientY - startY;

                      let fontSizeChange = 0;
                      switch (handleId) {
                        case 'nw':
                          fontSizeChange = Math.min(deltaX, deltaY);
                          break;
                        case 'ne':
                          fontSizeChange = Math.min(-deltaX, deltaY);
                          break;
                        case 'sw':
                          fontSizeChange = Math.min(deltaX, -deltaY);
                          break;
                        case 'se':
                          fontSizeChange = Math.max(deltaX, deltaY);
                          break;
                        case 'n':
                          fontSizeChange = -deltaY;
                          break;
                        case 's':
                          fontSizeChange = deltaY;
                          break;
                        case 'w':
                          fontSizeChange = -deltaX;
                          break;
                        case 'e':
                          fontSizeChange = deltaX;
                          break;
                      }

                      const newFontSize = Math.max(10, initialFontSize + fontSizeChange / 5);
                      updateTextProperties(text.id, { fontSize: newFontSize });

                      // Update dimensions based on new font size
                      const newDimensions = measureTextDimensions(
                        text.content,
                        text.fontFamily,
                        newFontSize,
                        fontStyle,
                        fontWeight
                      );
                      updateTextProperties(text.id, {
                        width: newDimensions.width,
                        height: newDimensions.height,
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
                }}
              />
            </>
          )}
        </div>
      );
    });
  }, [
    texts,
    activeElement,
    isEditing,
    textStyles,
    textColor,
    strokeColor,
    fontFamily,
    dragging,
    isRotating,
    isCropping,
    handleDrag,
    handleTouchMove,
    handleTouchEnd,
    handleTextZoom,
    startDragging,
    stopDragging,
    startRotation,
    handleRotation,
    stopRotation,
    handleElementClick,
    handleDoubleClick,
    startLongPress,
    handleMouseWheelRotation,
    handleTextBlur,
    handleTextKeyDown,
    textInputRef,
    updateText,
    handleTouchZoom,
    getTextDecoration,
    getCustomUnderlineStyle,
    updateTextProperties,
  ]);

  return renderTexts();
}; 