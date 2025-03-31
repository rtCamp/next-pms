export type Theme = "dark" | "light" | "system";

export type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

export type ThemeProviderState = {
  theme: Theme;
  isDarkThemeOnSystem: boolean;
  setTheme: (theme: Theme) => void;
};

export const defaultTheme: Theme =
  (window.frappe?.boot?.desk_theme?.toLowerCase() as Theme) ?? "system";
