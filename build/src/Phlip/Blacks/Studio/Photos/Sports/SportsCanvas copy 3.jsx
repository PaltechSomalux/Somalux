import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SportsTextElements } from './SportsTextElements';
import './Sports.css';
import PaltechWhite from '../../../../../Assets/PaltechWhite.png';

export const SportsCanvas = ({
  image,
  additionalImages,
  setAdditionalImages,
  handleAdditionalImageUpload,
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
  showScoreBox,
  setShowScoreBox,
}) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const additionalImageRefs = useRef([]);
  const wrapperRef = useRef(null);
  const additionalImageInputRef = useRef(null);
  const [imageDimensionsLocal, setImageDimensionsLocal] = useState({ width: 0, height: 0 });
  const [logoMoved, setLogoMoved] = useState(false);
  const [customMatchTime, setCustomMatchTime] = useState('');
  const [spokesperson, setSpokesperson] = useState(''); // New state for spokesperson's name
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
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
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
    if (isMatchday || selectedFeature === 'quote') {
      const { day, month, hour, minute } = matchDateTime;
      const newWeekday = calculateWeekday(day, month);
      setMatchDateTime((prev) => ({ ...prev, weekday: newWeekday }));
      const formattedDateTime = `${newWeekday} ${day}/${month} ${hour}:${minute}`;
      setMatchStatus(formattedDateTime);
    }
  }, [isMatchday, selectedFeature, matchDateTime, setMatchStatus]);

  useEffect(() => {
    if (image && !logos.some((logo) => logo.id === 'paltechWhite')) {
      const logoWidth = 100;
      const logoHeight = 100;
      const padding = 10;
      setLogos((prevLogos) => [
        ...prevLogos,
        {
          id: 'paltechWhite',
          type: 'logo',
          src: PaltechWhite,
          x: imageDimensionsLocal.width
            ? (additionalImages.length > 0 && (isMatchday || selectedFeature === 'quote')
                ? imageDimensionsLocal.width / 2
                : imageDimensionsLocal.width) -
              logoWidth / 2 -
              padding
            : 490,
          y: imageDimensionsLocal.height ? logoHeight / 2 + padding : 60,
          width: logoWidth,
          height: logoHeight,
          rotation: 0,
          opacity: 1,
          brightness: 1,
        },
      ]);
    }
  }, [image, additionalImages, isMatchday, selectedFeature, imageDimensionsLocal, logos, setLogos]);

  useEffect(() => {
    if (image && imageRef.current && canvasRef.current) {
      const img = imageRef.current;
      const canvas = canvasRef.current;

      const updateDimensions = () => {
        const { naturalWidth, naturalHeight } = img;
        const aspectRatio = naturalWidth / naturalHeight;
        const maxHeight = window.innerHeight * 0.7;
        let width = naturalWidth;
        let height = naturalHeight;

        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }

        const canvasWidth = additionalImages.length > 0 && (isMatchday || selectedFeature === 'quote') ? width * 2 : width;

        setImageDimensionsLocal({ width: canvasWidth, height });
        setImageDimensions({ width: canvasWidth, height });

        canvas.width = canvasWidth;
        canvas.height = height;

        if (!logoMoved) {
          setLogos((prevLogos) =>
            prevLogos.map((logo) =>
              logo.id === 'paltechWhite'
                ? {
                    ...logo,
                    x:
                      (additionalImages.length > 0 && (isMatchday || selectedFeature === 'quote')
                        ? canvasWidth / 2
                        : canvasWidth) -
                      logo.width / 2 -
                      10,
                    y: logo.height / 2 + 10,
                  }
                : logo
            )
          );
        }
      };

      img.addEventListener('load', updateDimensions);
      if (img.complete) updateDimensions();
      return () => img.removeEventListener('load', updateDimensions);
    } else if (!image && canvasRef.current) {
      const canvas = canvasRef.current;
      const defaultWidth = 500;
      const defaultHeight = defaultWidth * (9 / 16);
      setImageDimensionsLocal({ width: defaultWidth, height: defaultHeight });
      setImageDimensions({ width: defaultWidth, height: defaultHeight });
      canvas.width = defaultWidth;
      canvas.height = defaultHeight;
    }
  }, [image, additionalImages, isMatchday, selectedFeature, setImageDimensions, logoMoved, setLogos]);

  useEffect(() => {
    if (setCanvasRefs) {
      setCanvasRefs({ canvasRef, imageRef, additionalImageRefs });
    }
  }, [setCanvasRefs]);

  const drawImageElement = useCallback(
    (ctx, logo) => {
      if (!logo.src || logo.id === 'quoteImage') return; // Skip quoteImage for canvas rendering
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
      const totalImages = 1 + additionalImages.length;
      const widthPerImage = canvas.width / ((isMatchday || selectedFeature === 'quote') && totalImages > 1 ? 2 : 1);
      const heightPerImage = canvas.height / ((isMatchday || selectedFeature === 'quote') && totalImages > 2 ? 2 : 1);

      ctx.filter = `
        brightness(${filters.brightness}%)
        contrast(${filters.contrast}%)
        saturate(${filters.saturation}%)
        grayscale(${filters.grayscale}%)
        sepia(${filters.sepia}%)
        blur(${filters.blur}px)
      `;
      ctx.drawImage(img, 0, 0, widthPerImage, heightPerImage);
      ctx.filter = 'none';
    }

    if (additionalImages.length > 0 && (isMatchday || selectedFeature === 'quote')) {
      additionalImages.forEach((imgSrc, index) => {
        const img = additionalImageRefs.current[index];
        if (img) {
          const widthPerImage = canvas.width / 2;
          const heightPerImage = canvas.height / (additionalImages.length >= 2 ? 2 : 1);
          let x, y;
          if (index === 0) {
            x = widthPerImage;
            y = 0;
          } else if (index === 1) {
            x = 0;
            y = heightPerImage;
          } else if (index === 2) {
            x = widthPerImage;
            y = heightPerImage;
          }
          ctx.filter = `
            brightness(${filters.brightness}%)
            contrast(${filters.contrast}%)
            saturate(${filters.saturation}%)
            grayscale(${filters.grayscale}%)
            sepia(${filters.sepia}%)
            blur(${filters.blur}px)
          `;
          ctx.drawImage(img, x, y, widthPerImage, heightPerImage);
          ctx.filter = 'none';
        }
      });
    }

    logos.forEach((logo) => {
      if (logo.type === 'logo' && logo.id !== 'team1Logo' && logo.id !== 'team2Logo' && logo.id !== 'quoteImage') {
        drawImageElement(ctx, logo);
      }
    });
  }, [image, additionalImages, isMatchday, selectedFeature, filters, imageDimensionsLocal, logos, drawImageElement]);

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

  const handleAdditionalImageUploadClick = useCallback(() => {
    if (additionalImages.length < 3) {
      additionalImageInputRef.current.click();
    }
  }, [additionalImages.length]);

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

  const addLogo = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoId = selectedFeature === 'quote' ? 'quoteImage' : `logo-${Date.now()}`;
        setLogos((prevLogos) => [
          ...prevLogos.filter((logo) => logo.id !== 'quoteImage'),
          {
            id: logoId,
            type: 'logo',
            src: e.target.result,
            x: imageDimensionsLocal.width / 2,
            y: imageDimensionsLocal.height / 2,
            width: 80,
            height: 80,
            rotation: 0,
            opacity: 1,
            brightness: 1,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
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
      style={{ touchAction: 'none', position: 'relative', overflow: 'hidden' }}
    >
      <div
        className="image-container"
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: (isMatchday || selectedFeature === 'quote') && additionalImages.length > 0 ? 'row' : 'row',
          flexWrap: (isMatchday || selectedFeature === 'quote') && additionalImages.length > 0 ? 'wrap' : 'nowrap',
          width: '100%',
          height: image ? `${imageDimensionsLocal.height}px` : 'auto',
        }}
      >
        {image && (
          <>
            <div
              style={{
                width: (isMatchday || selectedFeature === 'quote') && additionalImages.length > 0 ? '50%' : '100%',
                height: (isMatchday || selectedFeature === 'quote') && additionalImages.length >= 2 ? '50%' : '100%',
              }}
            >
              <img
                ref={imageRef}
                src={image}
                alt="Sports background"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
            {(isMatchday || selectedFeature === 'quote') &&
              additionalImages.map((imgSrc, index) => (
                <div
                  key={`additional-img-${index}`}
                  style={{
                    width: '50%',
                    height: additionalImages.length >= 2 ? '50%' : '100%',
                  }}
                >
                  <img
                    ref={(el) => (additionalImageRefs.current[index] = el)}
                    src={imgSrc}
                    alt={`Additional sports background ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </div>
              ))}
          </>
        )}
        <canvas
          ref={canvasRef}
          style={{
            position: image ? 'absolute' : 'relative',
            top: 0,
            left: 0,
            width: '100%',
            height: image ? `${imageDimensionsLocal.height}px` : 'auto',
            background: image ? 'transparent' : '#f0f0f0',
          }}
        />
        {(isMatchday || selectedFeature === 'quote') && (
          <div
            className="add-images"
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <input
              type="file"
              ref={additionalImageInputRef}
              onChange={handleAdditionalImageUpload}
              accept="image/*"
              style={{ display: 'none' }}
              aria-label="Upload additional image"
            />
            <button
              className="add-image-button"
              onClick={handleAdditionalImageUploadClick}
              disabled={additionalImages.length >= 3}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: additionalImages.length >= 3 ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                fontSize: '20px',
                fontWeight: 'bold',
                border: 'none',
                cursor: additionalImages.length >= 3 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              }}
              aria-label="Add additional image"
            >
              +
            </button>
            {additionalImages.length > 0 && (
              <button
                className="toggle-score-box-button"
                onClick={() => setShowScoreBox((prev) => !prev)}
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
                aria-label={showScoreBox ? 'Hide score box' : 'Show score box'}
              >
                −
              </button>
            )}
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
          .filter((logo) => logo.id !== 'team1Logo' && logo.id !== 'team2Logo' && logo.id !== 'quoteImage')
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
        {image && showScoreBox && (
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
              padding: selectedFeature === 'quote' ? '12px 8px' : '8px',
              background: 'rgba(0, 0, 0, 0.5)',
            }}
          >
            {selectedFeature === 'quote' ? (
              <>
                {/* Circular Upload Button for Quote Image */}
                <div
                  className="quote-image-container"
                  style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '10px',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 15,
                  }}
                >
                  <button
                    className="logo-container"
                    onClick={() => logoInputRef.current.click()}
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '0.1px dotted #007bff',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      background: 'rgba(0, 0, 0, 0.7)',
                      cursor: 'pointer',
                      padding: 0,
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                    }}
                    aria-label="Upload quote image"
                  >
                    {logos.find((logo) => logo.id === 'quoteImage')?.src ? (
                      <img
                        src={logos.find((logo) => logo.id === 'quoteImage').src}
                        alt="Quote Image"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          filter: `brightness(${(logos.find((logo) => logo.id === 'quoteImage')?.brightness || 1) * 100}%)`,
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '16px', color: '#fff' }}>+</span>
                    )}
                  </button>
                </div>
                {/* Quote Input Field */}
                <textarea
                  value={customMatchTime}
                  onChange={(e) => setCustomMatchTime(e.target.value)}
                  placeholder="Enter quote"
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    fontSize: '14px',
                    padding: '8px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    borderRadius: '5px',
                    textAlign: 'center',
                    resize: 'vertical',
                    color: 'black',
                    fontFamily: fontFamily || 'Arial',
                  }}
                  aria-label="Quote input"
                />
                {/* Spokesperson Input Field */}
                <input
                  type="text"
                  value={spokesperson}
                  onChange={(e) => setSpokesperson(e.target.value)}
                  placeholder="Spokesperson"
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    width: '120px',
                    fontSize: '12px',
                    padding: '4px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    borderRadius: '3px',
                    textAlign: 'right',
                    color: 'black',
                  }}
                  aria-label="Spokesperson name"
                />
              </>
            ) : (
              <>
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
                        <span style={{ fontSize: isMatchday ? '20px' : '16px', color: '#666' }}>
                          Team 1
                        </span>
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
                        <span style={{ fontSize: isMatchday ? '20px' : '16px', color: '#666' }}>
                          Team 2
                        </span>
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};