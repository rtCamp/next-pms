/**
 * External dependencies
 */
import { useEffect, useState } from "react";

/**
 * Internal dependencies
 */
import { ThemeProviderContext } from "./context";
import { Theme, ThemeProviderProps } from "./type";
import { useBoot } from "../boot/hook";

const ThemeProvider = ({
  children,
  storageKey = "next-pms-ui-theme",
  ...props
}: ThemeProviderProps) => {

  console.log("Theme Provider");
  const { deskTheme } = useBoot();
  const [theme, setTheme] = useState<Theme>(
    () =>
      (localStorage.getItem(storageKey) as Theme) ||
      deskTheme ||
      window.matchMedia("(prefers-color-scheme: dark)").matches ||
      "system",
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    isDarkThemeOnSystem: window.matchMedia("(prefers-color-scheme: dark)")
      .matches,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    changeTheme: () => {
      if (theme === "system") {
        setTheme(
          window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "light"
            : "dark",
        );
      } else {
        setTheme(theme === "light" ? "dark" : "light");
      }
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
};

export default ThemeProvider;
