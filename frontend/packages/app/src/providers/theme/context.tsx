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
  setTheme: () => null,
};
export const ThemeProviderContext = createContext<ThemeProviderState>(initialState);
