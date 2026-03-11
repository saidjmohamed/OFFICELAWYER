'use client';

import { useState } from 'react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, Scale } from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passcode.length !== 6) {
      setError('الرمز يجب أن يكون 6 أرقام');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });

      const data = await response.json();

      if (data.success) {
        // استدعاء callback لتحديث حالة المصادقة فوراً
        onLoginSuccess();
      } else {
        setError(data.error || 'رمز غير صحيح');
      }
    } catch {
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl border-2">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 flex items-center justify-center gap-3">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
            <Scale className="w-8 h-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">نظام مكتب المحامي</CardTitle>
        <CardDescription className="text-base">أدخل الرمز المكون من 6 أرقام للدخول</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={passcode}
              onChange={(value) => {
                setPasscode(value);
                setError('');
              }}
            >
              <InputOTPGroup dir="ltr">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive text-center font-medium">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 text-base font-medium"
            disabled={passcode.length !== 6 || loading}
          >
            {loading ? (
              <>
                <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                جاري التحقق...
              </>
            ) : (
              <>
                <Lock className="ml-2 h-5 w-5" />
                دخول
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            الرمز الافتراضي: 123456
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
