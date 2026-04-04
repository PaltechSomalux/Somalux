/**
 * Reading Position Manager
 * Manages saving and restoring reader positions for books with exact scroll position
 */

const STORAGE_PREFIX = 'reading_position_';

/**
 * Save the current page position and scroll offset for a book
 * @param {string|number} userId - The user's ID
 * @param {string|number} bookId - The book's ID
 * @param {number} pageNumber - The current page number
 * @param {number} scrollOffset - The scroll position on the page (0-1, as percentage)
 */
export const saveReadingPosition = (userId, bookId, pageNumber, scrollOffset = 0) => {
  if (!userId || !bookId || !pageNumber) return;
  
  try {
    const key = `${STORAGE_PREFIX}${userId}_${bookId}`;
    localStorage.setItem(key, JSON.stringify({
      pageNumber: Math.max(1, parseInt(pageNumber)),
      scrollOffset: Math.max(0, Math.min(1, scrollOffset || 0)), // Clamp between 0-1
      timestamp: new Date().toISOString(),
    }));
  } catch (error) {
    console.warn('Failed to save reading position:', error);
  }
};

/**
 * Load the saved position for a book
 * @param {string|number} userId - The user's ID
 * @param {string|number} bookId - The book's ID
 * @returns {Object|null} { pageNumber, scrollOffset } or null if not found
 */
export const loadReadingPosition = (userId, bookId) => {
  if (!userId || !bookId) return null;
  
  try {
    const key = `${STORAGE_PREFIX}${userId}_${bookId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const { pageNumber, scrollOffset } = JSON.parse(saved);
      return {
        pageNumber: Math.max(1, parseInt(pageNumber)),
        scrollOffset: Math.max(0, Math.min(1, scrollOffset || 0)),
      };
    }
  } catch (error) {
    console.warn('Failed to load reading position:', error);
  }
  
  return null;
};

/**
 * Clear the saved position for a book
 * @param {string|number} userId - The user's ID
 * @param {string|number} bookId - The book's ID
 */
export const clearReadingPosition = (userId, bookId) => {
  if (!userId || !bookId) return;
  
  try {
    const key = `${STORAGE_PREFIX}${userId}_${bookId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear reading position:', error);
  }
};
