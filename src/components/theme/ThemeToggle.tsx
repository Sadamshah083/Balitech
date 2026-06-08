"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/cn";

type ThemeToggleProps = {
  showLabel?: boolean;
  className?: string;
};

export default function ThemeToggle({
  showLabel = false,
  className,
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      onClick={toggleTheme}
      className={cn(
        "theme-switch",
        isDark ? "theme-switch--dark" : "theme-switch--light",
        className
      )}
    >
      <span className="theme-switch__track" aria-hidden>
        <Sun size={14} className="theme-switch__icon theme-switch__icon--sun" />
        <Moon size={14} className="theme-switch__icon theme-switch__icon--moon" />
        <span className="theme-switch__thumb" />
      </span>
      {showLabel && (
        <span className="theme-switch__label">
          {isDark ? "Dark mode" : "Light mode"}
        </span>
      )}
    </button>
  );
}
