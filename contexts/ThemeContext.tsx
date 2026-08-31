import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  primary: string;
  danger: string;
  success: string;
  warning: string;
  border: string;
  placeholder: string;
  overlay: string;
  headerBackground: string;
  headerTint: string;
  tabBarBackground: string;
  tabBarInactive: string;
}

const LIGHT_COLORS: ThemeColors = {
  background: "#ffffff",
  surface: "#f3f4f6",
  text: "#111827",
  textMuted: "#666666",
  primary: "#2563eb",
  danger: "#dc2626",
  success: "#16a34a",
  warning: "#f59e0b",
  border: "#cccccc",
  placeholder: "#9ca3af",
  overlay: "rgba(0,0,0,0.4)",
  headerBackground: "#ffffff",
  headerTint: "#111827",
  tabBarBackground: "#ffffff",
  tabBarInactive: "#9ca3af",
};

const DARK_COLORS: ThemeColors = {
  background: "#0f172a",
  surface: "#1e293b",
  text: "#f1f5f9",
  textMuted: "#94a3b8",
  primary: "#3b82f6",
  danger: "#f87171",
  success: "#4ade80",
  warning: "#fbbf24",
  border: "#334155",
  placeholder: "#64748b",
  overlay: "rgba(0,0,0,0.6)",
  headerBackground: "#0f172a",
  headerTint: "#f1f5f9",
  tabBarBackground: "#0f172a",
  tabBarInactive: "#64748b",
};

const THEME_STORAGE_KEY = "flashlingo_theme_mode";

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");

  // Restore the saved preference on cold start.
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored === "light" || stored === "dark") setMode(stored);
    });
  }, []);

  const persist = useCallback((next: ThemeMode) => {
    AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {
      // Non-fatal — worst case the choice doesn't survive a restart.
    });
  }, []);

  const setTheme = useCallback(
    (next: ThemeMode) => {
      setMode(next);
      persist(next);
    },
    [persist]
  );

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next: ThemeMode = prev === "light" ? "dark" : "light";
      persist(next);
      return next;
    });
  }, [persist]);

  const colors = mode === "dark" ? DARK_COLORS : LIGHT_COLORS;

  const value = useMemo(
    () => ({ mode, colors, toggleTheme, setTheme }),
    [mode, colors, toggleTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}