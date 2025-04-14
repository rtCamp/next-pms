/**
 * External dependencies
 */
import { createContext } from "react";

/**
 * Internal dependencies
 */
import { ThemeProviderState, defaultTheme } from "./type";

const initialState: ThemeProviderState = {
  theme: defaultTheme,
  isDarkThemeOnSystem: window.matchMedia("(prefers-color-scheme: dark)").matches,
  setTheme: () => null,
};
export const ThemeProviderContext = createContext<ThemeProviderState>(initialState);
