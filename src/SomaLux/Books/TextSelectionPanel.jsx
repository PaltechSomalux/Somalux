/**
 * TextSelectionPanel.jsx - MOBILE OPTIMIZED VERSION
 * High-precision text selection panel with mobile-first positioning
 * Stays visible until user dismisses it
 */

import React, { useState, useEffect, useRef } from 'react';
import { FiCopy, FiPenTool, FiX } from 'react-icons/fi';
import './TextSelectionPanel.css';

const highlightColors = [
  { name: 'Yellow', value: 'yellow', hex: '#FFC107' },
  { name: 'Green', value: 'green', hex: '#4CAF50' },
  { name: 'Blue', value: 'blue', hex: '#2196F3' },
  { name: 'Pink', value: 'pink', hex: '#E91E63' },
  { name: 'Orange', value: 'orange', hex: '#FF9800' },
];

const TextSelectionPanel = ({
  position,
  selectedText,
  onCopy,
  onHighlight,
  onClose,
}) => {
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const panelRef = useRef(null);
  const [adjustedPos, setAdjustedPos] = useState(position);
  const [isMobile, setIsMobile] = useState(false);
  const feedbackTimeoutRef = useRef(null);

  // Detect mobile on mount and orientation changes
  useEffect(() => {
    const detectMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) || (navigator.maxTouchPoints > 2);
      setIsMobile(mobile);
    };

    detectMobile();
    window.addEventListener('orientationchange', detectMobile);
    window.addEventListener('resize', detectMobile);
    return () => {
      window.removeEventListener('orientationchange', detectMobile);
      window.removeEventListener('resize', detectMobile);
    };
  }, []);

  // STABLE: Update position when prop changes with mobile-aware adjustments
  useEffect(() => {
    if (!position) {
      setAdjustedPos(null);
      return;
    }

    setAdjustedPos(position);

    // Fine-tune position after panel renders
    const timer = requestAnimationFrame(() => {
      if (!panelRef.current) return;

      const rect = panelRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const basePadding = isMobile ? 10 : 15;
      const padding = Math.max(basePadding, 5);

      let newX = position.x;
      let newY = position.y;

      // Adjust if going off-screen with aggressive margins on mobile
      if (rect.left < padding) {
        newX = padding;
      } else if (rect.right > viewportWidth - padding) {
        newX = Math.max(padding, viewportWidth - rect.width - padding);
      }

      if (rect.top < padding) {
        newY = padding;
      } else if (rect.bottom > viewportHeight - padding) {
        newY = Math.max(padding, viewportHeight - rect.height - padding);
      }

      // Additional constraint for very small screens
      if (isMobile && viewportWidth < 420) {
        // On very small screens, keep panel slightly inset
        const maxWidth = viewportWidth - 20;
        if (rect.width > maxWidth) {
          newX = 10;
        }
      }

      setAdjustedPos({ x: newX, y: newY });
    });

    return () => cancelAnimationFrame(timer);
  }, [position, isMobile]);

  // STABLE: Handle copy with feedback and haptic
  const handleCopyClick = async () => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    // Haptic feedback on mobile
    if (isMobile && navigator.vibrate) {
      navigator.vibrate(50);
    }

    try {
      await navigator.clipboard.writeText(selectedText);
      setCopiedFeedback(true);

      feedbackTimeoutRef.current = setTimeout(() => {
        setCopiedFeedback(false);
        // Keep panel open after copy feedback
      }, 1200);
    } catch (err) {
      console.error('❌ Copy failed:', err);
      // Fallback copy
      const textarea = document.createElement('textarea');
      textarea.value = selectedText;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopiedFeedback(true);
        feedbackTimeoutRef.current = setTimeout(() => {
          setCopiedFeedback(false);
        }, 1200);
      } catch (e) {
        console.error('❌ Fallback copy failed:', e);
      }
      document.body.removeChild(textarea);
    }
  };

  // STABLE: Close panel with haptic feedback
  const handleClosePanel = () => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    // Haptic feedback on mobile
    if (isMobile && navigator.vibrate) {
      navigator.vibrate(20);
    }
    onClose();
  };

  if (!position || !adjustedPos) return null;

  return (
    <>
      {/* Selection Panel - No overlay to avoid interfering with reader */}
      <div
        ref={panelRef}
        className="text-selection-panel"
        style={{
          position: 'fixed',
          left: `${adjustedPos.x}px`,
          top: `${adjustedPos.y}px`,
          zIndex: 2000,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated entrance */}
        <div className="selection-panel-content">
          {copiedFeedback ? (
            // Copy success feedback
            <div className="selection-panel-feedback">
              <div className="feedback-checkmark">✓</div>
              <div className="feedback-text">Copied!</div>
            </div>
          ) : (
            // Main action buttons with inline colors
            <>
              <button
                className="selection-panel-btn copy-btn"
                onClick={handleCopyClick}
                title="Copy selected text"
                aria-label="Copy text"
              >
                <FiCopy size={16} />
                <span>Copy</span>
              </button>

              <div className="selection-panel-divider" />

              {/* Highlight label */}
              <div className="highlight-label">Highlight</div>
              
              {/* Color options inline */}
              <div className="inline-colors">
                {highlightColors.map((color) => (
                  <button
                    key={color.value}
                    className="inline-color-btn"
                    onClick={() => {
                      // Haptic feedback on mobile
                      if (isMobile && navigator.vibrate) {
                        navigator.vibrate(30);
                      }
                      onHighlight(color.value);
                    }}
                    title={`Highlight with ${color.name}`}
                    style={{
                      backgroundColor: color.hex,
                    }}
                    aria-label={`Highlight with ${color.name}`}
                  >
                    <span className="color-name">{color.name}</span>
                  </button>
                ))}
              </div>

              <div className="selection-panel-divider" />

              <button
                className="panel-close-btn"
                onClick={handleClosePanel}
                title="Close panel"
                aria-label="Close selection panel"
              >
                <FiX size={18} />
              </button>
            </>
          )}
        </div>

        {/* Arrow pointer */}
        <div className="selection-panel-arrow" />
      </div>
    </>
  );
};

export default TextSelectionPanel;
