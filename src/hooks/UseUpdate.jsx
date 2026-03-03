/**
 * UseUpdate Hook
 *
 * Custom hook for updating data.
 * Works with service layer functions.
 */

import { useCallback, useState } from "react";

/**
 * Custom hook for UPDATE operations via service functions
 *
 * @returns {Object} { updateData, error, isLoading }
 */
const useUpdate = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Execute an UPDATE operation via service function
   * @param {Function} serviceFn - Service function to call
   * @param {*} identifier - Identifier (email, id, etc.)
   * @param {Object} data - Data to update
   */
  const updateData = useCallback(async (serviceFn, identifier, data) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await serviceFn(identifier, data);
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

  return { updateData, error, isLoading };
};

export default useUpdate;
