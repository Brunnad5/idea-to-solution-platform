/**
 * ThemeSwitcher.tsx
 * 
 * Button zum Wechseln zwischen Hell- und Dunkel-Modus.
 * Speichert die Auswahl im localStorage.
 */

"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

// Verfügbare Themes
const LIGHT_THEME = "corporate";
const DARK_THEME = "business";

export default function ThemeSwitcher() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Beim Laden: Theme aus localStorage holen
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === DARK_THEME) {
      setIsDark(true);
      document.documentElement.setAttribute("data-theme", DARK_THEME);
    }
  }, []);

  // Theme wechseln
  const toggleTheme = () => {
    const newTheme = isDark ? LIGHT_THEME : DARK_THEME;
    setIsDark(!isDark);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  // Während SSR nichts rendern (verhindert Hydration-Mismatch)
  if (!mounted) {
    return (
      <button className="btn btn-ghost btn-sm btn-circle">
        <Sun className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-ghost btn-sm btn-circle"
      title={isDark ? "Helles Design" : "Dunkles Design"}
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
