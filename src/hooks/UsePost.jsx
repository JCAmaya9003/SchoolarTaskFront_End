/**
 * UsePost Hook
 *
 * Custom hook for creating/posting data.
 * Works with service layer functions.
 */

import { useCallback, useState } from "react";

/**
 * Custom hook for POST operations via service functions
 *
 * @returns {Object} { postData, error, isLoading }
 */
const usePost = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Execute a POST operation via service function
   * @param {Function} serviceFn - Service function to call
   * @param {Object} data - Data to pass to the service function
   */
  const postData = useCallback(async (serviceFn, data) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await serviceFn(data);
      return result;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("An unknown error occurred");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { postData, error, isLoading };
};

export default usePost;
