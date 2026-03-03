/**
 * Development Utilities
 *
 * Helper functions for development and testing.
 */

/**
 * Clear all localStorage data
 * Use this in browser console when you need to reset data:
 *
 * In browser console, run:
 * localStorage.clear()
 *
 * Then refresh the page.
 */
export const clearAllData = () => {
  localStorage.clear();
  console.log("All localStorage data cleared! Refresh the page to reseed.");
};

/**
 * View current localStorage data
 */
export const viewStorageData = () => {
  const keys = Object.keys(localStorage);
  console.log("Current localStorage keys:", keys);
  keys.forEach((key) => {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      console.log(`\n${key}:`, data);
    } catch (e) {
      console.log(`\n${key}:`, localStorage.getItem(key));
    }
  });
};

// Make available globally for browser console
if (typeof window !== "undefined") {
  window.clearAllData = clearAllData;
  window.viewStorageData = viewStorageData;
}
