import React, { useState } from 'react';
import { ImageToPdf } from './ImageToPdf';
import { PdfToWord } from './PdfToWord'; 
import { WordToPdf } from './WordToPdf'; 
import { WordToImage } from './WordToImage';
import { ImageFormat } from './ImageFormat';
import { ImageCompress } from './ImageCompress';
import "./FileConverter.css";

export const FileConverter = () => {
  const [activeTab, setActiveTab] = useState('imageToPdf');
 
  return (
    <div className="top-toolbar-convert">
      <div className="tools-scroll-container-convert">
        <div className="tool-group-convert">
          <button 
            className={`tool-button-convert ${activeTab === 'imageToPdf' ? 'active-convert' : ''}`}
            onClick={() => setActiveTab('imageToPdf')}
            data-tooltip="Convert images to PDF"
          >
            <span>Image to PDF</span>
          </button>
          <button 
            className={`tool-button-convert ${activeTab === 'pdfToWord' ? 'active-convert' : ''}`}
            onClick={() => setActiveTab('pdfToWord')}
            data-tooltip="Convert PDF to Word document"
          >
            <span>PDF to Word</span>
          </button>
          <button 
            className={`tool-button-convert ${activeTab === 'wordToPdf' ? 'active-convert' : ''}`}
            onClick={() => setActiveTab('wordToPdf')}
            data-tooltip="Convert Word document to PDF"
          >
            <span>Word to PDF</span>
          </button>
          <button 
            className={`tool-button-convert ${activeTab === 'wordToImage' ? 'active-convert' : ''}`}
            onClick={() => setActiveTab('wordToImage')}
            data-tooltip="Extract images from Word document"
          >
            <span>Word to Image</span>
          </button>
          <button 
            className={`tool-button-convert ${activeTab === 'imageFormat' ? 'active-convert' : ''}`}
            onClick={() => setActiveTab('imageFormat')}
            data-tooltip="Convert between image formats"
          >
            <span>Image Format</span>
          </button>
          <button 
            className={`tool-button-convert ${activeTab === 'compress' ? 'active-convert' : ''}`}
            onClick={() => setActiveTab('compress')}
            data-tooltip="Compress image files"
          >
            <span>Compress</span>
          </button>
        </div>
      </div>
      
      <div className="file-converter-content-convert">
        {activeTab === 'imageToPdf' && <ImageToPdf />}
        {activeTab === 'pdfToWord' && <PdfToWord />}
        {activeTab === 'wordToPdf' && <WordToPdf />}
        {activeTab === 'wordToImage' && <WordToImage />}
        {activeTab === 'imageFormat' && <ImageFormat />}
        {activeTab === 'compress' && <ImageCompress />}
      </div>
    </div>
  );
};