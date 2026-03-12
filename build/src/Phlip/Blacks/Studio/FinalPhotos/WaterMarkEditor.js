import React, { useState, useRef, useEffect } from 'react';
import { ImagePreviewSection } from './ImagePreviewSection';
import { WatermarkControlsSection } from './WatermarkControlsSection';

export const WatermarkEditor = (props) => {
  const [isDragging, setIsDragging] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [showTextInputOnImage, setShowTextInputOnImage] = useState(false);
  const imageRef = useRef();

  // Handle image load to get dimensions
  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageDimensions({
        width: imageRef.current.offsetWidth,
        height: imageRef.current.offsetHeight
      });
    }
  };

  // Reset text input visibility when image changes
  useEffect(() => {
    setShowTextInputOnImage(false);
  }, [props.selectedImage]);

  return (
    <div className="editor-container">
      <ImagePreviewSection 
        previewImage={props.previewImage}
        selectedImage={props.selectedImage}
        setSelectedImage={props.setSelectedImage}
        setPreviewImage={props.setPreviewImage}
        watermarkPosition={props.watermarkPosition}
        setWatermarkPosition={props.setWatermarkPosition}
        isDragging={isDragging}
        setIsDragging={setIsDragging}
        watermarkType={props.watermarkType}
        setWatermarkType={props.setWatermarkType}
        watermarkText={props.watermarkText}
        setWatermarkText={props.setWatermarkText}
        watermarkColor={props.watermarkColor}
        setWatermarkColor={props.setWatermarkColor}
        watermarkSize={props.watermarkSize}
        setWatermarkSize={props.setWatermarkSize}
        watermarkOpacity={props.watermarkOpacity}
        setWatermarkOpacity={props.setWatermarkOpacity}
        logoImage={props.logoImage}
        showTextInputOnImage={showTextInputOnImage}
        setShowTextInputOnImage={setShowTextInputOnImage}
        imageDimensions={imageDimensions}
        imageRef={imageRef}
        onImageLoad={handleImageLoad}
        isBold={props.isBold}
        setIsBold={props.setIsBold}
        isItalic={props.isItalic}
        setIsItalic={props.setIsItalic}
        isUnderline={props.isUnderline}
        setIsUnderline={props.setIsUnderline}
        fontFamily={props.fontFamily}
        setFontFamily={props.setFontFamily}
        textAlign={props.textAlign}
        setTextAlign={props.setTextAlign}
        textShadow={props.textShadow}
        setTextShadow={props.setTextShadow}
        rotation={props.rotation}
        setRotation={props.setRotation}
      />
      
      <WatermarkControlsSection 
        watermarkType={props.watermarkType}
        setWatermarkType={props.setWatermarkType}
        watermarkColor={props.watermarkColor}
        setWatermarkColor={props.setWatermarkColor}
        watermarkSize={props.watermarkSize}
        setWatermarkSize={props.setWatermarkSize}
        watermarkOpacity={props.watermarkOpacity}
        setWatermarkOpacity={props.setWatermarkOpacity}
        logoImage={props.logoImage}
        setLogoImage={props.setLogoImage}
        selectedImage={props.selectedImage}
        handleLogoUpload={props.handleLogoUpload}
        downloadImage={props.downloadImage}
        isBold={props.isBold}
        setIsBold={props.setIsBold}
        isItalic={props.isItalic}
        setIsItalic={props.setIsItalic}
        isUnderline={props.isUnderline}
        setIsUnderline={props.setIsUnderline}
        fontFamily={props.fontFamily}
        setFontFamily={props.setFontFamily}
        textAlign={props.textAlign}
        setTextAlign={props.setTextAlign}
        textShadow={props.textShadow}
        setTextShadow={props.setTextShadow}
        rotation={props.rotation}
        setRotation={props.setRotation}
        resetWatermark={props.resetWatermark}
        showTextInputOnImage={showTextInputOnImage}
        setShowTextInputOnImage={setShowTextInputOnImage}
      />
    </div> 
  );
};