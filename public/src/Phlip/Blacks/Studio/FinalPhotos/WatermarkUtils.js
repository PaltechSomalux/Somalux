export const applyImageWatermark = (ctx, width, height, { image, opacity, position }) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx.globalAlpha = opacity;
      let x, y, imgWidth, imgHeight;

      const scale = Math.min(width / img.width, height / img.height, 0.3);
      imgWidth = img.width * scale;
      imgHeight = img.height * scale;

      switch (position) {
        case 'top-left':
          x = 20;
          y = 20;
          break;
        case 'top-right':
          x = width - imgWidth - 20;
          y = 20;
          break;
        case 'bottom-left':
          x = 20;
          y = height - imgHeight - 20;
          break;
        case 'bottom-right':
          x = width - imgWidth - 20;
          y = height - imgHeight - 20;
          break;
        case 'tiled':
          const stepX = width / 3;
          const stepY = height / 3;
          for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
              ctx.drawImage(img, stepX * i + (stepX - imgWidth) / 2, stepY * j + (stepY - imgHeight) / 2, imgWidth, imgHeight);
            }
          }
          ctx.globalAlpha = 1;
          resolve();
          return;
        default:
          x = (width - imgWidth) / 2;
          y = (height - imgHeight) / 2;
      }

      ctx.drawImage(img, x, y, imgWidth, imgHeight);
      ctx.globalAlpha = 1;
      resolve();
    };
    img.onerror = () => reject(new Error('Failed to load logo image'));
    img.src = image;
  });
};