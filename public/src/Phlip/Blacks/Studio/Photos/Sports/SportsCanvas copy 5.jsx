import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SportsTextElements } from './SportsTextElements';
import './Sports.css';
import PaltechWhite from '../../../../../Assets/PaltechWhite.png';

export const SportsCanvas = ({
  image,
  secondImage,
  setSecondImage,
  handleSecondImageUpload,
  texts,
  setTexts,
  logos,
  setLogos,
  filters,
  activeElement,
  setActiveElement,
  dragging,
  isRotating,
  isEditing,
  setIsEditing,
  textStyles,
  textColor,
  strokeColor,
  fontFamily,
  handleDrag,
  handleTouchMove,
  handleTouchEnd,
  handleMouseWheelRotation,
  handleTextZoom,
  handleLogoResize,
  startDragging,
  stopDragging,
  startRotation,
  handleRotation,
  stopRotation,
  handleElementClick,
  handleDoubleClick,
  startLongPress,
  handleTextBlur,
  handleTextKeyDown,
  handleTouchZoom,
  setImage,
  setCanvasRefs,
  updateText,
  updateLogoProperties,
  textInputRef,
  selectedFeature,
  handleImageUpload,
  fileInputRef,
  logoInputRef,
  addLogo,
  onTeam1Click,
  onTeam2Click,
  team1Logo,
  team2Logo,
  setTeam1Logo,
  setTeam2Logo,
  setImageDimensions,
  team1Score,
  team2Score,
  setTeam1Score,
  setTeam2Score,
  selectedCompetition,
  setSelectedCompetition,
  matchStatus,
  setMatchStatus,
  team1Goals,
  setTeam1Goals,
  team2Goals,
  setTeam2Goals,
  addGoal,
  updateGoal,
  removeGoal,
  isMatchday,
}) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const secondImageRef = useRef(null);
  const wrapperRef = useRef(null);
  const secondImageInputRef = useRef(null);
  const [imageDimensionsLocal, setImageDimensionsLocal] = useState({ width: 0, height: 0 });
  const [logoMoved, setLogoMoved] = useState(false);
  const [customMatchTime, setCustomMatchTime] = useState('');
  const [matchDateTime, setMatchDateTime] = useState({
    weekday: new Date().toLocaleString('en-US', { weekday: 'short' }),
    day: new Date().getDate(),
    month: new Date().toLocaleString('en-US', { month: 'short' }),
    hour: new Date().getHours().toString(),
    minute: '45',
  });

  const scoreOptions = Array.from({ length: 20 }, (_, i) => i + 1);
  const timeOptions = Array.from({ length: 120 }, (_, i) => i + 1);

  const competitions = [
    'Premier League',
    'LaLiga',
    'Friendly',
    'FA Cup',
    'UEFA Champions League',
    'UEFA Europa League',
    'UEFA Europa Conference League',
    'Bundesliga',
    'Serie A',
    'Ligue 1',
    'Copa del Rey',
    'DFB-Pokal',
    'Coppa Italia',
    'Coupe de France',
    'EFL Cup',
    'FIFA World Cup',
    'UEFA European Championship',
    'Copa América',
    'Africa Cup of Nations',
    'CONMEBOL Libertadores',
    'CONMEBOL Sudamericana',
    'AFC Champions League',
    'MLS',
    'CONCACAF Champions Cup',
    'FIFA Club World Cup',
  ];

  const matchStatusOptions = ['Half-Time', 'Full-Time', 'Custom'];

  const generateDays = () => Array.from({ length: 31 }, (_, i) => i + 1);
  const generateMonths = () => [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const generateHours = () => Array.from({ length: 24 }, (_, i) => i.toString());
  const generateMinutes = () => ['00', '15', '30', '45'];
  const generateWeekdays = () => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const calculateWeekday = (day, month) => {
    const monthIndex = generateMonths().indexOf(month);
    const date = new Date(new Date().getFullYear(), monthIndex, day);
    return date.toLocaleString('en-US', { weekday: 'short' });
  };

  useEffect(() => {
    if (isMatchday) {
      const { day, month, hour, minute } = matchDateTime;
      const newWeekday = calculateWeekday(day, month);
      setMatchDateTime((prev) => ({ ...prev, weekday: newWeekday }));
      const formattedDateTime = `${newWeekday} ${day}/${month} ${hour}:${minute}`;
      setMatchStatus(formattedDateTime);
    }
  }, [isMatchday, matchDateTime, setMatchStatus]);

  useEffect(() => {
    if (image && !logos.some(logo => logo.id === 'paltechWhite')) {
      const logoWidth = 100;
      const logoHeight = 100;
      const padding = 10;
      setLogos((prevLogos) => [
        ...prevLogos,
        {
          id: 'paltechWhite',
          type: 'logo',
          src: PaltechWhite,
          x: imageDimensionsLocal.width ? imageDimensionsLocal.width / 2 - logoWidth / 2 - padding : 490,
          y: imageDimensionsLocal.height ? logoHeight / 2 + padding : 60,
          width: logoWidth,
          height: logoHeight,
          rotation: 0,
          opacity: 1,
          brightness: 1,
        },
      ]);
    }
  }, [image, imageDimensionsLocal, logos, setLogos, isMatchday, secondImage]);

  useEffect(() => {
    if (image && imageRef.current && canvasRef.current) {
      const img = imageRef.current;
      const canvas = canvasRef.current;
      const secondImg = secondImageRef.current;

      const updateDimensions = () => {
        if (isMatchday && secondImage && secondImg && secondImg.complete) {
          // When isMatchday and secondImage are present, set total canvas width to 2048
          const targetWidth = 2048;
          // Calculate height to maintain aspect ratio of the taller image
          const { naturalWidth: width1, naturalHeight: height1 } = img;
          const { naturalWidth: width2, naturalHeight: height2 } = secondImg;
          const aspectRatio1 = width1 / height1;
          const aspectRatio2 = width2 / height2;
          // Each image should fit in 1024 width
          const height1FromWidth = 1024 / aspectRatio1;
          const height2FromWidth = 1024 / aspectRatio2;
          // Use the larger height to ensure both images fit without cropping
          const targetHeight = Math.max(height1FromWidth, height2FromWidth);

          // Update state for canvas dimensions
          setImageDimensionsLocal({ width: targetWidth, height: targetHeight });
          setImageDimensions({ width: targetWidth, height: targetHeight });
          canvas.width = targetWidth;
          canvas.height = targetHeight;

          // Calculate scaling to fit within viewport
          const maxViewportWidth = window.innerWidth * 0.9; // 90% of viewport width
          const maxViewportHeight = window.innerHeight * 0.7; // 70% of viewport height
          const aspectRatio = targetWidth / targetHeight;
          let displayWidth = targetWidth;
          let displayHeight = targetHeight;

          // Scale down to fit viewport while preserving aspect ratio
          if (displayWidth > maxViewportWidth) {
            displayWidth = maxViewportWidth;
            displayHeight = displayWidth / aspectRatio;
          }
          if (displayHeight > maxViewportHeight) {
            displayHeight = maxViewportHeight;
            displayWidth = displayHeight * aspectRatio;
          }

          // Update wrapper styles
          if (wrapperRef.current) {
            wrapperRef.current.style.width = `${displayWidth}px`;
            wrapperRef.current.style.height = `${displayHeight}px`;
          }

          // Update logo positions if not moved
          if (!logoMoved) {
            setLogos((prevLogos) =>
              prevLogos.map((logo) =>
                logo.id === 'paltechWhite'
                  ? {
                      ...logo,
                      x: targetWidth / 2 - logo.width / 2 - 10,
                      y: logo.height / 2 + 10,
                    }
                  : logo
              )
            );
          }
        } else {
          // Single image or non-matchday logic
          const { naturalWidth, naturalHeight } = img;
          const aspectRatio = naturalWidth / naturalHeight;
          const maxViewportWidth = window.innerWidth * 0.9;
          const maxViewportHeight = window.innerHeight * 0.7;
          let width = naturalWidth;
          let height = naturalHeight;

          if (height > maxViewportHeight) {
            height = maxViewportHeight;
            width = height * aspectRatio;
          }
          if (width > maxViewportWidth) {
            width = maxViewportWidth;
            height = width / aspectRatio;
          }

          setImageDimensionsLocal({ width, height });
          setImageDimensions({ width, height });
          canvas.width = width;
          canvas.height = height;

          if (wrapperRef.current) {
            wrapperRef.current.style.width = `${width}px`;
            wrapperRef.current.style.height = `${height}px`;
          }

          if (!logoMoved) {
            setLogos((prevLogos) =>
              prevLogos.map((logo) =>
                logo.id === 'paltechWhite'
                  ? {
                      ...logo,
                      x: width - logo.width / 2 - 10,
                      y: logo.height / 2 + 10,
                    }
                  : logo
              )
            );
          }
        }
      };

      img.addEventListener('load', updateDimensions);
      if (secondImg) secondImg.addEventListener('load', updateDimensions);
      if (img.complete && (!secondImg || secondImg.complete)) updateDimensions();

      // Handle window resize to keep canvas responsive
      const handleResize = () => updateDimensions();
      window.addEventListener('resize', handleResize);

      return () => {
        img.removeEventListener('load', updateDimensions);
        if (secondImg) secondImg.removeEventListener('load', updateDimensions);
        window.removeEventListener('resize', handleResize);
      };
    } else if (!image && canvasRef.current) {
      const canvas = canvasRef.current;
      const defaultWidth = 500;
      const defaultHeight = defaultWidth * (9 / 16);
      setImageDimensionsLocal({ width: defaultWidth, height: defaultHeight });
      setImageDimensions({ width: defaultWidth, height: defaultHeight });
      canvas.width = defaultWidth;
      canvas.height = defaultHeight;
      if (wrapperRef.current) {
        wrapperRef.current.style.width = `${defaultWidth}px`;
        wrapperRef.current.style.height = `${defaultHeight}px`;
      }
    }
  }, [image, secondImage, isMatchday, setImageDimensions, logoMoved, setLogos]);

  useEffect(() => {
    if (setCanvasRefs) {
      setCanvasRefs({ canvasRef, imageRef, secondImageRef });
    }
  }, [setCanvasRefs]);

  const drawImageElement = useCallback(
    (ctx, logo) => {
      if (!logo.src) return;
      const img = new Image();
      img.src = logo.src;
      if (!img.complete) {
        img.onload = () => {
          ctx.save();
          ctx.translate(logo.x, logo.y);
          ctx.rotate((logo.rotation * Math.PI) / 180);
          ctx.globalAlpha = logo.opacity;
          ctx.filter = `brightness(${logo.brightness * 100}%)`;
          ctx.drawImage(img, -logo.width / 2, -logo.height / 2, logo.width, logo.height);
          ctx.restore();
        };
      } else {
        ctx.save();
        ctx.translate(logo.x, logo.y);
        ctx.rotate((logo.rotation * Math.PI) / 180);
        ctx.globalAlpha = logo.opacity;
        ctx.filter = `brightness(${logo.brightness * 100}%)`;
        ctx.drawImage(img, -logo.width / 2, -logo.height / 2, logo.width, logo.height);
        ctx.restore();
      }
    },
    []
  );

  const redrawCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (image && imageRef.current) {
      const img = imageRef.current;
      const width = isMatchday && secondImage ? canvas.width / 2 : canvas.width;
      const height = canvas.height;
      ctx.filter = `
        brightness(${filters.brightness}%)
        contrast(${filters.contrast}%)
        saturate(${filters.saturation}%)
        grayscale(${filters.grayscale}%)
        sepia(${filters.sepia}%)
        blur(${filters.blur}px)
      `;
      // Draw first image without distortion
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      const aspectRatio = imgWidth / imgHeight;
      let drawWidth = width;
      let drawHeight = height;
      if (drawWidth / drawHeight > aspectRatio) {
        drawWidth = drawHeight * aspectRatio;
      } else {
        drawHeight = drawWidth / aspectRatio;
      }
      const offsetX = (width - drawWidth) / 2;
      const offsetY = (height - drawHeight) / 2;
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      ctx.filter = 'none';
    }

    if (secondImage && secondImageRef.current && isMatchday) {
      const secondImg = secondImageRef.current;
      const width = canvas.width / 2;
      const height = canvas.height;
      ctx.filter = `
        brightness(${filters.brightness}%)
        contrast(${filters.contrast}%)
        saturate(${filters.saturation}%)
        grayscale(${filters.grayscale}%)
        sepia(${filters.sepia}%)
        blur(${filters.blur}px)
      `;
      // Draw second image without distortion
      const imgWidth = secondImg.naturalWidth;
      const imgHeight = secondImg.naturalHeight;
      const aspectRatio = imgWidth / imgHeight;
      let drawWidth = width;
      let drawHeight = height;
      if (drawWidth / drawHeight > aspectRatio) {
        drawWidth = drawHeight * aspectRatio;
      } else {
        drawHeight = drawWidth / aspectRatio;
      }
      const offsetX = canvas.width / 2 + (width - drawWidth) / 2;
      const offsetY = (height - drawHeight) / 2;
      ctx.drawImage(secondImg, offsetX, offsetY, drawWidth, drawHeight);
      ctx.filter = 'none';
    }

    logos.forEach((logo) => {
      if (logo.type === 'logo' && logo.id !== 'team1Logo' && logo.id !== 'team2Logo' && logo.id !== 'paltechWhite') {
        drawImageElement(ctx, logo);
      }
    });
  }, [image, secondImage, isMatchday, filters, imageDimensionsLocal, logos, drawImageElement]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const handleCanvasClick = useCallback(() => {
    setIsEditing(false);
    setActiveElement({ type: null, id: null });
  }, [setIsEditing, setActiveElement]);

  const handleImageUploadClick = useCallback(() => {
    fileInputRef.current.click();
  }, [fileInputRef]);

  const handleSecondImageUploadClick = useCallback(() => {
    secondImageInputRef.current.click();
  }, [secondImageInputRef]);

  useEffect(() => {
    const handleLogoDrag = (e) => {
      if (activeElement.type === 'logo' && activeElement.id === 'paltechWhite' && dragging) {
        setLogoMoved(true);
      }
    };

    window.addEventListener('pointermove', handleLogoDrag);
    return () => window.removeEventListener('pointermove', handleLogoDrag);
  }, [activeElement, dragging]);

  const handleMatchStatusChange = (value) => {
    setMatchStatus(value);
    if (value !== 'Custom') {
      setCustomMatchTime('');
    } else if (!customMatchTime) {
      setMatchStatus('Custom');
    }
  };

  const handleCustomTimeChange = (value) => {
    setCustomMatchTime(value);
    setMatchStatus(value ? `${value}'` : 'Custom');
  };

  return (
    <div
      className="canvas-wrapper"
      ref={wrapperRef}
      onPointerMove={handleDrag}
      onPointerUp={stopDragging}
      onPointerLeave={stopDragging}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleMouseWheelRotation}
      onClick={handleCanvasClick}
      style={{
        touchAction: 'none',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        className="image-container"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
        }}
      >
        {image && (
          <>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: isMatchday && secondImage ? '50%' : '100%',
                height: '100%',
              }}
            >
              <img
                ref={imageRef}
                src={image}
                alt="Sports background"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain', // Preserve aspect ratio, no distortion
                  display: 'block',
                }}
              />
            </div>
            {secondImage && isMatchday && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  width: '50%',
                  height: '100%',
                }}
              >
                <img
                  ref={secondImageRef}
                  src={secondImage}
                  alt="Second sports background"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain', // Preserve aspect ratio, no distortion
                    display: 'block',
                  }}
                />
              </div>
            )}
          </>
        )}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: image ? 'transparent' : '#f0f0f0',
          }}
        />
        {isMatchday && (
          <div
            className="add-second-image"
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              zIndex: 20,
            }}
          >
            <input
              type="file"
              ref={secondImageInputRef}
              onChange={handleSecondImageUpload}
              accept="image/*"
              style={{ display: 'none' }}
              aria-label="Upload second image"
            />
            <button
              className="add-second-image-button"
              onClick={handleSecondImageUploadClick}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                fontSize: '20px',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              }}
              aria-label="Add second image"
            >
              +
            </button>
          </div>
        )}
        <SportsTextElements
          texts={texts}
          activeElement={activeElement}
          isEditing={isEditing}
          textStyles={textStyles}
          textColor={textColor}
          strokeColor={strokeColor}
          fontFamily={fontFamily}
          dragging={dragging}
          isRotating={isRotating}
          handleDrag={handleDrag}
          handleTouchMove={handleTouchMove}
          handleTouchEnd={handleTouchEnd}
          handleTextZoom={handleTextZoom}
          startDragging={startDragging}
          stopDragging={stopDragging}
          startRotation={startRotation}
          handleRotation={handleRotation}
          stopRotation={stopRotation}
          handleElementClick={handleElementClick}
          handleDoubleClick={handleDoubleClick}
          startLongPress={startLongPress}
          handleMouseWheelRotation={handleMouseWheelRotation}
          handleTextBlur={handleTextBlur}
          handleTextKeyDown={handleTextKeyDown}
          textInputRef={textInputRef}
          updateText={updateText}
          handleTouchZoom={handleTouchZoom}
        />
        {logos
          .filter((logo) => logo.id !== 'team1Logo' && logo.id !== 'team2Logo')
          .map((logo) => (
            <div
              key={logo.id}
              className={`logo-element ${activeElement.id === logo.id && activeElement.type === 'logo' ? 'active' : ''}`}
              style={{
                position: 'absolute',
                left: logo.x,
                top: logo.y,
                transform: `translate(-50%, -50%) rotate(${logo.rotation}deg)`,
                width: logo.width,
                height: logo.height,
                cursor: dragging ? 'grabbing' : 'grab',
                zIndex: activeElement.id === logo.id ? 100 : 10,
                pointerEvents: isEditing || dragging || isRotating ? 'none' : 'auto',
              }}
              onPointerDown={(e) => startDragging(logo.type, logo.id, e)}
              onPointerMove={handleDrag}
              onPointerUp={stopDragging}
              onTouchStart={(e) => {
                startDragging(logo.type, logo.id, e);
                startLongPress(logo.type, logo.id, e);
                handleTouchZoom(logo.type, logo.id, e);
              }}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={(e) => handleElementClick(logo.type, logo.id, e)}
              onWheel={(e) => handleLogoResize(logo.id, e)}
            >
              <img
                src={logo.src}
                alt={logo.id === 'paltechWhite' ? 'Paltech White Logo' : 'Logo'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  opacity: logo.opacity,
                  filter: `brightness(${logo.brightness * 100}%)`,
                }}
              />
              {activeElement.id === logo.id && activeElement.type === 'logo' && (
                <>
                  <div
                    className="resize-handle"
                    style={{
                      position: 'absolute',
                      right: -5,
                      bottom: -5,
                      width: 10,
                      height: 10,
                      background: '#fff',
                      border: '1px solid #000',
                      cursor: 'se-resize',
                    }}
                    onPointerDown={(e) => startDragging(logo.type, logo.id, e)}
                  />
                  <div
                    className="rotate-handle"
                    style={{
                      position: 'absolute',
                      top: -15,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 10,
                      height: 10,
                      background: '#fff',
                      border: '1px solid #000',
                      cursor: 'pointer',
                    }}
                    onPointerDown={(e) => startRotation(logo.type, logo.id, e)}
                  />
                </>
              )}
            </div>
          ))}
        {!image && logos.length === 0 && (
          <div
            className="upload-prompt"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              style={{ display: 'none' }}
              aria-label="Upload image"
            />
            <button
              className="upload-button"
              onClick={handleImageUploadClick}
              aria-label="Upload image"
            >
              Upload Image
            </button>
          </div>
        )}
        <input
          type="file"
          ref={logoInputRef}
          onChange={addLogo}
          accept="image/*"
          style={{ display: 'none' }}
          aria-label="Upload logo"
        />
        {image && (
          <div
            className="score-box"
            style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              width: '80%',
              maxWidth: `${imageDimensionsLocal.width * 0.8}px`,
              pointerEvents: 'auto',
              borderRadius: '10px',
              padding: '8px',
              background: 'rgba(0, 0, 0, 0.5)',
            }}
          >
            <div
              className="competition-container"
              style={{
                width: '50%',
                maxHeight: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '5px',
                padding: '4px',
                color: 'white',
                fontSize: '14px',
                textAlign: 'center',
                marginBottom: '8px',
              }}
            >
              <select
                value={selectedCompetition || 'Premier League'}
                onChange={(e) => setSelectedCompetition(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 1)',
                  color: 'white',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  padding: '4px',
                  textAlign: 'center',
                  textAlignLast: 'center',
                }}
                aria-label="Select competition"
              >
                {competitions.map((competition, index) => (
                  <option key={index} value={competition}>
                    {competition}
                  </option>
                ))}
              </select>
            </div>
            <div
              className="logos-scores-section"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: `${imageDimensionsLocal.width * 0.8}px`,
                marginBottom: '8px',
              }}
            >
              <div
                className="team-logo"
                style={{
                  width: isMatchday ? '80px' : '60px',
                  height: isMatchday ? '80px' : '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <button
                  className="logo-container"
                  onClick={onTeam1Click}
                  style={{
                    width: isMatchday ? '80px' : '60px',
                    height: isMatchday ? '80px' : '60px',
                    border: '0.1px dotted #007bff',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  aria-label="Select Team 1 logo"
                >
                  {team1Logo?.src ? (
                    <img
                      src={team1Logo.src}
                      alt="Team 1 Logo"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        filter: `brightness(${team1Logo.brightness * 100}%)`,
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: isMatchday ? '20px' : '16px', color: '#666' }}>Team 1</span>
                  )}
                </button>
              </div>
              <div
                className="score-container"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '120px',
                }}
              >
                {isMatchday ? (
                  <span
                    style={{
                      fontSize: '36px',
                      fontWeight: '900',
                      color: 'white',
                      margin: '0 20px',
                      alignContent: 'center',
                    }}
                  >
                    VS
                  </span>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <select
                      value={team1Score || 0}
                      onChange={(e) => setTeam1Score(parseInt(e.target.value))}
                      style={{
                        width: '65px',
                        height: '60px',
                        fontSize: '32px',
                        fontWeight: '900',
                        textAlign: 'center',
                        borderRadius: '4px',
                        boxShadow: 'none',
                        border: 'none',
                        background: 'rgba(0, 0, 0, 0.8)',
                        cursor: 'pointer',
                        color: 'white',
                      }}
                      aria-label="Select Team 1 score"
                    >
                      <option value={0}>0</option>
                      {scoreOptions.map((num) => (
                        <option key={`team1-${num}`} value={num}>
                          {num}
                        </option>
                      ))}
                    </select>
                    <span
                      style={{
                        fontSize: '36px',
                        fontWeight: '500',
                        color: 'white',
                        margin: '0 20px',
                        alignContent: 'center',
                      }}
                    >
                      -
                    </span>
                    <select
                      value={team2Score || 0}
                      onChange={(e) => setTeam2Score(parseInt(e.target.value))}
                      style={{
                        width: '65px',
                        height: '60px',
                        fontSize: '32px',
                        fontWeight: '900',
                        textAlign: 'center',
                        borderRadius: '4px',
                        boxShadow: 'none',
                        border: 'none',
                        background: 'rgba(0, 0, 0, 0.8)',
                        cursor: 'pointer',
                        color: 'white',
                      }}
                      aria-label="Select Team 2 score"
                    >
                      <option value={0}>0</option>
                      {scoreOptions.map((num) => (
                        <option key={`team2-${num}`} value={num}>
                          {num}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {!isMatchday && (
                  <div
                    className="match-status-container"
                    style={{
                      width: 'fit-content',
                      maxHeight: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '5px',
                      padding: '4px',
                      color: 'white',
                      fontSize: '12px',
                      textAlign: 'center',
                      marginBottom: '-10px',
                      gap: '4px',
                    }}
                  >
                    <select
                      value={matchStatusOptions.includes(matchStatus) ? matchStatus : 'Custom'}
                      onChange={(e) => handleMatchStatusChange(e.target.value)}
                      style={{
                        width: '100px',
                        background: 'rgba(0, 0, 0, 0.8)',
                        color: 'green',
                        fontWeight: 'bold',
                        border: 'none',
                        fontSize: '12px',
                        cursor: 'pointer',
                        boxShadow: 'none',
                        padding: '1px',
                        textAlign: 'center',
                        textAlignLast: 'center',
                      }}
                      aria-label="Select match status"
                    >
                      {matchStatusOptions.map((status, index) => (
                        <option key={index} value={status} style={{ color: 'green', fontWeight: 'bold' }}>
                          {status}
                        </option>
                      ))}
                    </select>
                    {matchStatus === 'Custom' || !matchStatusOptions.includes(matchStatus) ? (
                      <select
                        value={customMatchTime || (matchStatus && matchStatus.replace("'", '')) || ''}
                        onChange={(e) => handleCustomTimeChange(e.target.value)}
                        style={{
                          width: '60px',
                          background: 'rgba(0, 0, 0, 0.8)',
                          color: 'green',
                          fontWeight: 'bold',
                          border: 'none',
                          fontSize: '12px',
                          cursor: 'pointer',
                          boxShadow: 'none',
                          padding: '1px',
                          textAlign: 'center',
                          textAlignLast: 'center',
                        }}
                        aria-label="Select custom match time"
                      >
                        <option value="">Time</option>
                        {timeOptions.map((num) => (
                          <option key={`match-time-${num}`} value={num} style={{ color: 'green', fontWeight: 'bold' }}>
                            {num}'
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                )}
                {isMatchday && (
                  <div
                    className="match-date-container"
                    style={{
                      width: 'fit-content',
                      maxHeight: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '5px',
                      padding: '4px',
                      color: 'white',
                      fontSize: '12px',
                      textAlign: 'center',
                      marginBottom: '-10px',
                      gap: '8px',
                      background: 'rgba(0, 0, 0, 0.8)',
                    }}
                  >
                    <select
                      value={matchDateTime.weekday}
                      onChange={(e) => setMatchDateTime({ ...matchDateTime, weekday: e.target.value })}
                      style={{
                        width: '50px',
                        background: 'rgba(0, 0, 0, 0.8)',
                        color: 'green',
                        fontWeight: 'bold',
                        border: 'none',
                        fontSize: '12px',
                        cursor: 'pointer',
                        boxShadow: 'none',
                        padding: '1px',
                        textAlign: 'center',
                        textAlignLast: 'center',
                      }}
                      aria-label="Select match weekday"
                    >
                      {generateWeekdays().map((weekday) => (
                        <option key={`weekday-${weekday}`} value={weekday} style={{ color: 'green', fontWeight: 'bold' }}>
                          {weekday}
                        </option>
                      ))}
                    </select>
                    <select
                      value={matchDateTime.day}
                      onChange={(e) => setMatchDateTime({ ...matchDateTime, day: parseInt(e.target.value) })}
                      style={{
                        width: '50px',
                        background: 'rgba(0, 0, 0, 0.8)',
                        color: 'green',
                        fontWeight: 'bold',
                        border: 'none',
                        fontSize: '12px',
                        cursor: 'pointer',
                        boxShadow: 'none',
                        padding: '1px',
                        textAlign: 'center',
                        textAlignLast: 'center',
                      }}
                      aria-label="Select match day"
                    >
                      {generateDays().map((day) => (
                        <option key={`day-${day}`} value={day} style={{ color: 'green', fontWeight: 'bold' }}>
                          {day}
                        </option>
                      ))}
                    </select>
                    <select
                      value={matchDateTime.month}
                      onChange={(e) => setMatchDateTime({ ...matchDateTime, month: e.target.value })}
                      style={{
                        width: '50px',
                        background: 'rgba(0, 0, 0, 0.8)',
                        color: 'green',
                        fontWeight: 'bold',
                        border: 'none',
                        fontSize: '12px',
                        cursor: 'pointer',
                        boxShadow: 'none',
                        padding: '1px',
                        textAlign: 'center',
                        textAlignLast: 'center',
                      }}
                      aria-label="Select match month"
                    >
                      {generateMonths().map((month) => (
                        <option key={`month-${month}`} value={month} style={{ color: 'green', fontWeight: 'bold' }}>
                          {month}
                        </option>
                      ))}
                    </select>
                    <select
                      value={matchDateTime.hour}
                      onChange={(e) => setMatchDateTime({ ...matchDateTime, hour: e.target.value })}
                      style={{
                        width: '50px',
                        background: 'rgba(0, 0, 0, 0.8)',
                        color: 'green',
                        fontWeight: 'bold',
                        border: 'none',
                        fontSize: '12px',
                        cursor: 'pointer',
                        boxShadow: 'none',
                        padding: '1px',
                        textAlign: 'center',
                        textAlignLast: 'center',
                      }}
                      aria-label="Select match hour"
                    >
                      {generateHours().map((hour) => (
                        <option key={`hour-${hour}`} value={hour} style={{ color: 'green', fontWeight: 'bold' }}>
                          {hour}
                        </option>
                      ))}
                    </select>
                    <select
                      value={matchDateTime.minute}
                      onChange={(e) => setMatchDateTime({ ...matchDateTime, minute: e.target.value })}
                      style={{
                        width: '50px',
                        background: 'rgba(0, 0, 0, 0.8)',
                        color: 'green',
                        fontWeight: 'bold',
                        border: 'none',
                        fontSize: '12px',
                        cursor: 'pointer',
                        boxShadow: 'none',
                        padding: '1px',
                        textAlign: 'center',
                        textAlignLast: 'center',
                      }}
                      aria-label="Select match minute"
                    >
                      {generateMinutes().map((minute) => (
                        <option key={`minute-${minute}`} value={minute} style={{ color: 'green', fontWeight: 'bold' }}>
                          {minute}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div
                className="team-logo"
                style={{
                  width: isMatchday ? '80px' : '60px',
                  height: isMatchday ? '80px' : '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <button
                  className="logo-container"
                  onClick={onTeam2Click}
                  style={{
                    width: isMatchday ? '80px' : '60px',
                    height: isMatchday ? '80px' : '60px',
                    border: '0.1px dotted #007bff',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  aria-label="Select Team 2 logo"
                >
                  {team2Logo?.src ? (
                    <img
                      src={team2Logo.src}
                      alt="Team 2 Logo"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        filter: `brightness(${team2Logo.brightness * 100}%)`,
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: isMatchday ? '20px' : '16px', color: '#666' }}>Team 2</span>
                  )}
                </button>
              </div>
            </div>
            {!isMatchday && (
              <div
                className="add-goal-section"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  width: '100%',
                  maxWidth: `${imageDimensionsLocal.width * 0.8}px`,
                  marginBottom: '8px',
                }}
              >
                <button
                  onClick={() => addGoal('team1')}
                  style={{
                    maxWidth: 'fit-content',
                    padding: '4px 8px',
                    fontSize: '10px',
                    background: 'rgba(0, 0, 0, 0.9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                  aria-label="Add Team 1 goal"
                >
                  + Goal
                </button>
                <button
                  onClick={() => addGoal('team2')}
                  style={{
                    maxWidth: 'fit-content',
                    fontSize: '10px',
                    background: 'rgba(0, 0, 0, 0.9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                  aria-label="Add Team 2 goal"
                >
                  + Goal
                </button>
              </div>
            )}
            {!isMatchday && (
              <div
                className="goals-section"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  width: '100%',
                  maxWidth: `${imageDimensionsLocal.width * 0.8}px`,
                }}
              >
                <div
                  className="team-goals"
                  style={{
                    width: '48%',
                    maxHeight: '80px',
                    overflowY: 'auto',
                  }}
                >
                  {team1Goals.map((goal, index) => (
                    <div
                      key={`team1-goal-${index}`}
                      className="goal-entry"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginBottom: '4px',
                        justifyContent: 'center',
                        flexWrap: 'nowrap',
                      }}
                    >
                      <input
                        type="text"
                        value={goal.player}
                        onChange={(e) => updateGoal('team1', index, 'player', e.target.value)}
                        placeholder="Player"
                        style={{
                          width: '80px',
                          fontSize: '10px',
                          padding: '2px',
                          background: 'rgba(255, 255, 255, 0.9)',
                          border: 'none',
                          borderRadius: '3px',
                        }}
                        aria-label={`Team 1 goal ${index + 1} player`}
                      />
                      <select
                        value={goal.time}
                        onChange={(e) => updateGoal('team1', index, 'time', e.target.value)}
                        style={{
                          width: '60px',
                          fontSize: '10px',
                          padding: '2px',
                          background: 'rgba(255, 255, 255, 0.9)',
                          border: 'none',
                          borderRadius: '3px',
                        }}
                        aria-label={`Team 1 goal ${index + 1} time`}
                      >
                        <option value="">Time</option>
                        {timeOptions.map((num) => (
                          <option key={`team1-time-${num}`} value={num}>
                            {num}'
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeGoal('team1', index)}
                        style={{
                          padding: '2px 6px',
                          fontSize: '10px',
                          background: 'rgba(255, 0, 0, 0.8)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                        }}
                        aria-label={`Remove Team 1 goal ${index + 1}`}
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
                <div
                  className="team-goals"
                  style={{
                    width: '48%',
                    maxHeight: '80px',
                    overflowY: 'auto',
                  }}
                >
                  {team2Goals.map((goal, index) => (
                    <div
                      key={`team2-goal-${index}`}
                      className="goal-entry"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginBottom: '4px',
                        justifyContent: 'center',
                        flexWrap: 'nowrap',
                      }}
                    >
                      <input
                        type="text"
                        value={goal.player}
                        onChange={(e) => updateGoal('team2', index, 'player', e.target.value)}
                        placeholder="Player"
                        style={{
                          width: '80px',
                          fontSize: '10px',
                          padding: '2px',
                          background: 'rgba(255, 255, 255, 0.9)',
                          border: 'none',
                          borderRadius: '3px',
                        }}
                        aria-label={`Team 2 goal ${index + 1} player`}
                      />
                      <select
                        value={goal.time}
                        onChange={(e) => updateGoal('team2', index, 'time', e.target.value)}
                        style={{
                          width: '60px',
                          fontSize: '10px',
                          padding: '2px',
                          background: 'rgba(255, 255, 255, 0.9)',
                          border: 'none',
                          borderRadius: '3px',
                        }}
                        aria-label={`Team 2 goal ${index + 1} time`}
                      >
                        <option value="">Time</option>
                        {timeOptions.map((num) => (
                          <option key={`team2-time-${num}`} value={num}>
                            {num}'
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeGoal('team2', index)}
                        style={{
                          padding: '2px 6px',
                          fontSize: '10px',
                          background: 'rgba(255, 0, 0, 0.8)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                        }}
                        aria-label={`Remove Team 2 goal ${index + 1}`}
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};