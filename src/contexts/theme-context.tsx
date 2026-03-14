'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
}

interface ThemeContextType {
  settings: ThemeSettings;
  updateSettings: (newSettings: Partial<ThemeSettings>) => void;
  isLoading: boolean;
}

const defaultSettings: ThemeSettings = {
  primaryColor: '#1e40af',
  secondaryColor: '#3b82f6',
  accentColor: '#f59e0b',
  fontFamily: 'Tajawal',
};

const ThemeContext = createContext<ThemeContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
  isLoading: true,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // جلب الإعدادات من الخادم
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/office-settings');
        if (response.ok) {
          const data = await response.json();
          setSettings({
            primaryColor: data.primaryColor || defaultSettings.primaryColor,
            secondaryColor: data.secondaryColor || defaultSettings.secondaryColor,
            accentColor: data.accentColor || defaultSettings.accentColor,
            fontFamily: data.fontFamily || defaultSettings.fontFamily,
          });
        }
      } catch (error) {
        console.error('خطأ في جلب إعدادات الثيم:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // تطبيق الألوان كمتغيرات CSS
  useEffect(() => {
    const root = document.documentElement;
    
    // تحويل اللون السداسي إلى RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    const primaryRgb = hexToRgb(settings.primaryColor);
    const secondaryRgb = hexToRgb(settings.secondaryColor);
    const accentRgb = hexToRgb(settings.accentColor);

    if (primaryRgb) {
      root.style.setProperty('--primary', `${settings.primaryColor}`);
      root.style.setProperty('--primary-foreground', '#ffffff');
    }

    if (secondaryRgb) {
      root.style.setProperty('--secondary', settings.secondaryColor);
      root.style.setProperty('--ring', settings.secondaryColor);
    }

    if (accentRgb) {
      root.style.setProperty('--accent', settings.accentColor);
    }

    // تطبيق الخط
    root.style.setProperty('--font-family', settings.fontFamily);
    document.body.style.fontFamily = `${settings.fontFamily}, sans-serif`;

  }, [settings]);

  const updateSettings = (newSettings: Partial<ThemeSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <ThemeContext.Provider value={{ settings, updateSettings, isLoading }}>
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
