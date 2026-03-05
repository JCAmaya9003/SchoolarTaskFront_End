/**
 * UseDelete Hook
 *
 * Custom hook for deleting data via service functions.
 * Supports multiple parameters.
 */

import { useCallback, useState } from "react";

/**
 * Custom hook for DELETE operations via service functions
 *
 * @returns {Object} { deleteData, error, isLoading }
 */
const useDelete = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Execute a DELETE operation via service function
   * @param {Function} serviceFn - Service function to call
   * @param {...any} params - Parameters to pass to the service function
   */
  const deleteData = useCallback(async (serviceFn, ...params) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await serviceFn(...params);
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

  return { deleteData, error, isLoading };
};

export default useDelete;
