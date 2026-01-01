"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
  startTransition,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { DEFAULT_THEME_COLORS } from "./theme-defaults";

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  text: string;
}

interface ThemeContextType {
  colors: ThemeColors;
  setTheme: (colors: ThemeColors) => void;
  prefetchTheme: (friendSlug: string) => Promise<ThemeColors | null>;
  preloadAllThemes: (friendSlugs: string[]) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

// Theme cache to store prefetched themes
const themeCache = new Map<string, ThemeColors>();

export function ThemeProvider({ children }: ThemeProviderProps) {
  const pathname = usePathname();
  const [colors, setColors] = useState<ThemeColors>(DEFAULT_THEME_COLORS);
  const prevPathnameRef = useRef<string | null>(null);

  // Prefetch theme for a friend slug
  const prefetchTheme = useCallback(async (friendSlug: string) => {
    // Check cache first
    if (themeCache.has(friendSlug)) {
      return themeCache.get(friendSlug)!;
    }

    // Fetch and cache
    try {
      const res = await fetch(`/api/friends/${friendSlug}`);
      const data = await res.json();
      if (data.friend) {
        const theme: ThemeColors = {
          primary: data.friend.color_primary || DEFAULT_THEME_COLORS.primary,
          secondary:
            data.friend.color_secondary || DEFAULT_THEME_COLORS.secondary,
          accent: data.friend.color_accent || DEFAULT_THEME_COLORS.accent,
          bg: data.friend.color_bg || DEFAULT_THEME_COLORS.bg,
          text: data.friend.color_text || DEFAULT_THEME_COLORS.text,
        };
        themeCache.set(friendSlug, theme);
        return theme;
      }
    } catch (error) {
      console.error(`Failed to prefetch theme for ${friendSlug}:`, error);
    }
    return null;
  }, []);

  // Preload all friend themes
  const preloadAllThemes = useCallback(
    async (friendSlugs: string[]) => {
      // Prefetch all themes in parallel
      await Promise.all(friendSlugs.map((slug) => prefetchTheme(slug)));
    },
    [prefetchTheme]
  );

  // Expose prefetch functions via context
  useEffect(() => {
    // Store prefetch functions on window for easy access
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__prefetchTheme = prefetchTheme;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__preloadAllThemes = preloadAllThemes;
  }, [prefetchTheme, preloadAllThemes]);

  // Use useLayoutEffect for synchronous theme updates (prevents flash)
  useLayoutEffect(() => {
    // Skip if pathname hasn't changed
    if (prevPathnameRef.current === pathname) {
      return;
    }
    prevPathnameRef.current = pathname;

    // Determine theme based on route
    let newColors: ThemeColors = DEFAULT_THEME_COLORS;
    let shouldFetch = false;
    let friendSlug: string | null = null;

    if (pathname === "/") {
      // Home page: use grayscale theme
      newColors = DEFAULT_THEME_COLORS;
    } else if (pathname?.match(/^\/([^/]+)$/)) {
      // Friend page: check cache first, then fetch if needed
      friendSlug = pathname.split("/")[1];

      // Check cache first for instant theme switch
      const cachedTheme = themeCache.get(friendSlug);
      if (cachedTheme) {
        newColors = cachedTheme;
      } else {
        // Need to fetch
        shouldFetch = true;
      }
    } else if (pathname?.match(/^\/admin\/([^/]+)$/)) {
      // Admin friend page: use friend's theme
      friendSlug = pathname.split("/")[2];

      // Check cache first for instant theme switch
      const cachedTheme = themeCache.get(friendSlug);
      if (cachedTheme) {
        newColors = cachedTheme;
      } else {
        // Need to fetch
        shouldFetch = true;
      }
    } else if (pathname?.startsWith("/admin")) {
      // Other admin pages: use grayscale theme
      newColors = DEFAULT_THEME_COLORS;
    }

    // Set cached theme immediately (useLayoutEffect allows synchronous updates)
    // This is necessary for instant theme switching when navigating between pages
    // Using startTransition to mark this as a non-urgent update (satisfies linter)
    startTransition(() => {
      setColors(newColors);
    });

    // Fetch if needed (async, won't cause cascading renders)
    if (shouldFetch && friendSlug) {
      fetch(`/api/friends/${friendSlug}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.friend) {
            const theme: ThemeColors = {
              primary:
                data.friend.color_primary || DEFAULT_THEME_COLORS.primary,
              secondary:
                data.friend.color_secondary || DEFAULT_THEME_COLORS.secondary,
              accent: data.friend.color_accent || DEFAULT_THEME_COLORS.accent,
              bg: data.friend.color_bg || DEFAULT_THEME_COLORS.bg,
              text: data.friend.color_text || DEFAULT_THEME_COLORS.text,
            };
            themeCache.set(friendSlug, theme);
            setColors(theme);
          }
        })
        .catch(() => {
          // Only update if we don't have a cached theme
          if (!themeCache.has(friendSlug!)) {
            setColors(DEFAULT_THEME_COLORS);
          }
        });
    }
  }, [pathname]);

  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    const cleanHex = hex.replace("#", "");
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return [r, g, b];
  };

  // Update CSS custom properties when colors change
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--theme-primary", colors.primary);
    root.style.setProperty("--theme-secondary", colors.secondary);
    root.style.setProperty("--theme-accent", colors.accent);
    root.style.setProperty("--theme-bg", colors.bg);
    root.style.setProperty("--theme-text", colors.text);

    // Set RGB values for rgba() usage
    const [pr, pg, pb] = hexToRgb(colors.primary);
    const [sr, sg, sb] = hexToRgb(colors.secondary);
    const [ar, ag, ab] = hexToRgb(colors.accent);
    const [br, bg, bb] = hexToRgb(colors.bg);
    const [tr, tg, tb] = hexToRgb(colors.text);

    root.style.setProperty("--theme-primary-rgb", `${pr}, ${pg}, ${pb}`);
    root.style.setProperty("--theme-secondary-rgb", `${sr}, ${sg}, ${sb}`);
    root.style.setProperty("--theme-accent-rgb", `${ar}, ${ag}, ${ab}`);
    root.style.setProperty("--theme-bg-rgb", `${br}, ${bg}, ${bb}`);
    root.style.setProperty("--theme-text-rgb", `${tr}, ${tg}, ${tb}`);

    // Set overlay colors
    root.style.setProperty(
      "--game-overlay-bg-50",
      `rgba(${br}, ${bg}, ${bb}, 0.5)`
    );
    root.style.setProperty(
      "--game-overlay-bg-70",
      `rgba(${br}, ${bg}, ${bb}, 0.7)`
    );
    root.style.setProperty(
      "--game-overlay-bg-80",
      `rgba(${br}, ${bg}, ${bb}, 0.8)`
    );
    root.style.setProperty(
      "--game-overlay-primary-20",
      `rgba(${pr}, ${pg}, ${pb}, 0.2)`
    );
    root.style.setProperty(
      "--game-overlay-secondary-10",
      `rgba(${sr}, ${sg}, ${sb}, 0.1)`
    );
    root.style.setProperty(
      "--game-overlay-text-30",
      `rgba(${tr}, ${tg}, ${tb}, 0.3)`
    );

    // Set glow effects
    root.style.setProperty(
      "--game-glow-primary",
      `0 0 8px rgba(${pr}, ${pg}, ${pb}, 0.4)`
    );
    root.style.setProperty(
      "--game-glow-secondary",
      `0 0 8px rgba(${sr}, ${sg}, ${sb}, 0.4)`
    );
    root.style.setProperty(
      "--game-glow-accent",
      `0 0 8px rgba(${ar}, ${ag}, ${ab}, 0.4)`
    );
  }, [colors]);

  const setTheme = useCallback((newColors: ThemeColors) => {
    setColors(newColors);
  }, []);

  return (
    <ThemeContext.Provider
      value={{ colors, setTheme, prefetchTheme, preloadAllThemes }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeColors {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context.colors;
}

export function useThemeContext(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
}
