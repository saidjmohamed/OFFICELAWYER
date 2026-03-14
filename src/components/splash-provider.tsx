'use client';

import { useEffect, useState } from 'react';
import { SplashScreen } from './splash-screen';

export function SplashProvider({ children }: { children: React.ReactNode }) {
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // التحقق مما إذا كانت هذه أول زيارة
    const hasVisited = sessionStorage.getItem('has_visited');
    if (!hasVisited) {
      setIsFirstVisit(true);
      sessionStorage.setItem('has_visited', 'true');
    }
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      {isFirstVisit && <SplashScreen />}
      {children}
    </>
  );
}
