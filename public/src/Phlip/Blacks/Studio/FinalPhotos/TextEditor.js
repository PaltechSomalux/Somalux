import React, { useState, useEffect } from 'react';
import "./TextEditor.css";
export const TextEditor = ({ canvasRef }) => {
  const [textElements, setTextElements] = useState([]);
  const [activeTextId, setActiveTextId] = useState(null);
  const [isAddingText, setIsAddingText] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [textInput, setTextInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });

  const addTextElement = () => {
    if (!textInput.trim()) return;

    const newTextElement = {
      id: Date.now(),
      text: textInput,
      position: { ...position },
      rotation: 0,
      scale: 1
    };

    setTextElements([...textElements, newTextElement]);
    setTextInput('');
    setIsAddingText(false);
    setActiveTextId(newTextElement.id);
  };

  const updateTextElement = (id, updates) => {
    setTextElements(textElements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const handleCanvasClick = (e) => {
    if (!isAddingText || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPosition({ x, y });
  };

  const removeTextElement = (id) => {
    setTextElements(textElements.filter(el => el.id !== id));
    if (activeTextId === id) setActiveTextId(null);
  };

  const handleMouseDown = (e, textEl) => {
    e.stopPropagation();
    setActiveTextId(textEl.id);
    setIsDragging(true);
    setDragStart({
      x: e.clientX - textEl.position.x,
      y: e.clientY - textEl.position.y
    });
  };

  const handleTouchStart = (e, textEl) => {
    e.stopPropagation();
    setActiveTextId(textEl.id);
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - textEl.position.x,
        y: e.touches[0].clientY - textEl.position.y
      });
    }
  };

  const handleRotationStart = (e, textEl) => {
    e.stopPropagation();
    setActiveTextId(textEl.id);
    setIsRotating(true);
  };

  const handleTouchRotationStart = (e, textEl) => {
    e.stopPropagation();
    setActiveTextId(textEl.id);
    setIsRotating(true);
  };

  const handleResizeStart = (e, textEl) => {
    e.stopPropagation();
    setActiveTextId(textEl.id);
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleTouchResizeStart = (e, textEl) => {
    e.stopPropagation();
    setActiveTextId(textEl.id);
    setIsResizing(true);
    setResizeStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleMouseMove = (e) => {
    if (!activeTextId || !canvasRef.current) return;
    const activeText = textElements.find(el => el.id === activeTextId);
    if (!activeText) return;

    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      updateTextElement(activeTextId, { position: { x: newX, y: newY } });
    } else if (isRotating) {
      const rect = canvasRef.current.getBoundingClientRect();
      const centerX = activeText.position.x + rect.left + 50 * activeText.scale;
      const centerY = activeText.position.y + rect.top + 10 * activeText.scale;
      const angle = Math.atan2(
        e.clientY - centerY,
        e.clientX - centerX
      ) * (180 / Math.PI);
      updateTextElement(activeTextId, { rotation: angle });
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const newScale = Math.max(0.5, Math.min(3, activeText.scale + deltaX * 0.01));
      updateTextElement(activeTextId, { scale: newScale });
      setResizeStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!activeTextId || !canvasRef.current) return;
    const activeText = textElements.find(el => el.id === activeTextId);
    if (!activeText || !e.touches[0]) return;

    const touch = e.touches[0];
    
    if (isDragging) {
      const newX = touch.clientX - dragStart.x;
      const newY = touch.clientY - dragStart.y;
      updateTextElement(activeTextId, { position: { x: newX, y: newY } });
    } else if (isRotating) {
      const rect = canvasRef.current.getBoundingClientRect();
      const centerX = activeText.position.x + rect.left + 50 * activeText.scale;
      const centerY = activeText.position.y + rect.top + 10 * activeText.scale;
      const angle = Math.atan2(
        touch.clientY - centerY,
        touch.clientX - centerX
      ) * (180 / Math.PI);
      updateTextElement(activeTextId, { rotation: angle });
    } else if (isResizing) {
      const deltaX = touch.clientX - resizeStart.x;
      const newScale = Math.max(0.5, Math.min(3, activeText.scale + deltaX * 0.01));
      updateTextElement(activeTextId, { scale: newScale });
      setResizeStart({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsRotating(false);
    setIsResizing(false);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setIsRotating(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.addEventListener('click', handleCanvasClick);
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('click', handleCanvasClick);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, isRotating, isResizing, activeTextId, textElements, isAddingText]);

  const renderTextElements = () => {
    return textElements.map((textEl) => {
      const isActive = activeTextId === textEl.id;

      return (
        <div
          key={textEl.id}
          style={{
            position: 'absolute',
            left: `${textEl.position.x}px`,
            top: `${textEl.position.y}px`,
            cursor: isActive ? 'move' : 'pointer',
            backgroundColor: isActive ? 'rgba(0,0,255,0.1)' : 'transparent',
            padding: '2px',
            border: isActive ? '1px dashed blue' : 'none',
            userSelect: 'none',
            whiteSpace: 'nowrap',
            touchAction: 'none',
            transform: `rotate(${textEl.rotation}deg) scale(${textEl.scale})`,
            transformOrigin: 'center center'
          }}
          onClick={(e) => {
            e.stopPropagation();
            setActiveTextId(textEl.id);
          }}
          onMouseDown={(e) => handleMouseDown(e, textEl)}
          onTouchStart={(e) => handleTouchStart(e, textEl)}
        >
          {textEl.text}
          {isActive && (
            <>
              <div
                style={{
                  position: 'absolute',
                  top: '-20px',
                  left: '50%',
                  width: '10px',
                  height: '10px',
                  backgroundColor: 'green',
                  borderRadius: '50%',
                  cursor: 'grab',
                  transform: 'translateX(-50%)'
                }}
                onMouseDown={(e) => handleRotationStart(e, textEl)}
                onTouchStart={(e) => handleTouchRotationStart(e, textEl)}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '-20px',
                  right: '-20px',
                  width: '10px',
                  height: '10px',
                  backgroundColor: 'red',
                  borderRadius: '50%',
                  cursor: 'nwse-resize',
                  transform: 'translate(50%, 50%)'
                }}
                onMouseDown={(e) => handleResizeStart(e, textEl)}
                onTouchStart={(e) => handleTouchResizeStart(e, textEl)}
              />
            </>
          )}
        </div>
      );
    });
  };

  return (
    <>
      {renderTextElements()}
      
      <div className="text-controls-panel" style={{ marginTop: '20px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <button
          onClick={() => setIsAddingText(!isAddingText)}
          style={{ backgroundColor: isAddingText ? '#4CAF50' : '#f1f1f1', padding: '8px 16px' }}
        >
          {isAddingText ? 'Cancel Text' : 'Add Text'}
        </button>

        {isAddingText && (
          <div style={{ marginTop: '10px' }}>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter your text here"
              style={{ width: '100%', minHeight: '60px', marginBottom: '10px' }}
            />
            <button onClick={addTextElement}>Add</button>
          </div>
        )}

        {activeTextId && !isAddingText && (
          <div style={{ marginTop: '10px' }}>
            <h4>Edit Selected Text</h4>
            <button
              onClick={() => {
                const activeText = textElements.find(el => el.id === activeTextId);
                if (activeText) {
                  setTextInput(activeText.text);
                  setIsAddingText(true);
                }
              }}
              style={{ marginRight: '10px' }}
            >
              Edit
            </button>
            <button
              onClick={() => removeTextElement(activeTextId)}
              style={{ backgroundColor: '#ff4444', color: 'white', marginRight: '10px' }}
            >
              Delete
            </button>
          </div> 
        )}
      </div>
    </> 
  );
};