import React, { createContext, useContext, useState, useCallback, useLayoutEffect } from 'react';

export type ThemeKey = 'dark' | 'light' | 'nord' | 'dracula' | 'solarized' | 'gruvbox' | 'catppuccin';

export interface ThemeInfo {
  key: ThemeKey;
  labelKey: string;
}

export const themes: ThemeInfo[] = [
  { key: 'dark', labelKey: 'themeDark' },
  { key: 'light', labelKey: 'themeLight' },
  { key: 'nord', labelKey: 'themeNord' },
  { key: 'dracula', labelKey: 'themeDracula' },
  { key: 'solarized', labelKey: 'themeSolarized' },
  { key: 'gruvbox', labelKey: 'themeGruvbox' },
  { key: 'catppuccin', labelKey: 'themeCatppuccin' },
];

// Theme CSS variables definitions
const themeVariables: Record<ThemeKey, Record<string, string>> = {
  dark: {
    '--background': '30 6% 9%',
    '--foreground': '40 20% 95%',
    '--card': '30 6% 12%',
    '--card-foreground': '40 20% 95%',
    '--card-hover': '30 6% 14%',
    '--popover': '30 6% 10%',
    '--popover-foreground': '40 20% 95%',
    '--primary': '43 74% 49%',
    '--primary-foreground': '30 6% 9%',
    '--secondary': '30 6% 18%',
    '--secondary-foreground': '40 20% 95%',
    '--muted': '30 6% 20%',
    '--muted-foreground': '40 10% 60%',
    '--accent': '30 6% 16%',
    '--accent-foreground': '40 20% 95%',
    '--destructive': '0 72% 51%',
    '--destructive-foreground': '40 20% 95%',
    '--success': '142 71% 45%',
    '--success-foreground': '30 6% 9%',
    '--border': '30 6% 22%',
    '--input': '30 6% 18%',
    '--ring': '43 74% 49%',
    '--category-custos-fixos': '187 85% 53%',
    '--category-conforto': '160 84% 39%',
    '--category-metas': '48 96% 53%',
    '--category-prazeres': '291 64% 42%',
    '--category-liberdade': '217 91% 60%',
    '--category-conhecimento': '25 95% 53%',
  },
  light: {
    '--background': '0 0% 98%',
    '--foreground': '222 47% 11%',
    '--card': '0 0% 100%',
    '--card-foreground': '222 47% 11%',
    '--card-hover': '0 0% 97%',
    '--popover': '0 0% 100%',
    '--popover-foreground': '222 47% 11%',
    '--primary': '221 83% 53%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '210 40% 96%',
    '--secondary-foreground': '222 47% 11%',
    '--muted': '210 40% 96%',
    '--muted-foreground': '215 16% 47%',
    '--accent': '210 40% 94%',
    '--accent-foreground': '222 47% 11%',
    '--destructive': '0 84% 60%',
    '--destructive-foreground': '0 0% 100%',
    '--success': '142 71% 45%',
    '--success-foreground': '0 0% 100%',
    '--border': '214 32% 91%',
    '--input': '214 32% 91%',
    '--ring': '221 83% 53%',
    '--category-custos-fixos': '187 85% 43%',
    '--category-conforto': '160 84% 32%',
    '--category-metas': '45 93% 47%',
    '--category-prazeres': '291 64% 42%',
    '--category-liberdade': '217 91% 50%',
    '--category-conhecimento': '25 95% 50%',
  },
  nord: {
    '--background': '220 16% 16%',
    '--foreground': '219 28% 88%',
    '--card': '220 16% 20%',
    '--card-foreground': '219 28% 88%',
    '--card-hover': '220 16% 22%',
    '--popover': '220 16% 18%',
    '--popover-foreground': '219 28% 88%',
    '--primary': '193 43% 67%',
    '--primary-foreground': '220 16% 16%',
    '--secondary': '220 16% 28%',
    '--secondary-foreground': '219 28% 88%',
    '--muted': '220 16% 28%',
    '--muted-foreground': '219 14% 63%',
    '--accent': '220 16% 24%',
    '--accent-foreground': '219 28% 88%',
    '--destructive': '354 42% 56%',
    '--destructive-foreground': '219 28% 88%',
    '--success': '92 28% 65%',
    '--success-foreground': '220 16% 16%',
    '--border': '220 16% 28%',
    '--input': '220 16% 24%',
    '--ring': '193 43% 67%',
    '--category-custos-fixos': '193 43% 67%',
    '--category-conforto': '92 28% 65%',
    '--category-metas': '40 71% 73%',
    '--category-prazeres': '311 20% 63%',
    '--category-liberdade': '213 32% 52%',
    '--category-conhecimento': '14 51% 63%',
  },
  dracula: {
    '--background': '231 15% 18%',
    '--foreground': '60 30% 96%',
    '--card': '232 14% 21%',
    '--card-foreground': '60 30% 96%',
    '--card-hover': '232 14% 24%',
    '--popover': '232 14% 19%',
    '--popover-foreground': '60 30% 96%',
    '--primary': '265 89% 78%',
    '--primary-foreground': '231 15% 18%',
    '--secondary': '232 14% 28%',
    '--secondary-foreground': '60 30% 96%',
    '--muted': '232 14% 28%',
    '--muted-foreground': '225 14% 64%',
    '--accent': '232 14% 26%',
    '--accent-foreground': '60 30% 96%',
    '--destructive': '0 100% 67%',
    '--destructive-foreground': '60 30% 96%',
    '--success': '135 94% 65%',
    '--success-foreground': '231 15% 18%',
    '--border': '232 14% 28%',
    '--input': '232 14% 24%',
    '--ring': '265 89% 78%',
    '--category-custos-fixos': '191 97% 77%',
    '--category-conforto': '135 94% 65%',
    '--category-metas': '65 92% 76%',
    '--category-prazeres': '326 100% 74%',
    '--category-liberdade': '265 89% 78%',
    '--category-conhecimento': '31 100% 71%',
  },
  solarized: {
    '--background': '192 100% 5%',
    '--foreground': '44 87% 94%',
    '--card': '192 81% 9%',
    '--card-foreground': '44 87% 94%',
    '--card-hover': '192 81% 11%',
    '--popover': '192 81% 7%',
    '--popover-foreground': '44 87% 94%',
    '--primary': '175 59% 40%',
    '--primary-foreground': '192 100% 5%',
    '--secondary': '194 14% 20%',
    '--secondary-foreground': '44 87% 94%',
    '--muted': '194 14% 20%',
    '--muted-foreground': '186 13% 53%',
    '--accent': '192 81% 12%',
    '--accent-foreground': '44 87% 94%',
    '--destructive': '1 71% 52%',
    '--destructive-foreground': '44 87% 94%',
    '--success': '68 100% 30%',
    '--success-foreground': '192 100% 5%',
    '--border': '194 14% 20%',
    '--input': '192 81% 12%',
    '--ring': '175 59% 40%',
    '--category-custos-fixos': '175 59% 40%',
    '--category-conforto': '68 100% 30%',
    '--category-metas': '45 100% 35%',
    '--category-prazeres': '331 64% 52%',
    '--category-liberdade': '205 69% 49%',
    '--category-conhecimento': '18 89% 55%',
  },
  gruvbox: {
    '--background': '0 0% 16%',
    '--foreground': '48 87% 87%',
    '--card': '0 0% 20%',
    '--card-foreground': '48 87% 87%',
    '--card-hover': '0 0% 22%',
    '--popover': '0 0% 18%',
    '--popover-foreground': '48 87% 87%',
    '--primary': '27 99% 55%',
    '--primary-foreground': '0 0% 16%',
    '--secondary': '0 0% 26%',
    '--secondary-foreground': '48 87% 87%',
    '--muted': '0 0% 26%',
    '--muted-foreground': '40 12% 62%',
    '--accent': '0 0% 24%',
    '--accent-foreground': '48 87% 87%',
    '--destructive': '6 96% 59%',
    '--destructive-foreground': '48 87% 87%',
    '--success': '106 50% 50%',
    '--success-foreground': '0 0% 16%',
    '--border': '0 0% 26%',
    '--input': '0 0% 22%',
    '--ring': '27 99% 55%',
    '--category-custos-fixos': '157 44% 52%',
    '--category-conforto': '106 50% 50%',
    '--category-metas': '61 66% 44%',
    '--category-prazeres': '324 54% 57%',
    '--category-liberdade': '177 56% 49%',
    '--category-conhecimento': '27 99% 55%',
  },
  catppuccin: {
    '--background': '240 21% 12%',
    '--foreground': '226 64% 88%',
    '--card': '240 21% 15%',
    '--card-foreground': '226 64% 88%',
    '--card-hover': '240 21% 17%',
    '--popover': '240 21% 13%',
    '--popover-foreground': '226 64% 88%',
    '--primary': '267 84% 81%',
    '--primary-foreground': '240 21% 12%',
    '--secondary': '237 16% 23%',
    '--secondary-foreground': '226 64% 88%',
    '--muted': '237 16% 23%',
    '--muted-foreground': '227 35% 59%',
    '--accent': '240 21% 19%',
    '--accent-foreground': '226 64% 88%',
    '--destructive': '343 81% 75%',
    '--destructive-foreground': '226 64% 88%',
    '--success': '115 54% 76%',
    '--success-foreground': '240 21% 12%',
    '--border': '237 16% 23%',
    '--input': '240 21% 18%',
    '--ring': '267 84% 81%',
    '--category-custos-fixos': '189 71% 73%',
    '--category-conforto': '115 54% 76%',
    '--category-metas': '41 86% 83%',
    '--category-prazeres': '316 72% 86%',
    '--category-liberdade': '217 92% 76%',
    '--category-conhecimento': '23 92% 75%',
  },
};

interface ThemeContextType {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'budget-app-theme';

const applyTheme = (theme: ThemeKey) => {
  const root = document.documentElement;
  const variables = themeVariables[theme];
  
  // Apply all CSS variables directly
  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeKey>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeKey | null;
    if (stored && themes.some(t => t.key === stored)) return stored;
    return 'dark';
  });

  // Apply theme immediately on mount and when it changes
  useLayoutEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((newTheme: ThemeKey) => {
    setThemeState(newTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
