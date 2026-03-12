import React, { useCallback, useEffect, useRef } from 'react';
import { loadImage } from './SportsUtils';

export const SportsDownload = ({
  image,
  secondImage,
  texts,
  logos,
  team1Logo,
  team2Logo,
  team1Score,
  team2Score,
  filters,
  canvasRefs,
  imageDimensions,
  selectedCompetition,
  matchStatus,
  team1Goals,
  team2Goals,
  isMatchday,
}) => {
  // Cache for preloaded images
  const imageCache = useRef(new Map());
  // Track if download is in progress to prevent multiple triggers
  const isDownloading = useRef(false);

  // Preload images on component mount to avoid delays during download
  useEffect(() => {
    const preloadImages = async () => {
      try {
        // Preload primary background image
        if (image) {
          const bgImg = await loadImage(image);
          imageCache.current.set(image, bgImg);
        }
        // Preload second background image
        if (secondImage && isMatchday) {
          const secondBgImg = await loadImage(secondImage);
          imageCache.current.set(secondImage, secondBgImg);
        }
        // Preload logos (including paltechWhite)
        const logoPromises = logos
          .filter((logo) => logo.src && logo.type === 'logo' && logo.id !== 'team1Logo' && logo.id !== 'team2Logo')
          .map(async (logo) => {
            const img = await loadImage(logo.src);
            imageCache.current.set(logo.src, img);
          });
        // Preload team logos
        if (team1Logo?.src) {
          const img = await loadImage(team1Logo.src);
          imageCache.current.set(team1Logo.src, img);
        }
        if (team2Logo?.src) {
          const img = await loadImage(team2Logo.src);
          imageCache.current.set(team2Logo.src, img);
        }
        await Promise.all(logoPromises);
      } catch (err) {
        console.error('Failed to preload images:', err);
      }
    };
    preloadImages();
  }, [image, secondImage, logos, team1Logo, team2Logo, isMatchday]);

  const drawUnderline = (ctx, text, scaledFontSize, textWidth) => {
    ctx.beginPath();
    const underlineY = scaledFontSize * 0.1;
    ctx.moveTo(-textWidth / 2, underlineY);
    ctx.lineTo(textWidth / 2, underlineY);
    ctx.strokeStyle = text.stroke || '#000000';
    ctx.lineWidth = scaledFontSize / 20;
    ctx.stroke();
  };

  const drawGradientText = (ctx, text, scaledFontSize, fontStyle, textWidth, textHeight) => {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = textWidth;
    tempCanvas.height = textHeight;

    tempCtx.font = `${fontStyle}${scaledFontSize}px ${text.fontFamily || 'Arial'}`;
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    tempCtx.fillText(text.content || '', textWidth / 2, textHeight / 2);
    tempCtx.globalCompositeOperation = 'source-in';

    const gradient = ctx.createLinearGradient(0, 0, textWidth, textHeight);
    gradient.addColorStop(0, text.color.split(',')[0] || '#ffffff');
    gradient.addColorStop(1, text.color.split(',')[1] || '#ffffff');
    tempCtx.fillStyle = gradient;
    tempCtx.fillRect(0, 0, textWidth, textHeight);

    ctx.drawImage(tempCanvas, -textWidth / 2, -textHeight / 2);
    tempCanvas.remove();
  };

  const drawLogo = (ctx, logo, scaleX, scaleY, x, y, logoSize) => {
    const img = imageCache.current.get(logo.src);
    if (!img) return Promise.resolve();

    const originalWidth = img.naturalWidth;
    const originalHeight = img.naturalHeight;
    const targetWidth = logoSize * scaleX;
    const targetHeight = logoSize * scaleY;
    const aspectRatio = originalWidth / originalHeight;

    let displayWidth = targetWidth;
    let displayHeight = targetHeight;
    if (aspectRatio > 1) {
      displayHeight = targetWidth / aspectRatio;
    } else {
      displayWidth = targetHeight * aspectRatio;
    }

    const scaledX = x * scaleX;
    const scaledY = y * scaleY;

    ctx.save();
    ctx.translate(scaledX, scaledY);
    ctx.rotate((logo.rotation || 0) * Math.PI / 180);
    ctx.globalAlpha = logo.opacity || 1;
    ctx.filter = `brightness(${logo.brightness * 100 || 100}%)`;
    ctx.drawImage(img, -displayWidth / 2, -displayHeight / 2, displayWidth, displayHeight);
    ctx.restore();
    return Promise.resolve();
  };

  const drawCircularEmoji = (ctx, emoji, x, y, size) => {
    ctx.save();
    ctx.font = `${size}px Arial`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillText(emoji, x, y);
    ctx.restore();
  };

  const downloadSportsImage = useCallback(() => {
    // Prevent multiple downloads
    if (isDownloading.current) return;
    isDownloading.current = true;

    const { canvasRef, imageRef, secondImageRef } = canvasRefs;
    if (!canvasRef?.current || !image || !imageRef?.current) {
      alert('No image available for download. Please select an image.');
      isDownloading.current = false;
      return;
    }

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    // Use primary image's natural dimensions for the canvas
    const img = imageCache.current.get(image) || imageRef.current;
    const canvasWidth = img.naturalWidth;
    const canvasHeight = img.naturalHeight;

    // Cap DPR at 1.5 for faster rendering
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    tempCanvas.width = canvasWidth * dpr;
    tempCanvas.height = canvasHeight * dpr;
    tempCtx.scale(dpr, dpr);

    // Calculate scaling based on SportsCanvas imageDimensions
    const displayWidth = isMatchday && secondImage ? imageDimensions.width / 2 : imageDimensions.width;
    const scaleX = canvasWidth / displayWidth;
    const scaleY = canvasHeight / imageDimensions.height;

    // Draw primary background image
    if (img) {
      tempCtx.filter = `
        brightness(${filters.brightness}%)
        contrast(${filters.contrast}%)
        saturate(${filters.saturation}%)
        grayscale(${filters.grayscale}%)
        sepia(${filters.sepia}%)
        blur(${filters.blur}px)
      `;
      const imageWidth = isMatchday && secondImage ? canvasWidth / 2 : canvasWidth;
      tempCtx.drawImage(img, 0, 0, imageWidth, canvasHeight);
      tempCtx.filter = 'none';
    }

    // Draw second background image
    if (secondImage && secondImageRef?.current && isMatchday) {
      const secondImg = imageCache.current.get(secondImage) || secondImageRef.current;
      if (secondImg) {
        tempCtx.filter = `
          brightness(${filters.brightness}%)
          contrast(${filters.contrast}%)
          saturate(${filters.saturation}%)
          grayscale(${filters.grayscale}%)
          sepia(${filters.sepia}%)
          blur(${filters.blur}px)
        `;
        tempCtx.drawImage(secondImg, canvasWidth / 2, 0, canvasWidth / 2, canvasHeight);
        tempCtx.filter = 'none';
      }
    }

    // Draw all logos (including paltechWhite, excluding team logos)
    const logoPromises = logos
      .filter((logo) => logo.type === 'logo' && logo.id !== 'team1Logo' && logo.id !== 'team2Logo')
      .map((logo) => drawLogo(tempCtx, logo, scaleX, scaleY, logo.x, logo.y, logo.width));

    // Calculate score box dimensions
    const scoreBoxWidth = canvasWidth * 0.8;
    const scoreBoxPadding = 8 * Math.min(scaleX, scaleY);
    const numGoals = isMatchday ? 0 : Math.max(team1Goals.length, team2Goals.length);
    const scoreBoxHeight = isMatchday
      ? (36 + 80 + 36) * Math.min(scaleX, scaleY) // Competition + Logos/VS + Date
      : (36 + 60 + 36 + numGoals * 24) * Math.min(scaleX, scaleY); // Competition + Scores + Status + Goals
    const scoreBoxY = canvasHeight - scoreBoxHeight - 10 * scaleY;
    const scoreBoxLeft = (canvasWidth - scoreBoxWidth) / 2;

    // Draw score box container background
    tempCtx.save();
    tempCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    tempCtx.beginPath();
    tempCtx.roundRect(
      scoreBoxLeft,
      scoreBoxY,
      scoreBoxWidth,
      scoreBoxHeight,
      10 * Math.min(scaleX, scaleY)
    );
    tempCtx.fill();
    tempCtx.restore();

    // Section 1: Competition
    const competitionHeight = 36 * Math.min(scaleX, scaleY);
    const competitionY = scoreBoxY + scoreBoxPadding;
    const competitionFontSize = 14 * Math.min(scaleX, scaleY);
    tempCtx.save();
    tempCtx.font = `${competitionFontSize}px Arial`;
    tempCtx.fillStyle = '#ffffff';
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    const competitionText = selectedCompetition || 'Premier League';
    tempCtx.fillText(competitionText, canvasWidth / 2, competitionY + competitionHeight / 2, scoreBoxWidth * 0.5);
    tempCtx.restore();

    // Section 2: Logos and Scores/VS
    const logosScoresHeight = (isMatchday ? 80 : 60) * Math.min(scaleX, scaleY);
    const logosScoresY = competitionY + competitionHeight;
    const teamLogoWidth = (isMatchday ? 80 : 60) * scaleX;
    const scoreContainerWidth = (isMatchday ? 120 : 150) * scaleX;
    const logoPadding = (isMatchday ? 8 : 5) * scaleX;
    const totalLogosScoresWidth = teamLogoWidth * 2 + scoreContainerWidth + logoPadding * 2;
    const logosScoresLeft = scoreBoxLeft + (scoreBoxWidth - totalLogosScoresWidth) / 2;

    // Draw team logos
    const teamLogoPromises = [];
    if (team1Logo) {
      const team1X = logosScoresLeft + logoPadding + teamLogoWidth / 2;
      const team1Y = logosScoresY + logosScoresHeight / 2;
      teamLogoPromises.push(
        drawLogo(
          tempCtx,
          { ...team1Logo, width: isMatchday ? 80 : 60, height: isMatchday ? 80 : 60 },
          scaleX,
          scaleY,
          team1X / scaleX,
          team1Y / scaleY,
          isMatchday ? 80 : 60
        )
      );
    }
    if (team2Logo) {
      const team2X = logosScoresLeft + logoPadding + teamLogoWidth + scoreContainerWidth + teamLogoWidth / 2;
      const team2Y = logosScoresY + logosScoresHeight / 2;
      teamLogoPromises.push(
        drawLogo(
          tempCtx,
          { ...team2Logo, width: isMatchday ? 80 : 60, height: isMatchday ? 80 : 60 },
          scaleX,
          scaleY,
          team2X / scaleX,
          team2Y / scaleY,
          isMatchday ? 80 : 60
        )
      );
    }

    // Draw scores or VS
    tempCtx.save();
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    if (isMatchday) {
      const vsFontSize = 36 * Math.min(scaleX, scaleY);
      tempCtx.font = `900 ${vsFontSize}px Arial`;
      tempCtx.fillStyle = '#ffffff';
      tempCtx.fillText('VS', scoreBoxLeft + scoreBoxWidth / 2, logosScoresY + logosScoresHeight / 2);
    } else {
      const scoreFontSize = 32 * Math.min(scaleX, scaleY);
      tempCtx.font = `900 ${scoreFontSize}px Arial`;
      tempCtx.fillStyle = '#ffffff';
      const scoreX1 = logosScoresLeft + teamLogoWidth + 30 * scaleX;
      const scoreX2 = logosScoresLeft + teamLogoWidth + scoreContainerWidth - 30 * scaleX;
      const scoreY = logosScoresY + logosScoresHeight / 2;
      tempCtx.fillText(team1Score || '0', scoreX1, scoreY);
      tempCtx.fillText('-', logosScoresLeft + teamLogoWidth + scoreContainerWidth / 2, scoreY);
      tempCtx.fillText(team2Score || '0', scoreX2, scoreY);
    }
    tempCtx.restore();

    // Section 3: Match Status or Date
    const matchStatusHeight = 36 * Math.min(scaleX, scaleY);
    const matchStatusY = logosScoresY + logosScoresHeight;
    if (isMatchday) {
      // Handle matchStatus format: "weekday day/month hour:minute"
      let formattedMatchStatus = matchStatus || 'Sat 16/Aug 03:36';
      if (formattedMatchStatus.includes('/')) {
        const [weekday, datePart, time] = formattedMatchStatus.split(' ');
        const [day, month] = datePart.split('/');
        formattedMatchStatus = `${weekday} ${day} ${month} ${time}`;
      }
      const dateParts = formattedMatchStatus.split(' ');
      tempCtx.save();
      tempCtx.font = `bold ${12 * Math.min(scaleX, scaleY)}px Arial`;
      tempCtx.fillStyle = '#00ff00';
      tempCtx.textAlign = 'left';
      const spacing = 8 * Math.min(scaleX, scaleY);
      let totalWidth = dateParts.reduce((sum, part) => {
        const partWidth = tempCtx.measureText(part).width;
        return sum + partWidth + spacing;
      }, 0) - spacing;
      let currentX = scoreBoxLeft + (scoreBoxWidth - totalWidth) / 2;
      dateParts.forEach((part) => {
        tempCtx.fillText(part, currentX, matchStatusY + matchStatusHeight / 2);
        currentX += tempCtx.measureText(part).width + spacing;
      });
      tempCtx.restore();
    } else {
      const matchStatusFontSize = 11 * Math.min(scaleX, scaleY);
      tempCtx.save();
      tempCtx.font = `bold ${matchStatusFontSize}px Arial`;
      tempCtx.fillStyle = '#00ff00';
      tempCtx.textAlign = 'center';
      tempCtx.textBaseline = 'middle';
      const statusText = matchStatus || 'Full-Time';
      tempCtx.fillText(statusText, canvasWidth / 2, matchStatusY + matchStatusHeight / 2);
      tempCtx.restore();
    }

    // Section 4: Goals (only if not isMatchday)
    if (!isMatchday) {
      const goalsY = matchStatusY + matchStatusHeight;
      const teamGoalsWidth = scoreBoxWidth * 0.48;
      const team2Offset = scoreBoxWidth * 0.52;
      const goalEntryHeight = 20 * Math.min(scaleX, scaleY);
      const goalFontSize = 10 * Math.min(scaleX, scaleY);
      const ballSize = 7 * Math.min(scaleX, scaleY);
      const playerWidth = 80 * scaleX;
      const timeWidth = 60 * scaleX;
      const gap = 4 * scaleX;

      // Draw Team 1 goals
      team1Goals.forEach((goal, index) => {
        const goalY = goalsY + index * goalEntryHeight;
        tempCtx.save();
        tempCtx.textBaseline = 'middle';
        tempCtx.textAlign = 'left';
        const scoreBoxLeft = (canvasWidth - scoreBoxWidth) / 2;
        const padding = 10 * Math.min(scaleX, scaleY);
        let xOffset = scoreBoxLeft + padding;

        tempCtx.font = `550 ${goalFontSize}px Arial`;
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillText(goal.player || 'Player', xOffset, goalY + goalEntryHeight / 2, playerWidth);

        xOffset += playerWidth + gap;

        tempCtx.font = `300 ${goalFontSize}px Arial`;
        tempCtx.fillText(goal.time ? `${goal.time}'` : 'Time', xOffset, goalY + goalEntryHeight / 2, timeWidth);

        xOffset += timeWidth + gap;

        drawCircularEmoji(tempCtx, '⚽', xOffset + ballSize / 2, goalY + goalEntryHeight / 2, ballSize);

        tempCtx.restore();
      });

      // Draw Team 2 goals
      team2Goals.forEach((goal, index) => {
        const goalY = goalsY + index * goalEntryHeight;
        tempCtx.save();
        tempCtx.textBaseline = 'middle';
        tempCtx.textAlign = 'left';
        const entryWidth = ballSize + gap + timeWidth + gap + playerWidth;
        let xOffset = (canvasWidth - scoreBoxWidth) / 2 + team2Offset + (teamGoalsWidth - entryWidth) / 2;

        drawCircularEmoji(tempCtx, '⚽', xOffset + ballSize / 2, goalY + goalEntryHeight / 2, ballSize);

        xOffset += ballSize + gap;

        tempCtx.font = `300 ${goalFontSize}px Arial`;
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillText(goal.time ? `${goal.time}'` : 'Time', xOffset, goalY + goalEntryHeight / 2, timeWidth);

        xOffset += timeWidth + gap;

        tempCtx.font = `550 ${goalFontSize}px Arial`;
        tempCtx.fillText(goal.player || 'Player', xOffset, goalY + goalEntryHeight / 2, playerWidth);

        tempCtx.restore();
      });
    }

    // Draw text elements
    texts.forEach((text) => {
      tempCtx.save();
      const scaledX = text.x * scaleX;
      const scaledY = text.y * scaleY;
      const scaledFontSize = text.fontSize * Math.min(scaleX, scaleY);
      let fontStyle = '';
      if (text.italic) fontStyle += 'italic ';
      if (text.bold) fontStyle += 'bold ';
      tempCtx.font = `${fontStyle}${scaledFontSize}px ${text.fontFamily || 'Arial'}`;
      tempCtx.textAlign = 'center';
      tempCtx.textBaseline = 'middle';
      tempCtx.translate(scaledX, scaledY);
      tempCtx.rotate((text.rotation || 0) * Math.PI / 180);

      const textWidth = tempCtx.measureText(text.content || '').width;
      const textHeight = scaledFontSize * 1.2;

      if (text.stroke && text.stroke !== 'none') {
        tempCtx.strokeStyle = text.stroke;
        tempCtx.lineWidth = scaledFontSize / 40;
        tempCtx.strokeText(text.content || '', 0, 0);
      }

      if (text.color.includes(',')) {
        drawGradientText(tempCtx, text, scaledFontSize, fontStyle, textWidth, textHeight);
      } else {
        tempCtx.fillStyle = text.color || '#ffffff';
        tempCtx.fillText(text.content || '', 0, 0);
      }

      if (text.underline && text.underline !== 'none') {
        drawUnderline(tempCtx, text, scaledFontSize, textWidth);
      }
      tempCtx.restore();
    });

    // Wait for all logos to load, then download
    return Promise.all([...logoPromises, ...teamLogoPromises]).then(() => {
      const tryGenerateImage = (quality, resolve, reject) => {
        tempCanvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create image blob'));
              isDownloading.current = false;
              return;
            }

            const sizeKB = (blob.size / 1024).toFixed(2);
            console.log(`Image size at quality ${quality}: ${sizeKB} KB`);

            const targetSizeKB = 500;
            const minQuality = 0.5;
            const qualityStep = 0.05;

            if (sizeKB <= targetSizeKB || quality <= minQuality) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'sports-image.jpg';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              tempCanvas.remove();
              resolve();
            } else {
              setTimeout(() => tryGenerateImage(quality - qualityStep, resolve, reject), 0);
            }
          },
          'image/jpeg',
          quality
        );
      };

      return new Promise((resolve, reject) => {
        tryGenerateImage(0.8, resolve, reject);
      }).finally(() => {
        isDownloading.current = false;
      });
    }).catch((err) => {
      console.error('Failed to process image:', err);
      alert('Failed to process the image. Please try again.');
      isDownloading.current = false;
    });
  }, [
    image,
    secondImage,
    texts,
    logos,
    team1Logo,
    team2Logo,
    team1Score,
    team2Score,
    filters,
    canvasRefs,
    imageDimensions,
    selectedCompetition,
    matchStatus,
    team1Goals,
    team2Goals,
    isMatchday,
  ]);

  return (
    <div className="download-section" style={{ padding: '10px', textAlign: 'center' }}>
      <button
        onClick={downloadSportsImage}
        onTouchStart={downloadSportsImage}
        style={{
          fontSize: '14px',
          background: 'green',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          padding: '11px 20px',
          cursor: 'pointer',
          touchAction: 'manipulation',
          width: 'auto',
          maxWidth: '250px',
          display: 'inline-block',
          fontWeight: '600',
          transition: 'background-color 0.2s, transform 0.1s',
        }}
        onMouseDown={(e) => e.preventDefault()}
        onTouchEnd={(e) => e.preventDefault()}
        aria-label="Download sports image"
        role="button"
        disabled={isDownloading.current}
      >
        Download
      </button>
    </div>
  );
};