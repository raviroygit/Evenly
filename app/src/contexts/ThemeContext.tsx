import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, Theme } from '../styles/theme';

interface ThemeContextType {
  theme: 'light' | 'dark';
  colors: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@theme_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark'); // Default to dark
  const systemColorScheme = useColorScheme();

  // Get current colors based on theme
  const colors = theme === 'dark' ? darkTheme : lightTheme;

  // Load saved theme from storage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
          setTheme(savedTheme as 'light' | 'dark');
        } else {
          // If no saved theme, use dark as default (not system theme)
          setTheme('dark');
        }
      } catch (error) {
        console.log('Error loading theme:', error);
        // On error, default to dark theme
        setTheme('dark');
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      setTheme(newTheme);
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  // Force light theme on app start (for debugging) - DISABLED to prevent infinite loop
  // useEffect(() => {
  //   const forceLightTheme = async () => {
  //     try {
  //       await AsyncStorage.setItem(THEME_STORAGE_KEY, 'light');
  //       setTheme('light');
  //     } catch (error) {
  //       console.log('Error forcing light theme:', error);
  //     }
  //   };
  //   // Uncomment the line below to force light theme on every app start
  //   forceLightTheme();
  // }, []);

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
