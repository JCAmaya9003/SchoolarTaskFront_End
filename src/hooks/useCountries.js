/**
 * useCountries — Fetches country list from REST Countries API.
 * Returns { countries, isLoading, error }
 * Each country: { name, code }
 * US is placed first, rest sorted alphabetically.
 */
import { useState, useEffect } from "react";

const COUNTRIES_URL = "https://restcountries.com/v3.1/all?fields=name,cca2";

const useCountries = () => {
  const [countries, setCountries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetch(COUNTRIES_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch countries");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const list = data
          .map((c) => ({ name: c.name.common, code: c.cca2 }))
          .sort((a, b) => a.name.localeCompare(b.name));

        // Pin United States first
        const usIdx = list.findIndex((c) => c.code === "US");
        if (usIdx > -1) {
          const [us] = list.splice(usIdx, 1);
          list.unshift(us);
        }
        setCountries(list);
        setIsLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err);
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { countries, isLoading, error };
};

export default useCountries;
