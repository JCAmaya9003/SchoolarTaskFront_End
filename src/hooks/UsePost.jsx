import { useCallback, useState } from "react";

const usePost = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const postData = useCallback(
    async (url, data) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
          credentials: "include",
        });

        if (!response.ok) {
          const errorDetails = await response.json().catch(() => null);
          throw new Error(errorDetails?.message || `HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        return text ? JSON.parse(text) : null;
      } catch (error) {
        setError(error instanceof Error ? error : new Error('An unknown error occurred'));
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { postData, error, isLoading };
};

export default usePost;
