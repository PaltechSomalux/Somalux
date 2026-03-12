import React, { useState, useEffect, useContext, createContext } from "react";
import "./ThemeToggle.css";

// Create a context for theme
const ThemeContext = createContext();

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// Theme provider component to wrap your app
export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage first
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem("darkMode");
      if (savedMode !== null) {
        return JSON.parse(savedMode);
      }
      // Fall back to system preference
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false; // Default for SSR
  });

  // Apply the theme whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      
      if (darkMode) {
        root.classList.add("dark-mode");
        root.classList.remove("light-mode");
        root.style.colorScheme = "dark";
      } else {
        root.classList.add("light-mode");
        root.classList.remove("dark-mode");
        root.style.colorScheme = "light";
      }
      
      localStorage.setItem("darkMode", JSON.stringify(darkMode));
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// The toggle button component
export const ThemeToggle = () => {
  const { darkMode, toggleTheme } = useTheme();
  
  return (
    <button 
      className={`theme-toggle ${darkMode ? 'dark' : 'light'}`}
      onClick={toggleTheme} 
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={darkMode}
    >
      <div className="theme-toggle-track">
        <span className="theme-toggle-thumb">
          {darkMode ? (
            <span className="theme-icon">🌙</span>
          ) : (
            <span className="theme-icon">☀️</span>
          )}
        </span>
      </div>
      <span className="theme-toggle-label">
        {darkMode ? "Dark Mode" : "Light Mode"}
      </span>
    </button>
  );
};