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
          secondary: data.friend.color_secondary || DEFAULT_THEME_COLORS.secondary,
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
              primary: data.friend.color_primary || DEFAULT_THEME_COLORS.primary,
              secondary: data.friend.color_secondary || DEFAULT_THEME_COLORS.secondary,
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

  // Import color conversion utility that handles hex, hsl, rgb formats
  const colorToRgb = (color: string): [number, number, number] => {
    // Handle hex format
    if (color.startsWith("#")) {
      const cleanHex = color.replace("#", "").trim();
      if (cleanHex.length === 3) {
        const r = parseInt(cleanHex[0] + cleanHex[0], 16);
        const g = parseInt(cleanHex[1] + cleanHex[1], 16);
        const b = parseInt(cleanHex[2] + cleanHex[2], 16);
        return [r, g, b];
      }
      if (cleanHex.length === 6) {
        const r = parseInt(cleanHex.substring(0, 2), 16);
        const g = parseInt(cleanHex.substring(2, 4), 16);
        const b = parseInt(cleanHex.substring(4, 6), 16);
        if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
          return [r, g, b];
        }
      }
    }

    // Handle HSL format (hsl(200, 80%, 50%))
    if (color.startsWith("hsl")) {
      const match = color.match(/hsl\(?\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)?/i);
      if (match) {
        const h = parseInt(match[1], 10) / 360;
        const s = parseInt(match[2], 10) / 100;
        const l = parseInt(match[3], 10) / 100;
        if (!isNaN(h) && !isNaN(s) && !isNaN(l)) {
          let r, g, b;
          if (s === 0) {
            r = g = b = l;
          } else {
            const hue2rgb = (p: number, q: number, t: number) => {
              if (t < 0) t += 1;
              if (t > 1) t -= 1;
              if (t < 1 / 6) return p + (q - p) * 6 * t;
              if (t < 1 / 2) return q;
              if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
              return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
          }
          return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
        }
      }
    }

    // Handle RGB format (rgb(255, 0, 0))
    if (color.startsWith("rgb")) {
      const match = color.match(/rgba?\(?\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
      if (match) {
        const r = parseInt(match[1], 10);
        const g = parseInt(match[2], 10);
        const b = parseInt(match[3], 10);
        if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
          return [r, g, b];
        }
      }
    }

    console.warn("Invalid color format, using black:", color);
    return [0, 0, 0];
  };

  // Update CSS custom properties when colors change
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--theme-primary", colors.primary);
    root.style.setProperty("--theme-secondary", colors.secondary);
    root.style.setProperty("--theme-accent", colors.accent);
    root.style.setProperty("--theme-bg", colors.bg);
    root.style.setProperty("--theme-text", colors.text);

    // Set RGB values for rgba() usage (handles hex, hsl, rgb formats)
    const [pr, pg, pb] = colorToRgb(colors.primary);
    const [sr, sg, sb] = colorToRgb(colors.secondary);
    const [ar, ag, ab] = colorToRgb(colors.accent);
    const [br, bg, bb] = colorToRgb(colors.bg);
    const [tr, tg, tb] = colorToRgb(colors.text);

    root.style.setProperty("--theme-primary-rgb", `${pr}, ${pg}, ${pb}`);
    root.style.setProperty("--theme-secondary-rgb", `${sr}, ${sg}, ${sb}`);
    root.style.setProperty("--theme-accent-rgb", `${ar}, ${ag}, ${ab}`);
    root.style.setProperty("--theme-bg-rgb", `${br}, ${bg}, ${bb}`);
    root.style.setProperty("--theme-text-rgb", `${tr}, ${tg}, ${tb}`);

    // Set overlay colors
    root.style.setProperty("--game-overlay-bg-50", `rgba(${br}, ${bg}, ${bb}, 0.5)`);
    root.style.setProperty("--game-overlay-bg-70", `rgba(${br}, ${bg}, ${bb}, 0.7)`);
    root.style.setProperty("--game-overlay-bg-80", `rgba(${br}, ${bg}, ${bb}, 0.8)`);
    root.style.setProperty("--game-overlay-primary-20", `rgba(${pr}, ${pg}, ${pb}, 0.2)`);
    root.style.setProperty("--game-overlay-secondary-10", `rgba(${sr}, ${sg}, ${sb}, 0.1)`);
    root.style.setProperty("--game-overlay-text-30", `rgba(${tr}, ${tg}, ${tb}, 0.3)`);

    // Set glow effects
    root.style.setProperty("--game-glow-primary", `0 0 8px rgba(${pr}, ${pg}, ${pb}, 0.4)`);
    root.style.setProperty("--game-glow-secondary", `0 0 8px rgba(${sr}, ${sg}, ${sb}, 0.4)`);
    root.style.setProperty("--game-glow-accent", `0 0 8px rgba(${ar}, ${ag}, ${ab}, 0.4)`);
  }, [colors]);

  const setTheme = useCallback((newColors: ThemeColors) => {
    setColors(newColors);
  }, []);

  return (
    <ThemeContext.Provider value={{ colors, setTheme, prefetchTheme, preloadAllThemes }}>
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
