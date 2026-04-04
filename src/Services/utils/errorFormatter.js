/**
 * Utility functions for properly formatting error objects for console logging
 * Prevents "[object Object]" messages in the console
 */

/**
 * Safely format an error for logging
 * @param {any} error - The error object/value to format
 * @returns {string} - A formatted string representation of the error
 */
export function formatError(error) {
  if (!error) {
    return 'Unknown error';
  }

  // If it's already a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // If it's an Error object, extract the message and stack
  if (error instanceof Error) {
    return error.message || error.toString();
  }

  // Try to get a message property
  if (error.message) {
    return String(error.message);
  }

  // Try to get an error property (for Supabase errors)
  if (error.error) {
    return formatError(error.error);
  }

  // Try to stringify it
  try {
    return JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
  } catch {
    // If all else fails, use toString
    return String(error);
  }
}

/**
 * Log an error with proper formatting
 * @param {string} message - Message prefix
 * @param {any} error - The error to log
 */
export function logError(message, error) {
  const formattedError = formatError(error);
  console.error(`${message}: ${formattedError}`);
}

/**
 * Log a warning with proper formatting
 * @param {string} message - Message prefix
 * @param {any} error - The error to log
 */
export function logWarn(message, error) {
  const formattedError = formatError(error);
  console.warn(`${message}: ${formattedError}`);
}
