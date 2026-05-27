import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "yimage_preferences";

const DEFAULT_PREFERENCES = {
  theme: "default",
  compactMode: false,
  reduceMotion: false,
  largerText: false,
  highContrast: false,
  defaultFeedPostType: "all",
  defaultDiscoverMode: "trending",
  showImageOnlyPostsFirst: false,
  autoOpenCommentsAfterPostingComment: true
};

const PreferencesContext = createContext(null);

export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(saved) });
      }
    } catch {
      setPreferences(DEFAULT_PREFERENCES);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Ignore storage errors and keep the current session working.
    }

    const root = document.documentElement;
    root.classList.toggle("compact-mode", preferences.compactMode);
    root.classList.toggle("reduce-motion", preferences.reduceMotion);
    root.classList.toggle("larger-text", preferences.largerText);
    root.classList.toggle("high-contrast", preferences.highContrast);
    root.classList.toggle("theme-dark", preferences.theme === "dark");
  }, [preferences]);

  const value = useMemo(
    () => ({
      preferences,
      updatePreference(key, valueToSet) {
        setPreferences((current) => ({
          ...current,
          [key]: valueToSet
        }));
      }
    }),
    [preferences]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);

  if (!context) {
    throw new Error("usePreferences must be used inside PreferencesProvider");
  }

  return context;
}
