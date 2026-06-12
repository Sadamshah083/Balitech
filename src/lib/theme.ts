export type Theme = "dark";

export const THEME_STORAGE_KEY = "balitech-theme";

export const themes: Theme[] = ["dark"];

export function getStoredTheme(): Theme {
  return "dark";
}
