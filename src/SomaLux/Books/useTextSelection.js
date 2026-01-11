/**
 * useTextSelection.js - STABLE VERSION
 * High-precision, reliable text selection detection
 * Guaranteed stable panel display with proper event handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const useTextSelection = (containerSelector = '.fast-reader-content') => {
  // Mobile device detection
  const isMobileRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);

  // Initialize mobile detection
  useEffect(() => {
    const detectMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) || (navigator.maxTouchPoints > 2);
      isMobileRef.current = mobile;
      setIsMobile(mobile);
      console.log(`📱 Mobile device detected: ${mobile}`);
      return mobile;
    };

    detectMobile();
    window.addEventListener('orientationchange', detectMobile);
    return () => window.removeEventListener('orientationchange', detectMobile);
  }, []);

  const [selection, setSelection] = useState(null);
  const [position, setPosition] = useState(null);
  const timeoutRef = useRef(null);
  const lastSelectionTimeRef = useRef(0);
  const selectionStableRef = useRef(false);
  const isProcessingRef = useRef(false);
  const touchStartTimeRef = useRef(0);

  /**
   * Calculate optimal position for the selection panel
   */
  const calculatePosition = useCallback((rect) => {
    try {
      if (!rect || rect.width === 0 || rect.height === 0) {
        return null;
      }

      const isMobile = isMobileRef.current;
      const panelHeight = isMobile ? 140 : 120;
      const panelWidth = isMobile ? 180 : 150;
      const viewportPadding = isMobile ? 10 : 15;
      const minPadding = 8;

      // Center horizontally on selection
      let x = rect.left + rect.width / 2 - panelWidth / 2;

      // Position above selection with gap
      let y = rect.top - panelHeight - 10;

      // Fallback: position below if not enough space above
      if (y < viewportPadding) {
        y = rect.bottom + 10;
      }

      // Constrain to viewport with stricter bounds on mobile
      const maxX = window.innerWidth - panelWidth - viewportPadding;
      const maxY = window.innerHeight - panelHeight - viewportPadding;
      
      x = Math.max(viewportPadding, Math.min(maxX, x));
      y = Math.max(viewportPadding, Math.min(maxY, y));

      // Ensure minimum safe distance from edges on mobile
      if (isMobile) {
        x = Math.max(minPadding, x);
        y = Math.max(minPadding, y);
      }

      return { x, y };
    } catch (error) {
      console.error('❌ Position calculation error:', error);
      return null;
    }
  }, []);

  /**
   * Core selection detection - STABLE
   * Only updates state if valid selection detected
   */
  const detectSelection = useCallback(() => {
    // Prevent duplicate processing
    if (isProcessingRef.current) {
      return;
    }

    try {
      isProcessingRef.current = true;
      const sel = window.getSelection();

      // No selection
      if (!sel || sel.rangeCount === 0 || sel.type === 'None') {
        setSelection(null);
        setPosition(null);
        selectionStableRef.current = false;
        return;
      }

      const text = sel.toString().trim();

      // Minimum 2 characters for valid selection (prevents accidental clicks)
      if (text.length < 2) {
        setSelection(null);
        setPosition(null);
        selectionStableRef.current = false;
        return;
      }

      // Get range and validate - strict boundary checking
      const range = sel.getRangeAt(0);
      const rects = range.getClientRects();
      
      if (!rects || rects.length === 0) {
        setSelection(null);
        setPosition(null);
        selectionStableRef.current = false;
        return;
      }

      // Get bounding box of all selected text
      let minTop = Infinity;
      let maxBottom = -Infinity;
      let minLeft = Infinity;
      let maxRight = -Infinity;
      
      for (let rect of rects) {
        if (rect.width > 0 && rect.height > 0) {
          minTop = Math.min(minTop, rect.top);
          maxBottom = Math.max(maxBottom, rect.bottom);
          minLeft = Math.min(minLeft, rect.left);
          maxRight = Math.max(maxRight, rect.right);
        }
      }
      
      // Ensure we have valid bounds
      if (minTop === Infinity || maxRight === -Infinity) {
        setSelection(null);
        setPosition(null);
        selectionStableRef.current = false;
        return;
      }
      
      const boundingRect = {
        top: minTop,
        bottom: maxBottom,
        left: minLeft,
        right: maxRight,
        width: maxRight - minLeft,
        height: maxBottom - minTop
      };

      // Calculate position based on actual selection bounds
      const pos = calculatePosition(boundingRect);
      if (!pos) {
        setSelection(null);
        setPosition(null);
        selectionStableRef.current = false;
        return;
      }

      // STABLE: Update state for new selections (only after completion)
      const now = Date.now();
      if (!selectionStableRef.current || now - lastSelectionTimeRef.current > 100) {
        lastSelectionTimeRef.current = now;
        setSelection({
          text,
          range,
          timestamp: now,
        });
        setPosition(pos);
        selectionStableRef.current = true;
        console.log('✅ Selection complete:', text.substring(0, 30));
      }
    } catch (error) {
      console.error('❌ Detection error:', error);
      setSelection(null);
      setPosition(null);
      selectionStableRef.current = false;
    } finally {
      isProcessingRef.current = false;
    }
  }, [calculatePosition]);

  /**
   * Clear selection permanently
   */
  const clearSelection = useCallback(() => {
    console.log('🗑️ Selection cleared');
    setSelection(null);
    setPosition(null);
    selectionStableRef.current = false;
    lastSelectionTimeRef.current = 0;
    
    // Clear browser selection only if needed
    try {
      window.getSelection().removeAllRanges();
    } catch (e) {
      // Ignore
    }
  }, []);

  /**
   * STABLE EVENT LISTENERS - Global document-level coverage with mobile optimizations
   */
  useEffect(() => {
    console.log('🎬 useTextSelection hook mounted');

    // Debounce flag to prevent multiple rapid calls
    let detectionTimeout = null;
    let touchStartedRef = false;
    let lastDetectionTimeRef = 0;

    const scheduleDetection = (delay = 25) => {
      if (detectionTimeout) clearTimeout(detectionTimeout);
      detectionTimeout = setTimeout(() => {
        detectSelection();
        lastDetectionTimeRef = Date.now();
      }, delay);
    };

    // Mouse-based selection
    const handleMouseUp = () => {
      scheduleDetection();
    };

    // Keyboard selection (Shift+Arrow, etc)
    const handleKeyUp = (e) => {
      // Only for selection keyboard shortcuts
      if (e.shiftKey) {
        scheduleDetection();
      }
    };

    // Touch start - simply mark that touch started
    const handleTouchStart = (e) => {
      touchStartedRef = true;
      touchStartTimeRef.current = Date.now();
      console.log('👆 Touch started');
    };

    // Touch move - we don't care about movement for text selection
    const handleTouchMove = (e) => {
      // Just track that there's movement
      // We'll allow selection either way
    };

    // Touch selection (mobile) - FIXED: Always attempt detection
    const handleTouchEnd = () => {
      if (!touchStartedRef) return;
      touchStartedRef = false;

      const touchDuration = Date.now() - touchStartTimeRef.current;
      console.log(`📱 Touch ended after ${touchDuration}ms`);
      
      // Use longer delay for mobile to allow selection to stabilize
      const isMobile = isMobileRef.current;
      const delay = isMobile ? 150 : 50; // Reduced from 200ms to 150ms for better responsiveness
      
      // Always schedule detection - let detectSelection validate if there's actual text selected
      scheduleDetection(delay);
    };

    // Pointer events (hybrid devices)
    const handlePointerUp = () => {
      scheduleDetection();
    };

    // Selection change event for keyboard-based selection
    const handleSelectionChange = () => {
      // Debounce selection changes
      const now = Date.now();
      if (now - lastDetectionTimeRef > 50) {
        scheduleDetection(25);
      }
    };

    // Context menu for iOS long-press
    const handleContextMenu = () => {
      console.log('📋 Context menu detected (iOS long-press)');
      // Delay detection to allow iOS context menu to complete
      scheduleDetection(200); // Reduced from 250ms
    };

    // ATTACH TO DOCUMENT - Global listeners for all selection methods
    document.addEventListener('mouseup', handleMouseUp, true);
    document.addEventListener('keyup', handleKeyUp, true);
    document.addEventListener('touchstart', handleTouchStart, true);
    document.addEventListener('touchmove', handleTouchMove, true);
    document.addEventListener('touchend', handleTouchEnd, true);
    document.addEventListener('pointerup', handlePointerUp, true);
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('selectionchange', handleSelectionChange, true);

    return () => {
      console.log('🎬 useTextSelection hook unmounting');
      document.removeEventListener('mouseup', handleMouseUp, true);
      document.removeEventListener('keyup', handleKeyUp, true);
      document.removeEventListener('touchstart', handleTouchStart, true);
      document.removeEventListener('touchmove', handleTouchMove, true);
      document.removeEventListener('touchend', handleTouchEnd, true);
      document.removeEventListener('pointerup', handlePointerUp, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('selectionchange', handleSelectionChange, true);
      
      if (detectionTimeout) clearTimeout(detectionTimeout);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [detectSelection]);

  /**
   * STABLE CLICK OUTSIDE HANDLER
   * Panel stays open until user explicitly closes it or selects new text
   */
  useEffect(() => {
    if (!selection || !position) return;

    const handleClickOutside = (e) => {
      // Check if click is on the panel or its children
      const panel = document.querySelector('.text-selection-panel');
      if (panel && (panel === e.target || panel.contains(e.target))) {
        return; // Click is on panel, don't close
      }

      // Check if it's a new text selection
      const currentSelection = window.getSelection();
      if (currentSelection && currentSelection.rangeCount > 0) {
        const currentText = currentSelection.toString().trim();
        // If user is selecting NEW text (different from current), close old panel
        if (currentText !== selection.text) {
          // Don't close here - let the new selection's panel replace it
          // The new selection detection will update the state
          return;
        }
      }

      // Only close if user clicks the close button or explicitly outside
      // Panel will stay open for user to interact with Copy/Highlight buttons
      // User can click background to close if they want
      // But we give them time to interact with the panel first
    };

    // Use capture phase for reliable detection of ALL clicks
    document.addEventListener('click', handleClickOutside, true);

    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [selection, position, clearSelection]);

  return {
    selection,
    position,
    clearSelection,
    selectedText: selection?.text || '',
  };
};

export default useTextSelection;
