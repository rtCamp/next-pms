/**
 * External dependencies
 */
import { createContext } from "react";

/**
 * Internal dependencies
 */
import { ThemeProviderState } from "./type";

const initialState: ThemeProviderState = {
  theme: "system",
  isDarkThemeOnSystem: window.matchMedia("(prefers-color-scheme: dark)")
    .matches,
  setTheme: () => null,
  changeTheme: () => null,
};
export const ThemeProviderContext =
  createContext<ThemeProviderState>(initialState);
