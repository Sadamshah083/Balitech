"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="theme-toggle inline-flex items-center gap-2 rounded-full border border-orange/40 px-3 py-2 text-xs font-bold uppercase tracking-wider text-orange transition hover:border-orange hover:bg-orange/10"
    >
      {theme === "dark" ? (
        <>
          <Sun size={14} aria-hidden />
          <span className="hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <Moon size={14} aria-hidden />
          <span className="hidden sm:inline">Dark</span>
        </>
      )}
    </button>
  );
}
