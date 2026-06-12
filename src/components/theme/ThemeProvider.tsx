"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme() {
  document.documentElement.setAttribute("data-theme", "dark");
  try {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
  } catch {
    /* ignore */
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyTheme();
  }, []);

  const setTheme = useCallback((_theme: Theme) => {
    applyTheme();
  }, []);

  const toggleTheme = useCallback(() => {
    applyTheme();
  }, []);

  const value = useMemo(
    () => ({ theme: "dark" as Theme, setTheme, toggleTheme }),
    [setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
