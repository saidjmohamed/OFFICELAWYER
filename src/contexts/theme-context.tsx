'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeSettings {
  mode: ThemeMode;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
}

interface ThemeContextType {
  settings: ThemeSettings;
  updateSettings: (newSettings: Partial<ThemeSettings>) => void;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
  isLoading: boolean;
}

const defaultSettings: ThemeSettings = {
  mode: 'light',
  primaryColor: '#1e40af',
  secondaryColor: '#3b82f6',
  accentColor: '#f59e0b',
  fontFamily: 'Tajawal',
};

const ThemeContext = createContext<ThemeContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
  toggleTheme: () => {},
  setMode: () => {},
  isDark: false,
  isLoading: true,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  // تحميل الإعدادات المحفوظة - مرة واحدة فقط
  useEffect(() => {
    const loadSettings = () => {
      try {
        // تحميل الوضع من localStorage
        const savedMode = localStorage.getItem('theme-mode') as ThemeMode | null;
        const savedPrimaryColor = localStorage.getItem('primary-color');
        const savedSecondaryColor = localStorage.getItem('secondary-color');
        const savedAccentColor = localStorage.getItem('accent-color');
        const savedFontFamily = localStorage.getItem('font-family');

        const newSettings: ThemeSettings = {
          mode: savedMode || defaultSettings.mode,
          primaryColor: savedPrimaryColor || defaultSettings.primaryColor,
          secondaryColor: savedSecondaryColor || defaultSettings.secondaryColor,
          accentColor: savedAccentColor || defaultSettings.accentColor,
          fontFamily: savedFontFamily || defaultSettings.fontFamily,
        };

        setSettings(newSettings);

        // تحديد ما إذا كان الوضع داكن
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldBeDark = newSettings.mode === 'dark' || (newSettings.mode === 'system' && prefersDark);
        setIsDark(shouldBeDark);

        // تطبيق الوضع
        if (shouldBeDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (error) {
        console.error('خطأ في تحميل إعدادات الثيم:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []); // يتم التشغيل مرة واحدة فقط عند التحميل

  // الاستماع لتغييرات تفضيلات النظام
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSettings(currentSettings => {
        if (currentSettings.mode === 'system') {
          setIsDark(e.matches);
          if (e.matches) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
        return currentSettings; // لا تغير الإعدادات
      });
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []); // لا يعتمد على أي شيء

  // جلب الإعدادات من الخادم
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/office-settings');
        if (response.ok) {
          const data = await response.json();
          if (data.primaryColor) {
            setSettings(prev => ({
              ...prev,
              primaryColor: data.primaryColor,
              secondaryColor: data.secondaryColor || prev.secondaryColor,
              accentColor: data.accentColor || prev.accentColor,
              fontFamily: data.fontFamily || prev.fontFamily,
            }));
          }
        }
      } catch (error) {
        console.error('خطأ في جلب إعدادات المكتب:', error);
      }
    };

    if (!isLoading) {
      fetchSettings();
    }
  }, [isLoading]);

  // تطبيق الألوان كمتغيرات CSS
  useEffect(() => {
    if (isLoading) return;

    const root = document.documentElement;

    // حفظ في localStorage
    localStorage.setItem('theme-mode', settings.mode);
    localStorage.setItem('primary-color', settings.primaryColor);
    localStorage.setItem('secondary-color', settings.secondaryColor);
    localStorage.setItem('accent-color', settings.accentColor);
    localStorage.setItem('font-family', settings.fontFamily);

    // تطبيق الألوان
    root.style.setProperty('--primary', settings.primaryColor);
    root.style.setProperty('--ring', settings.primaryColor);
    root.style.setProperty('--secondary', settings.secondaryColor);
    root.style.setProperty('--accent', settings.accentColor);

    // تطبيق الخط
    document.body.style.fontFamily = `${settings.fontFamily}, sans-serif`;
  }, [settings, isLoading]);

  const toggleTheme = () => {
    setSettings(prev => {
      const newMode = prev.mode === 'light' ? 'dark' : prev.mode === 'dark' ? 'system' : 'light';
      const newIsDark = newMode === 'dark' || (newMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      setIsDark(newIsDark);
      
      if (newIsDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      return { ...prev, mode: newMode };
    });
  };

  const setMode = (mode: ThemeMode) => {
    const newIsDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setIsDark(newIsDark);
    
    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    setSettings(prev => ({ ...prev, mode }));
  };

  const updateSettings = (newSettings: Partial<ThemeSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <ThemeContext.Provider value={{ settings, updateSettings, toggleTheme, setMode, isDark, isLoading }}>
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
