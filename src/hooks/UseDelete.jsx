import { useCallback, useState } from "react";

const useDelete = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const deleteData = useCallback(
    async (url, data) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    "Content-Type": "application/json", // Ensure the content type is set
                },
                body: JSON.stringify(data), // Send the data in the body
                credentials: "include",
            });

            if (!response.ok) {
                const errorDetails = await response.json().catch(() => null);
                throw new Error(errorDetails?.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json(); // Assuming the response contains some confirmation or data
        } catch (error) {
            setError(error instanceof Error ? error : new Error('An unknown error occurred'));
            throw error;
        } finally {
            setIsLoading(false);
        }
    },
    []
  );

  return { deleteData, error, isLoading };
};

export default useDelete;