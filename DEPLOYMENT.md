# دليل النشر - OFFICELAWYER

## 🌐 خيارات النشر

### 1. النشر المحلي (Local)
يعمل افتراضياً مع SQLite محلي بدون أي إعدادات إضافية.

```bash
bun install
bun run dev
```

---

### 2. النشر على Vercel + Turso (موصى به)

#### الخطوة 1: إنشاء حساب Turso
1. اذهب إلى [turso.tech](https://turso.tech)
2. أنشئ حساب مجاني
3. أنشئ قاعدة بيانات جديدة

#### الخطوة 2: الحصول على بيانات الاتصال
من لوحة تحكم Turso:
- انسخ **Database URL** (مثل: `libsql://your-db.turso.io`)
- أنشئ **Auth Token** من Settings

#### الخطوة 3: النشر على Vercel
1. اربط المشروع بـ GitHub
2. استورد المشروع في Vercel
3. أضف متغيرات البيئة:

```
DATABASE_MODE=turso
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-auth-token
DEFAULT_PASSCODE=123456
NODE_ENV=production
```

#### الخطوة 4: نشر المشروع
اضغط **Deploy** وانتظر اكتمال النشر.

---

## 📋 متغيرات البيئة

| المتغير | الوصف | مطلوب |
|---------|-------|-------|
| `DATABASE_MODE` | وضع قاعدة البيانات (local/turso/auto) | لا |
| `TURSO_DATABASE_URL` | رابط قاعدة بيانات Turso | للسحابي |
| `TURSO_AUTH_TOKEN` | رمز المصادقة لـ Turso | للسحابي |
| `DEFAULT_PASSCODE` | الرمز الافتراضي للدخول | لا |

---

## 🔧 التبديل بين الأوضاع

### وضع محلي (Local)
```env
DATABASE_MODE=local
# أو اتركه فارغاً للاستخدام التلقائي
```

### وضع سحابي (Turso)
```env
DATABASE_MODE=turso
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token
```

### وضع تلقائي (Auto)
```env
# بدون تحديد DATABASE_MODE
# سيستخدم Turso إذا كانت المتغيرات موجودة
# وإلا سيستخدم SQLite المحلي
```

---

## 🛠️ استكشاف الأخطاء

### خطأ: "Turso configuration missing"
تأكد من إضافة `TURSO_DATABASE_URL` و `TURSO_AUTH_TOKEN`

### خطأ: "حدث خطأ في المصادقة"
1. تحقق من أن قاعدة البيانات تم تهيئتها (`/api/init-db`)
2. تحقق من الرمز الافتراضي (123456)

### خطأ في الاتصال بقاعدة البيانات
- **محلياً**: تأكد من وجود مجلد `db/`
- **سحابياً**: تحقق من صحة URL و Token

---

## 📱 المنصات المدعومة

| المنصة | SQLite محلي | Turso سحابي |
|--------|-------------|-------------|
| localhost | ✅ | ✅ |
| Vercel | ❌ | ✅ |
| Netlify | ❌ | ✅ |
| Render | ❌ | ✅ |

---

## 🔐 الأمان

- غيّر الرمز الافتراضي بعد أول تسجيل دخول
- لا تشارك `TURSO_AUTH_TOKEN` مع أحد
- استخدم متغيرات البيئة في Vercel بدلاً من ملف `.env`
