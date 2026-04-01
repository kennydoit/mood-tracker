import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  bg: string;
  card: string;
  cardAlt: string;
  border: string;
  borderLight: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textHint: string;
  accent: string;
  accentBg: string;
  inputBg: string;
  shadow: string;
}

export const lightColors: ThemeColors = {
  bg: '#fafafa',
  card: '#fff',
  cardAlt: '#f5f5f5',
  border: '#e0e0e0',
  borderLight: '#f0f0f0',
  textPrimary: '#111',
  textSecondary: '#555',
  textMuted: '#aaa',
  textHint: '#bbb',
  accent: '#5B7FFF',
  accentBg: '#EEF1FF',
  inputBg: '#fafafa',
  shadow: '#000',
};

export const darkColors: ThemeColors = {
  bg: '#0F0F0F',
  card: '#1C1C1E',
  cardAlt: '#2C2C2E',
  border: '#3A3A3C',
  borderLight: '#2C2C2E',
  textPrimary: '#F2F2F7',
  textSecondary: '#AEAEB2',
  textMuted: '#636366',
  textHint: '#48484A',
  accent: '#6B8FFF',
  accentBg: '#1C2340',
  inputBg: '#2C2C2E',
  shadow: 'transparent',
};

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  colors: lightColors,
  setMode: () => {},
});

const THEME_KEY = '@mood_tracker_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved === 'dark' || saved === 'light') setModeState(saved as ThemeMode);
    });
  }, []);

  const setMode = async (m: ThemeMode) => {
    setModeState(m);
    await AsyncStorage.setItem(THEME_KEY, m);
  };

  const colors = mode === 'dark' ? darkColors : lightColors;

  return React.createElement(
    ThemeContext.Provider,
    { value: { mode, colors, setMode } },
    children,
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
