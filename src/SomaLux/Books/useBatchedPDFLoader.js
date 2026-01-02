import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Manages strict sequential PDF preview loading.
 * Papers load in perfect order: 1, 2, 3, etc.
 * Only next paper loads after previous completes.
 * 
 * @param {Array} papers - Array of paper objects to load
 * @returns {Object} { loadingState, shouldRenderPDF, getCurrentBatch }
 */
export const useBatchedPDFLoader = (papers) => {
  // Track the highest index that has completed loading
  const [completedUpToIndex, setCompletedUpToIndex] = useState(-1);
  // Track the current paper being loaded
  const [currentLoadingIndex, setCurrentLoadingIndex] = useState(0);
  const timeoutRef = useRef(null);

  // Called when a paper finishes rendering
  const onPaperLoadComplete = useCallback((paperId) => {
    // Find the index of this paper
    const paperIndex = papers?.findIndex(p => p.id === paperId) ?? -1;
    
    // Only process if this is the current paper being loaded
    if (paperIndex !== currentLoadingIndex) {
      return;
    }

    // Mark this paper as completed
    setCompletedUpToIndex(paperIndex);
    
    // Schedule next paper to load
    if (paperIndex < (papers?.length || 0) - 1) {
      timeoutRef.current = setTimeout(() => {
        setCurrentLoadingIndex(paperIndex + 1);
      }, 300);
    }
  }, [currentLoadingIndex, papers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Determine if a specific paper should render its actual PDF preview
  const shouldRenderPDF = useCallback((paperId) => {
    // Find the index of this paper
    const paperIndex = papers?.findIndex(p => p.id === paperId) ?? -1;
    
    // Render if:
    // 1. It's already completed loading, OR
    // 2. It's the current one being loaded
    return paperIndex !== -1 && (paperIndex <= completedUpToIndex || paperIndex === currentLoadingIndex);
  }, [papers, completedUpToIndex, currentLoadingIndex]);

  // Get current batch info
  const getCurrentBatch = useCallback(() => {
    return {
      currentLoadingIndex,
      completedUpToIndex,
      totalPapers: papers?.length || 0,
      loadedCount: completedUpToIndex + 1,
    };
  }, [currentLoadingIndex, completedUpToIndex, papers?.length]);

  return {
    shouldRenderPDF,
    onPaperLoadComplete,
    getCurrentBatch,
    loadingState: {
      loadedCount: completedUpToIndex + 1,
      totalPapers: papers?.length || 0,
      currentLoadingIndex,
    },
  };
};

export default useBatchedPDFLoader;
