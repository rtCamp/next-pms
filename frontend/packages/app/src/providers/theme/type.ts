export type Theme = "dark" | "light" | "system";

export type ThemeProviderProps = {
  children: React.ReactNode;
  storageKey?: string;
};

export type ThemeProviderState = {
  theme: Theme;
  isDarkThemeOnSystem: boolean;
  setTheme: (theme: Theme) => void;
  changeTheme: () => void;
};
