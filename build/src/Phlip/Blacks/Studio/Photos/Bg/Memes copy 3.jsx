import React, { useState, useCallback, useEffect, useRef } from 'react';
import { throttle } from 'lodash';
import './Memes.css';
import { MemeCanvas } from './MemeCanvas';
import { MemeControls } from './MemeControls';

const SHAPES = [
  'rectangle', 'square', 'circle', 'oval', 'triangle', 'pentagon', 'hexagon', 'heptagon', 'octagon',
  'trapezoid', 'parallelogram', 'diamond', 'crescent', 'lightning', 'cross', 'heart',
  'line', 'line-arrow', 'line-double-arrow', 'callout-circle-arrow', 'callout-rectangle', 'callout-rounded-rectangle'
];

const EMOJIS = [
  '😂', '🚀', '⭐', '🔥', '🎈',
];

const FONT_FAMILIES = [
  'Impact', 'Arial', 'Helvetica', 'Times New Roman', 'Comic Sans MS', 'Verdana', 'Georgia', 'Courier New',
];

const UNDERLINE_STYLES = [
  { value: 'none', label: 'None' },
  { value: 'single', label: 'Single' },
  { value: 'double', label: 'Double' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dash-dot', label: 'Dash Dot' },
  { value: 'dash-dot-dot', label: 'Dash Dot Dot' },
  { value: 'wave', label: 'Wave' },
  { value: 'thick', label: 'Thick' },
  { value: 'double-wave', label: 'Double Wave' },
  { value: 'heavy-wave', label: 'Heavy Wave' },
  { value: 'long-dash', label: 'Long Dash' },
  { value: 'thick-dash', label: 'Thick Dash' },
  { value: 'thick-dotted', label: 'Thick Dotted' },
  { value: 'thick-dash-dot', label: 'Thick Dash Dot' },
  { value: 'thick-dash-dot-dot', label: 'Thick Dash Dot Dot' },
];

export const Memes = () => {
  const [image, setImage] = useState(null);
  const [texts, setTexts] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [emojis, setEmojis] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [activeElement, setActiveElement] = useState({ type: null, id: null });
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [fontFamily, setFontFamily] = useState('Impact');
  const [textColor, setTextColor] = useState('#ffffff');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [shapeFillColor, setShapeFillColor] = useState('#ff0000');
  const [shapeOutlineColor, setShapeOutlineColor] = useState('#000000');
  const [shapeOutlineWidth, setShapeOutlineWidth] = useState(1);
  const [photoOpacity, setPhotoOpacity] = useState(100);
  const [photoBrightness, setPhotoBrightness] = useState(100);
  const [emojiSize, setEmojiSize] = useState(40);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isRotating, setIsRotating] = useState(false);
  const [rotationStartAngle, setRotationStartAngle] = useState(0);
  const [rotationCenter, setRotationCenter] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [initialDistance, setInitialDistance] = useState(null);
  const [initialFontSize, setInitialFontSize] = useState(40);
  const [textStyles, setTextStyles] = useState({
    bold: false,
    italic: false,
    underline: 'none',
  });
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [selectedShape, setSelectedShape] = useState('rectangle');
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[0]);
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    grayscale: 0,
    sepia: 0,
    blur: 0,
  });
  const [canvasRefs, setCanvasRefs] = useState({ canvasRef: null, imageRef: null });

  const textInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const mergeInputRef = useRef(null);

  // Utility function to measure text width
  const measureTextWidth = useCallback((text, fontSize, fontFamily, bold, italic) => {
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    let fontStyle = '';
    if (italic) fontStyle += 'italic ';
    if (bold) fontStyle += 'bold ';
    ctx.font = `${fontStyle}${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(text || ' ');
    return metrics.width;
  }, []);

  // Utility function to get the image center
  const getImageCenter = useCallback(() => {
    const { imageRef } = canvasRefs;
    if (imageRef?.current) {
      const { offsetWidth, offsetHeight } = imageRef.current;
      return { x: offsetWidth / 2, y: offsetHeight / 2 };
    }
    return { x: 50, y: 50 };
  }, [canvasRefs]);

  // Utility function to restrict elements within image bounds
  const restrictToBounds = useCallback((type, id, x, y, width, height, rotation = 0) => {
    const { imageRef } = canvasRefs;
    if (!imageRef?.current) return { x, y, width, height };
    const imgRect = imageRef.current.getBoundingClientRect();
    const imgWidth = imgRect.width;
    const imgHeight = imgRect.height;

    // Calculate rotated bounding box
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const boundWidth = width * cos + height * sin;
    const boundHeight = width * sin + height * cos;

    // Restrict center position
    const minX = boundWidth / 2;
    const maxX = imgWidth - boundWidth / 2;
    const minY = boundHeight / 2;
    const maxY = imgHeight - boundHeight / 2;

    const newX = Math.max(minX, Math.min(x, maxX));
    const newY = Math.max(minY, Math.min(y, maxY));

    // Restrict size
    const maxWidth = imgWidth;
    const maxHeight = imgHeight;
    const minSize = type === 'shape' && ['line', 'line-arrow', 'line-double-arrow'].includes(shapes.find(s => s.id === id)?.shapeType) ? 5 : 20;
    const newWidth = Math.max(minSize, Math.min(width, maxWidth));
    const newHeight = type === 'shape' && ['line', 'line-arrow', 'line-double-arrow'].includes(shapes.find(s => s.id === id)?.shapeType) ?
      Math.max(5, Math.min(height, 50)) :
      Math.max(minSize, Math.min(height, maxHeight));

    return { x: newX, y: newY, width: newWidth, height: newHeight };
  }, [canvasRefs, shapes]);

  // Define update functions
  const updateText = useCallback((id, updates) => {
    setTexts((prev) => prev.map((text) => (text.id === id ? { ...text, ...updates } : text)));
  }, []);

  const updateShape = useCallback((id, updates) => {
    setShapes((prev) => prev.map((shape) => (shape.id === id ? { ...shape, ...updates } : shape)));
  }, []);

  const updateShapeProperties = useCallback((id, updates) => {
    setShapes((prev) =>
      prev.map((shape) => (shape.id === id ? { ...shape, ...updates } : shape))
    );
  }, []);

  const updateEmoji = useCallback((id, updates) => {
    setEmojis((prev) => prev.map((emoji) => (emoji.id === id ? { ...emoji, ...updates } : emoji)));
  }, []);

  const updatePhoto = useCallback((id, updates) => {
    setPhotos((prev) => prev.map((photo) => (photo.id === id ? { ...photo, ...updates } : photo)));
  }, []);

  // Handle merge images
  const handleMergeImages = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !canvasRefs.imageRef?.current) return;

    const imgRect = canvasRefs.imageRef.current.getBoundingClientRect();
    const canvasWidth = imgRect.width;
    const canvasHeight = imgRect.height;
    const totalImages = photos.length + files.length;
    const gridSize = Math.ceil(Math.sqrt(totalImages));
    const imageWidth = canvasWidth / gridSize;
    const imageHeight = canvasHeight / gridSize;

    const newPhotos = files.map((file, index) => {
      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onload = (event) => {
          const id = `photo-${Date.now()}-${Math.random()}`;
          const col = (photos.length + index) % gridSize;
          const row = Math.floor((photos.length + index) / gridSize);
          const { x, y, width, height } = restrictToBounds(
            'photo',
            id,
            col * imageWidth + imageWidth / 2,
            row * imageHeight + imageHeight / 2,
            imageWidth,
            imageHeight
          );
          resolve({
            id,
            type: 'photo',
            src: event.target.result,
            x,
            y,
            width,
            height,
            opacity: photoOpacity / 100,
            brightness: photoBrightness / 100,
            rotation: 0,
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newPhotos).then((newPhotosArray) => {
      const allPhotos = [...photos, ...newPhotosArray];
      const updatedPhotos = allPhotos.map((photo, index) => {
        const col = index % gridSize;
        const row = Math.floor(index / gridSize);
        const { x, y, width, height } = restrictToBounds(
          'photo',
          photo.id,
          col * imageWidth + imageWidth / 2,
          row * imageHeight + imageHeight / 2,
          imageWidth,
          imageHeight
        );
        return { ...photo, x, y, width, height };
      });

      setPhotos(updatedPhotos);
      setActiveElement({ type: 'photo', id: newPhotosArray[0]?.id || null });
      setSelectedFeature('photo');
    });
  }, [canvasRefs, photos, photoOpacity, photoBrightness, restrictToBounds]);

  // Update text properties when controls change
  useEffect(() => {
    if (activeElement.type === 'text' && activeElement.id && selectedFeature === 'text') {
      updateText(activeElement.id, { color: textColor, stroke: strokeColor, fontFamily });
    }
  }, [textColor, strokeColor, fontFamily, activeElement, selectedFeature, updateText]);

  // Update shape properties when controls change
  useEffect(() => {
    if (activeElement.type === 'shape' && activeElement.id && selectedFeature === 'shape') {
      updateShape(activeElement.id, {
        fillColor: shapeFillColor,
        outlineColor: shapeOutlineColor,
        outlineWidth: shapeOutlineWidth,
      });
    }
  }, [shapeFillColor, shapeOutlineColor, shapeOutlineWidth, activeElement, selectedFeature, updateShape]);

  // Update photo properties when controls change
  useEffect(() => {
    if (activeElement.type === 'photo' && activeElement.id && selectedFeature === 'photo') {
      updatePhoto(activeElement.id, { opacity: photoOpacity / 100, brightness: photoBrightness / 100 });
    }
  }, [photoOpacity, photoBrightness, activeElement, selectedFeature, updatePhoto]);

  // Cleanup long press timer
  useEffect(() => {
    return () => {
      if (longPressTimer) clearTimeout(longPressTimer);
    };
  }, [longPressTimer]);

  const handleFilterChange = useCallback((filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: parseInt(value) }));
  }, []);

  const addText = useCallback(() => {
    const { x, y } = getImageCenter();
    const newText = {
      id: Date.now(),
      type: 'text',
      content: 'Tap to edit',
      x,
      y,
      fontFamily,
      fontSize: 40,
      color: textColor,
      stroke: strokeColor,
      rotation: 0,
      bold: textStyles.bold,
      italic: textStyles.italic,
      underline: textStyles.underline,
    };
    const textWidth = measureTextWidth(newText.content, newText.fontSize, newText.fontFamily, newText.bold, newText.italic);
    const { x: boundedX, y: boundedY } = restrictToBounds('text', newText.id, x, y, textWidth, newText.fontSize);
    setTexts((prev) => [...prev, { ...newText, x: boundedX, y: boundedY }]);
    setActiveElement({ type: 'text', id: newText.id });
    setSelectedFeature('text');
    setIsEditing(true);
  }, [fontFamily, textColor, strokeColor, textStyles, getImageCenter, restrictToBounds, measureTextWidth]);

  const addShape = useCallback(
    ({ shapeType, fillColor, outlineColor, outlineWidth } = {}) => {
      const { x, y } = getImageCenter();
      const isLineShape = ['line', 'line-arrow', 'line-double-arrow'].includes(shapeType || selectedShape);
      const newShape = {
        id: Date.now(),
        type: 'shape',
        shapeType: shapeType || selectedShape,
        x,
        y,
        width: 100,
        height: isLineShape ? 10 : 100,
        fillColor: fillColor || (isLineShape ? 'none' : shapeFillColor),
        outlineColor: outlineColor || shapeOutlineColor,
        outlineWidth: outlineWidth || (isLineShape ? 2 : shapeOutlineWidth),
        rotation: 0,
      };
      const { x: boundedX, y: boundedY, width, height } = restrictToBounds('shape', newShape.id, x, y, newShape.width, newShape.height);
      setShapes((prev) => [...prev, { ...newShape, x: boundedX, y: boundedY, width, height }]);
      setActiveElement({ type: 'shape', id: newShape.id });
      setSelectedFeature('shape');
    },
    [selectedShape, shapeFillColor, shapeOutlineColor, shapeOutlineWidth, getImageCenter, restrictToBounds]
  );

  const addEmoji = useCallback(() => {
    const { x, y } = getImageCenter();
    const newEmoji = {
      id: Date.now(),
      type: 'emoji',
      emoji: selectedEmoji,
      x,
      y,
      size: emojiSize,
      rotation: 0,
    };
    const { x: boundedX, y: boundedY, width: size } = restrictToBounds('emoji', newEmoji.id, x, y, emojiSize, emojiSize);
    setEmojis((prev) => [...prev, { ...newEmoji, x: boundedX, y: boundedY, size }]);
    setActiveElement({ type: 'emoji', id: newEmoji.id });
    setSelectedFeature('emoji');
  }, [selectedEmoji, emojiSize, getImageCenter, restrictToBounds]);

  const addPhoto = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const { x, y } = getImageCenter();
      const newPhoto = {
        id: Date.now(),
        type: 'photo',
        src: event.target.result,
        x,
        y,
        width: 100,
        height: 100,
        opacity: photoOpacity / 100,
        brightness: photoBrightness / 100,
        rotation: 0,
      };
      const { x: boundedX, y: boundedY, width, height } = restrictToBounds('photo', newPhoto.id, x, y, 100, 100);
      setPhotos((prev) => [...prev, { ...newPhoto, x: boundedX, y: boundedY, width, height }]);
      setActiveElement({ type: 'photo', id: newPhoto.id });
      setSelectedFeature('photo');
    };
    reader.readAsDataURL(file);
  }, [photoOpacity, photoBrightness, getImageCenter, restrictToBounds]);

  const deleteElement = useCallback(() => {
    if (!activeElement.id) return;
    if (activeElement.type === 'text') {
      setTexts((prev) => prev.filter((text) => text.id !== activeElement.id));
    } else if (activeElement.type === 'shape') {
      setShapes((prev) => prev.filter((shape) => shape.id !== activeElement.id));
    } else if (activeElement.type === 'emoji') {
      setEmojis((prev) => prev.filter((emoji) => emoji.id !== activeElement.id));
    } else if (activeElement.type === 'photo') {
      setPhotos((prev) => prev.filter((photo) => photo.id !== activeElement.id));
    }
    setActiveElement({ type: null, id: null });
    setSelectedFeature(null);
  }, [activeElement]);

  const toggleTextStyle = useCallback(
    (style, value) => {
      if (style === 'underline') {
        setTextStyles((prev) => ({ ...prev, [style]: value }));
        if (activeElement.type === 'text' && activeElement.id) {
          updateText(activeElement.id, { [style]: value });
        }
      } else {
        const newValue = !textStyles[style];
        setTextStyles((prev) => ({ ...prev, [style]: newValue }));
        if (activeElement.type === 'text' && activeElement.id) {
          updateText(activeElement.id, { [style]: newValue });
        }
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
          setTextStyles({ bold: text.bold || false, italic: text.italic || false, underline: text.underline || 'none' });
          setTextColor(text.color || '#ffffff');
          setStrokeColor(text.stroke || '#000000');
          setFontFamily(text.fontFamily || 'Impact');
        }
      } else if (type === 'shape') {
        const shape = shapes.find((s) => s.id === id);
        if (shape) {
          setShapeFillColor(shape.fillColor || '#ff0000');
          setShapeOutlineColor(shape.outlineColor || '#000000');
          setShapeOutlineWidth(shape.outlineWidth || 1);
          setSelectedShape(shape.shapeType || 'rectangle');
        }
      } else if (type === 'emoji') {
        const emoji = emojis.find((em) => em.id === id);
        if (emoji) {
          setEmojiSize(emoji.size || 40);
          setSelectedEmoji(emoji.emoji || EMOJIS[0]);
        }
      } else if (type === 'photo') {
        const photo = photos.find((p) => p.id === id);
        if (photo) {
          setPhotoOpacity((photo.opacity * 100) || 100);
          setPhotoBrightness((photo.brightness * 100) || 100);
        }
      }
    },
    [texts, shapes, emojis, photos]
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
          setTextStyles({ bold: text.bold || false, italic: text.italic || false, underline: text.underline || 'none' });
          setTextColor(text.color || '#ffffff');
          setStrokeColor(text.stroke || '#000000');
          setFontFamily(text.fontFamily || 'Impact');
        }
      }
    },
    [texts]
  );

  const handleStartLongPress = useCallback(
    (type, id, e) => {
      e.stopPropagation();
      const timer = setTimeout(() => {
        setActiveElement({ type, id });
        setSelectedFeature(type);
        if (type === 'text') {
          setIsEditing(true);
          const text = texts.find((t) => t.id === id);
          if (text) {
            setTextStyles({ bold: text.bold || false, italic: text.italic || false, underline: text.underline || 'none' });
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

  const handleCancelLongPress = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  const handleStartDragging = useCallback(
    (type, id, e, corner = null) => {
      e.stopPropagation();
      e.preventDefault();
      setDragging(true);
      setActiveElement({ type, id });
      setSelectedFeature(type);

      let element;
      if (type === 'text') element = texts.find((t) => t.id === id);
      else if (type === 'shape') element = shapes.find((s) => s.id === id);
      else if (type === 'emoji') element = emojis.find((em) => em.id === id);
      else if (type === 'photo') element = photos.find((p) => p.id === id);

      if (!element) return;

      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;

      const width = element.width || (type === 'text' ? measureTextWidth(element.content, element.fontSize, element.fontFamily, element.bold, element.italic) : element.size || element.width || 100);
      const height = element.height || (type === 'text' ? element.fontSize || 40 : element.size || element.height || 100);

      const { x, y } = restrictToBounds(type, id, element.x, element.y, width, height, element.rotation);

      if (corner) {
        setDragOffset({ x: clientX, y: clientY, corner, initialX: x, initialY: y, initialWidth: width, initialHeight: height });
      } else {
        setDragOffset({ x: clientX - x, y: clientY - y });
      }

      if (type === 'text') updateText(id, { x, y });
      else if (type === 'shape') updateShape(id, { x, y });
      else if (type === 'emoji') updateEmoji(id, { x, y });
      else if (type === 'photo') updatePhoto(id, { x, y });
    },
    [texts, shapes, emojis, photos, restrictToBounds, updateText, updateShape, updateEmoji, updatePhoto, measureTextWidth]
  );

  const handleDrag = useCallback(
    throttle((e) => {
      if (!dragging || !activeElement.id) return;
      e.preventDefault();
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;

      let element;
      let width, height;
      if (activeElement.type === 'text') {
        element = texts.find((t) => t.id === activeElement.id);
        width = measureTextWidth(element.content, element.fontSize, element.fontFamily, element.bold, element.italic);
        height = element.fontSize || 40;
      } else if (activeElement.type === 'shape') {
        element = shapes.find((s) => s.id === activeElement.id);
        width = element.width;
        height = element.height;
      } else if (activeElement.type === 'emoji') {
        element = emojis.find((em) => em.id === activeElement.id);
        width = element.size;
        height = element.size;
      } else if (activeElement.type === 'photo') {
        element = photos.find((p) => p.id === activeElement.id);
        width = element.width;
        height = element.height;
      }
      if (!element) return;

      if (dragOffset.corner) {
        if (activeElement.type === 'shape') {
          const { corner, initialX, initialY, initialWidth, initialHeight } = dragOffset;
          let newWidth = initialWidth;
          let newHeight = initialHeight;
          let newX = initialX;
          let newY = initialY;

          const deltaX = (clientX - dragOffset.x) * Math.cos((element.rotation * Math.PI) / 180) + (clientY - dragOffset.y) * Math.sin((element.rotation * Math.PI) / 180);
          const deltaY = (clientY - dragOffset.y) * Math.cos((element.rotation * Math.PI) / 180) - (clientX - dragOffset.x) * Math.sin((element.rotation * Math.PI) / 180);

          if (corner === 'top-left') {
            newWidth = initialWidth - deltaX;
            newHeight = initialHeight - deltaY;
            newX = initialX + deltaX / 2;
            newY = initialY + deltaY / 2;
          } else if (corner === 'top-right') {
            newWidth = initialWidth + deltaX;
            newHeight = initialHeight - deltaY;
            newX = initialX + deltaX / 2;
            newY = initialY + deltaY / 2;
          } else if (corner === 'bottom-left') {
            newWidth = initialWidth - deltaX;
            newHeight = initialHeight + deltaY;
            newX = initialX + deltaX / 2;
            newY = initialY + deltaY / 2;
          } else if (corner === 'bottom-right') {
            newWidth = initialWidth + deltaX;
            newHeight = initialHeight + deltaY;
            newX = initialX + deltaX / 2;
            newY = initialY + deltaY / 2;
          }

          const { x, y, width, height } = restrictToBounds(activeElement.type, activeElement.id, newX, newY, newWidth, newHeight, element.rotation);
          updateShape(activeElement.id, { width, height, x, y });
        }
      } else {
        const newX = clientX - dragOffset.x;
        const newY = clientY - dragOffset.y;
        const { x, y } = restrictToBounds(activeElement.type, activeElement.id, newX, newY, width, height, element.rotation);

        if (activeElement.type === 'text') {
          updateText(activeElement.id, { x, y });
        } else if (activeElement.type === 'shape') {
          updateShape(activeElement.id, { x, y });
        } else if (activeElement.type === 'emoji') {
          updateEmoji(activeElement.id, { x, y });
        } else if (activeElement.type === 'photo') {
          updatePhoto(activeElement.id, { x, y });
        }
      }
    }, 8),
    [dragging, activeElement, dragOffset, texts, shapes, emojis, photos, restrictToBounds, updateText, updateShape, updateEmoji, updatePhoto, measureTextWidth]
  );

  const handleStopDragging = useCallback(() => {
    setDragging(false);
  }, []);

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target.result);
      setTexts([]);
      setShapes([]);
      setEmojis([]);
      setPhotos([]);
      setActiveElement({ type: null, id: null });
      setSelectedFeature(null);
      setFilters({ brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0, blur: 0 });
    };
    reader.readAsDataURL(file);
  }, []);

  const handleStartRotation = useCallback(
    (type, id, e) => {
      e.stopPropagation();
      e.preventDefault();
      handleCancelLongPress();
      setIsRotating(true);
      setActiveElement({ type, id });
      setSelectedFeature(type);

      let element;
      if (type === 'text') element = texts.find((t) => t.id === id);
      else if (type === 'shape') element = shapes.find((s) => s.id === id);
      else if (type === 'emoji') element = emojis.find((em) => em.id === id);
      else if (type === 'photo') element = photos.find((p) => p.id === id);

      if (!element) return;

      setRotationCenter({ x: element.x, y: element.y });
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
      const dx = clientX - element.x;
      const dy = clientY - element.y;
      setRotationStartAngle(Math.atan2(dy, dx) * (180 / Math.PI) - (element.rotation || 0));
    },
    [texts, shapes, emojis, photos, handleCancelLongPress]
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

      if (activeElement.type === 'text') {
        updateText(activeElement.id, { rotation: newRotation });
      } else if (activeElement.type === 'shape') {
        updateShape(activeElement.id, { rotation: newRotation });
      } else if (activeElement.type === 'emoji') {
        updateEmoji(activeElement.id, { rotation: newRotation });
      } else if (activeElement.type === 'photo') {
        updatePhoto(activeElement.id, { rotation: newRotation });
      }
    }, 8),
    [isRotating, activeElement, rotationCenter, rotationStartAngle, updateText, updateShape, updateEmoji, updatePhoto]
  );

  const handleStopRotation = useCallback(() => {
    setIsRotating(false);
  }, []);

  const handleMouseWheelRotation = useCallback(
    (e) => {
      if (e.ctrlKey && activeElement.id) {
        e.preventDefault();
        let element;
        if (activeElement.type === 'text') element = texts.find((t) => t.id === activeElement.id);
        else if (activeElement.type === 'shape') element = shapes.find((s) => s.id === activeElement.id);
        else if (activeElement.type === 'emoji') element = emojis.find((em) => em.id === activeElement.id);
        else if (activeElement.type === 'photo') element = photos.find((p) => p.id === activeElement.id);

        if (!element) return;

        const rotationDelta = e.deltaY * 0.2;
        const newRotation = (element.rotation || 0) - rotationDelta;

        if (activeElement.type === 'text') {
          updateText(activeElement.id, { rotation: newRotation });
        } else if (activeElement.type === 'shape') {
          updateShape(activeElement.id, { rotation: newRotation });
        } else if (activeElement.type === 'emoji') {
          updateEmoji(activeElement.id, { rotation: newRotation });
        } else if (activeElement.type === 'photo') {
          updatePhoto(activeElement.id, { rotation: newRotation });
        }
      }
    },
    [activeElement, texts, shapes, emojis, photos, updateText, updateShape, updateEmoji, updatePhoto]
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
      const textWidth = measureTextWidth(text.content, newFontSize, text.fontFamily, text.bold, text.italic);
      const { x, y, width, height } = restrictToBounds('text', id, text.x, text.y, textWidth, newFontSize, text.rotation);
      updateText(id, { fontSize: newFontSize, x, y });
    }, 10),
    [activeElement, texts, updateText, restrictToBounds, measureTextWidth]
  );

  const handleShapeResize = useCallback(
    throttle((id, e, corner = null) => {
      if (activeElement.type !== 'shape' || activeElement.id !== id) return;
      const delta = e.deltaY || 0;
      const resizeStep = 1;
      const shape = shapes.find((s) => s.id === id);
      if (!shape) return;

      if (corner) {
        return; // Corner resizing is handled in handleDrag
      }

      const newWidth = shape.width - delta * resizeStep;
      const newHeight = shape.height - delta * resizeStep;
      const { x, y, width, height } = restrictToBounds('shape', id, shape.x, shape.y, newWidth, newHeight, shape.rotation);
      updateShape(id, { width, height, x, y });
    }, 10),
    [activeElement, shapes, updateShape, restrictToBounds]
  );

  const handleEmojiZoom = useCallback(
    throttle((id, e) => {
      if (activeElement.type !== 'emoji' || activeElement.id !== id) return;
      const delta = e.deltaY || 0;
      const zoomStep = 0.5;
      const minSize = 10;
      const maxSize = 200;
      const emoji = emojis.find((em) => em.id === id);
      if (!emoji) return;
      const newSize = Math.min(Math.max(emoji.size - delta * zoomStep, minSize), maxSize);
      const { x, y, width: size } = restrictToBounds('emoji', id, emoji.x, emoji.y, newSize, newSize, emoji.rotation);
      updateEmoji(id, { size, x, y });
    }, 10),
    [activeElement, emojis, updateEmoji, restrictToBounds]
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
      const newWidth = photo.width - delta * resizeStep;
      const newHeight = photo.height - delta * resizeStep;
      const { x, y, width, height } = restrictToBounds('photo', id, photo.x, photo.y, newWidth, newHeight, photo.rotation);
      updatePhoto(id, { width, height, x, y });
    }, 10),
    [activeElement, photos, updatePhoto, restrictToBounds]
  );

  const handleTouchZoom = useCallback(
    (type, id, e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        setActiveElement({ type, id });
        setSelectedFeature(type);
        let initialSize;
        let element;
        if (type === 'text') {
          element = texts.find((t) => t.id === id);
          if (!element) return;
          initialSize = element.fontSize;
        } else if (type === 'shape') {
          element = shapes.find((s) => s.id === id);
          if (!element) return;
          initialSize = element.width;
        } else if (type === 'emoji') {
          element = emojis.find((em) => em.id === id);
          if (!element) return;
          initialSize = element.size;
        } else if (type === 'photo') {
          element = photos.find((p) => p.id === id);
          if (!element) return;
          initialSize = element.width;
        }
        setInitialFontSize(initialSize);
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        setInitialDistance(dist);
      }
    },
    [texts, shapes, emojis, photos]
  );

  const handleTouchMove = useCallback(
    throttle((e) => {
      if (initialDistance !== null && e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        const scale = currentDistance / initialDistance;
        const newSize = Math.min(Math.max(initialFontSize * scale, 10), 500);

        let element;
        if (activeElement.type === 'text') {
          element = texts.find((t) => t.id === activeElement.id);
          if (!element) return;
          const textWidth = measureTextWidth(element.content, newSize, element.fontFamily, element.bold, element.italic);
          const { x, y, width, height } = restrictToBounds('text', activeElement.id, element.x, element.y, textWidth, newSize, element.rotation);
          updateText(activeElement.id, { fontSize: newSize, x, y });
        } else if (activeElement.type === 'shape') {
          element = shapes.find((s) => s.id === activeElement.id);
          if (!element) return;
          const { x, y, width, height } = restrictToBounds('shape', activeElement.id, element.x, element.y, newSize, newSize, element.rotation);
          updateShape(activeElement.id, { width, height, x, y });
        } else if (activeElement.type === 'emoji') {
          element = emojis.find((em) => em.id === activeElement.id);
          if (!element) return;
          const { x, y, width: size } = restrictToBounds('emoji', activeElement.id, element.x, element.y, newSize, newSize, element.rotation);
          updateEmoji(activeElement.id, { size, x, y });
        } else if (activeElement.type === 'photo') {
          element = photos.find((p) => p.id === activeElement.id);
          if (!element) return;
          const { x, y, width, height } = restrictToBounds('photo', activeElement.id, element.x, element.y, newSize, newSize, element.rotation);
          updatePhoto(activeElement.id, { width, height, x, y });
        }
      } else if (e.touches.length === 1) {
        handleDrag(e);
      }
    }, 8),
    [initialDistance, initialFontSize, activeElement, updateText, updateShape, updateEmoji, updatePhoto, handleDrag, restrictToBounds, measureTextWidth]
  );

  const handleTouchEnd = useCallback(() => {
    setInitialDistance(null);
    handleStopDragging();
    handleStopRotation();
    handleCancelLongPress();
  }, [handleStopDragging, handleStopRotation, handleCancelLongPress]);

  const drawUnderline = useCallback((ctx, text, scaledFontSize, textWidth, scaleX, scaleY) => {
    ctx.strokeStyle = text.color || '#ffffff';
    ctx.lineCap = 'round';
    const lineWidth = scaledFontSize / 20;
    const thickLineWidth = scaledFontSize / 10;
    const underlineY = scaledFontSize / 2 + lineWidth;
    const startX = -textWidth / 2;
    const endX = textWidth / 2;

    switch (text.underline) {
      case 'single':
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(startX, underlineY);
        ctx.lineTo(endX, underlineY);
        ctx.stroke();
        break;
      case 'double':
        ctx.lineWidth = lineWidth * 0.5;
        ctx.beginPath();
        ctx.moveTo(startX, underlineY);
        ctx.lineTo(endX, underlineY);
        ctx.moveTo(startX, underlineY + lineWidth * 1.5);
        ctx.lineTo(endX, underlineY + lineWidth * 1.5);
        ctx.stroke();
        break;
      case 'dotted':
        ctx.lineWidth = lineWidth;
        ctx.setLineDash([lineWidth, lineWidth]);
        ctx.beginPath();
        ctx.moveTo(startX, underlineY);
        ctx.lineTo(endX, underlineY);
        ctx.stroke();
        ctx.setLineDash([]);
        break;
      case 'dashed':
        ctx.lineWidth = lineWidth;
        ctx.setLineDash([lineWidth * 3, lineWidth * 2]);
        ctx.beginPath();
        ctx.moveTo(startX, underlineY);
        ctx.lineTo(endX, underlineY);
        ctx.stroke();
        ctx.setLineDash([]);
        break;
      case 'dash-dot':
        ctx.lineWidth = lineWidth;
        ctx.setLineDash([lineWidth * 3, lineWidth, lineWidth, lineWidth]);
        ctx.beginPath();
        ctx.moveTo(startX, underlineY);
        ctx.lineTo(endX, underlineY);
        ctx.stroke();
        ctx.setLineDash([]);
        break;
      case 'dash-dot-dot':
        ctx.lineWidth = lineWidth;
        ctx.setLineDash([lineWidth * 3, lineWidth, lineWidth, lineWidth, lineWidth, lineWidth]);
        ctx.beginPath();
        ctx.moveTo(startX, underlineY);
        ctx.lineTo(endX, underlineY);
        ctx.stroke();
        ctx.setLineDash([]);
        break;
      case 'wave':
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        const waveAmplitude = lineWidth * 0.5;
        const waveFrequency = textWidth / 10;
        for (let x = startX; x <= endX; x += waveFrequency) {
          ctx.moveTo(x, underlineY);
          ctx.quadraticCurveTo(
            x + waveFrequency / 4, underlineY - waveAmplitude,
            x + waveFrequency / 2, underlineY
          );
          ctx.quadraticCurveTo(
            x + (3 * waveFrequency) / 4, underlineY + waveAmplitude,
            x + waveFrequency, underlineY
          );
        }
        ctx.stroke();
        break;
      case 'double-wave':
        ctx.lineWidth = lineWidth * 0.5;
        ctx.beginPath();
        for (let x = startX; x <= endX; x += waveFrequency) {
          ctx.moveTo(x, underlineY);
          ctx.quadraticCurveTo(
            x + waveFrequency / 4, underlineY - waveAmplitude,
            x + waveFrequency / 2, underlineY
          );
          ctx.quadraticCurveTo(
            x + (3 * waveFrequency) / 4, underlineY + waveAmplitude,
            x + waveFrequency, underlineY
          );
        }
        ctx.stroke();
        ctx.beginPath();
        for (let x = startX; x <= endX; x += waveFrequency) {
          ctx.moveTo(x, underlineY + lineWidth * 1.5);
          ctx.quadraticCurveTo(
            x + waveFrequency / 4, underlineY + lineWidth * 1.5 - waveAmplitude,
            x + waveFrequency / 2, underlineY + lineWidth * 1.5
          );
          ctx.quadraticCurveTo(
            x + (3 * waveFrequency) / 4, underlineY + lineWidth * 1.5 + waveAmplitude,
            x + waveFrequency, underlineY + lineWidth * 1.5
          );
        }
        ctx.stroke();
        break;
      case 'thick':
        ctx.lineWidth = thickLineWidth;
        ctx.beginPath();
        ctx.moveTo(startX, underlineY);
        ctx.lineTo(endX, underlineY);
        ctx.stroke();
        break;
      case 'heavy-wave':
        ctx.lineWidth = lineWidth * 1.5;
        ctx.beginPath();
        for (let x = startX; x <= endX; x += waveFrequency) {
          ctx.moveTo(x, underlineY);
          ctx.quadraticCurveTo(
            x + waveFrequency / 4, underlineY - waveAmplitude * 1.5,
            x + waveFrequency / 2, underlineY
          );
          ctx.quadraticCurveTo(
            x + (3 * waveFrequency) / 4, underlineY + waveAmplitude * 1.5,
            x + waveFrequency, underlineY
          );
        }
        ctx.stroke();
        break;
      case 'long-dash':
        ctx.lineWidth = lineWidth;
        ctx.setLineDash([lineWidth * 6, lineWidth * 2]);
        ctx.beginPath();
        ctx.moveTo(startX, underlineY);
        ctx.lineTo(endX, underlineY);
        ctx.stroke();
        ctx.setLineDash([]);
        break;
      case 'thick-dash':
        ctx.lineWidth = thickLineWidth;
        ctx.setLineDash([lineWidth * 3, lineWidth * 2]);
        ctx.beginPath();
        ctx.moveTo(startX, underlineY);
        ctx.lineTo(endX, underlineY);
        ctx.stroke();
        ctx.setLineDash([]);
        break;
      case 'thick-dotted':
        ctx.lineWidth = thickLineWidth;
        ctx.setLineDash([lineWidth, lineWidth]);
        ctx.beginPath();
        ctx.moveTo(startX, underlineY);
        ctx.lineTo(endX, underlineY);
        ctx.stroke();
        ctx.setLineDash([]);
        break;
      case 'thick-dash-dot':
        ctx.lineWidth = thickLineWidth;
        ctx.setLineDash([lineWidth * 3, lineWidth, lineWidth, lineWidth]);
        ctx.beginPath();
        ctx.moveTo(startX, underlineY);
        ctx.lineTo(endX, underlineY);
        ctx.stroke();
        ctx.setLineDash([]);
        break;
      case 'thick-dash-dot-dot':
        ctx.lineWidth = thickLineWidth;
        ctx.setLineDash([lineWidth * 3, lineWidth, lineWidth, lineWidth, lineWidth, lineWidth]);
        ctx.beginPath();
        ctx.moveTo(startX, underlineY);
        ctx.lineTo(endX, underlineY);
        ctx.stroke();
        ctx.setLineDash([]);
        break;
      default:
        break;
    }
  }, []);

  const downloadMeme = useCallback(() => {
    const { canvasRef, imageRef } = canvasRefs;
    if (!canvasRef?.current || !imageRef?.current || !image) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Load images
    const loadImage = (src) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    Promise.all([loadImage(image), ...photos.map((photo) => loadImage(photo.src))])
      .then(([backgroundImg, ...photoImages]) => {
        // Set canvas to natural image dimensions
        canvas.width = backgroundImg.naturalWidth;
        canvas.height = backgroundImg.naturalHeight;

        // Adjust for device pixel ratio
        const scale = window.devicePixelRatio || 1;
        canvas.width *= scale;
        canvas.height *= scale;
        ctx.scale(scale, scale);

        // Calculate scaling factors
        const displayWidth = imageRef.current.offsetWidth;
        const displayHeight = imageRef.current.offsetHeight;
        const scaleX = backgroundImg.naturalWidth / displayWidth;
        const scaleY = backgroundImg.naturalHeight / displayHeight;

        // Draw background image with filters
        ctx.filter = `
          brightness(${filters.brightness}%)
          contrast(${filters.contrast}%)
          saturate(${filters.saturation}%)
          grayscale(${filters.grayscale}%)
          sepia(${filters.sepia}%)
          blur(${filters.blur}px)
        `;
        ctx.drawImage(backgroundImg, 0, 0, backgroundImg.naturalWidth, backgroundImg.naturalHeight);
        ctx.filter = 'none';

        // Draw photos
        photos.forEach((photo, index) => {
          ctx.save();
          const scaledX = photo.x * scaleX;
          const scaledY = photo.y * scaleY;
          const scaledWidth = photo.width * scaleX;
          const scaledHeight = photo.height * scaleY;
          ctx.translate(scaledX, scaledY);
          ctx.rotate((photo.rotation * Math.PI) / 180);
          ctx.globalAlpha = photo.opacity || 1;
          ctx.filter = `brightness(${photo.brightness * 100 || 100}%)`;
          ctx.drawImage(photoImages[index], -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
          ctx.restore();
        });

        // Draw shapes
        shapes.forEach((shape) => {
          ctx.save();
          const scaledX = shape.x * scaleX;
          const scaledY = shape.y * scaleY;
          const scaledWidth = shape.width * scaleX;
          const scaledHeight = shape.height * scaleY;
          ctx.translate(scaledX, scaledY);
          ctx.rotate((shape.rotation * Math.PI) / 180);

          ctx.fillStyle = shape.fillColor === 'none' ? 'transparent' : shape.fillColor || '#ff0000';
          ctx.strokeStyle = shape.outlineColor || '#000000';
          ctx.lineWidth = shape.outlineWidth * Math.max(scaleX, scaleY);

          ctx.beginPath();
          switch (shape.shapeType) {
            case 'rectangle':
            case 'square':
              ctx.rect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
              break;
            case 'circle':
            case 'oval':
              ctx.ellipse(0, 0, scaledWidth / 2, scaledHeight / 2, 0, 0, Math.PI * 2);
              break;
            case 'triangle':
              ctx.moveTo(0, -scaledHeight / 2);
              ctx.lineTo(scaledWidth / 2, scaledHeight / 2);
              ctx.lineTo(-scaledWidth / 2, scaledHeight / 2);
              ctx.closePath();
              break;
            case 'pentagon':
              for (let i = 0; i < 5; i++) {
                const angle = (i * (Math.PI * 2) / 5) - Math.PI / 2;
                const x = (scaledWidth / 2) * Math.cos(angle);
                const y = (scaledHeight / 2) * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              }
              ctx.closePath();
              break;
            case 'hexagon':
              for (let i = 0; i < 6; i++) {
                const angle = (i * (Math.PI * 2) / 6) - Math.PI / 2;
                const x = (scaledWidth / 2) * Math.cos(angle);
                const y = (scaledHeight / 2) * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              }
              ctx.closePath();
              break;
            case 'heptagon':
              for (let i = 0; i < 7; i++) {
                const angle = (i * (Math.PI * 2) / 7) - Math.PI / 2;
                const x = (scaledWidth / 2) * Math.cos(angle);
                const y = (scaledHeight / 2) * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              }
              ctx.closePath();
              break;
            case 'octagon':
              for (let i = 0; i < 8; i++) {
                const angle = (i * (Math.PI * 2) / 8) - Math.PI / 2;
                const x = (scaledWidth / 2) * Math.cos(angle);
                const y = (scaledHeight / 2) * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              }
              ctx.closePath();
              break;
            case 'trapezoid':
              ctx.moveTo(scaledWidth * 0.2, -scaledHeight / 2);
              ctx.lineTo(scaledWidth * 0.8, -scaledHeight / 2);
              ctx.lineTo(scaledWidth / 2, scaledHeight / 2);
              ctx.lineTo(-scaledWidth / 2, scaledHeight / 2);
              ctx.closePath();
              break;
            case 'parallelogram':
              ctx.moveTo(scaledWidth * 0.25, -scaledHeight / 2);
              ctx.lineTo(scaledWidth * 0.75, -scaledHeight / 2);
              ctx.lineTo(scaledWidth / 2, scaledHeight / 2);
              ctx.lineTo(-scaledWidth / 2, scaledHeight / 2);
              ctx.closePath();
              break;
            case 'diamond':
              ctx.moveTo(0, -scaledHeight / 2);
              ctx.lineTo(scaledWidth / 2, 0);
              ctx.lineTo(0, scaledHeight / 2);
              ctx.lineTo(-scaledWidth / 2, 0);
              ctx.closePath();
              break;
            case 'crescent':
              ctx.arc(0, 0, scaledWidth / 2, 0, Math.PI * 2);
              ctx.arc(scaledWidth * 0.1, 0, scaledWidth * 0.3, Math.PI, Math.PI * 2, true);
              ctx.closePath();
              break;
            case 'lightning':
              ctx.moveTo(-scaledWidth * 0.1, -scaledHeight / 2);
              ctx.lineTo(scaledWidth * 0.2, -scaledHeight * 0.2);
              ctx.lineTo(0, -scaledHeight * 0.2);
              ctx.lineTo(scaledWidth * 0.3, scaledHeight * 0.2);
              ctx.lineTo(0, -scaledHeight * 0.1);
              ctx.lineTo(-scaledWidth * 0.2, -scaledHeight * 0.1);
              ctx.lineTo(scaledWidth * 0.1, scaledHeight / 2);
              ctx.lineTo(-scaledWidth * 0.3, 0);
              ctx.closePath();
              break;
            case 'heart':
              ctx.moveTo(0, scaledHeight / 4);
              ctx.quadraticCurveTo(-scaledWidth / 2, -scaledHeight / 2, -scaledWidth / 2, 0);
              ctx.quadraticCurveTo(-scaledWidth / 2, -scaledHeight, 0, -scaledHeight / 2);
              ctx.quadraticCurveTo(scaledWidth / 2, -scaledHeight, scaledWidth / 2, 0);
              ctx.quadraticCurveTo(scaledWidth / 2, -scaledHeight / 2, 0, scaledHeight / 4);
              ctx.closePath();
              break;
            case 'line':
              ctx.moveTo(-scaledWidth / 2, 0);
              ctx.lineTo(scaledWidth / 2, 0);
              break;
            case 'line-arrow':
              ctx.moveTo(-scaledWidth / 2, 0);
              ctx.lineTo(scaledWidth / 2, 0);
              ctx.moveTo(scaledWidth / 2, 0);
              ctx.lineTo(scaledWidth / 2 - scaledWidth * 0.1, scaledHeight * 0.1);
              ctx.moveTo(scaledWidth / 2, 0);
              ctx.lineTo(scaledWidth / 2 - scaledWidth * 0.1, -scaledHeight * 0.1);
              break;
            case 'line-double-arrow':
              ctx.moveTo(-scaledWidth / 2, 0);
              ctx.lineTo(scaledWidth / 2, 0);
              ctx.moveTo(-scaledWidth / 2, 0);
              ctx.lineTo(-scaledWidth / 2 + scaledWidth * 0.1, scaledHeight * 0.1);
              ctx.moveTo(-scaledWidth / 2, 0);
              ctx.lineTo(-scaledWidth / 2 + scaledWidth * 0.1, -scaledHeight * 0.1);
              ctx.moveTo(scaledWidth / 2, 0);
              ctx.lineTo(scaledWidth / 2 - scaledWidth * 0.1, scaledHeight * 0.1);
              ctx.moveTo(scaledWidth / 2, 0);
              ctx.lineTo(scaledWidth / 2 - scaledWidth * 0.1, -scaledHeight * 0.1);
              break;
            case 'callout-circle-arrow':
              ctx.ellipse(0, 0, scaledWidth * 0.4, scaledHeight * 0.4, 0, 0, Math.PI * 2);
              ctx.moveTo(0, scaledHeight * 0.4);
              ctx.lineTo(-scaledWidth * 0.1, scaledHeight * 0.6);
              ctx.lineTo(scaledWidth * 0.1, scaledHeight * 0.6);
              ctx.closePath();
              break;
            case 'callout-rectangle':
              ctx.rect(-scaledWidth * 0.4, -scaledHeight * 0.4, scaledWidth * 0.8, scaledHeight * 0.8);
              ctx.moveTo(0, scaledHeight * 0.4);
              ctx.lineTo(-scaledWidth * 0.1, scaledHeight * 0.6);
              ctx.lineTo(scaledWidth * 0.1, scaledHeight * 0.6);
              ctx.closePath();
              break;
            case 'callout-rounded-rectangle':
              const radius = Math.min(scaledWidth, scaledHeight) * 0.1;
              ctx.moveTo(-scaledWidth * 0.4 + radius, -scaledHeight * 0.4);
              ctx.lineTo(scaledWidth * 0.4 - radius, -scaledHeight * 0.4);
              ctx.quadraticCurveTo(scaledWidth * 0.4, -scaledHeight * 0.4, scaledWidth * 0.4, -scaledHeight * 0.4 + radius);
              ctx.lineTo(scaledWidth * 0.4, scaledHeight * 0.4 - radius);
              ctx.quadraticCurveTo(scaledWidth * 0.4, scaledHeight * 0.4, scaledWidth * 0.4 - radius, scaledHeight * 0.4);
              ctx.lineTo(0, scaledHeight * 0.4);
              ctx.lineTo(-scaledWidth * 0.1, scaledHeight * 0.6);
              ctx.lineTo(scaledWidth * 0.1, scaledHeight * 0.6);
              ctx.lineTo(-scaledWidth * 0.4 + radius, scaledHeight * 0.4);
              ctx.quadraticCurveTo(-scaledWidth * 0.4, scaledHeight * 0.4, -scaledWidth * 0.4, scaledHeight * 0.4 - radius);
              ctx.lineTo(-scaledWidth * 0.4, -scaledHeight * 0.4 + radius);
              ctx.quadraticCurveTo(-scaledWidth * 0.4, -scaledHeight * 0.4, -scaledWidth * 0.4 + radius, -scaledHeight * 0.4);
              ctx.closePath();
              break;
          }
          ctx.fill();
          if (shape.outlineWidth > 0) ctx.stroke();
          ctx.restore();
        });

        // Draw texts
        texts.forEach((text) => {
          ctx.save();
          const scaledX = text.x * scaleX;
          const scaledY = text.y * scaleY;
          const scaledFontSize = text.fontSize * Math.max(scaleX, scaleY);
          let fontStyle = '';
          if (text.italic) fontStyle += 'italic ';
          if (text.bold) fontStyle += 'bold ';
          ctx.font = `${fontStyle}${scaledFontSize}px ${text.fontFamily}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.translate(scaledX, scaledY);
          ctx.rotate((text.rotation * Math.PI) / 180);

          // Draw text stroke
          ctx.strokeStyle = text.stroke || '#000000';
          ctx.lineWidth = scaledFontSize / 40;
          ctx.strokeText(text.content, 0, 0);

          // Draw text fill
          ctx.fillStyle = text.color || '#ffffff';
          ctx.fillText(text.content, 0, 0);

          // Draw underline if applicable
          if (text.underline !== 'none') {
            const textWidth = measureTextWidth(text.content, scaledFontSize, text.fontFamily, text.bold, text.italic);
            drawUnderline(ctx, text, scaledFontSize, textWidth, scaleX, scaleY);
          }
          ctx.restore();
        });

        // Draw emojis
        emojis.forEach((emoji) => {
          ctx.save();
          const scaledX = emoji.x * scaleX;
          const scaledY = emoji.y * scaleY;
          const scaledSize = emoji.size * Math.max(scaleX, scaleY);
          ctx.translate(scaledX, scaledY);
          ctx.rotate((emoji.rotation * Math.PI) / 180);
          ctx.font = `${scaledSize}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(emoji.emoji, 0, 0);
          ctx.restore();
        });

        // Generate and download image as JPEG
        const dataURL = canvas.toDataURL('image/jpeg', 0.9);
        const link = document.createElement('a');
        link.download = 'meme.jpg';
        link.href = dataURL;
        link.click();

        // Reset canvas scaling
        ctx.scale(1 / scale, 1 / scale);
      })
      .catch((error) => {
        console.error('Error loading images for download:', error);
      });
  }, [image, texts, shapes, emojis, photos, filters, canvasRefs, measureTextWidth, drawUnderline]);

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

  const handleTextColorChange = useCallback((e) => {
    setTextColor(e.target.value);
  }, []);

  const handleStrokeColorChange = useCallback((e) => {
    setStrokeColor(e.target.value);
  }, []);

  const handleShapeFillColorChange = useCallback((e) => {
    setShapeFillColor(e.target.value);
  }, []);

  const handleShapeOutlineColorChange = useCallback((e) => {
    setShapeOutlineColor(e.target.value);
  }, []);

  const handleShapeOutlineWidthChange = useCallback((e) => {
    setShapeOutlineWidth(parseInt(e.target.value));
  }, []);

  const handlePhotoOpacityChange = useCallback((e) => {
    setPhotoOpacity(parseInt(e.target.value));
  }, []);

  const handlePhotoBrightnessChange = useCallback((e) => {
    setPhotoBrightness(parseInt(e.target.value));
  }, []);

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

  const handleShapeTypeChange = useCallback(
    (e) => {
      const newShapeType = e.target.value;
      setSelectedShape(newShapeType);
      if (activeElement.type === 'shape' && activeElement.id && selectedFeature === 'shape') {
        updateShape(activeElement.id, { shapeType: newShapeType });
      }
    },
    [activeElement, selectedFeature, updateShape]
  );

  const handleEmojiChange = useCallback(
    (emoji) => {
      setSelectedEmoji(emoji);
      if (activeElement.type === 'emoji' && activeElement.id && selectedFeature === 'emoji') {
        updateEmoji(activeElement.id, { emoji });
      }
    },
    [activeElement, selectedFeature, updateEmoji]
  );

  const handleEmojiSizeChange = useCallback(
    (e) => {
      const newSize = parseInt(e.target.value);
      setEmojiSize(newSize);
      if (activeElement.type === 'emoji' && activeElement.id && selectedFeature === 'emoji') {
        const emoji = emojis.find((em) => em.id === activeElement.id);
        if (!emoji) return;
        const { x, y, width: size } = restrictToBounds('emoji', activeElement.id, emoji.x, emoji.y, newSize, newSize, emoji.rotation);
        updateEmoji(activeElement.id, { size, x, y });
      }
    },
    [activeElement, selectedFeature, emojis, updateEmoji, restrictToBounds]
  );

  // New handler for text content change in MemeControls
  const handleTextContentChange = useCallback(
    (id, value) => {
      if (typeof updateText === 'function') {
        updateText(id, { content: value || 'Tap to edit' });
      } else {
        console.error('updateText is not a function');
      }
    },
    [updateText]
  );

  return (
    <div className="meme-editor">
      <div className="editor-container">
        <MemeCanvas
          image={image}
          texts={texts}
          setTexts={setTexts}
          shapes={shapes}
          setShapes={setShapes}
          emojis={emojis}
          setEmojis={setEmojis}
          photos={photos}
          setPhotos={setPhotos}
          filters={filters}
          activeElement={activeElement}
          setActiveElement={setActiveElement}
          dragging={dragging}
          isRotating={isRotating}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          textStyles={textStyles}
          textColor={textColor}
          strokeColor={strokeColor}
          fontFamily={fontFamily}
          handleDrag={handleDrag}
          handleTouchMove={handleTouchMove}
          handleTouchEnd={handleTouchEnd}
          handleMouseWheelRotation={handleMouseWheelRotation}
          handleTextZoom={handleTextZoom}
          handleShapeResize={handleShapeResize}
          handleEmojiZoom={handleEmojiZoom}
          handlePhotoResize={handlePhotoResize}
          startDragging={handleStartDragging}
          stopDragging={handleStopDragging}
          startRotation={handleStartRotation}
          handleRotation={handleRotation}
          stopRotation={handleStopRotation}
          handleElementClick={handleElementClick}
          handleDoubleClick={handleDoubleClick}
          startLongPress={handleStartLongPress}
          handleTextBlur={handleTextBlur}
          handleTextKeyDown={handleTextKeyDown}
          handleTouchZoom={handleTouchZoom}
          setImage={setImage}
          handleImageUpload={handleImageUpload}
          setCanvasRefs={setCanvasRefs}
          updateShapeProperties={updateShapeProperties}
          textInputRef={textInputRef}
          fileInputRef={fileInputRef}
        />
        {image && (
          <MemeControls
            addText={addText}
            addShape={addShape}
            addPhoto={addPhoto}
            addEmoji={addEmoji}
            deleteElement={deleteElement}
            handleFilterChange={handleFilterChange}
            selectedFeature={selectedFeature}
            setSelectedFeature={setSelectedFeature}
            activeElement={activeElement}
            fontFamily={fontFamily}
            handleFontFamilyChange={handleFontFamilyChange}
            textColor={textColor}
            handleTextColorChange={handleTextColorChange}
            strokeColor={strokeColor}
            handleStrokeColorChange={handleStrokeColorChange}
            textStyles={textStyles}
            toggleTextStyle={toggleTextStyle}
            selectedShape={selectedShape}
            handleShapeTypeChange={handleShapeTypeChange}
            shapeFillColor={shapeFillColor}
            handleShapeFillColorChange={handleShapeFillColorChange}
            shapeOutlineColor={shapeOutlineColor}
            handleShapeOutlineColorChange={handleShapeOutlineColorChange}
            shapeOutlineWidth={shapeOutlineWidth}
            handleShapeOutlineWidthChange={handleShapeOutlineWidthChange}
            selectedEmoji={selectedEmoji}
            handleEmojiChange={handleEmojiChange}
            photoOpacity={photoOpacity}
            handlePhotoOpacityChange={handlePhotoOpacityChange}
            photoBrightness={photoBrightness}
            handlePhotoBrightnessChange={handlePhotoBrightnessChange}
            downloadMeme={downloadMeme}
            filters={filters}
            updateShapeProperties={updateShapeProperties}
            emojiSize={emojiSize}
            handleEmojiSizeChange={handleEmojiSizeChange}
            handleImageUpload={handleImageUpload}
            newPhotoInputRef={fileInputRef}
            handleMergeImages={handleMergeImages}
            mergeInputRef={mergeInputRef}
            updateText={updateText} // Pass updateText to MemeControls
            updateShape={updateShape} // Pass updateShape for consistency
            updateEmoji={updateEmoji} // Pass updateEmoji for consistency
            updatePhoto={updatePhoto} // Pass updatePhoto for consistency
            handleTextContentChange={handleTextContentChange} // New handler for text content
            texts={texts} // Pass texts to access active text content
            SHAPES={SHAPES} // Pass SHAPES constant
            EMOJIS={EMOJIS} // Pass EMOJIS constant
            FONT_FAMILIES={FONT_FAMILIES} // Pass FONT_FAMILIES constant
            UNDERLINE_STYLES={UNDERLINE_STYLES} // Pass UNDERLINE_STYLES constant
          />
        )}
      </div>
    </div>
  );
};