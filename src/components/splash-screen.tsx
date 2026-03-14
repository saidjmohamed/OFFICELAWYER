'use client';

import { useEffect, useState } from 'react';
import { Scale, Loader2 } from 'lucide-react';

export function SplashScreen() {
  const [show, setShow] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // بعد 1.5 ثانية، ابدأ التلاشي
    const fadeTimer = setTimeout(() => {
      setFade(true);
    }, 1500);

    // بعد 2 ثانية، أخفِ الشاشة
    const hideTimer = setTimeout(() => {
      setShow(false);
    }, 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-primary to-primary/80 transition-opacity duration-500 ${
        fade ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* الشعار */}
      <div className="flex flex-col items-center gap-6">
        {/* الأيقونة */}
        <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse">
          <Scale className="w-12 h-12 text-white" />
        </div>
        
        {/* اسم التطبيق */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-1">نظام مكتب المحامي</h1>
          <p className="text-white/80 text-sm">إدارة القضايا والجلسات والموكلين</p>
        </div>
        
        {/* مؤشر التحميل */}
        <Loader2 className="w-6 h-6 text-white/80 animate-spin mt-4" />
      </div>
      
      {/* معلومات المطور */}
      <div className="absolute bottom-8 text-center">
        <p className="text-white/60 text-xs">تطوير: الأستاذ سايج محمد</p>
      </div>
    </div>
  );
}
