/**
 * External dependencies.
 */
import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { useLocation } from "react-router-dom";

type UseQueryParam<T> = [T, Dispatch<SetStateAction<T>>];

export const useQueryParam = <T>(
  param: string,
  initialState: T,
): UseQueryParam<T> => {
  const location = useLocation();

  // State for managing the value derived from the query parameter
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialState;

    // Parse query parameter value from the URL
    const { search } = window.location;
    const searchParams = new URLSearchParams(search);
    for (const [key, value] of searchParams.entries()) {
      if (value === "null") searchParams.delete(key);
      try {
        JSON.parse(value);
      } catch (error) {
        searchParams.delete(key);
      }
    }

    const paramValue = searchParams.get(param);
    return paramValue !== null
      ? (JSON.parse(paramValue || "[]") as T)
      : initialState;
  });
  useEffect(() => {
    const currentSearchParams = new URLSearchParams(window.location.search);

    // Update the query parameter with the current state value
    if (
      value !== null &&
      value !== "" &&
      !(Array.isArray(value) && value.length === 0)
    ) {
      currentSearchParams.set(param, JSON.stringify(value));
    } else {
      // Remove the query parameter if the value is null or empty
      currentSearchParams.delete(param);
    }

    // Update the URL with the modified search parameters
    const newUrl = [window.location.pathname, currentSearchParams.toString()]
      .filter(Boolean)
      .join("?");

    // Update the browser's history without triggering a page reload
    window.history.replaceState(window.history.state, "", newUrl);
  }, [param, value, location.pathname]);

  return [value, setValue];
};
