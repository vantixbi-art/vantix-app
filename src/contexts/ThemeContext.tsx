import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type ThemeId = 'luxury-gold' | 'cyberpunk-neon' | 'midnight-obsidian' | 'emerald-forest';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  dot: string;
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'luxury-gold',
    name: 'Luxury Gold',
    description: 'Rich dark matte · luxury gold',
    dot: '#FFD700',
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    description: 'Charcoal dark · neon magenta',
    dot: '#FF007F',
  },
  {
    id: 'midnight-obsidian',
    name: 'Midnight Obsidian',
    description: 'Deep obsidian · icy blue',
    dot: '#00D2FF',
  },
  {
    id: 'emerald-forest',
    name: 'Emerald Forest',
    description: 'Dark green · mint glow',
    dot: '#00FFCC',
  },
];

interface ThemeCtx {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeCtx>({
  theme: 'luxury-gold',
  setTheme: () => {},
});

const LS_KEY = 'vantix-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const saved = localStorage.getItem(LS_KEY) as ThemeId | null;
    const resolved = THEMES.some(t => t.id === saved) ? saved! : 'luxury-gold';
    document.documentElement.setAttribute('data-theme', resolved);
    return resolved;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(LS_KEY, theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
