import React, { useState, useCallback, useRef } from 'react';
import './Memes.css';
import { MemeCanvas } from './MemeCanvas';
import { MemeControls } from './MemeControls';
import { MemeDownload } from './MemeDownload';
import { MemeTemplate } from '../Memes/MemeTemplete/MemeTemplete';
import { measureTextWidth, getImageCenter, restrictToBounds, loadImage, throttleEvent } from './MemeUtils';
import { SHAPES, EMOJIS, FONT_FAMILIES, DESIGNER_COLORS } from './MemeConstants';

export const Memes = () => {
  const [image, setImage] = useState(null);
  const [texts, setTexts] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [emojis, setEmojis] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [activeElement, setActiveElement] = useState({ type: null, id: null });
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [fontFamily, setFontFamily] = useState('Impact');
  const [textColor, setTextColor] = useState(DESIGNER_COLORS[1].value);
  const [strokeColor, setStrokeColor] = useState(DESIGNER_COLORS[1].value);
  const [shapeFillColor, setShapeFillColor] = useState(DESIGNER_COLORS[2].value);
  const [shapeOutlineColor, setShapeOutlineColor] = useState(DESIGNER_COLORS[1].value);
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
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [eraserSettings, setEraserSettings] = useState({
    size: 10,
    opacity: 100,
    hardness: 100,
  });

  const textInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const mergeInputRef = useRef(null);

  const handleEraserChange = useCallback((property, value) => {
    setEraserSettings((prev) => ({ ...prev, [property]: parseInt(value) }));
  }, []);

  const updateText = useCallback((id, updates) => {
    setTexts((prev) => prev.map((text) => (text.id === id ? { ...text, ...updates } : text)));
  }, []);

  const updateShape = useCallback((id, updates) => {
    setShapes((prev) => prev.map((shape) => (shape.id === id ? { ...shape, ...updates } : shape)));
  }, []);

  const updateShapeProperties = useCallback((id, updates) => {
    setShapes((prev) => prev.map((shape) => (shape.id === id ? { ...shape, ...updates } : shape)));
  }, []);

  const updatePhotoProperties = useCallback((id, updates) => {
    setPhotos((prev) => prev.map((photo) => (photo.id === id ? { ...photo, ...updates } : photo)));
  }, []);

  const updateEmoji = useCallback((id, updates) => {
    setEmojis((prev) => prev.map((emoji) => (emoji.id === id ? { ...emoji, ...updates } : emoji)));
  }, []);

  const addText = useCallback(() => {
    const { x, y } = getImageCenter(canvasRefs.canvasRef || canvasRefs.imageRef);
    const newText = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: 'Tap to edit',
      x,
      y,
      fontFamily,
      fontSize: 40,
      color: '#FF0000',
      stroke: strokeColor,
      rotation: 0,
      bold: textStyles.bold,
      italic: textStyles.italic,
      underline: textStyles.underline,
    };
    const textWidth = measureTextWidth(newText.content, newText.fontSize, newText.fontFamily, newText.bold, newText.italic);
    const { x: boundedX, y: boundedY } = restrictToBounds('text', newText.id, x, y, textWidth, newText.fontSize, 0, canvasRefs.canvasRef || canvasRefs.imageRef, shapes);
    setTexts((prev) => [...prev, { ...newText, x: boundedX, y: boundedY }]);
    setActiveElement({ type: 'text', id: newText.id });
    setSelectedFeature('text');
    setIsEditing(true);
  }, [fontFamily, strokeColor, textStyles, canvasRefs, shapes]);

  const addShape = useCallback((shapeProps) => {
    const { x, y } = getImageCenter(canvasRefs.canvasRef || canvasRefs.imageRef);
    const isLineShape = ['line', 'arrow', 'double-arrow'].includes(shapeProps.shapeType);
    const newShape = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      shapeType: shapeProps.shapeType,
      x,
      y,
      width: 100,
      height: isLineShape ? 10 : 100,
      fillColor: isLineShape ? 'none' : shapeProps.fillColor,
      outlineColor: shapeProps.outlineColor,
      outlineWidth: isLineShape ? 2 : shapeProps.outlineWidth,
      rotation: 0,
    };
    const { x: boundedX, y: boundedY, width, height } = restrictToBounds(
      'shape',
      newShape.id,
      x,
      y,
      newShape.width,
      newShape.height,
      0,
      canvasRefs.canvasRef || canvasRefs.imageRef,
      shapes
    );
    setShapes((prev) => [...prev, { ...newShape, x: boundedX, y: boundedY, width, height }]);
    setActiveElement({ type: 'shape', id: newShape.id });
    setSelectedFeature('shape');
  }, [canvasRefs, shapes]);

  const addEmoji = useCallback(() => {
    const { x, y } = getImageCenter(canvasRefs.canvasRef || canvasRefs.imageRef);
    const newEmoji = {
      id: `emoji-${Date.now()}`,
      type: 'emoji',
      emoji: selectedEmoji,
      x,
      y,
      size: emojiSize,
      rotation: 0,
    };
    const { x: boundedX, y: boundedY, width: size } = restrictToBounds('emoji', newEmoji.id, x, y, emojiSize, emojiSize, 0, canvasRefs.canvasRef || canvasRefs.imageRef, shapes);
    setEmojis((prev) => [...prev, { ...newEmoji, x: boundedX, y: boundedY, size }]);
    setActiveElement({ type: 'emoji', id: newEmoji.id });
    setSelectedFeature('emoji');
  }, [selectedEmoji, emojiSize, canvasRefs, shapes]);

  const addPhoto = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const { x, y } = getImageCenter(canvasRefs.canvasRef || canvasRefs.imageRef);
        const newPhoto = {
          id: `photo-${Date.now()}`,
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
        const { x: boundedX, y: boundedY, width, height } = restrictToBounds('photo', newPhoto.id, x, y, 100, 100, 0, canvasRefs.canvasRef || canvasRefs.imageRef, shapes);
        setPhotos((prev) => [...prev, { ...newPhoto, x: boundedX, y: boundedY, width, height }]);
        setActiveElement({ type: 'photo', id: newPhoto.id });
        setSelectedFeature('photo');
      };
      reader.readAsDataURL(file);
    },
    [photoOpacity, photoBrightness, canvasRefs, shapes]
  );

  const deleteElement = useCallback(() => {
    if (!activeElement.id) return;

    switch (activeElement.type) {
      case 'text':
        setTexts((prev) => prev.filter((text) => text.id !== activeElement.id));
        break;
      case 'shape':
        setShapes((prev) => prev.filter((shape) => shape.id !== activeElement.id));
        break;
      case 'emoji':
        setEmojis((prev) => prev.filter((emoji) => emoji.id !== activeElement.id));
        break;
      case 'photo':
        setPhotos((prev) => prev.filter((photo) => photo.id !== activeElement.id));
        break;
      default:
        return;
    }

    setActiveElement({ type: null, id: null });
    setSelectedFeature(null);
  }, [activeElement]);

  const handleTemplateClick = useCallback(() => {
    setShowTemplateModal(true);
  }, []);

  const handleTemplateClose = useCallback(() => {
    setShowTemplateModal(false);
  }, []);

  const handleTemplateSelect = useCallback((meme) => {
    const imageSrc = meme.value.startsWith('url(') ? meme.value.match(/url\((.*?)\)/)[1] : meme.value;
    setImage(imageSrc);
    setShowTemplateModal(false);
    setTexts([]);
    setShapes([]);
    setEmojis([]);
    setPhotos([]);
    setActiveElement({ type: null, id: null });
    setSelectedFeature(null);
    setFilters({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      grayscale: 0,
      sepia: 0,
      blur: 0,
    });
    setEraserSettings({ size: 10, opacity: 100, hardness: 100 });
  }, []);

  const handleElementClick = useCallback(
    (type, id, e) => {
      e.stopPropagation();
      setActiveElement({ type, id });
      setSelectedFeature(type);

      const element =
        type === 'text'
          ? texts.find((t) => t.id === id)
          : type === 'shape'
          ? shapes.find((s) => s.id === id)
          : type === 'emoji'
          ? emojis.find((em) => em.id === id)
          : type === 'photo'
          ? photos.find((p) => p.id === id)
          : null;

      if (!element) return;

      switch (type) {
        case 'text':
          setTextStyles({
            bold: element.bold || false,
            italic: element.italic || false,
            underline: element.underline || 'none',
          });
          setTextColor(element.color || DESIGNER_COLORS[1].value);
          setStrokeColor(element.stroke || DESIGNER_COLORS[1].value);
          setFontFamily(element.fontFamily || 'Impact');
          break;
        case 'shape':
          setShapeFillColor(element.fillColor || DESIGNER_COLORS[2].value);
          setShapeOutlineColor(element.outlineColor || DESIGNER_COLORS[1].value);
          setShapeOutlineWidth(element.outlineWidth || 1);
          setSelectedShape(element.shapeType || 'rectangle');
          break;
        case 'emoji':
          setEmojiSize(element.size || 40);
          setSelectedEmoji(element.emoji || EMOJIS[0]);
          break;
        case 'photo':
          setPhotoOpacity(element.opacity * 100 || 100);
          setPhotoBrightness(element.brightness * 100 || 100);
          break;
        default:
          break;
      }
    },
    [texts, shapes, emojis, photos]
  );

  const handleDoubleClick = useCallback(
    (type, id, e) => {
      e.stopPropagation();
      if (type === 'text') {
        setActiveElement({ type, id });
        setSelectedFeature(type);
        setIsEditing(true);
      }
    },
    []
  );

  const handleStartLongPress = useCallback(
    (type, id, e) => {
      e.stopPropagation();
      const timer = setTimeout(() => {
        if (type === 'text') {
          setIsEditing(true);
        }
      }, 500);
      setLongPressTimer(timer);
    },
    []
  );

  const handleCancelLongPress = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  const handleStartDragging = useCallback(
    (type, id, e) => {
      e.stopPropagation();
      e.preventDefault();
      setDragging(true);

      const element =
        type === 'text'
          ? texts.find((t) => t.id === id)
          : type === 'shape'
          ? shapes.find((s) => s.id === id)
          : type === 'emoji'
          ? emojis.find((em) => em.id === id)
          : type === 'photo'
          ? photos.find((p) => p.id === id)
          : null;

      if (!element) return;

      const clientX = e.clientX || (e.touches?.[0]?.clientX) || 0;
      const clientY = e.clientY || (e.touches?.[0]?.clientY) || 0;

      const width =
        type === 'text'
          ? measureTextWidth(element.content, element.fontSize, element.fontFamily, element.bold, element.italic)
          : type === 'emoji'
          ? element.size
          : element.width || 100;

      const height =
        type === 'text'
          ? element.fontSize || 40
          : type === 'emoji'
          ? element.size
          : element.height || 100;

      const { x, y } = restrictToBounds(type, id, element.x, element.y, width, height, element.rotation, canvasRefs.canvasRef || canvasRefs.imageRef, shapes);
      setDragOffset({ x: clientX - x, y: clientY - y });
    },
    [texts, shapes, emojis, photos, canvasRefs, shapes]
  );

  const handleDrag = useCallback(
    throttleEvent((e) => {
      if (!dragging || !activeElement.id) return;
      e.preventDefault();

      const clientX = e.clientX || (e.touches?.[0]?.clientX) || 0;
      const clientY = e.clientY || (e.touches?.[0]?.clientY) || 0;

      const newX = clientX - dragOffset.x;
      const newY = clientY - dragOffset.y;

      const element =
        activeElement.type === 'text'
          ? texts.find((t) => t.id === activeElement.id)
          : activeElement.type === 'shape'
          ? shapes.find((s) => s.id === activeElement.id)
          : activeElement.type === 'emoji'
          ? emojis.find((em) => em.id === activeElement.id)
          : activeElement.type === 'photo'
          ? photos.find((p) => p.id === activeElement.id)
          : null;

      if (!element) return;

      const width =
        activeElement.type === 'text'
          ? measureTextWidth(element.content, element.fontSize, element.fontFamily, element.bold, element.italic)
          : activeElement.type === 'emoji'
          ? element.size
          : element.width || 100;

      const height =
        activeElement.type === 'text'
          ? element.fontSize || 40
          : activeElement.type === 'emoji'
          ? element.size
          : element.height || 100;

      const { x, y } = restrictToBounds(activeElement.type, activeElement.id, newX, newY, width, height, element.rotation, canvasRefs.canvasRef || canvasRefs.imageRef, shapes);

      const updater =
        activeElement.type === 'text'
          ? updateText
          : activeElement.type === 'shape'
          ? updateShape
          : activeElement.type === 'emoji'
          ? updateEmoji
          : activeElement.type === 'photo'
          ? updatePhotoProperties
          : null;

      if (updater) {
        updater(activeElement.id, { x, y });
      }
    }, 8),
    [dragging, activeElement, dragOffset, texts, shapes, emojis, photos, updateText, updateShape, updateEmoji, updatePhotoProperties, canvasRefs, shapes]
  );

  const handleStopDragging = useCallback(() => {
    setDragging(false);
  }, []);

  const handleStartRotation = useCallback(
    (type, id, e) => {
      e.stopPropagation();
      e.preventDefault();
      handleCancelLongPress();
      setIsRotating(true);

      const element =
        type === 'text'
          ? texts.find((t) => t.id === id)
          : type === 'shape'
          ? shapes.find((s) => s.id === id)
          : type === 'emoji'
          ? emojis.find((em) => em.id === id)
          : type === 'photo'
          ? photos.find((p) => p.id === id)
          : null;

      if (!element) return;

      setRotationCenter({ x: element.x, y: element.y });
      const clientX = e.clientX || (e.touches?.[0]?.clientX) || 0;
      const clientY = e.clientY || (e.touches?.[0]?.clientY) || 0;
      const dx = clientX - element.x;
      const dy = clientY - element.y;
      setRotationStartAngle(Math.atan2(dy, dx) * (180 / Math.PI) - (element.rotation || 0));
    },
    [texts, shapes, emojis, photos, handleCancelLongPress]
  );

  const handleRotation = useCallback(
    throttleEvent((e) => {
      if (!isRotating || !activeElement.id) return;
      e.preventDefault();

      const clientX = e.clientX || (e.touches?.[0]?.clientX) || 0;
      const clientY = e.clientY || (e.touches?.[0]?.clientY) || 0;
      const dx = clientX - rotationCenter.x;
      const dy = clientY - rotationCenter.y;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const newRotation = angle - rotationStartAngle;

      const updater =
        activeElement.type === 'text'
          ? updateText
          : activeElement.type === 'shape'
          ? updateShape
          : activeElement.type === 'emoji'
          ? updateEmoji
          : activeElement.type === 'photo'
          ? updatePhotoProperties
          : null;

      if (updater) {
        updater(activeElement.id, { rotation: newRotation });
      }
    }, 8),
    [isRotating, activeElement, rotationCenter, rotationStartAngle, updateText, updateShape, updateEmoji, updatePhotoProperties]
  );

  const handleStopRotation = useCallback(() => {
    setIsRotating(false);
  }, []);

  const handleMouseWheelRotation = useCallback(
    (e) => {
      if (e.ctrlKey && activeElement.id) {
        e.preventDefault();
        const rotationDelta = e.deltaY * 0.2;

        const updater =
          activeElement.type === 'text'
            ? updateText
            : activeElement.type === 'shape'
            ? updateShape
            : activeElement.type === 'emoji'
            ? updateEmoji
            : activeElement.type === 'photo'
            ? updatePhotoProperties
            : null;

        if (updater) {
          const element =
            activeElement.type === 'text'
              ? texts.find((t) => t.id === activeElement.id)
              : activeElement.type === 'shape'
              ? shapes.find((s) => s.id === activeElement.id)
              : activeElement.type === 'emoji'
              ? emojis.find((em) => em.id === activeElement.id)
              : activeElement.type === 'photo'
              ? photos.find((p) => p.id === activeElement.id)
              : null;

          if (!element) return;

          const newRotation = (element.rotation || 0) - rotationDelta;
          updater(activeElement.id, { rotation: newRotation });
        }
      }
    },
    [activeElement, texts, shapes, emojis, photos, updateText, updateShape, updateEmoji, updatePhotoProperties]
  );

  const handleTextZoom = useCallback(
    throttleEvent((id, e) => {
      if (activeElement.type !== 'text' || activeElement.id !== id) return;
      const delta = e.deltaY || 0;
      const text = texts.find((t) => t.id === id);
      if (!text) return;

      const newFontSize = Math.min(Math.max(text.fontSize - delta * 0.5, 10), 200);
      const textWidth = measureTextWidth(text.content, newFontSize, text.fontFamily, text.bold, text.italic);
      const { x, y, width, height } = restrictToBounds('text', id, text.x, text.y, textWidth, newFontSize, text.rotation, canvasRefs.canvasRef || canvasRefs.imageRef, shapes);
      updateText(id, { fontSize: newFontSize, x, y });
    }, 10),
    [activeElement, texts, updateText, canvasRefs, shapes]
  );

  const handleShapeResize = useCallback(
    throttleEvent((id, e) => {
      if (activeElement.type !== 'shape' || activeElement.id !== id) return;
      const delta = e.deltaY || 0;
      const shape = shapes.find((s) => s.id === id);
      if (!shape) return;

      const newWidth = Math.max(10, shape.width - delta);
      const newHeight = Math.max(10, shape.height - delta);
      const { x, y, width, height } = restrictToBounds('shape', id, shape.x, shape.y, newWidth, newHeight, shape.rotation, canvasRefs.canvasRef || canvasRefs.imageRef, shapes);
      updateShape(id, { width, height, x, y });
    }, 10),
    [activeElement, shapes, updateShape, canvasRefs, shapes]
  );

  const handleEmojiZoom = useCallback(
    throttleEvent((id, e) => {
      if (activeElement.type !== 'emoji' || activeElement.id !== id) return;
      const delta = e.deltaY || 0;
      const emoji = emojis.find((em) => em.id === id);
      if (!emoji) return;

      const newSize = Math.min(Math.max(emoji.size - delta * 0.5, 10), 200);
      const { x, y, width: size } = restrictToBounds('emoji', id, emoji.x, emoji.y, newSize, newSize, emoji.rotation, canvasRefs.canvasRef || canvasRefs.imageRef, shapes);
      updateEmoji(id, { size, x, y });
    }, 10),
    [activeElement, emojis, updateEmoji, canvasRefs, shapes]
  );

  const handlePhotoResize = useCallback(
    throttleEvent((id, e) => {
      if (activeElement.type !== 'photo' || activeElement.id !== id) return;
      const delta = e.deltaY || 0;
      const photo = photos.find((p) => p.id === id);
      if (!photo) return;

      const newWidth = Math.max(10, photo.width - delta);
      const newHeight = Math.max(10, photo.height - delta);
      const { x, y, width, height } = restrictToBounds('photo', id, photo.x, photo.y, newWidth, newHeight, photo.rotation, canvasRefs.canvasRef || canvasRefs.imageRef, shapes);
      updatePhotoProperties(id, { width, height, x, y });
    }, 10),
    [activeElement, photos, updatePhotoProperties, canvasRefs, shapes]
  );

  const handleTouchZoom = useCallback(
    (type, id, e) => {
      if (e.touches.length === 2) {
        e.preventDefault();

        const element =
          type === 'text'
            ? texts.find((t) => t.id === id)
            : type === 'shape'
            ? shapes.find((s) => s.id === id)
            : type === 'emoji'
            ? emojis.find((em) => em.id === id)
            : type === 'photo'
            ? photos.find((p) => p.id === id)
            : null;

        if (!element) return;

        setInitialFontSize(type === 'text' ? element.fontSize : type === 'emoji' ? element.size : element.width || 100);

        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        setInitialDistance(dist);
      }
    },
    [texts, shapes, emojis, photos]
  );

  const handleTouchMove = useCallback(
    throttleEvent((e) => {
      if (initialDistance !== null && e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        const scale = currentDistance / initialDistance;
        const newSize = Math.min(Math.max(initialFontSize * scale, 10), 500);

        const updater =
          activeElement.type === 'text'
            ? updateText
            : activeElement.type === 'shape'
            ? updateShape
            : activeElement.type === 'emoji'
            ? updateEmoji
            : activeElement.type === 'photo'
            ? updatePhotoProperties
            : null;

        if (!updater || !activeElement.id) return;

        const element =
          activeElement.type === 'text'
            ? texts.find((t) => t.id === activeElement.id)
            : activeElement.type === 'shape'
            ? shapes.find((s) => s.id === activeElement.id)
            : activeElement.type === 'emoji'
            ? emojis.find((em) => em.id === activeElement.id)
            : activeElement.type === 'photo'
            ? photos.find((p) => p.id === activeElement.id)
            : null;

        if (!element) return;

        if (activeElement.type === 'text') {
          const textWidth = measureTextWidth(element.content, newSize, element.fontFamily, element.bold, element.italic);
          const { x, y } = restrictToBounds('text', activeElement.id, element.x, element.y, textWidth, newSize, element.rotation, canvasRefs.canvasRef || canvasRefs.imageRef, shapes);
          updateText(activeElement.id, { fontSize: newSize, x, y });
        } else {
          const { x, y, width, height } = restrictToBounds(
            activeElement.type,
            activeElement.id,
            element.x,
            element.y,
            newSize,
            newSize,
            element.rotation,
            canvasRefs.canvasRef || canvasRefs.imageRef,
            shapes
          );
          updater(activeElement.id, {
            ...(activeElement.type === 'emoji' ? { size: width } : { width, height }),
            x,
            y,
          });
        }
      } else if (e.touches.length === 1) {
        handleDrag(e);
      }
    }, 8),
    [initialDistance, initialFontSize, activeElement, updateText, updateShape, updateEmoji, updatePhotoProperties, handleDrag, canvasRefs, shapes, texts]
  );

  const handleTouchEnd = useCallback(() => {
    setInitialDistance(null);
    handleStopDragging();
    handleStopRotation();
    handleCancelLongPress();
  }, [handleStopDragging, handleStopRotation, handleCancelLongPress]);

  const handleTextBlur = useCallback(
    (id, e) => {
      const newContent = e.target.value || 'Tap to edit';
      updateText(id, { content: newContent, color: newContent === 'Tap to edit' ? '#FF0000' : textColor });
      setIsEditing(false);
    },
    [updateText, textColor]
  );

  const handleTextKeyDown = useCallback(
    (id, e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const newContent = e.target.value || 'Tap to edit';
        updateText(id, { content: newContent, color: newContent === 'Tap to edit' ? '#FF0000' : textColor });
        setIsEditing(false);
      }
    },
    [updateText, textColor]
  );

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

  const handleImageUpload = useCallback(
    (e) => {
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
        setFilters({
          brightness: 100,
          contrast: 100,
          saturation: 100,
          grayscale: 0,
          sepia: 0,
          blur: 0,
        });
        setEraserSettings({ size: 10, opacity: 100, hardness: 100 });
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleMergeImages = useCallback(
    (e) => {
      const files = Array.from(e.target.files);
      if (!files.length || !canvasRefs.canvasRef?.current) return;

      const canvas = canvasRefs.canvasRef.current;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const totalImages = files.length; // Only new images, not combining with existing photos

      // Determine the grid size based on the number of images
      const gridSize = Math.ceil(Math.sqrt(totalImages));
      const imageWidth = canvasWidth / gridSize;
      const imageHeight = canvasHeight / gridSize;

      // Clear existing image and photos to treat merged photos as the primary content
      setImage(null);
      setPhotos([]);

      const newPhotos = files.map((file, index) => {
        const reader = new FileReader();
        return new Promise((resolve) => {
          reader.onload = (event) => {
            const id = `photo-${Date.now()}-${Math.random()}`;
            const col = index % gridSize;
            const row = Math.floor(index / gridSize);
            const proposedX = col * imageWidth;
            const proposedY = row * imageHeight;
            const { x, y, width, height } = restrictToBounds(
              'photo',
              id,
              proposedX,
              proposedY,
              imageWidth,
              imageHeight,
              0,
              canvasRefs.canvasRef,
              shapes
            );
            resolve({
              id,
              type: 'photo',
              src: event.target.result,
              x,
              y,
              width, // Use the calculated width to match grid size
              height, // Use the calculated height to match grid size
              opacity: photoOpacity / 100,
              brightness: photoBrightness / 100,
              rotation: 0,
            });
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(newPhotos).then((newPhotosArray) => {
        setPhotos(newPhotosArray);
        setActiveElement({ type: 'photo', id: newPhotosArray[0]?.id || null });
        setSelectedFeature('photo');
      });
    },
    [canvasRefs, photoOpacity, photoBrightness, shapes]
  );

  const handleFilterChange = useCallback((filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: parseInt(value) }));
  }, []);

  const handleTextColorChange = useCallback(
    (e) => {
      const newColor = e.target.value;
      setTextColor(newColor);
      if (activeElement.type === 'text' && activeElement.id && selectedFeature === 'text') {
        updateText(activeElement.id, { color: newColor });
      }
    },
    [activeElement, selectedFeature, updateText]
  );

  const handleStrokeColorChange = useCallback(
    (e) => {
      const newStroke = e.target.value;
      setStrokeColor(newStroke);
      if (activeElement.type === 'text' && activeElement.id && selectedFeature === 'text') {
        updateText(activeElement.id, { stroke: newStroke });
      }
    },
    [activeElement, selectedFeature, updateText]
  );

  const handleShapeFillColorChange = useCallback(
    (e) => {
      const newFillColor = e.target.value;
      setShapeFillColor(newFillColor);
      if (activeElement.type === 'shape' && activeElement.id && selectedFeature === 'shape') {
        updateShape(activeElement.id, { fillColor: newFillColor });
      }
    },
    [activeElement, selectedFeature, updateShape]
  );

  const handleShapeOutlineColorChange = useCallback(
    (e) => {
      const newOutlineColor = e.target.value;
      setShapeOutlineColor(newOutlineColor);
      if (activeElement.type === 'shape' && activeElement.id && selectedFeature === 'shape') {
        updateShape(activeElement.id, { outlineColor: newOutlineColor });
      }
    },
    [activeElement, selectedFeature, updateShape]
  );

  const handleShapeOutlineWidthChange = useCallback(
    (e) => {
      const newOutlineWidth = parseInt(e.target.value);
      setShapeOutlineWidth(newOutlineWidth);
      if (activeElement.type === 'shape' && activeElement.id && selectedFeature === 'shape') {
        updateShape(activeElement.id, { outlineWidth: newOutlineWidth });
      }
    },
    [activeElement, selectedFeature, updateShape]
  );

  const handlePhotoOpacityChange = useCallback(
    (e) => {
      const newOpacity = parseInt(e.target.value);
      setPhotoOpacity(newOpacity);
      if (activeElement.type === 'photo' && activeElement.id && selectedFeature === 'photo') {
        updatePhotoProperties(activeElement.id, { opacity: newOpacity / 100 });
      }
    },
    [activeElement, selectedFeature, updatePhotoProperties]
  );

  const handlePhotoBrightnessChange = useCallback(
    (e) => {
      const newBrightness = parseInt(e.target.value);
      setPhotoBrightness(newBrightness);
      if (activeElement.type === 'photo' && activeElement.id && selectedFeature === 'photo') {
        updatePhotoProperties(activeElement.id, { brightness: newBrightness / 100 });
      }
    },
    [activeElement, selectedFeature, updatePhotoProperties]
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
        const { x, y, width: size } = restrictToBounds('emoji', activeElement.id, emoji.x, emoji.y, newSize, newSize, emoji.rotation, canvasRefs.canvasRef || canvasRefs.imageRef, shapes);
        updateEmoji(activeElement.id, { size, x, y });
      }
    },
    [activeElement, selectedFeature, emojis, updateEmoji, canvasRefs, shapes]
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
          updatePhotoProperties={updatePhotoProperties}
          textInputRef={textInputRef}
          fileInputRef={fileInputRef}
          updateText={updateText}
          eraserSettings={eraserSettings}
          selectedFeature={selectedFeature}
          isCropping={isCropping}
        />
        {(image || photos.length > 0) && (
          <>
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
              filters={filters}
              updateShapeProperties={updateShapeProperties}
              handleImageUpload={handleImageUpload}
              newPhotoInputRef={fileInputRef}
              handleMergeImages={handleMergeImages}
              mergeInputRef={mergeInputRef}
              handleTemplateClick={handleTemplateClick}
              eraserSettings={eraserSettings}
              handleEraserChange={handleEraserChange}
            />
            <MemeDownload
              image={image}
              texts={texts}
              shapes={shapes}
              emojis={emojis}
              photos={photos}
              filters={filters}
              canvasRefs={canvasRefs}
            />
          </>
        )}
        {showTemplateModal && (
          <MemeTemplate
            currentMeme={null}
            onClose={handleTemplateClose}
            onSelect={handleTemplateSelect}
          />
        )}
      </div>
    </div>
  );
};