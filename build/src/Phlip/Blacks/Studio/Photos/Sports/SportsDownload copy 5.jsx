import React, { useCallback, useEffect, useRef } from 'react';
import { loadImage, measureTextWidth } from './SportsUtils';
import './Sports.css';

export const SportsDownload = ({
  image,
  additionalImages,
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
  showScoreBox,
  selectedFeature,
  customMatchTime,
  spokesperson,
  matchDateTime,
  fontFamily,
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
        // Preload additional background images if isMatchday or quote feature is active
        if ((isMatchday || selectedFeature === 'quote') && additionalImages.length > 0) {
          const additionalImagePromises = additionalImages.map(async (imgSrc) => {
            const img = await loadImage(imgSrc);
            imageCache.current.set(imgSrc, img);
          });
          await Promise.all(additionalImagePromises);
        }
        // Preload logos, excluding team logos and quote image
        const logoPromises = logos
          .filter(
            (logo) =>
              logo.src &&
              logo.type === 'logo' &&
              logo.id !== 'team1Logo' &&
              logo.id !== 'team2Logo' &&
              logo.id !== 'quoteImage'
          )
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
        // Preload quote image
        const quoteImage = logos.find((logo) => logo.id === 'quoteImage');
        if (quoteImage?.src) {
          const img = await loadImage(quoteImage.src);
          imageCache.current.set(quoteImage.src, img);
        }
        await Promise.all(logoPromises);
      } catch (err) {
        console.error('Failed to preload images:', err);
      }
    };
    preloadImages();
  }, [image, additionalImages, logos, team1Logo, team2Logo, isMatchday, selectedFeature]);

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

    tempCtx.font = `${fontStyle}${scaledFontSize}px ${text.fontFamily || 'Roboto'}`;
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

    // Apply circular clip for quoteImage
    if (logo.id === 'quoteImage') {
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(displayWidth, displayHeight) / 2, 0, Math.PI * 2);
      ctx.clip();
    }

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

  const drawQuoteBox = (ctx, width, height, scaleX, scaleY) => {
    const boxWidth = width * 0.8;
    const boxHeight = 200 * Math.min(scaleX, scaleY);
    const boxX = (width - boxWidth) / 2;
    const boxY = height - boxHeight - 10 * scaleY;
    const padding = 8 * Math.min(scaleX, scaleY);

    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 10 * Math.min(scaleX, scaleY));
    ctx.fill();

    // Draw quote symbol
    ctx.font = `bold ${48 * Math.min(scaleX, scaleY)}px Arial`;
    ctx.fillStyle = 'red';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('“', boxX + padding, boxY - 20 * scaleY);

    // Draw quote image
    const quoteImage = logos.find((logo) => logo.id === 'quoteImage');
    if (quoteImage) {
      const quoteImageSize = 60 * Math.min(scaleX, scaleY);
      drawLogo(
        ctx,
        quoteImage,
        scaleX,
        scaleY,
        (boxX + boxWidth - 70 * scaleX) / scaleX,
        (boxY - 60 * scaleY) / scaleY,
        60
      );
    }

    // Draw quote text
    const quoteText = customMatchTime || 'Enter quote';
    ctx.font = `${16 * Math.min(scaleX, scaleY)}px 'Roboto', sans-serif`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const maxWidth = boxWidth - 2 * padding;
    const words = quoteText.split(' ');
    let line = '';
    let lines = [];
    let y = boxY + 12 * scaleY;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const testWidth = measureTextWidth(
        testLine,
        16 * Math.min(scaleX, scaleY),
        "'Roboto', sans-serif",
        false,
        false
      );
      if (testWidth > maxWidth && line) {
        lines.push(line.trim());
        line = words[i] + ' ';
      } else {
        line = testLine;
      }
    }
    if (line) lines.push(line.trim());

    lines.forEach((line, index) => {
      ctx.fillText(line, boxX + boxWidth / 2, y + index * 18 * scaleY);
    });

    // Draw spokesperson (moved above date)
    const spokespersonText = spokesperson || 'Spokesperson';
    ctx.font = `${14 * Math.min(scaleX, scaleY)}px 'Roboto', sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(spokespersonText, boxX + boxWidth - padding, boxY + boxHeight - 44 * scaleY);

    // Draw date (moved below spokesperson)
    const dateText = `${matchDateTime.day} ${matchDateTime.month} ${matchDateTime.year}`;
    ctx.font = `${12 * Math.min(scaleX, scaleY)}px 'Roboto', sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(dateText, boxX + boxWidth - padding, boxY + boxHeight - 24 * scaleY);
  };

  const downloadSportsImage = useCallback(() => {
    if (isDownloading.current) return;
    isDownloading.current = true;

    const { canvasRef, imageRef, additionalImageRefs } = canvasRefs;
    if (!canvasRef?.current || !image) {
      alert('No image available for download. Please select an image.');
      isDownloading.current = false;
      return;
    }

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    const img = imageCache.current.get(image) || imageRef.current;
    const originalWidth = img.naturalWidth;
    const originalHeight = img.naturalHeight;

    // Set target resolution to 1080x1350 for matchday or quote images with additional images
    const targetWidth = (isMatchday || selectedFeature === 'quote') && additionalImages.length > 0 ? 1080 : originalWidth;
    const targetHeight = (isMatchday || selectedFeature === 'quote') && additionalImages.length > 0 ? 1350 : originalHeight;

    tempCanvas.width = targetWidth;
    tempCanvas.height = targetHeight;

    const canvasWidth = imageDimensions.width;
    const canvasHeight = imageDimensions.height;
    const scaleX = (isMatchday || selectedFeature === 'quote') && additionalImages.length > 0 ? targetWidth / (canvasWidth * 2) : targetWidth / canvasWidth;
    const scaleY = targetHeight / canvasHeight;

    // Cache text measurements
    const textMetricsCache = new Map();

    // Draw primary background image
    tempCtx.filter = `
      brightness(${filters.brightness}%)
      contrast(${filters.contrast}%)
      saturate(${filters.saturation}%)
      grayscale(${filters.grayscale}%)
      sepia(${filters.sepia}%)
      blur(${filters.blur}px)
    `;
    tempCtx.drawImage(
      img,
      0,
      0,
      (isMatchday || selectedFeature === 'quote') && additionalImages.length > 0 ? targetWidth / 2 : targetWidth,
      (isMatchday || selectedFeature === 'quote') && additionalImages.length >= 2 ? targetHeight / 2 : targetHeight
    );
    tempCtx.filter = 'none';

    // Draw additional background images
    if ((isMatchday || selectedFeature === 'quote') && additionalImages.length > 0) {
      additionalImages.forEach((imgSrc, index) => {
        const additionalImg = imageCache.current.get(imgSrc) || additionalImageRefs.current[index];
        if (additionalImg) {
          const widthPerImage = targetWidth / 2;
          const heightPerImage = additionalImages.length >= 2 ? targetHeight / 2 : targetHeight;
          let x, y;
          if (index === 0) {
            x = widthPerImage;
            y = 0;
          } else if (index == 1) {
            x = 0;
            y = heightPerImage;
          } else if (index == 2) {
            x = widthPerImage;
            y = heightPerImage;
          }
          tempCtx.filter = `
            brightness(${filters.brightness}%)
            contrast(${filters.contrast}%)
            saturate(${filters.saturation}%)
            grayscale(${filters.grayscale}%)
            sepia(${filters.sepia}%)
            blur(${filters.blur}px)
          `;
          tempCtx.drawImage(additionalImg, x, y, widthPerImage, heightPerImage);
          tempCtx.filter = 'none';
        }
      });
    }

    // Draw logos (excluding team logos and quote image)
    const logoPromises = logos
      .filter(
        (logo) =>
          logo.type === 'logo' &&
          logo.id !== 'team1Logo' &&
          logo.id !== 'team2Logo' &&
          logo.id !== 'quoteImage'
      )
      .map((logo) => drawLogo(tempCtx, logo, scaleX, scaleY, logo.x, logo.y, logo.width));

    // Draw text elements
    texts.forEach((text) => {
      tempCtx.save();
      const scaledX = text.x * scaleX;
      const scaledY = text.y * scaleY;
      const scaledFontSize = text.fontSize * Math.min(scaleX, scaleY);
      let fontStyle = '';
      if (text.italic) fontStyle += 'italic ';
      if (text.bold) fontStyle += 'bold ';
      tempCtx.font = `${fontStyle}${scaledFontSize}px ${text.fontFamily || 'Roboto'}`;
      tempCtx.textAlign = 'center';
      tempCtx.textBaseline = 'middle';
      tempCtx.translate(scaledX, scaledY);
      tempCtx.rotate((text.rotation || 0) * Math.PI / 180);

      let textWidth = textMetricsCache.get(text.content);
      if (!textWidth) {
        textWidth = measureTextWidth(
          text.content || '',
          scaledFontSize,
          text.fontFamily || 'Roboto',
          text.bold,
          text.italic
        );
        textMetricsCache.set(text.content, textWidth);
      }
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

    // Draw "Campuslife" and ".co.ke" text in top right corner for quote feature
    if (selectedFeature === 'quote') {
      tempCtx.save();
      tempCtx.font = `bold ${16 * Math.min(scaleX, scaleY)}px 'Roboto', sans-serif`;
      tempCtx.fillStyle = 'white';
      tempCtx.textAlign = 'right';
      tempCtx.textBaseline = 'top';
      tempCtx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      tempCtx.shadowOffsetX = 1 * Math.min(scaleX, scaleY);
      tempCtx.shadowOffsetY = 1 * Math.min(scaleX, scaleY);
      tempCtx.shadowBlur = 2 * Math.min(scaleX, scaleY);
      tempCtx.fillText('Campuslife', targetWidth - 10 * scaleX, 10 * scaleY);
      tempCtx.fillText('.co.ke', targetWidth - 10 * scaleX, 10 * scaleY + 18 * scaleY);
      tempCtx.restore();
    }

    // Draw score or quote box
    const teamLogoPromises = [];
    if (selectedFeature === 'quote' || (showScoreBox && (isMatchday || (selectedFeature !== 'text' && selectedFeature !== 'logo')))) {
      if (selectedFeature === 'quote') {
        drawQuoteBox(tempCtx, targetWidth, targetHeight, scaleX, scaleY);
      } else {
        // Calculate score box dimensions
        const scoreBoxWidth = targetWidth * 0.8;
        const scoreBoxPadding = 8 * Math.min(scaleX, scaleY);
        const numGoals = isMatchday ? 0 : Math.max(team1Goals.length, team2Goals.length);
        const scoreBoxHeight = isMatchday
          ? (36 + 80 + 36) * Math.min(scaleX, scaleY)
          : (36 + 60 + 36 + numGoals * 24) * Math.min(scaleX, scaleY);
        const scoreBoxY = targetHeight - scoreBoxHeight - 10 * scaleY;
        const scoreBoxLeft = (targetWidth - scoreBoxWidth) / 2;

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
        tempCtx.fillText(competitionText, targetWidth / 2, competitionY + competitionHeight / 2, scoreBoxWidth * 0.5);
        tempCtx.restore();

        // Draw team logos
        if (team1Logo) {
          const team1X = scoreBoxLeft + scoreBoxPadding + (70 * scaleX) / 2;
          const team1Y = competitionY + competitionHeight + (isMatchday ? 70 : 60) / 2 * scaleY;
          teamLogoPromises.push(
            drawLogo(
              tempCtx,
              { ...team1Logo, width: isMatchday ? 70 : 60, height: isMatchday ? 70 : 60 },
              scaleX,
              scaleY,
              team1X / scaleX,
              scaleY / scaleY,
              isMatchday ? 70 : 60
            )
          );
        }
        if (team2Logo) {
          const team2X = scoreBoxLeft + scoreBoxWidth - scoreBoxPadding - (isMatchday ? 70 : 60) * scaleX / 2;
          const team2Y = competitionY + competitionHeight + (isMatchday ? 70 : 60) / 2 * scaleY;
          teamLogoPromises.push(
            drawLogo(
              tempCtx,
              { ...team2Logo, width: isMatchday ? 70 : 60, height: isMatchday ? 70 : 60 },
              scaleX,
              scaleY,
              team2X / scaleX,
              team2Y / scaleY,
              isMatchday ? 70 : 60
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
          tempCtx.fillText('VS', scoreBoxLeft + scoreBoxWidth / 2, competitionY + competitionHeight + (isMatchday ? 70 : 60) / 2 * scaleY);
        } else {
          const scoreFontSize = 32 * Math.min(scaleX, scaleY);
          tempCtx.font = `900 ${scoreFontSize}px Arial`;
          tempCtx.fillStyle = '#ffffff';
          const scoreX1 = scoreBoxLeft + scoreBoxPadding + 70 * scaleX;
          const scoreX2 = scoreBoxLeft + scoreBoxWidth - scoreBoxPadding - 70 * scaleX;
          const scoreY = competitionY + competitionHeight + (isMatchday ? 70 : 60) / 2 * scaleY;
          tempCtx.fillText(team1Score || '0', scoreX1, scoreY);
          tempCtx.fillText('-', scoreBoxLeft + scoreBoxWidth / 2, scoreY);
          tempCtx.fillText(team2Score || '0', scoreX2, scoreY);
        }
        tempCtx.restore();

        // Section 3: Match Status or Date
        const matchStatusHeight = 36 * Math.min(scaleX, scaleY);
        const matchStatusY = competitionY + (isMatchday ? 80 : 60) * scaleY;
        if (isMatchday) {
          let formattedMatchStatus = matchStatus || 'Fri 15/Aug 23:45';
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
          const spacing = 10 * Math.min(scaleX, scaleY);
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
          tempCtx.fillText(statusText, targetWidth / 2, matchStatusY + matchStatusHeight / 2);
          tempCtx.restore();
        }

        // Section 4: Goals (only if not isMatchday)
        if (!isMatchday) {
          const goalsY = matchStatusY + matchStatusHeight;
          const teamGoalsWidth = scoreBoxWidth * 0.48;
          const team2Offset = scoreBoxWidth * 0.52;
          const goalEntryHeight = 20 * Math.min(scaleX, scaleY);
          const goalFontSize = 12 * Math.min(scaleX, scaleY);
          const ballSize = 7 * Math.min(scaleX, scaleY);
          const playerWidth = 70 * scaleX;
          const timeWidth = 50 * scaleX;
          const gap = 4 * scaleX;

          // Draw Team 1 goals
          team1Goals.forEach((goal, index) => {
            const goalY = goalsY + index * goalEntryHeight;
            tempCtx.save();
            tempCtx.textBaseline = 'middle';
            tempCtx.textAlign = 'left';
            const scoreBoxLeft = (targetWidth - scoreBoxWidth) / 2;
            const padding = 10 * Math.min(scaleX, scaleY);
            let xOffset = scoreBoxLeft + padding;

            tempCtx.font = `550 ${goalFontSize}px Arial`;
            tempCtx.fillStyle = '#ffffff';
            tempCtx.fillText(goal.player || 'Player', xOffset, goalY + goalEntryHeight / 2, playerWidth);

            xOffset += playerWidth + gap;

            tempCtx.font = `300 ${goalFontSize}px Arial`;
            tempCtx.fillStyle = '#ffffff';
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
            let xOffset = (targetWidth - scoreBoxWidth) / 2 + team2Offset + (teamGoalsWidth - entryWidth) / 2;

            drawCircularEmoji(tempCtx, '⚽', xOffset + ballSize / 2, goalY + goalEntryHeight / 2, ballSize);

            xOffset += ballSize + gap;

            tempCtx.font = `300 ${goalFontSize}px Arial`;
            tempCtx.fillStyle = '#ffffff';
            tempCtx.fillText(goal.time ? `${goal.time}'` : 'Time', xOffset, goalY + goalEntryHeight / 2, timeWidth);

            xOffset += timeWidth + gap;

            tempCtx.font = `550 ${goalFontSize}px Arial`;
            tempCtx.fillStyle = '#ffffff';
            tempCtx.fillText(goal.player || 'Player', xOffset, goalY + goalEntryHeight / 2, playerWidth);

            tempCtx.restore();
          });
        }
      }
    }

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
    additionalImages,
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
    showScoreBox,
    selectedFeature,
    customMatchTime,
    spokesperson,
    matchDateTime,
    fontFamily,
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