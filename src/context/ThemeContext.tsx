import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  isPremiumTheme: boolean;
  togglePremiumTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isPremiumTheme, setIsPremiumTheme] = useState(() => {
    const saved = localStorage.getItem('premiumTheme');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('premiumTheme', JSON.stringify(isPremiumTheme));
  }, [isPremiumTheme]);

  const togglePremiumTheme = () => {
    setIsPremiumTheme(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isPremiumTheme, togglePremiumTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}