import { createContext, useContext, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { AppTheme, DARK_THEMES, LIGHT_THEMES, getThemeByKey, VantaBlackTheme, SettledLightTheme } from '@/constants/colors';

interface ThemeContextType {
  theme: AppTheme;
  isDark: boolean;
  darkThemeKey: string;
  toggleTheme: () => void;
  setDarkTheme: (key: string) => void;
  setTheme: (dark: boolean) => void;
  availableDarkThemes: AppTheme[];
  availableLightThemes: AppTheme[];
}

const ThemeContext = createContext<ThemeContextType>({
  theme: VantaBlackTheme,
  isDark: true,
  darkThemeKey: 'vanta-black',
  toggleTheme: () => {},
  setDarkTheme: () => {},
  setTheme: () => {},
  availableDarkThemes: DARK_THEMES,
  availableLightThemes: LIGHT_THEMES,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === 'dark');
  const [darkThemeKey, setDarkThemeKey] = useState('vanta-black');

  const darkTheme = getThemeByKey(darkThemeKey);
  const theme = isDark ? darkTheme : SettledLightTheme;

  const toggleTheme = () => setIsDark((prev) => !prev);
  const setDarkTheme = (key: string) => setDarkThemeKey(key);
  const setTheme = (dark: boolean) => setIsDark(dark);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        darkThemeKey,
        toggleTheme,
        setDarkTheme,
        setTheme,
        availableDarkThemes: DARK_THEMES,
        availableLightThemes: LIGHT_THEMES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
