import type { ColorScheme } from "frappe-ui";

/** frappe-ui's `useColorScheme` keeps the scheme it applies under this key. */
const THEME_KEY = "theme";
/** The scheme the user picked, under the React app's key, so a pick carries over. */
const CHOICE_KEY = "next-pms-ui-theme";

/** A colour scheme from a stored value or a Desk theme (`Light`, `Dark`, `Automatic`). */
function toColorScheme(value: string | null | undefined): ColorScheme | null {
  const scheme = value?.toLowerCase();
  if (scheme === "automatic") return "system";
  return scheme === "light" || scheme === "dark" || scheme === "system"
    ? scheme
    : null;
}

/**
 * Sets the scheme `useColorScheme` starts from, as the React app did: the user's own
 * pick, else their Desk theme, read again on every load so a Desk change is followed.
 * Call it before the app mounts.
 */
export function applyStartingColorScheme(deskTheme?: string): void {
  // Blocked site data makes touching localStorage throw.
  if (!navigator.cookieEnabled) return;
  const scheme =
    toColorScheme(localStorage.getItem(CHOICE_KEY)) ?? toColorScheme(deskTheme);
  if (scheme) localStorage.setItem(THEME_KEY, scheme);
}

/** Remembers a scheme the user picked, so it wins over the Desk theme from now on. */
export function rememberColorScheme(scheme: ColorScheme): void {
  if (!navigator.cookieEnabled) return;
  localStorage.setItem(CHOICE_KEY, scheme);
}
