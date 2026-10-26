import type { ColorScheme } from "frappe-ui";

/** frappe-ui's `useColorScheme` keeps the choice under this key. */
const THEME_KEY = "theme";
/** Where the React app kept the user's choice. */
const REACT_THEME_KEY = "next-pms-ui-theme";

/** A colour scheme from a stored value or a Desk theme (`Light`, `Dark`, `Automatic`). */
function toColorScheme(value: string | null | undefined): ColorScheme | null {
  const scheme = value?.toLowerCase();
  if (scheme === "automatic") return "system";
  return scheme === "light" || scheme === "dark" || scheme === "system"
    ? scheme
    : null;
}

/**
 * Saves a colour scheme for `useColorScheme` to start from when it has none: the one
 * picked in the React app, else the user's Desk theme. Call it before the app mounts.
 */
export function seedColorScheme(deskTheme?: string): void {
  // Blocked site data makes touching localStorage throw.
  if (!navigator.cookieEnabled) return;
  if (toColorScheme(localStorage.getItem(THEME_KEY))) return;

  const scheme =
    toColorScheme(localStorage.getItem(REACT_THEME_KEY)) ??
    toColorScheme(deskTheme);
  if (scheme) localStorage.setItem(THEME_KEY, scheme);
}
