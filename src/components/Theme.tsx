import { Moon, Sun } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type ColorTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "maxsoft-color-theme";

const isColorTheme = (value: string | null | undefined): value is ColorTheme =>
  value === "light" || value === "dark";

const readStoredTheme = (): ColorTheme | null => {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isColorTheme(stored) ? stored : null;
  } catch {
    return null;
  }
};

const systemTheme = (): ColorTheme =>
  window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const initialTheme = (): ColorTheme => {
  const preparedTheme = document.documentElement.dataset.theme;
  if (isColorTheme(preparedTheme)) return preparedTheme;
  return readStoredTheme() ?? systemTheme();
};

interface ThemeContextValue {
  theme: ColorTheme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ColorTheme>(initialTheme);
  const [followsSystem, setFollowsSystem] = useState(() => !readStoredTheme());
  const transitionTimeout = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    if (!followsSystem) return;
    const preference = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!preference) return;
    const followSystem = (event: MediaQueryListEvent) => setTheme(event.matches ? "dark" : "light");
    preference.addEventListener("change", followSystem);
    return () => preference.removeEventListener("change", followSystem);
  }, [followsSystem]);

  useEffect(
    () => () => {
      if (transitionTimeout.current !== null) window.clearTimeout(transitionTimeout.current);
    },
    [],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      toggleTheme: () => {
        const nextTheme = theme === "light" ? "dark" : "light";
        document.documentElement.classList.add("theme-switching");
        setFollowsSystem(false);
        try {
          window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        } catch {
          // The visual switch still works when browser storage is unavailable.
        }
        setTheme(nextTheme);
        if (transitionTimeout.current !== null) window.clearTimeout(transitionTimeout.current);
        transitionTimeout.current = window.setTimeout(() => {
          document.documentElement.classList.remove("theme-switching");
          transitionTimeout.current = null;
        }, 320);
      },
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("THEME_CONTEXT_MISSING: ThemeToggle должен находиться внутри ThemeProvider");
  return context;
};

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  const label = dark ? "Включить светлую тему" : "Включить тёмную тему";
  return (
    <button
      aria-label={label}
      className="icon-button theme-toggle"
      data-theme-state={theme}
      onClick={toggleTheme}
      title={label}
      type="button"
    >
      {dark ? (
        <Sun className="theme-toggle-icon h-5 w-5" aria-hidden="true" />
      ) : (
        <Moon className="theme-toggle-icon h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
};
