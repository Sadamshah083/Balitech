export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "balitech-theme";

export const themes: Theme[] = ["dark", "light"];

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}
