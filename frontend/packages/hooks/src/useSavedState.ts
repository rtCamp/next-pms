/**
 * External dependencies.
 */
import { useState, useEffect, Dispatch, SetStateAction } from "react";

/**
 * A drop-in replacement for `useState` that persists the value in `localStorage`.
 * The state type is inferred from `initialState` — no explicit type parameter needed.
 *
 * @param key - The `localStorage` key to read from and write to.
 * @param initialState - Value used when the key is absent or its stored data is unparseable.
 *                       Accepts a plain value or a lazy initializer function (same as `useState`).
 *                       Its type drives the inferred return type.
 * @returns A `[value, setValue]` tuple identical to `useState`.
 *
 * @example
 * const [view, setView] = useSavedState("projects-view", "list");
 * //    ^? [string, Dispatch<SetStateAction<string>>]
 *
 * @example
 * const [month, setMonth] = useSavedState("kpiMonth", getDefaultKpiMonth);
 * //    ^? [string, Dispatch<SetStateAction<string>>]
 */
export const useSavedState = <T extends NonNullable<unknown> | null>(
  key: string,
  initialState: T | (() => T),
): [T, Dispatch<SetStateAction<T>>] => {
  const [value, setValue] = useState<T>(() => {
    const fallback =
      typeof initialState === "function"
        ? (initialState as () => T)()
        : initialState;
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage unavailable (private browsing quota exceeded, etc.)
    }
  }, [key, value]);

  return [value, setValue];
};
