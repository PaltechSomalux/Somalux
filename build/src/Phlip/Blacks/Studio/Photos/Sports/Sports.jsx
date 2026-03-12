import React, { useState, useCallback, useRef } from 'react';
import './Sports.css';
import { SportsCanvas } from './SportsCanvas';
import { SportsControls } from './SportsControls';
import { SportsDownload } from './SportsDownload';
import { measureTextWidth, getImageCenter, restrictToBounds, loadImage, throttleEvent } from './SportsUtils';
import { FONT_FAMILIES, TEXT_COLORS, UNDERLINE_STYLES } from './SportsConstants';
import { SportTemplate } from './SportTemplate/SportTemplate';

export const Sports = () => {
  const [image, setImage] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [texts, setTexts] = useState([]);
  const [logos, setLogos] = useState([]);
  const [team1Logo, setTeam1Logo] = useState(null);
  const [team2Logo, setTeam2Logo] = useState(null);
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [team1Goals, setTeam1Goals] = useState([]);
  const [team2Goals, setTeam2Goals] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState('');
  const [matchStatus, setMatchStatus] = useState('Full-Time');
  const [customMatchTime, setCustomMatchTime] = useState('');
  const [spokesperson, setSpokesperson] = useState('');
  const [matchDateTime, setMatchDateTime] = useState({
    weekday: new Date().toLocaleString('en-US', { weekday: 'short' }),
    day: new Date().getDate(),
    month: new Date().toLocaleString('en-US', { month: 'short' }),
    hour: new Date().getHours().toString(),
    minute: '45',
    year: new Date().getFullYear().toString(),
  });
  const [imageDimensions, setImageDimensions] = useState({ width: 500, height: 281.25 });
  const [activeElement, setActiveElement] = useState({ type: null, id: null });
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [fontFamily, setFontFamily] = useState('Impact');
  const [textColor, setTextColor] = useState(TEXT_COLORS[1].value);
  const [strokeColor, setStrokeColor] = useState(TEXT_COLORS[1].value);
  const [logoOpacity, setLogoOpacity] = useState(100);
  const [logoBrightness, setLogoBrightness] = useState(100);
  const [textStyles, setTextStyles] = useState({
    bold: false,
    italic: false,
    underline: 'none',
  });
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isRotating, setIsRotating] = useState(false);
  const [rotationStartAngle, setRotationStartAngle] = useState(0);
  const [rotationCenter, setRotationCenter] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [initialDistance, setInitialDistance] = useState(null);
  const [initialFontSize, setInitialFontSize] = useState(40);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    grayscale: 0,
    sepia: 0,
    blur: 0,
  });
  const [canvasRefs, setCanvasRefs] = useState({ canvasRef: null, imageRef: null, additionalImageRefs: [] });
  const [showTeamTemplate, setShowTeamTemplate] = useState({ team: null, visible: false });
  const [isMatchday, setIsMatchday] = useState(false);
  const [showScoreBox, setShowScoreBox] = useState(true);

  const textInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const sportTemplateRef = useRef(null);

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target.result);
      setAdditionalImages([]);
      setTexts([]);
      setLogos([]);
      setTeam1Logo(null);
      setTeam2Logo(null);
      setTeam1Score(0);
      setTeam2Score(0);
      setTeam1Goals([]);
      setTeam2Goals([]);
      setSelectedCompetition('');
      setMatchStatus('Full-Time');
      setCustomMatchTime('');
      setSpokesperson('');
      setMatchDateTime({
        weekday: new Date().toLocaleString('en-US', { weekday: 'short' }),
        day: new Date().getDate(),
        month: new Date().toLocaleString('en-US', { month: 'short' }),
        hour: new Date().getHours().toString(),
        minute: '45',
        year: new Date().getFullYear().toString(),
      });
      setActiveElement({ type: null, id: null });
      setSelectedFeature(null);
      setIsMatchday(false);
      setShowScoreBox(true);
      setFilters({
        brightness: 100,
        contrast: 100,
        saturation: 100,
        grayscale: 0,
        sepia: 0,
        blur: 0,
      });
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAdditionalImageUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file || additionalImages.length >= 3) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setAdditionalImages((prev) => [...prev, event.target.result]);
    };
    reader.readAsDataURL(file);
  }, [additionalImages.length]);

  const updateText = useCallback((id, updates) => {
    setTexts((prev) => prev.map((text) => (text.id === id ? { ...text, ...updates } : text)));
  }, []);

  const updateTextProperties = useCallback((id, updates) => {
    setTexts((prev) => prev.map((text) => (text.id === id ? { ...text, ...updates } : text)));
  }, [setTexts]);

  const updateLogoProperties = useCallback((id, updates) => {
    setLogos((prev) => prev.map((logo) => (logo.id === id ? { ...logo, ...updates } : logo)));
  }, []);

  const addGoal = useCallback((team) => {
    if (team === 'team1') {
      setTeam1Goals((prev) => [...prev, { player: '', time: '' }]);
      setTeam1Score((prev) => prev + 1);
    } else {
      setTeam2Goals((prev) => [...prev, { player: '', time: '' }]);
      setTeam2Score((prev) => prev + 1);
    }
  }, []);

  const updateGoal = useCallback((team, index, field, value) => {
    if (team === 'team1') {
      const updatedGoals = [...team1Goals];
      updatedGoals[index] = { ...updatedGoals[index], [field]: value };
      setTeam1Goals(updatedGoals);
    } else {
      const updatedGoals = [...team2Goals];
      updatedGoals[index] = { ...updatedGoals[index], [field]: value };
      setTeam2Goals(updatedGoals);
    }
  }, [team1Goals, team2Goals]);

  const removeGoal = useCallback((team, index) => {
    if (team === 'team1') {
      setTeam1Goals((prev) => prev.filter((_, i) => i !== index));
      setTeam1Score((prev) => Math.max(0, prev - 1));
    } else {
      setTeam2Goals((prev) => prev.filter((_, i) => i !== index));
      setTeam2Score((prev) => Math.max(0, prev - 1));
    }
  }, []);

  const addText = useCallback(() => {
    const { x, y } = getImageCenter(canvasRefs.canvasRef || canvasRefs.imageRef);
    const newText = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: 'Tap to edit',
      x: additionalImages.length > 0 && (isMatchday || selectedFeature === 'quote') ? x / 2 : x,
      y,
      fontFamily,
      fontSize: 40,
      color: '#FF0000',
      stroke: strokeColor,
      rotation: 0,
      bold: textStyles.bold,
      italic: textStyles.italic,
      underline: textStyles.underline,
      width: 0, // Initialize width
      height: 0, // Initialize height
    };
    const textWidth = measureTextWidth(newText.content, newText.fontSize, newText.fontFamily, newText.bold, newText.italic);
    const { x: boundedX, y: boundedY } = restrictToBounds('text', newText.id, newText.x, y, textWidth, newText.fontSize, 0, canvasRefs.canvasRef || canvasRefs.imageRef, logos);
    setTexts((prev) => [...prev, { ...newText, x: boundedX, y: boundedY, width: textWidth, height: newText.fontSize }]);
    setActiveElement({ type: 'text', id: newText.id });
    setSelectedFeature('text');
    setIsEditing(true);
  }, [fontFamily, strokeColor, textStyles, canvasRefs, logos, additionalImages.length, isMatchday, selectedFeature]);

  const addLogo = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const { x, y } = getImageCenter(canvasRefs.canvasRef || canvasRefs.imageRef);
        const newLogo = {
          id: selectedFeature === 'quote' ? 'quoteImage' : `logo-${Date.now()}`,
          type: 'logo',
          src: event.target.result,
          x: additionalImages.length > 0 && (isMatchday || selectedFeature === 'quote') ? x / 2 : x,
          y,
          width: 100,
          height: 100,
          opacity: logoOpacity / 100,
          brightness: logoBrightness / 100,
          rotation: 0,
        };
        const { x: boundedX, y: boundedY, width, height } = restrictToBounds('logo', newLogo.id, newLogo.x, y, 100, 100, 0, canvasRefs.canvasRef || canvasRefs.imageRef, logos);
        setLogos((prev) => [...prev.filter((logo) => logo.id !== 'quoteImage'), { ...newLogo, x: boundedX, y: boundedY, width, height }]);
        setActiveElement({ type: 'logo', id: newLogo.id });
        setSelectedFeature('logo');
      };
      reader.readAsDataURL(file);
    },
    [logoOpacity, logoBrightness, canvasRefs, logos, additionalImages.length, isMatchday, selectedFeature]
  );

  const deleteElement = useCallback(() => {
    if (!activeElement.id) return;

    switch (activeElement.type) {
      case 'text':
        setTexts((prev) => prev.filter((text) => text.id !== activeElement.id));
        break;
      case 'logo':
        setLogos((prev) => prev.filter((logo) => logo.id !== activeElement.id));
        break;
      default:
        return;
    }

    setActiveElement({ type: null, id: null });
    setSelectedFeature(null);
  }, [activeElement]);

  const handleElementClick = useCallback(
    (type, id, e) => {
      e.stopPropagation();
      setActiveElement({ type, id });
      setSelectedFeature(type);

      const element = type === 'text' ? texts.find((t) => t.id === id) : logos.find((p) => p.id === id);

      if (!element) return;

      if (type === 'text') {
        setTextStyles({
          bold: element.bold || false,
          italic: element.italic || false,
          underline: element.underline || 'none',
        });
        setTextColor(element.color || TEXT_COLORS[1].value);
        setStrokeColor(element.stroke || TEXT_COLORS[1].value);
        setFontFamily(element.fontFamily || 'Impact');
      } else if (type === 'logo') {
        setLogoOpacity(element.opacity * 100 || 100);
        setLogoBrightness(element.brightness * 100 || 100);
      }
    },
    [texts, logos]
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

      const element = type === 'text' ? texts.find((t) => t.id === id) : logos.find((p) => p.id === id);

      if (!element) return;

      const clientX = e.clientX || (e.touches?.[0]?.clientX) || 0;
      const clientY = e.clientY || (e.touches?.[0]?.clientY) || 0;

      const width =
        type === 'text'
          ? element.width || measureTextWidth(element.content, element.fontSize, element.fontFamily, element.bold, element.italic)
          : element.width || 100;

      const height =
        type === 'text'
          ? element.height || element.fontSize || 40
          : element.height || 100;

      const { x, y } = restrictToBounds(type, id, element.x, element.y, width, height, element.rotation, canvasRefs.canvasRef || canvasRefs.imageRef, logos);
      setDragOffset({ x: clientX - x, y: clientY - y });
    },
    [texts, logos, canvasRefs]
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
        activeElement.type === 'text' ? texts.find((t) => t.id === activeElement.id) : logos.find((p) => p.id === activeElement.id);

      if (!element) return;

      const width =
        activeElement.type === 'text'
          ? element.width || measureTextWidth(element.content, element.fontSize, element.fontFamily, element.bold, element.italic)
          : element.width || 100;

      const height =
        activeElement.type === 'text'
          ? element.height || element.fontSize || 40
          : element.height || 100;

      const { x, y } = restrictToBounds(activeElement.type, activeElement.id, newX, newY, width, height, element.rotation, canvasRefs.canvasRef || canvasRefs.imageRef, logos);

      const updater = activeElement.type === 'text' ? updateText : updateLogoProperties;

      updater(activeElement.id, { x, y });
    }, 8),
    [dragging, activeElement, dragOffset, texts, logos, updateText, updateLogoProperties, canvasRefs]
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

      const element = type === 'text' ? texts.find((t) => t.id === id) : logos.find((p) => p.id === id);

      if (!element) return;

      setRotationCenter({ x: element.x, y: element.y });
      const clientX = e.clientX || (e.touches?.[0]?.clientX) || 0;
      const clientY = e.clientY || (e.touches?.[0]?.clientY) || 0;
      const dx = clientX - element.x;
      const dy = clientY - element.y;
      setRotationStartAngle(Math.atan2(dy, dx) * (180 / Math.PI) - (element.rotation || 0));
    },
    [texts, logos, handleCancelLongPress]
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

      const updater = activeElement.type === 'text' ? updateText : updateLogoProperties;

      updater(activeElement.id, { rotation: newRotation });
    }, 8),
    [isRotating, activeElement, rotationCenter, rotationStartAngle, updateText, updateLogoProperties]
  );

  const handleStopRotation = useCallback(() => {
    setIsRotating(false);
  }, []);

  const handleMouseWheelRotation = useCallback(
    (e) => {
      if (e.ctrlKey && activeElement.id) {
        e.preventDefault();
        const rotationDelta = e.deltaY * 0.2;

        const updater = activeElement.type === 'text' ? updateText : updateLogoProperties;

        const element =
          activeElement.type === 'text' ? texts.find((t) => t.id === activeElement.id) : logos.find((p) => p.id === activeElement.id);

        if (!element) return;

        const newRotation = (element.rotation || 0) - rotationDelta;
        updater(activeElement.id, { rotation: newRotation });
      }
    },
    [activeElement, texts, logos, updateText, updateLogoProperties]
  );

  const handleTextZoom = useCallback(
    throttleEvent((id, e) => {
      if (activeElement.type !== 'text' || activeElement.id !== id) return;
      const delta = e.deltaY || 0;
      const text = texts.find((t) => t.id === id);
      if (!text) return;

      const newFontSize = Math.min(Math.max(text.fontSize - delta * 0.5, 10), 200);
      const textWidth = measureTextWidth(text.content, newFontSize, text.fontFamily, text.bold, text.italic);
      const { x, y } = restrictToBounds('text', id, text.x, text.y, textWidth, newFontSize, text.rotation, canvasRefs.canvasRef || canvasRefs.imageRef, logos);
      updateText(id, { fontSize: newFontSize, x, y, width: textWidth, height: newFontSize });
    }, 10),
    [activeElement, texts, updateText, canvasRefs, logos]
  );

  const handleLogoResize = useCallback(
    throttleEvent((id, e) => {
      if (activeElement.type !== 'logo' || activeElement.id !== id) return;
      const delta = e.deltaY || 0;
      const logo = logos.find((p) => p.id === id);
      if (!logo) return;

      const newWidth = Math.max(10, logo.width - delta);
      const newHeight = Math.max(10, logo.height - delta);
      const { x, y, width, height } = restrictToBounds('logo', id, logo.x, logo.y, newWidth, newHeight, logo.rotation, canvasRefs.canvasRef || canvasRefs.imageRef, logos);
      updateLogoProperties(id, { width, height, x, y });
    }, 10),
    [activeElement, logos, updateLogoProperties, canvasRefs]
  );

  const handleTouchZoom = useCallback(
    (type, id, e) => {
      if (e.touches.length === 2) {
        e.preventDefault();

        const element = type === 'text' ? texts.find((t) => t.id === id) : logos.find((p) => p.id === id);

        if (!element) return;

        setInitialFontSize(type === 'text' ? element.fontSize : element.width || 100);

        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        setInitialDistance(dist);
      }
    },
    [texts, logos]
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

        const updater = activeElement.type === 'text' ? updateText : updateLogoProperties;

        if (!updater || !activeElement.id) return;

        const element =
          activeElement.type === 'text' ? texts.find((t) => t.id === activeElement.id) : logos.find((p) => p.id === activeElement.id);

        if (!element) return;

        if (activeElement.type === 'text') {
          const textWidth = measureTextWidth(element.content, newSize, element.fontFamily, element.bold, element.italic);
          const { x, y } = restrictToBounds('text', activeElement.id, element.x, element.y, textWidth, newSize, element.rotation, canvasRefs.canvasRef || canvasRefs.imageRef, logos);
          updateText(activeElement.id, { fontSize: newSize, x, y, width: textWidth, height: newSize });
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
            logos
          );
          updateLogoProperties(activeElement.id, { width, height, x, y });
        }
      } else if (e.touches.length === 1) {
        handleDrag(e);
      }
    }, 8),
    [initialDistance, initialFontSize, activeElement, updateText, updateLogoProperties, handleDrag, canvasRefs, texts, logos]
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
      if (e.key === 'Enter' && e.shiftKey) {
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

  const handleLogoOpacityChange = useCallback(
    (e) => {
      const newOpacity = parseInt(e.target.value);
      setLogoOpacity(newOpacity);
      if (activeElement.type === 'logo' && activeElement.id && selectedFeature === 'logo') {
        updateLogoProperties(activeElement.id, { opacity: newOpacity / 100 });
      }
    },
    [activeElement, selectedFeature, updateLogoProperties]
  );

  const handleLogoBrightnessChange = useCallback(
    (e) => {
      const newBrightness = parseInt(e.target.value);
      setLogoBrightness(newBrightness);
      if (activeElement.type === 'logo' && activeElement.id && selectedFeature === 'logo') {
        updateLogoProperties(activeElement.id, { brightness: newBrightness / 100 });
      }
    },
    [activeElement, selectedFeature, updateLogoProperties]
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

  const handleTeam1Click = useCallback(() => {
    setShowTeamTemplate({ team: 'team1', visible: true });
  }, []);

  const handleTeam2Click = useCallback(() => {
    setShowTeamTemplate({ team: 'team2', visible: true });
  }, []);

  const handleTeamTemplateClose = useCallback(() => {
    setShowTeamTemplate({ team: null, visible: false });
  }, []);

  const handleTeamTemplateSelect = useCallback(
    (sport) => {
      const src = sport.value.startsWith('url(') ? sport.value.match(/url\((.*?)\)/)[1] : sport.value;
      const newLogo = {
        src,
        width: isMatchday || selectedFeature === 'quote' ? 80 : 60,
        height: isMatchday || selectedFeature === 'quote' ? 80 : 60,
        opacity: logoOpacity / 100,
        brightness: logoBrightness / 100,
        rotation: 0,
      };
      if (showTeamTemplate.team === 'team1') {
        setTeam1Logo(newLogo);
      } else if (showTeamTemplate.team === 'team2') {
        setTeam2Logo(newLogo);
      }
      setActiveElement({ type: 'logo', id: showTeamTemplate.team === 'team1' ? 'team1Logo' : 'team2Logo' });
      setSelectedFeature('logo');
      setShowTeamTemplate({ team: null, visible: false });
    },
    [logoOpacity, logoBrightness, showTeamTemplate.team, isMatchday, selectedFeature]
  );

  const handleMatchdayClick = useCallback(() => {
    setIsMatchday((prev) => !prev);
    setSelectedFeature(null);
    if (!isMatchday) {
      setTeam1Score(0);
      setTeam2Score(0);
      setTeam1Goals([]);
      setTeam2Goals([]);
      const now = new Date();
      const formattedDateTime = `${now.toLocaleString('en-US', { weekday: 'short' })} ${now.getDate()}/${now.toLocaleString('en-US', { month: 'short' })} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      setMatchStatus(formattedDateTime);
      setCustomMatchTime('');
      setSpokesperson('');
      setShowScoreBox(true);
    } else {
      setMatchStatus('Full-Time');
      setCustomMatchTime('');
      setSpokesperson('');
    }
  }, [isMatchday]);

  const handleQuoteClick = useCallback(() => {
    setSelectedFeature((prev) => (prev === 'quote' ? null : 'quote'));
    if (selectedFeature !== 'quote') {
      setTeam1Score(0);
      setTeam2Score(0);
      setTeam1Goals([]);
      setTeam2Goals([]);
      const now = new Date();
      const formattedDateTime = `${now.toLocaleString('en-US', { weekday: 'short' })} ${now.getDate()}/${now.toLocaleString('en-US', { month: 'short' })} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      setMatchStatus(formattedDateTime);
      setCustomMatchTime('');
      setSpokesperson('');
      setShowScoreBox(true);
      setIsMatchday(false);
    } else {
      setMatchStatus('Full-Time');
      setCustomMatchTime('');
      setSpokesperson('');
    }
  }, [selectedFeature]);

  return (
    <div className="sports-editor">
      <div className="editor-container">
        <SportsCanvas
          image={image}
          additionalImages={additionalImages}
          setAdditionalImages={setAdditionalImages}
          handleAdditionalImageUpload={handleAdditionalImageUpload}
          texts={texts}
          setTexts={setTexts}
          logos={logos}
          setLogos={setLogos}
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
          fontInfo={fontFamily} // Renamed to fontInfo to match SportsCanvas
          handleDrag={handleDrag}
          handleTouchMove={handleTouchMove}
          handleTouchEnd={handleTouchEnd}
          handleMouseWheelRotation={handleMouseWheelRotation}
          handleTextZoom={handleTextZoom}
          handleLogoResize={handleLogoResize}
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
          setCanvasRefs={setCanvasRefs}
          updateText={updateText}
          updateTextProperties={updateTextProperties} // Added new prop
          updateLogoProperties={updateLogoProperties}
          textInputRef={textInputRef}
          selectedFeature={selectedFeature}
          handleImageUpload={handleImageUpload}
          fileInputRef={fileInputRef}
          logoInputRef={logoInputRef}
          onTeam1Click={handleTeam1Click}
          onTeam2Click={handleTeam2Click}
          team1Logo={team1Logo}
          setTeam1Logo={setTeam1Logo}
          team2Logo={team2Logo}
          setTeam2Logo={setTeam2Logo}
          setImageDimensions={setImageDimensions}
          team1Score={team1Score}
          setTeam1Score={setTeam1Score}
          team2Score={team2Score}
          setTeam2Score={setTeam2Score}
          selectedCompetition={selectedCompetition}
          setSelectedCompetition={setSelectedCompetition}
          matchStatus={matchStatus}
          setMatchStatus={setMatchStatus}
          team1Goals={team1Goals}
          setTeam1Goals={setTeam1Goals}
          team2Goals={team2Goals}
          setTeam2Goals={setTeam2Goals}
          addGoal={addGoal}
          updateGoal={updateGoal}
          removeGoal={removeGoal}
          isMatchday={isMatchday}
          showScoreBox={showScoreBox}
          setShowScoreBox={setShowScoreBox}
          customMatchTime={customMatchTime}
          setCustomMatchTime={setCustomMatchTime}
          spokesperson={spokesperson}
          setSpokesperson={setSpokesperson}
          matchDateTime={matchDateTime}
          setMatchDateTime={setMatchDateTime}
        />
        {(image || logos.length > 0) && (
          <>
            <SportsControls
              addText={addText}
              addLogo={addLogo}
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
              logoOpacity={logoOpacity}
              handleLogoOpacityChange={handleLogoOpacityChange}
              logoBrightness={logoBrightness}
              handleLogoBrightnessChange={handleLogoBrightnessChange}
              filters={filters}
              handleImageUpload={handleImageUpload}
              newPhotoInputRef={fileInputRef}
              handleMatchdayClick={handleMatchdayClick}
              handleQuoteClick={handleQuoteClick}
            />
            <SportsDownload
              image={image}
              additionalImages={additionalImages}
              texts={texts}
              logos={logos}
              team1Logo={team1Logo}
              team2Logo={team2Logo}
              team1Score={team1Score}
              team2Score={team2Score}
              filters={filters}
              canvasRefs={canvasRefs}
              imageDimensions={imageDimensions}
              selectedCompetition={selectedCompetition}
              matchStatus={matchStatus}
              team1Goals={team1Goals}
              team2Goals={team2Goals}
              isMatchday={isMatchday}
              showScoreBox={showScoreBox}
              selectedFeature={selectedFeature}
              customMatchTime={customMatchTime}
              spokesperson={spokesperson}
              matchDateTime={matchDateTime}
              fontFamily={fontFamily}
            />
          </>
        )}
        {showTeamTemplate.visible && (
          <SportTemplate
            ref={sportTemplateRef}
            currentSport={null}
            onClose={handleTeamTemplateClose}
            onSelect={handleTeamTemplateSelect}
          />
        )}
      </div>
    </div>
  );
}; 