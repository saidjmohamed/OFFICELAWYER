'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export function DemoBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // التحقق مما إذا كان المستخدم قد رأى التحذير من قبل
    const hasSeenWarning = localStorage.getItem('demo_warning_seen');
    if (!hasSeenWarning) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('demo_warning_seen', 'true');
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      onClick={handleDismiss}
      style={{ touchAction: 'auto' }}
    >
      <div 
        className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl shadow-2xl max-w-md w-full p-6 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          {/* الأيقونة */}
          <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8" />
          </div>
          
          {/* العنوان */}
          <h2 className="text-xl font-bold mb-3">نسخة تجريبية</h2>
          
          {/* الرسالة */}
          <p className="text-white/90 text-sm leading-relaxed mb-4">
            هذه نسخة تجريبية للتطبيق. البيانات التي تُدخلها لأغراض الاختبار فقط وقد تُحذف في أي وقت.
          </p>
          
          {/* معلومات المطور */}
          <p className="text-white/70 text-xs mb-5">
            تطوير: الأستاذ سايج محمد
          </p>
          
          {/* زر الإغلاق */}
          <button
            onClick={handleDismiss}
            className="bg-white text-orange-600 font-bold py-3 px-8 rounded-full text-sm hover:bg-white/90 transition-colors"
          >
            فهمت، متابعة
          </button>
        </div>
      </div>
    </div>
  );
}

// مكون التذييل - شريط بسيط في الأسفل
export function DemoFooter() {
  return (
    <div className="hidden md:flex fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2 px-4 text-center text-xs items-center justify-center gap-2">
      <AlertTriangle className="h-3 w-3" />
      <span>نسخة تجريبية - بيانات اختبارية فقط</span>
    </div>
  );
}
