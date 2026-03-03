/**
 * Storage Service
 *
 * Low-level localStorage utilities with error handling.
 * Provides a safe interface for storing and retrieving JSON data.
 */

/**
 * Get parsed data from localStorage
 * @param {string} key - The localStorage key
 * @returns {any} Parsed data or null if not found/error
 */
export const getItem = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error getting item from localStorage (${key}):`, error);
    return null;
  }
};

/**
 * Save data to localStorage
 * @param {string} key - The localStorage key
 * @param {any} value - The value to store (will be JSON stringified)
 * @returns {boolean} Success status
 */
export const setItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting item in localStorage (${key}):`, error);
    return false;
  }
};

/**
 * Remove data from localStorage
 * @param {string} key - The localStorage key
 * @returns {boolean} Success status
 */
export const removeItem = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing item from localStorage (${key}):`, error);
    return false;
  }
};

/**
 * Clear all localStorage data
 * @returns {boolean} Success status
 */
export const clear = () => {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error("Error clearing localStorage:", error);
    return false;
  }
};

/**
 * Check if a key exists in localStorage
 * @param {string} key - The localStorage key
 * @returns {boolean} True if key exists
 */
export const hasItem = (key) => {
  return localStorage.getItem(key) !== null;
};

/**
 * Get all keys from localStorage
 * @returns {string[]} Array of all localStorage keys
 */
export const getAllKeys = () => {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    keys.push(localStorage.key(i));
  }
  return keys;
};
