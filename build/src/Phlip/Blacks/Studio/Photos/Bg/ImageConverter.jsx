import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import "./ImageConverter.css";
import { 
  FiCrop, FiRotateCw, FiSliders, FiEdit, FiDownload, 
  FiTrash2, FiLayers, FiImage, FiX, 
  FiCheck, FiPlus, FiMinus, FiRefreshCw, FiSun, 
  FiDroplet, FiType, FiBold, FiItalic, 
  FiUnderline, FiAlignLeft, FiAlignCenter, FiAlignRight,
  FiMaximize2, FiEraser, FiSquare, FiCircle, 
  FiTriangle, FiArrowRight, FiSmile
} from 'react-icons/fi';
import { TbAdjustments, TbPhoto } from 'react-icons/tb';
import { IoMdColorFilter } from 'react-icons/io';
import { RiContrastDrop2Line } from 'react-icons/ri';
import {Toolbar} from './Toolbar';
import { SidebarTools } from './SidebarTools/SidebarTools';
import {CanvasArea} from './CanvasArea';
import {BottomToolbar} from './BottomToolbar';
import {UploadZone} from './UploadZone';

export const ImageConverter = () => {
  // State management
  const [image, setImage] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [activeTool, setActiveTool] = useState(null);
  const [filters, setFilters] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 1,
    temperature: 0
  });
  const [eraseSettings, setEraseSettings] = useState({
    brushSize: 10,
    hardness: 0.5
  });
  const [resizeSettings, setResizeSettings] = useState({
    width: 0,
    height: 0,
    maintainAspectRatio: true
  });
  const [watermark, setWatermark] = useState({
    image: null,
    opacity: 0.7,
    scale: 0.2,
    position: { x: 20, y: 20 }
  });
  const [textElements, setTextElements] = useState([]);
  const [currentText, setCurrentText] = useState({
    content: '',
    color: '#ffffff',
    size: 24,
    font: 'Arial',
    bold: false,
    italic: false,
    underline: false,
    align: 'left',
    position: { x: 100, y: 100 }
  });
  const [doodles, setDoodles] = useState([]);
  const [currentDoodle, setCurrentDoodle] = useState(null);
  const [doodleSettings, setDoodleSettings] = useState({
    mode: 'free', // 'free', 'line', 'rectangle', 'circle', 'triangle', 'arrow', 'emoji'
    color: '#000000',
    size: 3,
    emoji: '😊'
  });
  const [isErasing, setIsErasing] = useState(false);
  const [isDoodling, setIsDoodling] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [transform, setTransform] = useState({
    zoom: 1,
    rotation: 0
  });
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  
  // Refs
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const toolsContainerRef = useRef(null);

  // Handle file drop/upload
  const onImageDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(e.target.result);
        setImage(e.target.result);
        setOriginalDimensions({ width: img.width, height: img.height });
        setResizeSettings({
          width: img.width,
          height: img.height,
          maintainAspectRatio: true
        });
        setActiveTool(null);
        setFilters({
          brightness: 0,
          contrast: 0,
          saturation: 1,
          temperature: 0
        });
        setTransform({
          zoom: 1,
          rotation: 0
        });
        setHistory([e.target.result]);
        setHistoryIndex(0);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps: getImageRootProps, getInputProps: getImageInputProps } = useDropzone({
    accept: {'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']},
    maxFiles: 1,
    onDrop: onImageDrop,
  });

  // Handle watermark drop
  const onWatermarkDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setWatermark(prev => ({
        ...prev,
        image: e.target.result
      }));
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps: getWatermarkRootProps, getInputProps: getWatermarkInputProps } = useDropzone({
    accept: {'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']},
    maxFiles: 1,
    onDrop: onWatermarkDrop,
  });

  // Save to history
  const saveToHistory = useCallback((canvasData) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(canvasData);
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // Undo/redo functionality
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setImage(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setImage(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Draw image on canvas with all transformations and filters
  const drawImageToCanvas = useCallback(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      
      // Apply transformations
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(transform.rotation * Math.PI / 180);
      ctx.scale(transform.zoom, transform.zoom);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
      
      // Apply filters
      ctx.filter = getFilterString();
      
      // Draw image
      ctx.drawImage(img, 0, 0);
      ctx.restore();
      
      // Apply watermark if exists
      if (watermark.image) {
        const watermarkImg = new Image();
        watermarkImg.onload = () => {
          ctx.save();
          ctx.globalAlpha = watermark.opacity;
          const width = watermarkImg.width * watermark.scale;
          const height = watermarkImg.height * watermark.scale;
          ctx.drawImage(
            watermarkImg, 
            watermark.position.x, 
            watermark.position.y, 
            width, 
            height
          );
          ctx.restore();
        };
        watermarkImg.src = watermark.image;
      }

      // Draw text elements
      textElements.forEach(text => {
        ctx.save();
        ctx.font = `${text.bold ? 'bold ' : ''}${text.italic ? 'italic ' : ''}${text.size}px ${text.font}`;
        ctx.fillStyle = text.color;
        ctx.textAlign = text.align;
        ctx.textBaseline = 'top';
        
        if (text.underline) {
          ctx.strokeStyle = text.color;
          ctx.lineWidth = 1;
        }
        
        const textMetrics = ctx.measureText(text.content);
        const textWidth = textMetrics.width;
        
        let x = text.position.x;
        if (text.align === 'center') x = canvas.width / 2;
        if (text.align === 'right') x = canvas.width - text.position.x;
        
        ctx.fillText(text.content, x, text.position.y);
        
        if (text.underline) {
          ctx.beginPath();
          ctx.moveTo(x, text.position.y + text.size + 2);
          ctx.lineTo(x + (text.align === 'left' ? textWidth : 
                        text.align === 'center' ? textWidth / 2 : -textWidth), 
                    text.position.y + text.size + 2);
          ctx.stroke();
        }
        
        ctx.restore();
      });

      // Draw doodles
      doodles.forEach(doodle => {
        ctx.save();
        ctx.strokeStyle = doodle.color;
        ctx.fillStyle = doodle.color;
        ctx.lineWidth = doodle.size;
        
        switch(doodle.type) {
          case 'free':
            ctx.beginPath();
            ctx.moveTo(doodle.points[0].x, doodle.points[0].y);
            doodle.points.forEach(point => {
              ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
            break;
          case 'line':
            ctx.beginPath();
            ctx.moveTo(doodle.start.x, doodle.start.y);
            ctx.lineTo(doodle.end.x, doodle.end.y);
            ctx.stroke();
            break;
          case 'rectangle':
            ctx.strokeRect(doodle.x, doodle.y, doodle.width, doodle.height);
            break;
          case 'circle':
            ctx.beginPath();
            ctx.arc(doodle.x, doodle.y, doodle.radius, 0, Math.PI * 2);
            ctx.stroke();
            break;
          case 'triangle':
            ctx.beginPath();
            ctx.moveTo(doodle.points[0].x, doodle.points[0].y);
            ctx.lineTo(doodle.points[1].x, doodle.points[1].y);
            ctx.lineTo(doodle.points[2].x, doodle.points[2].y);
            ctx.closePath();
            ctx.stroke();
            break;
          case 'arrow':
            // Draw arrow implementation
            break;
          case 'emoji':
            ctx.font = `${doodle.size * 5}px serif`;
            ctx.fillText(doodle.emoji, doodle.x, doodle.y);
            break;
          default:
            break;
        }
        
        ctx.restore();
      });
    };

    img.src = image;
  }, [image, transform, filters, watermark, textElements, doodles]);

  // Get filter string for canvas context
  const getFilterString = useCallback(() => {
    return `
      brightness(${1 + filters.brightness})
      contrast(${1 + filters.contrast})
      saturate(${filters.saturation})
      sepia(${Math.max(0, filters.temperature / 100)})
      hue-rotate(${filters.temperature * 3.6}deg)
    `.trim().replace(/\s+/g, ' ');
  }, [filters]);

  // Apply watermark to canvas
  const applyWatermark = useCallback(() => {
    if (!watermark.image) return;
    
    drawImageToCanvas();
    saveToHistory(canvasRef.current.toDataURL());
  }, [watermark, drawImageToCanvas, saveToHistory]);

  // Start erasing on canvas
  const startErasing = useCallback((e) => {
    if (!isErasing || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    setStartPos({
      x: (e.clientX - rect.left) / transform.zoom,
      y: (e.clientY - rect.top) / transform.zoom
    });
  }, [isErasing, transform.zoom]);

  // Erase on canvas
  const erase = useCallback((e) => {
    if (!isErasing || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const currentPos = {
      x: (e.clientX - rect.left) / transform.zoom,
      y: (e.clientY - rect.top) / transform.zoom
    };
    
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(currentPos.x, currentPos.y, eraseSettings.brushSize, 0, Math.PI * 2);
    ctx.fill();
    
    setStartPos(currentPos);
  }, [isErasing, eraseSettings.brushSize, transform.zoom]);

  // Stop erasing
  const stopErasing = useCallback(() => {
    if (isErasing) {
      setIsErasing(false);
      const ctx = canvasRef.current.getContext('2d');
      ctx.globalCompositeOperation = 'source-over';
      saveToHistory(canvasRef.current.toDataURL());
    }
  }, [isErasing, saveToHistory]);

  // Start doodling on canvas
  const startDoodling = useCallback((e) => {
    if (!isDoodling || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const pos = {
      x: (e.clientX - rect.left) / transform.zoom,
      y: (e.clientY - rect.top) / transform.zoom
    };
    
    setStartPos(pos);
    
    // Initialize new doodle based on mode
    const newDoodle = {
      type: doodleSettings.mode,
      color: doodleSettings.color,
      size: doodleSettings.size,
      points: [pos],
      start: pos,
      emoji: doodleSettings.mode === 'emoji' ? doodleSettings.emoji : null
    };
    
    setCurrentDoodle(newDoodle);
  }, [isDoodling, transform.zoom, doodleSettings]);

  // Continue doodling on canvas
  const continueDoodling = useCallback((e) => {
    if (!isDoodling || !currentDoodle || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const pos = {
      x: (e.clientX - rect.left) / transform.zoom,
      y: (e.clientY - rect.top) / transform.zoom
    };
    
    // Update current doodle based on mode
    const updatedDoodle = {
      ...currentDoodle,
      points: [...currentDoodle.points, pos],
      end: pos,
      width: pos.x - currentDoodle.start.x,
      height: pos.y - currentDoodle.start.y,
      radius: Math.sqrt(
        Math.pow(pos.x - currentDoodle.start.x, 2) + 
        Math.pow(pos.y - currentDoodle.start.y, 2)
      )
    };
    
    setCurrentDoodle(updatedDoodle);
    drawImageToCanvas(); // Redraw to show live preview
  }, [isDoodling, currentDoodle, transform.zoom, drawImageToCanvas]);

  // Stop doodling and add to doodles array
  const stopDoodling = useCallback(() => {
    if (isDoodling && currentDoodle) {
      setDoodles(prev => [...prev, currentDoodle]);
      setCurrentDoodle(null);
      saveToHistory(canvasRef.current.toDataURL());
    }
    setIsDoodling(false);
  }, [isDoodling, currentDoodle, saveToHistory]);

  // Add text to canvas
  const addText = useCallback(() => {
    if (!currentText.content.trim()) return;
    
    setTextElements(prev => [...prev, currentText]);
    setCurrentText(prev => ({
      ...prev,
      content: '',
      position: { x: prev.position.x + 20, y: prev.position.y + 20 }
    }));
    
    drawImageToCanvas();
    saveToHistory(canvasRef.current.toDataURL());
  }, [currentText, drawImageToCanvas, saveToHistory]);

  // Update text property
  const updateTextProperty = useCallback((property, value) => {
    setCurrentText(prev => ({
      ...prev,
      [property]: value
    }));
  }, []);

  // Remove text element
  const removeText = useCallback((index) => {
    setTextElements(prev => prev.filter((_, i) => i !== index));
    drawImageToCanvas();
    saveToHistory(canvasRef.current.toDataURL());
  }, [drawImageToCanvas, saveToHistory]);

  // Remove doodle element
  const removeDoodle = useCallback((index) => {
    setDoodles(prev => prev.filter((_, i) => i !== index));
    drawImageToCanvas();
    saveToHistory(canvasRef.current.toDataURL());
  }, [drawImageToCanvas, saveToHistory]);

  // Export image in specified format
  const exportImage = useCallback((format = 'png', quality = 1) => {
    if (!canvasRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = canvasRef.current.width;
    canvas.height = canvasRef.current.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(canvasRef.current, 0, 0);
    
    const dataUrl = canvas.toDataURL(`image/${format}`, quality);
    
    const link = document.createElement('a');
    link.download = `edited-image.${format}`;
    link.href = dataUrl;
    link.click();
  }, []);

  // Reset all transformations
  const resetTransformations = useCallback(() => {
    setTransform({
      zoom: 1,
      rotation: 0
    });
  }, []);

  // Rotate image by specified degrees
  const rotateImage = useCallback((degrees) => {
    setTransform(prev => ({
      ...prev,
      rotation: (prev.rotation + degrees) % 360
    }));
  }, []);

  // Adjust zoom level
  const adjustZoom = useCallback((amount) => {
    setTransform(prev => ({
      ...prev,
      zoom: Math.min(Math.max(prev.zoom + amount, 0.1), 3)
    }));
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters({
      brightness: 0,
      contrast: 0,
      saturation: 1,
      temperature: 0
    });
  }, []);

  // Update filter value
  const updateFilter = useCallback((filter, value) => {
    setFilters(prev => ({
      ...prev,
      [filter]: value
    }));
  }, []);

  // Update erase setting
  const updateEraseSetting = useCallback((setting, value) => {
    setEraseSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  }, []);

  // Update doodle setting
  const updateDoodleSetting = useCallback((setting, value) => {
    setDoodleSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  });

  // Update resize setting
  const updateResizeSetting = useCallback((setting, value) => {
    setResizeSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  });

  // Apply resize to image
  const applyResize = useCallback(() => {
    if (!canvasRef.current || !originalImage) return;

    const canvas = document.createElement('canvas');
    canvas.width = resizeSettings.width;
    canvas.height = resizeSettings.height;
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, resizeSettings.width, resizeSettings.height);
      const resizedDataUrl = canvas.toDataURL();
      setImage(resizedDataUrl);
      saveToHistory(resizedDataUrl);
    };
    img.src = originalImage;
  }, [resizeSettings, originalImage, saveToHistory]);

  // Update watermark setting
  const updateWatermarkSetting = useCallback((setting, value) => {
    setWatermark(prev => ({
      ...prev,
      [setting]: value
    }));
  }, []);

  // Effect to redraw canvas when dependencies change
  useEffect(() => {
    drawImageToCanvas();
  }, [image, transform, filters, watermark, textElements, doodles, drawImageToCanvas]);

  // Effect to scroll tools container to show active tool
  useEffect(() => {
    if (activeTool && toolsContainerRef.current) {
      const activeButton = toolsContainerRef.current.querySelector('.tool-button.active');
      if (activeButton) {
        activeButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [activeTool]);

  return (
    <div className="image-editor-container">
      {!image ? (
        <UploadZone 
          getImageRootProps={getImageRootProps} 
          getImageInputProps={getImageInputProps} 
        />
      ) : (
        <div className="editor-container">
          <Toolbar 
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            rotateImage={rotateImage}
            adjustZoom={adjustZoom}
            transform={transform}
            resetTransformations={resetTransformations}
            undo={undo}
            redo={redo}
            historyIndex={historyIndex}
            history={history}
            toolsContainerRef={toolsContainerRef}
            setDoodleMode={(mode) => {
              setActiveTool('doodle');
              updateDoodleSetting('mode', mode);
              setIsDoodling(true);
              setIsErasing(false);
            }}
          />
          
          <div className="editor-area">
            <SidebarTools 
              activeTool={activeTool}
              setActiveTool={setActiveTool}
              filters={filters}
              updateFilter={updateFilter}
              resetFilters={resetFilters}
              currentText={currentText}
              updateTextProperty={updateTextProperty}
              addText={addText}
              textElements={textElements}
              removeText={removeText}
              watermark={watermark}
              getWatermarkRootProps={getWatermarkRootProps}
              getWatermarkInputProps={getWatermarkInputProps}
              updateWatermarkSetting={updateWatermarkSetting}
              applyWatermark={applyWatermark}
              resizeSettings={resizeSettings}
              updateResizeSetting={updateResizeSetting}
              applyResize={applyResize}
              originalDimensions={originalDimensions}
              eraseSettings={eraseSettings}
              updateEraseSetting={updateEraseSetting}
              applyErase={() => {
                drawImageToCanvas();
                saveToHistory(canvasRef.current.toDataURL());
              }}
              doodleSettings={doodleSettings}
              updateDoodleSetting={updateDoodleSetting}
              doodles={doodles}
              removeDoodle={removeDoodle}
            />
            
            <CanvasArea 
              canvasRef={canvasRef}
              canvasContainerRef={canvasContainerRef}
              transform={transform}
              isErasing={isErasing}
              startErasing={startErasing}
              erase={erase}
              stopErasing={stopErasing}
              eraseSettings={eraseSettings}
              isDoodling={isDoodling}
              startDoodling={startDoodling}
              continueDoodling={continueDoodling}
              stopDoodling={stopDoodling}
              doodleSettings={doodleSettings}
            />
          </div>
          
          <BottomToolbar 
            setImage={setImage}
            setActiveTool={setActiveTool}
            setHistory={setHistory}
            setHistoryIndex={setHistoryIndex}
            exportImage={exportImage}
          />
        </div>
      )}
    </div>
  );
};