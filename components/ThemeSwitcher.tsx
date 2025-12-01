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
const LIGHT_THEME = "light";
const DARK_THEME = "dark";

export default function ThemeSwitcher() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Beim Laden: Theme aus localStorage holen
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme");
    const currentTheme = document.documentElement.getAttribute("data-theme");
    setIsDark(savedTheme === DARK_THEME || currentTheme === DARK_THEME);
  }, []);

  // Theme wechseln
  const handleClick = () => {
    const newIsDark = !isDark;
    const newTheme = newIsDark ? DARK_THEME : LIGHT_THEME;
    
    // State aktualisieren
    setIsDark(newIsDark);
    
    // Theme im DOM setzen
    document.documentElement.setAttribute("data-theme", newTheme);
    
    // Im localStorage speichern
    localStorage.setItem("theme", newTheme);
    
    console.log("Theme gewechselt zu:", newTheme);
  };

  // Während SSR nichts rendern (verhindert Hydration-Mismatch)
  if (!mounted) {
    return (
      <button className="btn btn-ghost btn-sm btn-circle" aria-label="Theme wechseln">
        <Sun className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="btn btn-ghost btn-sm btn-circle"
      aria-label={isDark ? "Helles Design aktivieren" : "Dunkles Design aktivieren"}
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
