import React, { useState, useRef, useEffect, useCallback } from 'react';
import { throttle } from 'lodash';
import './Memes.css';

export const Memes = () => {
  const [media, setMedia] = useState({ type: null, src: null }); // Store image or video
  const [texts, setTexts] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [activeElement, setActiveElement] = useState({ type: null, id: null });
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [fontFamily, setFontFamily] = useState('Impact');
  const [textColor, setTextColor] = useState('#ffffff');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [photoOpacity, setPhotoOpacity] = useState(100);
  const [photoBrightness, setPhotoBrightness] = useState(100);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isRotating, setIsRotating] = useState(false);
  const [rotationStartAngle, setRotationStartAngle] = useState(0);
  const [rotationCenter, setRotationCenter] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [textStyles, setTextStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
  });
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [initialDistance, setInitialDistance] = useState(null);
  const [initialFontSize, setInitialFontSize] = useState(null);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const mediaRef = useRef(null); // Ref for image or video element
  const wrapperRef = useRef(null);
  const textInputRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (activeElement.type === 'text' && activeElement.id && selectedFeature === 'text') {
      updateText(activeElement.id, { color: textColor, stroke: strokeColor });
    }
  }, [textColor, strokeColor, activeElement, selectedFeature]);

  useEffect(() => {
    if (activeElement.type === 'photo' && activeElement.id && selectedFeature === 'photo') {
      updatePhoto(activeElement.id, { opacity: photoOpacity / 100, brightness: photoBrightness / 100 });
    }
  }, [photoOpacity, photoBrightness, activeElement, selectedFeature]);

  useEffect(() => {
    if (activeElement.type === 'text' && activeElement.id && isEditing && textInputRef.current) {
      textInputRef.current.focus();
      textInputRef.current.select();
    }
  }, [isEditing, activeElement]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  const addText = useCallback(() => {
    const newText = {
      id: Date.now(),
      type: 'text',
      content: 'Tap to edit',
      x: 50,
      y: 50,
      fontFamily,
      fontSize: 40,
      color: textColor,
      stroke: strokeColor,
      rotation: 0,
      bold: textStyles.bold,
      italic: textStyles.italic,
      underline: textStyles.underline,
    };
    setTexts((prev) => [...prev, newText]);
    setActiveElement({ type: 'text', id: newText.id });
    setSelectedFeature('text');
    setIsEditing(true);
  }, [fontFamily, textColor, strokeColor, textStyles]);

  const addPhoto = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const newPhoto = {
        id: Date.now(),
        type: 'photo',
        src: event.target.result,
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        opacity: photoOpacity / 100,
        brightness: photoBrightness / 100,
        rotation: 0,
      };
      setPhotos((prev) => [...prev, newPhoto]);
      setActiveElement({ type: 'photo', id: newPhoto.id });
      setSelectedFeature('photo');
    };
    reader.readAsDataURL(file);
  }, [photoOpacity, photoBrightness]);

  const updateText = useCallback((id, updates) => {
    setTexts((prev) =>
      prev.map((text) => (text.id === id ? { ...text, ...updates } : text))
    );
  }, []);

  const updatePhoto = useCallback((id, updates) => {
    setPhotos((prev) =>
      prev.map((photo) => (photo.id === id ? { ...photo, ...updates } : photo))
    );
  }, []);

  const deleteElement = useCallback(() => {
    if (!activeElement.id) return;
    if (activeElement.type === 'text') {
      setTexts((prev) => prev.filter((text) => text.id !== activeElement.id));
    } else if (activeElement.type === 'photo') {
      setPhotos((prev) => prev.filter((photo) => photo.id !== activeElement.id));
    }
    setActiveElement({ type: null, id: null });
  }, [activeElement]);

  const toggleTextStyle = useCallback(
    (style) => {
      const newValue = !textStyles[style];
      setTextStyles((prev) => ({ ...prev, [style]: newValue }));
      if (activeElement.type === 'text' && activeElement.id) {
        updateText(activeElement.id, { [style]: newValue });
      }
    },
    [activeElement, textStyles, updateText]
  );

  const handleElementClick = useCallback(
    (type, id, e) => {
      e.stopPropagation();
      setActiveElement({ type, id });
      setSelectedFeature(type);
      if (type === 'text') {
        const text = texts.find((t) => t.id === id);
        if (text) {
          setTextStyles({
            bold: text.bold || false,
            italic: text.italic || false,
            underline: text.underline || false,
          });
          setTextColor(text.color || '#ffffff');
          setStrokeColor(text.stroke || '#000000');
          setFontFamily(text.fontFamily || 'Impact');
        }
      } else if (type === 'photo') {
        const photo = photos.find((p) => p.id === id);
        if (photo) {
          setPhotoOpacity(photo.opacity * 100 || 100);
          setPhotoBrightness(photo.brightness * 100 || 100);
        }
      }
    },
    [texts, photos]
  );

  const handleDoubleClick = useCallback(
    (type, id, e) => {
      e.stopPropagation();
      setActiveElement({ type, id });
      setSelectedFeature(type);
      if (type === 'text') {
        setIsEditing(true);
        const text = texts.find((t) => t.id === id);
        if (text) {
          setTextStyles({
            bold: text.bold || false,
            italic: text.italic || false,
            underline: text.underline || false,
          });
          setTextColor(text.color || '#ffffff');
          setStrokeColor(text.stroke || '#000000');
          setFontFamily(text.fontFamily || 'Impact');
        }
      }
    },
    [texts]
  );

  const startLongPress = useCallback(
    (type, id, e) => {
      e.stopPropagation();
      const timer = setTimeout(() => {
        setActiveElement({ type, id });
        setSelectedFeature(type);
        if (type === 'text') {
          setIsEditing(true);
          const text = texts.find((t) => t.id === id);
          if (text) {
            setTextStyles({
              bold: text.bold || false,
              italic: text.italic || false,
              underline: text.underline || false,
            });
            setTextColor(text.color || '#ffffff');
            setStrokeColor(text.stroke || '#000000');
            setFontFamily(text.fontFamily || 'Impact');
          }
        }
      }, 500);
      setLongPressTimer(timer);
    },
    [texts]
  );

  const cancelLongPress = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  const startDragging = useCallback(
    (type, id, e) => {
      e.stopPropagation();
      e.preventDefault();
      if (e.target.classList.contains('rotation-handle')) return;
      setDragging(true);
      setActiveElement({ type, id });
      setSelectedFeature(type);

      let element;
      if (type === 'text') {
        element = texts.find((t) => t.id === id);
      } else if (type === 'photo') {
        element = photos.find((p) => p.id === id);
      }

      if (!element) return;

      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;

      setDragOffset({
        x: clientX - element.x,
        y: clientY - element.y,
      });
    },
    [texts, photos]
  );

  const handleDrag = useCallback(
    throttle((e) => {
      if (!dragging || !activeElement.id) return;
      e.preventDefault();
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
      const newX = clientX - dragOffset.x;
      const newY = clientY - dragOffset.y;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (activeElement.type === 'text') {
          setTexts((prev) =>
            prev.map((text) =>
              text.id === activeElement.id ? { ...text, x: newX, y: newY } : text
            )
          );
        } else if (activeElement.type === 'photo') {
          setPhotos((prev) =>
            prev.map((photo) =>
              photo.id === activeElement.id ? { ...photo, x: newX, y: newY } : photo
            )
          );
        }
      });
    }, 8),
    [dragging, activeElement, dragOffset]
  );

  const stopDragging = useCallback(() => {
    setDragging(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setMedia({ type: 'image', src: event.target.result });
      setTexts([]);
      setPhotos([]);
      setActiveElement({ type: null, id: null });
      setSelectedFeature(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleVideoUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setMedia({ type: 'video', src: event.target.result });
      setTexts([]);
      setPhotos([]);
      setActiveElement({ type: null, id: null });
      setSelectedFeature(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const startRotation = useCallback(
    (type, id, e) => {
      e.stopPropagation();
      e.preventDefault();
      cancelLongPress();
      setIsRotating(true);
      setActiveElement({ type, id });
      setSelectedFeature(type);

      let element;
      if (type === 'text') {
        element = texts.find((t) => t.id === id);
      } else if (type === 'photo') {
        element = photos.find((p) => p.id === id);
      }

      if (!element) return;

      setRotationCenter({ x: element.x, y: element.y });
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
      const dx = clientX - element.x;
      const dy = clientY - element.y;
      setRotationStartAngle(Math.atan2(dy, dx) * (180 / Math.PI) - (element.rotation || 0));
    },
    [texts, photos, cancelLongPress]
  );

  const handleRotation = useCallback(
    throttle((e) => {
      if (!isRotating || !activeElement.id) return;
      e.preventDefault();
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
      const dx = clientX - rotationCenter.x;
      const dy = clientY - rotationCenter.y;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const newRotation = angle - rotationStartAngle;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (activeElement.type === 'text') {
          updateText(activeElement.id, { rotation: newRotation });
        } else if (activeElement.type === 'photo') {
          updatePhoto(activeElement.id, { rotation: newRotation });
        }
      });
    }, 8),
    [isRotating, activeElement, rotationCenter, rotationStartAngle, updateText, updatePhoto]
  );

  const stopRotation = useCallback(() => {
    setIsRotating(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const handleMouseWheelRotation = useCallback(
    (e) => {
      if (e.ctrlKey && activeElement.id) {
        e.preventDefault();
        let element;
        if (activeElement.type === 'text') {
          element = texts.find((t) => t.id === activeElement.id);
        } else if (activeElement.type === 'photo') {
          element = photos.find((p) => p.id === activeElement.id);
        }

        if (!element) return;

        const rotationDelta = e.deltaY * 0.2;
        const newRotation = (element.rotation || 0) - rotationDelta;

        if (activeElement.type === 'text') {
          updateText(activeElement.id, { rotation: newRotation });
        } else if (activeElement.type === 'photo') {
          updatePhoto(activeElement.id, { rotation: newRotation });
        }
      }
    },
    [activeElement, texts, photos, updateText, updatePhoto]
  );

  const handleTextZoom = useCallback(
    throttle((id, e) => {
      if (activeElement.type !== 'text' || activeElement.id !== id) return;
      const delta = e.deltaY || 0;
      const zoomStep = 0.5;
      const minFontSize = 10;
      const maxFontSize = 200;
      const text = texts.find((t) => t.id === id);
      if (!text) return;
      const newFontSize = Math.min(Math.max(text.fontSize - delta * zoomStep, minFontSize), maxFontSize);
      updateText(id, { fontSize: newFontSize });
    }, 10),
    [activeElement, texts, updateText]
  );

  const handlePhotoResize = useCallback(
    throttle((id, e) => {
      if (activeElement.type !== 'photo' || activeElement.id !== id) return;
      const delta = e.deltaY || 0;
      const resizeStep = 1;
      const minSize = 20;
      const maxSize = 500;
      const photo = photos.find((p) => p.id === id);
      if (!photo) return;
      const newWidth = Math.min(Math.max(photo.width - delta * resizeStep, minSize), maxSize);
      const newHeight = Math.min(Math.max(photo.height - delta * resizeStep, minSize), maxSize);
      updatePhoto(id, { width: newWidth, height: newHeight });
    }, 10),
    [activeElement, photos, updatePhoto]
  );

  const handleTouchZoom = useCallback(
    (type, id, e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        setActiveElement({ type, id });
        setSelectedFeature(type);
        let initialSize;
        if (type === 'text') {
          const text = texts.find((t) => t.id === id);
          if (!text) return;
          initialSize = text.fontSize;
        } else if (type === 'photo') {
          const photo = photos.find((p) => p.id === id);
          if (!photo) return;
          initialSize = photo.width;
        }
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        setInitialDistance(dist);
        setInitialFontSize(initialSize);
      }
    },
    [texts, photos]
  );

  const handleTouchMove = useCallback(
    throttle((e) => {
      if (e.touches.length === 2 && initialDistance !== null) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        const scale = currentDistance / initialDistance;
        const newSize = Math.min(Math.max(initialFontSize * scale, 10), 500);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          if (activeElement.type === 'text') {
            updateText(activeElement.id, { fontSize: newSize });
          } else if (activeElement.type === 'photo') {
            updatePhoto(activeElement.id, { width: newSize, height: newSize });
          }
        });
      } else if (e.touches.length === 1) {
        handleDrag(e);
      }
    }, 8),
    [initialDistance, initialFontSize, activeElement, updateText, updatePhoto, handleDrag]
  );

  const handleTouchEnd = useCallback(() => {
    setInitialDistance(null);
    setInitialFontSize(null);
    stopDragging();
    stopRotation();
    cancelLongPress();
  }, [stopDragging, stopRotation, cancelLongPress]);

  const downloadMeme = useCallback(() => {
    if (!canvasRef.current || !media.src) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const loadImage = (src) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    const drawFrame = (video, scaleX, scaleY) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (media.type === 'video') {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height); // For images
      }

      photos.forEach((photo, index) => {
        const img = new Image();
        img.src = photo.src;
        ctx.save();
        const scaledX = photo.x * scaleX;
        const scaledY = photo.y * scaleY;
        const scaledWidth = photo.width * scaleX;
        const scaledHeight = photo.height * scaleY;
        ctx.translate(scaledX, scaledY);
        ctx.rotate((photo.rotation * Math.PI) / 180);
        ctx.globalAlpha = photo.opacity || 1;
        ctx.filter = `brightness(${photo.brightness * 100 || 100}%)`;
        ctx.drawImage(img, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
        ctx.restore();
      });

      texts.forEach((text) => {
        ctx.save();
        const scaledX = text.x * scaleX;
        const scaledY = text.y * scaleY;
        const scaledFontSize = text.fontSize * Math.max(scaleX, scaleY);
        ctx.translate(scaledX, scaledY);
        ctx.rotate((text.rotation * Math.PI) / 180);
        let fontStyle = '';
        if (text.italic) fontStyle += 'italic ';
        if (text.bold) fontStyle += 'bold ';
        ctx.font = `${fontStyle}${scaledFontSize}px ${text.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = text.stroke || '#000000';
        ctx.lineWidth = scaledFontSize / 10;
        ctx.strokeText(text.content, 0, 0);
        ctx.fillStyle = text.color || '#ffffff';
        ctx.fillText(text.content, 0, 0);
        if (text.underline) {
          const textMetrics = ctx.measureText(text.content);
          ctx.strokeStyle = text.color || '#ffffff';
          ctx.lineWidth = scaledFontSize / 20;
          ctx.beginPath();
          ctx.moveTo(-textMetrics.width / 2, scaledFontSize / 2);
          ctx.lineTo(textMetrics.width / 2, scaledFontSize / 2);
          ctx.stroke();
        }
        ctx.restore();
      });
    };

    if (media.type === 'image') {
      Promise.all([loadImage(media.src), ...photos.map((photo) => loadImage(photo.src))])
        .then(([backgroundImg, ...photoImages]) => {
          canvas.width = backgroundImg.naturalWidth;
          canvas.height = backgroundImg.naturalHeight;
          const displayWidth = mediaRef.current.offsetWidth;
          const displayHeight = mediaRef.current.offsetHeight;
          const scaleX = backgroundImg.naturalWidth / displayWidth;
          const scaleY = backgroundImg.naturalHeight / displayHeight;

          drawFrame(backgroundImg, scaleX, scaleY);

          const dataURL = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = 'meme.png';
          link.href = dataURL;
          link.click();
        })
        .catch((error) => {
          console.error('Error loading images for download:', error);
        });
    } else if (media.type === 'video') {
      const video = mediaRef.current;
      if (!video) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const displayWidth = mediaRef.current.offsetWidth;
      const displayHeight = mediaRef.current.offsetHeight;
      const scaleX = video.videoWidth / displayWidth;
      const scaleY = video.videoHeight / displayHeight;

      const stream = canvas.captureStream(30); // 30 FPS
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'meme.mp4';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      };

      video.currentTime = 0;
      video.play();

      const renderFrame = () => {
        if (video.paused || video.ended) {
          recorder.stop();
          video.pause();
          return;
        }
        drawFrame(video, scaleX, scaleY);
        requestAnimationFrame(renderFrame);
      };

      recorder.start();
      renderFrame();
    }
  }, [media, texts, photos]);

  const handleTextBlur = useCallback(
    (id, e) => {
      const newContent = e.target.value || 'Tap to edit';
      updateText(id, { content: newContent });
      setIsEditing(false);
    },
    [updateText]
  );

  const handleTextKeyDown = useCallback(
    (id, e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const newContent = e.target.value || 'Tap to edit';
        updateText(id, { content: newContent });
        setIsEditing(false);
      }
    },
    [updateText]
  );

  const handleTextColorChange = useCallback(
    (e) => {
      const newColor = e.target.value;
      setTextColor(newColor);
    },
    []
  );

  const handleStrokeColorChange = useCallback(
    (e) => {
      const newColor = e.target.value;
      setStrokeColor(newColor);
    },
    []
  );

  const handlePhotoOpacityChange = useCallback(
    (e) => {
      const newOpacity = parseInt(e.target.value);
      setPhotoOpacity(newOpacity);
    },
    []
  );

  const handlePhotoBrightnessChange = useCallback(
    (e) => {
      const newBrightness = parseInt(e.target.value);
      setPhotoBrightness(newBrightness);
    },
    []
  );

  const handleFontFamilyChange = useCallback(
    (e) => {
      const newFont = e.target.value;
      setFontFamily(newFont);
      if (activeElement.type === 'text' && activeElement.id && selectedFeature === 'text') {
        updateText(activeElement.id, { fontFamily: newFont });
      }
    },
    [activeElement, selectedFeature, updateText]
  );

  const renderPhotos = useCallback(() => {
    return photos.map((photo) => (
      <div
        key={photo.id}
        className={`photo-element ${activeElement.type === 'photo' && activeElement.id === photo.id ? 'active' : ''}`}
        style={{
          position: 'absolute',
          left: `${photo.x}px`,
          top: `${photo.y}px`,
          width: `${photo.width}px`,
          height: `${photo.height}px`,
          opacity: photo.opacity || 1,
          filter: `brightness(${photo.brightness * 100 || 100}%)`,
          cursor: dragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          transform: `translate(-50%, -50%) rotate(${photo.rotation}deg)`,
          transformOrigin: 'center center',
          touchAction: 'none',
          willChange: 'left, top, transform, opacity, filter',
          transition: dragging || isRotating ? 'none' : 'left 0.05s, top 0.05s, transform 0.05s, opacity 0.05s, filter 0.05s',
        }}
      >
        <img
          src={photo.src}
          alt="Overlay photo"
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          onPointerDown={(e) => startDragging('photo', photo.id, e)}
          onTouchStart={(e) => {
            handleTouchZoom('photo', photo.id, e);
          }}
          onTouchMove={handleTouchMove}
          onPointerMove={handleDrag}
          onPointerUp={stopDragging}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => handleElementClick('photo', photo.id, e)}
          onWheel={(e) => {
            handlePhotoResize(photo.id, e);
            if (e.ctrlKey) {
              handleMouseWheelRotation(e);
            }
          }}
        />
        {activeElement.type === 'photo' && activeElement.id === photo.id && (
          <div
            className="rotation-handle"
            onPointerDown={(e) => startRotation('photo', photo.id, e)}
            onTouchStart={(e) => startRotation('photo', photo.id, e)}
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
    ));
  }, [
    photos,
    activeElement,
    dragging,
    isRotating,
    handleDrag,
    handleTouchMove,
    handleTouchEnd,
    handlePhotoResize,
    startDragging,
    stopDragging,
    startRotation,
    handleRotation,
    stopRotation,
    handleElementClick,
    handleMouseWheelRotation,
  ]);

  const renderTexts = useCallback(() => {
    return texts.map((text) => {
      const fontStyle = `${text.italic ? 'italic' : ''}`;
      const fontWeight = `${text.bold ? 'bold' : 'normal'}`;
      const textDecoration = `${text.underline ? 'underline' : 'none'}`;
      return (
        <div
          key={text.id}
          className={`text-element ${activeElement.type === 'text' && activeElement.id === text.id ? 'active' : ''}`}
          style={{
            position: 'absolute',
            left: `${text.x}px`,
            top: `${text.y}px`,
            fontFamily: text.fontFamily,
            fontSize: `${text.fontSize}px`,
            color: text.color || '#ffffff',
            fontStyle,
            fontWeight,
            textDecoration,
            WebkitTextStroke: `${text.fontSize / 40}px ${text.stroke || '#000000'}`,
            cursor: dragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            transform: `translate(-50%, -50%) rotate(${text.rotation}deg)`,
            transformOrigin: 'center center',
            touchAction: 'none',
            willChange: 'left, top, transform',
            transition: dragging || isRotating ? 'none' : 'left 0.05s, top 0.05s, transform 0.05s',
          }}
        >
          <div
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
            {isEditing && activeElement.type === 'text' && activeElement.id === text.id ? (
              <input
                ref={textInputRef}
                type="text"
                defaultValue={text.content}
                autoFocus
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontFamily: text.fontFamily,
                  fontSize: `${text.fontSize}px`,
                  color: text.color || '#ffffff',
                  fontStyle,
                  fontWeight,
                  textDecoration,
                  textShadow: `-${text.fontSize / 40}px -${text.fontSize / 40}px 0 ${text.stroke || '#000000'},  
                               ${text.fontSize / 40}px -${text.fontSize / 40}px 0 ${text.stroke || '#000000'},
                              -${text.fontSize / 40}px ${text.fontSize / 40}px 0 ${text.stroke || '#000000'},
                               ${text.fontSize / 40}px ${text.fontSize / 40}px 0 ${text.stroke || '#000000'}`,
                  width: 'auto',
                  minWidth: '100px',
                  textAlign: 'center',
                }}
                onBlur={(e) => handleTextBlur(text.id, e)}
                onKeyDown={(e) => handleTextKeyDown(text.id, e)}
              />
            ) : (
              text.content
            )}
          </div>
          {activeElement.type === 'text' && activeElement.id === text.id && !isEditing && (
            <div
              className="rotation-handle"
              onPointerDown={(e) => startRotation('text', text.id, e)}
              onTouchStart={(e) => startRotation('text', text.id, e)}
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
    texts,
    activeElement,
    dragging,
    isRotating,
    isEditing,
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
  ]);

  return (
    <div className="meme-editor">
      <div className="editor-container">
        <div
          className="canvas-wrapper"
          ref={wrapperRef}
          onPointerMove={handleDrag}
          onPointerUp={stopDragging}
          onPointerLeave={stopDragging}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleMouseWheelRotation}
          style={{ touchAction: 'none', position: 'relative' }}
          onClick={() => {
            setIsEditing(false);
            setActiveElement({ type: null, id: null });
          }}
        >
          {media.src ? (
            <>
              <div className="media-container" style={{ position: 'relative' }}>
                {media.type === 'image' ? (
                  <img
                    ref={mediaRef}
                    src={media.src}
                    alt="Meme background"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '70vh',
                      display: 'block',
                    }}
                  />
                ) : (
                  <video
                    ref={mediaRef}
                    src={media.src}
                    controls
                    style={{
                      maxWidth: '100%',
                      maxHeight: '70vh',
                      display: 'block',
                    }}
                  />
                )}
                {renderPhotos()}
                {renderTexts()}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>
              <div className="bottom-toolbar-memes">
                <div className="primary-tools-scroll-container-memes">
                  <div className="tool-group-memes primary-tools">
                    <button
                      className={`tool-button-memes ${selectedFeature === 'text' ? 'active' : ''}`}
                      onClick={addText}
                      data-tooltip="Add text to your meme"
                    >
                      <span>Text</span>
                    </button>
                    <button
                      className={`tool-button-memes ${selectedFeature === 'photo' ? 'active' : ''}`}
                      onClick={() => photoInputRef.current.click()}
                      data-tooltip="Add a photo to your meme"
                    >
                      <span>Photo</span>
                    </button>
                    <input
                      type="file"
                      ref={photoInputRef}
                      onChange={addPhoto}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    {activeElement.id && (
                      <button
                        className="tool-button-memes"
                        onClick={deleteElement}
                        data-tooltip="Delete selected element"
                      >
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
                {selectedFeature && (
                  <div className="secondary-tools-scroll-container-memes">
                    <div className="tool-group-memes secondary-tools">
                      {selectedFeature === 'text' && (
                        <>
                          <div className="form-group-memes">
                            <label>Font</label>
                            <select
                              value={fontFamily}
                              onChange={handleFontFamilyChange}
                              className="font-select-memes"
                            >
                              <option value="Impact">Impact</option>
                              <option value="Arial">Arial</option>
                              <option value="Comic Sans MS">Comic Sans</option>
                              <option value="Courier New">Courier New</option>
                              <option value="Times New Roman">Times New Roman</option>
                            </select>
                          </div>
                          <div className="form-group-memes">
                            <label>Color</label>
                            <input
                              type="color"
                              value={textColor}
                              onChange={handleTextColorChange}
                              className="color-input-memes"
                            />
                          </div>
                          <div className="form-group-memes">
                            <label>Stroke</label>
                            <input
                              type="color"
                              value={strokeColor}
                              onChange={handleStrokeColorChange}
                              className="color-input-memes"
                            />
                          </div>
                          <div className="style-buttons-memes">
                            <button
                              className={`style-button-memes ${textStyles.bold ? 'active' : ''}`}
                              onClick={() => toggleTextStyle('bold')}
                              data-tooltip="Bold"
                            >
                              <span style={{ fontWeight: 'bold' }}>B</span>
                            </button>
                            <button
                              className={`style-button-memes ${textStyles.italic ? 'active' : ''}`}
                              onClick={() => toggleTextStyle('italic')}
                              data-tooltip="Italic"
                            >
                              <span style={{ fontStyle: 'italic' }}>I</span>
                            </button>
                            <button
                              className={`style-button-memes ${textStyles.underline ? 'active' : ''}`}
                              onClick={() => toggleTextStyle('underline')}
                              data-tooltip="Underline"
                            >
                              <span style={{ textDecoration: 'underline' }}>U</span>
                            </button>
                          </div>
                        </>
                      )}
                      {selectedFeature === 'photo' && (
                        <>
                          <div className="form-group-memes">
                            <label>Opacity</label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={photoOpacity}
                              onChange={handlePhotoOpacityChange}
                              className="size-slider"
                            />
                            <span>{photoOpacity}%</span>
                          </div>
                          <div className="form-group-memes">
                            <label>Brightness</label>
                            <input
                              type="range"
                              min="0"
                              max="200"
                              value={photoBrightness}
                              onChange={handlePhotoBrightnessChange}
                              className="size-slider"
                            />
                            <span>{photoBrightness}%</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
                <div className="download-button-container">
                  <button
                    className="download-button-memes"
                    onClick={downloadMeme}
                    data-tooltip={`Download your ${media.type === 'video' ? 'video' : 'meme'}`}
                  >
                    <span>Download {media.type === 'video' ? 'Video' : 'Meme'}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="upload-prompt">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <input
                type="file"
                ref={videoInputRef}
                onChange={handleVideoUpload}
                accept="video/mp4,video/webm,video/ogg"
                style={{ display: 'none' }}
              />
              <button className="upload-button" onClick={() => fileInputRef.current.click()}>
                Upload Image
              </button>
              <button className="upload-button" onClick={() => videoInputRef.current.click()}>
                Upload Video
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};