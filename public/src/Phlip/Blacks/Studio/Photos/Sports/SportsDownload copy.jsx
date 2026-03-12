import React, { useCallback } from 'react';
import { loadImage } from './SportsUtils';

export const SportsDownload = ({
  image,
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
}) => {
  const drawUnderline = (ctx, text, scaledFontSize, textWidth, scaleX, scaleY) => {
    ctx.beginPath();
    const underlineY = scaledFontSize * 0.1;
    ctx.moveTo(-textWidth / 2, underlineY);
    ctx.lineTo(textWidth / 2, underlineY);
    ctx.strokeStyle = text.stroke || '#000000';
    ctx.lineWidth = scaledFontSize / 20;
    ctx.stroke();
  };

  const drawGradientText = (ctx, text, scaledFontSize, fontStyle, scaleX, scaleY) => {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    const textWidth = ctx.measureText(text.content || '').width;
    const textHeight = scaledFontSize * 1.2;

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

  const drawLogo = (ctx, logo, scaleX, scaleY, x, y) => {
    if (!logo.src) return Promise.resolve();
    return loadImage(logo.src).then((img) => {
      const originalWidth = img.naturalWidth;
      const originalHeight = img.naturalHeight;
      const targetWidth = 60 * scaleX;
      const targetHeight = 60 * scaleY;
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
      ctx.drawImage(
        img,
        -displayWidth / 2,
        -displayHeight / 2,
        displayWidth,
        displayHeight
      );
      ctx.restore();
    }).catch((err) => {
      console.error('Failed to load logo image:', err);
    });
  };

  const drawCircularEmoji = (ctx, emoji, x, y, size, scaleX, scaleY) => {
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
    const { canvasRef, imageRef } = canvasRefs;
    if (!canvasRef?.current || !image) {
      alert('No image available for download. Please select an image.');
      return;
    }

    const canvas = canvasRef.current;
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    const img = imageRef.current;
    const originalWidth = img.naturalWidth;
    const originalHeight = img.naturalHeight;

    // Adjust canvas size for device pixel ratio
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap DPR at 2 for performance on mobile
    tempCanvas.width = originalWidth * dpr;
    tempCanvas.height = originalHeight * dpr;
    tempCtx.scale(dpr, dpr);

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const scaleX = originalWidth / canvasWidth;
    const scaleY = originalHeight / canvasHeight;

    return loadImage(image).then((bgImg) => {
      // Apply filters to background image
      tempCtx.filter = `
        brightness(${filters.brightness}%)
        contrast(${filters.contrast}%)
        saturate(${filters.saturation}%)
        grayscale(${filters.grayscale}%)
        sepia(${filters.sepia}%)
        blur(${filters.blur}px)
      `;
      tempCtx.drawImage(bgImg, 0, 0, originalWidth, originalHeight);
      tempCtx.filter = 'none';

      // Draw logos (excluding team logos)
      const logoPromises = logos
        .filter((logo) => logo.type === 'logo' && logo.id !== 'team1Logo' && logo.id !== 'team2Logo')
        .map((logo) => drawLogo(tempCtx, logo, scaleX, scaleY, logo.x, logo.y));

      // Calculate score box dimensions
      const scoreBoxWidth = originalWidth * 0.8;
      const scoreBoxPadding = 8 * Math.min(scaleX, scaleY);
      const goalEntryHeight = 20 * Math.min(scaleX, scaleY);
      const numGoals = Math.max(team1Goals.length, team2Goals.length);
      const scoreBoxHeight = (36 + 60 + 36 + numGoals * 24) * Math.min(scaleX, scaleY);
      const scoreBoxY = originalHeight - scoreBoxHeight - 10 * scaleY;

      // Draw score box container background
      tempCtx.save();
      tempCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      tempCtx.beginPath();
      tempCtx.roundRect(
        (originalWidth - scoreBoxWidth) / 2,
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
      tempCtx.fillText(
        competitionText,
        originalWidth / 2,
        competitionY + competitionHeight / 2,
        scoreBoxWidth * 0.5
      );
      tempCtx.restore();

      // Section 2: Logos and Scores
      const logosScoresHeight = 60 * Math.min(scaleX, scaleY);
      const logosScoresY = competitionY + competitionHeight;
      const teamLogoWidth = 60 * scaleX;
      const scoreContainerWidth = 150 * scaleX;
      const totalLogosScoresWidth = teamLogoWidth * 2 + scoreContainerWidth;
      const logosScoresLeft = (originalWidth - totalLogosScoresWidth) / 2;

      // Draw team logos
      const teamLogoPromises = [];
      if (team1Logo) {
        const team1X = logosScoresLeft + teamLogoWidth / 2;
        const team1Y = logosScoresY + teamLogoWidth / 2;
        teamLogoPromises.push(
          drawLogo(tempCtx, { ...team1Logo, width: 60, height: 60 }, scaleX, scaleY, team1X / scaleX, team1Y / scaleY)
        );
      }
      if (team2Logo) {
        const team2X = logosScoresLeft + teamLogoWidth + scoreContainerWidth + teamLogoWidth / 2;
        const team2Y = logosScoresY + teamLogoWidth / 2;
        teamLogoPromises.push(
          drawLogo(tempCtx, { ...team2Logo, width: 60, height: 60 }, scaleX, scaleY, team2X / scaleX, team2Y / scaleY)
        );
      }

      // Draw scores
      const scoreFontSize = 32 * Math.min(scaleX, scaleY);
      tempCtx.save();
      tempCtx.font = `900 ${scoreFontSize}px Arial`;
      tempCtx.fillStyle = '#ffffff';
      tempCtx.textAlign = 'center';
      tempCtx.textBaseline = 'middle';
      const scoreX1 = logosScoresLeft + teamLogoWidth + 30 * scaleX;
      const scoreX2 = logosScoresLeft + teamLogoWidth + scoreContainerWidth - 30 * scaleX;
      const scoreY = logosScoresY + logosScoresHeight / 2;
      tempCtx.fillText(team1Score || '0', scoreX1, scoreY);
      tempCtx.fillText('-', logosScoresLeft + teamLogoWidth + scoreContainerWidth / 2, scoreY);
      tempCtx.fillText(team2Score || '0', scoreX2, scoreY);
      tempCtx.restore();

      // Section 3: Match Status
      const matchStatusHeight = 36 * Math.min(scaleX, scaleY);
      const matchStatusY = logosScoresY + logosScoresHeight;
      const matchStatusFontSize = 14 * Math.min(scaleX, scaleY);
      tempCtx.save();
      tempCtx.font = `${matchStatusFontSize}px Arial`;
      tempCtx.fillStyle = '#ffffff';
      tempCtx.textAlign = 'center';
      tempCtx.textBaseline = 'middle';
      tempCtx.fillText(matchStatus || 'Full-Time', originalWidth / 2, matchStatusY + matchStatusHeight / 2);
      tempCtx.restore();

      // Section 4: Goals
      const goalsY = matchStatusY + matchStatusHeight;
      const teamGoalsWidth = scoreBoxWidth * 0.45;
      const team2Offset = scoreBoxWidth * 0.55;
      const goalFontSize = 12 * Math.min(scaleX, scaleY);
      const ballSize = 7 * Math.min(scaleX, scaleY);

      // Draw Team 1 goals
      team1Goals.forEach((goal, index) => {
        const goalY = goalsY + index * goalEntryHeight;
        tempCtx.save();
        tempCtx.font = `550 ${goalFontSize}px Arial`;
        tempCtx.fillStyle = '#ffffff';
        tempCtx.textAlign = 'left';
        tempCtx.textBaseline = 'middle';

        let xOffset = (originalWidth - scoreBoxWidth) / 2;
        tempCtx.fillText(goal.player || 'Player', xOffset + 15 * scaleX, goalY + goalEntryHeight / 2, 90 * scaleX);

        xOffset += 90 * scaleX + 4 * scaleX;
        tempCtx.font = `300 ${goalFontSize}px Arial`;
        tempCtx.fillText(goal.time ? `${goal.time}'` : 'Time', xOffset + 3 * scaleX, goalY + goalEntryHeight / 2, 50 * scaleX);

        xOffset += 50 * scaleX + 4 * scaleX;
        drawCircularEmoji(tempCtx, '⚽', xOffset, goalY + goalEntryHeight / 2, ballSize, scaleX, scaleY);

        tempCtx.restore();
      });

      // Draw Team 2 goals
      team2Goals.forEach((goal, index) => {
        const goalY = goalsY + index * goalEntryHeight;
        tempCtx.save();
        tempCtx.font = `550 ${goalFontSize}px Arial`;
        tempCtx.fillStyle = '#ffffff';
        tempCtx.textAlign = 'left';
        tempCtx.textBaseline = 'middle';

        let xOffset = (originalWidth - scoreBoxWidth) / 2 + team2Offset;
        drawCircularEmoji(tempCtx, '⚽', xOffset + 4 * scaleX, goalY + goalEntryHeight / 2, ballSize, scaleX, scaleY);

        xOffset += 4 * scaleX + ballSize;
        tempCtx.font = `300 ${goalFontSize}px Arial`;
        tempCtx.fillText(goal.time ? `${goal.time}'` : 'Time', xOffset + 3 * scaleX, goalY + goalEntryHeight / 2, 50 * scaleX);

        xOffset += 50 * scaleX + 4 * scaleX;
        tempCtx.font = `550 ${goalFontSize}px Arial`;
        tempCtx.fillText(goal.player || 'Player', xOffset + 15 * scaleX, goalY + goalEntryHeight / 2, 90 * scaleX);

        tempCtx.restore();
      });

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

        if (text.stroke && text.stroke !== 'none') {
          tempCtx.strokeStyle = text.stroke;
          tempCtx.lineWidth = scaledFontSize / 40;
          tempCtx.strokeText(text.content || '', 0, 0);
        }

        if (text.color.includes(',')) {
          drawGradientText(tempCtx, text, scaledFontSize, fontStyle, scaleX, scaleY);
        } else {
          tempCtx.fillStyle = text.color || '#ffffff';
          tempCtx.fillText(text.content || '', 0, 0);
        }

        if (text.underline && text.underline !== 'none') {
          drawUnderline(tempCtx, text, scaledFontSize, textWidth, scaleX, scaleY);
        }

        tempCtx.restore();
      });

      // Wait for all logos to load, then download
      return Promise.all([...logoPromises, ...teamLogoPromises]).then(() => {
        // Function to convert data URL to file size in KB
        const getFileSizeInKB = (dataURL) => {
          const byteString = atob(dataURL.split(',')[1]);
          return (byteString.length / 1024).toFixed(2); // Size in KB
        };

        // Convert canvas to Blob for better mobile compatibility
        const tryGenerateImage = (quality, resolve, reject) => {
          tempCanvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create image blob'));
                return;
              }

              const sizeKB = (blob.size / 1024).toFixed(2);
              console.log(`Image size at quality ${quality}: ${sizeKB} KB`);

              const targetSizeKB = 500; // Adjust based on needs
              const minQuality = 0.5;
              const qualityStep = 0.05;

              if (sizeKB <= targetSizeKB || quality <= minQuality) {
                // Size is acceptable or quality can't be reduced further
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
                // Try again with lower quality
                setTimeout(() => tryGenerateImage(quality - qualityStep, resolve, reject), 0);
              }
            },
            'image/jpeg',
            quality
          );
        };

        return new Promise((resolve, reject) => {
          tryGenerateImage(1.0, resolve, reject); // Start with maximum quality
        });
      });
    }).catch((err) => {
      console.error('Failed to load background image:', err);
      alert('Failed to load the background image. Please try again.');
    });
  }, [
    image,
    texts,
    logos,
    team1Logo,
    team2Logo,
    team1Score,
    team2Score,
    filters,
    canvasRefs,
    selectedCompetition,
    matchStatus,
    team1Goals,
    team2Goals,
  ]);

  return (
    <div className="download-section" style={{ padding: '10px', textAlign: 'center' }}>
      <button
        onClick={downloadSportsImage}
        onTouchStart={downloadSportsImage} // Support touch events for mobile
        style={{
         maxWidth:"fitcontent",
          fontSize: '12px',
          background: 'green',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          touchAction: 'manipulation', // Improve touch responsiveness
          width: 'auto',
          maxWidth: '200px',
          display: 'inline-block',
          fontWeight: '500',
          transition: 'background-color 0.2s',
        }}
        onMouseDown={(e) => e.preventDefault()} // Prevent focus outline on click
        onTouchEnd={(e) => e.preventDefault()} // Prevent default touch behavior
        aria-label="Download sports image"
        role="button"
      >
        Download
      </button>
    </div>
  );
}; 