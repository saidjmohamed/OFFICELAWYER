'use client';

import { useState } from 'react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Lock, Scale, User, Eye, EyeOff, KeyRound, UserPlus } from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  // حالة التبويب
  const [activeTab, setActiveTab] = useState<'user' | 'passcode'>('user');
  
  // حالة تسجيل الدخول بالمستخدم
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // حالة الرمز
  const [passcode, setPasscode] = useState('');
  
  // حالة التسجيل
  const [registerMode, setRegisterMode] = useState(false);
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerFullName, setRegisterFullName] = useState('');
  
  // حالة عامة
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // تسجيل الدخول باسم المستخدم
  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || username.length < 3) {
      setError('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
      return;
    }

    if (!password || password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        // حفظ اسم المستخدم إذا تم تحديد "تذكرني"
        if (rememberMe) {
          localStorage.setItem('remembered_username', username);
        } else {
          localStorage.removeItem('remembered_username');
        }
        onLoginSuccess();
      } else {
        setError(data.error || 'بيانات الدخول غير صحيحة');
      }
    } catch {
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  // تسجيل الدخول بالرمز
  const handlePasscodeLogin = async (e: React.FormEvent) => {
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

  // تسجيل مستخدم جديد
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerUsername || registerUsername.length < 3) {
      setError('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
      return;
    }

    if (!registerPassword || registerPassword.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          username: registerUsername,
          password: registerPassword,
          email: registerEmail || undefined,
          fullName: registerFullName || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // التبديل إلى وضع تسجيل الدخول بعد التسجيل الناجح
        setRegisterMode(false);
        setRegisterUsername('');
        setRegisterPassword('');
        setRegisterEmail('');
        setRegisterFullName('');
        setUsername(registerUsername);
        setActiveTab('user');
        setError('');
        alert('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول');
      } else {
        setError(data.error || 'فشل في إنشاء الحساب');
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
        <CardDescription className="text-base">
          {registerMode ? 'إنشاء حساب جديد' : 'سجل الدخول للمتابعة'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {registerMode ? (
          // نموذج التسجيل
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="register-username">اسم المستخدم *</Label>
              <div className="relative">
                <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="register-username"
                  value={registerUsername}
                  onChange={(e) => {
                    setRegisterUsername(e.target.value);
                    setError('');
                  }}
                  placeholder="أدخل اسم المستخدم"
                  className="pr-9"
                  minLength={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-fullname">الاسم الكامل (اختياري)</Label>
              <Input
                id="register-fullname"
                value={registerFullName}
                onChange={(e) => setRegisterFullName(e.target.value)}
                placeholder="أدخل اسمك الكامل"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-email">البريد الإلكتروني (اختياري)</Label>
              <Input
                id="register-email"
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                placeholder="example@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-password">كلمة المرور *</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  value={registerPassword}
                  onChange={(e) => {
                    setRegisterPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="6 أحرف على الأقل"
                  className="pr-9 pl-9"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive text-center font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  جاري إنشاء الحساب...
                </>
              ) : (
                <>
                  <UserPlus className="ml-2 h-5 w-5" />
                  إنشاء حساب
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setRegisterMode(false);
                setError('');
              }}
            >
              العودة لتسجيل الدخول
            </Button>
          </form>
        ) : (
          // تبويبات تسجيل الدخول
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'user' | 'passcode'); setError(''); }}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="user" className="gap-2">
                <User className="h-4 w-4" />
                مستخدم
              </TabsTrigger>
              <TabsTrigger value="passcode" className="gap-2">
                <KeyRound className="h-4 w-4" />
                رمز
              </TabsTrigger>
            </TabsList>

            {/* تسجيل الدخول بالمستخدم */}
            <TabsContent value="user">
              <form onSubmit={handleUserLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">اسم المستخدم</Label>
                  <div className="relative">
                    <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setError('');
                      }}
                      placeholder="أدخل اسم المستخدم"
                      className="pr-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      placeholder="أدخل كلمة المرور"
                      className="pr-9 pl-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                      تذكرني
                    </Label>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive text-center font-medium">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium"
                  disabled={!username || !password || loading}
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

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setRegisterMode(true);
                    setError('');
                  }}
                >
                  إنشاء حساب جديد
                </Button>
              </form>
            </TabsContent>

            {/* تسجيل الدخول بالرمز */}
            <TabsContent value="passcode">
              <form onSubmit={handlePasscodeLogin} className="space-y-4">
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
              </form>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 pt-0">
        <p className="text-xs text-muted-foreground text-center">
          {activeTab === 'user' && !registerMode && 'اسم المستخدم الافتراضي: admin / admin123'}
        </p>
      </CardFooter>
    </Card>
  );
}
