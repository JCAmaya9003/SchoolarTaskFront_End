/**
 * UseFetch Hook
 *
 * Custom hook for fetching data.
 * Works with service layer functions that return promises.
 *
 * FIXED: This hook was previously incorrectly named and implemented DELETE functionality.
 * It now properly implements GET/fetch functionality.
 */

import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for fetching data from a service function
 *
 * @param {Function} serviceFn - Service function that returns a promise
 * @returns {Object} { data, error, isLoading, refetch }
 */
const useFetch = (serviceFn) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!serviceFn) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await serviceFn();
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("An unknown error occurred")
      );
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [serviceFn]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, isLoading, refetch };
};

export default useFetch;
