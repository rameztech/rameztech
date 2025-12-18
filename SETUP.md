# دليل الإعداد والتثبيت

## المتطلبات
- Node.js 18+ 
- npm أو pnpm
- MySQL/TiDB

## خطوات التثبيت

### 1. استنساخ المشروع
```bash
git clone <your-repo-url>
cd ramez-tech
```

### 2. تثبيت المكتبات
```bash
pnpm install
# أو
npm install
```

### 3. إعداد قاعدة البيانات
```bash
# نسخ ملف المتغيرات البيئية
cp .env.example .env.local

# تعديل DATABASE_URL في .env.local بـ بيانات قاعدة البيانات الخاصة بك
```

### 4. تطبيق المخطط على قاعدة البيانات
```bash
pnpm db:push
```

### 5. إضافة الفئات الافتراضية
```bash
node server/seed-categories.mjs
```

### 6. إنشاء حساب Admin (اختياري)
```bash
node server/init-admin.mjs
```

**بيانات Admin الافتراضية:**
- البريد الإلكتروني: `admin@example.com`
- كلمة المرور: `admin123`

⚠️ **تنبيه أمني**: غيّر كلمة المرور الافتراضية فوراً من لوحة التحكم!

### 7. تشغيل خادم التطوير
```bash
pnpm dev
```

الموقع سيكون متاحاً على: `http://localhost:3000`

## الوصول إلى لوحة التحكم
- الرابط: `http://localhost:3000/admin/login`
- البريد الإلكتروني: `admin@example.com`
- كلمة المرور: `admin123`

## الأوامر المتاحة

| الأمر | الوصف |
|------|--------|
| `pnpm dev` | تشغيل خادم التطوير |
| `pnpm build` | بناء المشروع للإنتاج |
| `pnpm start` | تشغيل المشروع في الإنتاج |
| `pnpm test` | تشغيل الاختبارات |
| `pnpm check` | فحص أخطاء TypeScript |
| `pnpm format` | تنسيق الكود |
| `pnpm db:push` | تطبيق تغييرات قاعدة البيانات |

## النشر على GitHub

### 1. إنشاء مستودع جديد على GitHub
```bash
# في صفحة GitHub الخاصة بك، أنشئ مستودع جديد باسم "ramez-tech"
```

### 2. ربط المستودع المحلي
```bash
git remote add origin https://github.com/your-username/ramez-tech.git
git branch -M main
git push -u origin main
```

### 3. إضافة المتغيرات البيئية
لا تنسى **عدم** رفع ملف `.env.local` على GitHub!
استخدم `.env.example` كمثال للمتغيرات المطلوبة.

## النشر على Vercel

### 1. تثبيت Vercel CLI
```bash
npm i -g vercel
```

### 2. النشر
```bash
vercel
```

### 3. إضافة متغيرات البيئة
في لوحة التحكم Vercel، أضف جميع المتغيرات من `.env.local`

## النشر على Netlify

### 1. تثبيت Netlify CLI
```bash
npm i -g netlify-cli
```

### 2. النشر
```bash
netlify deploy
```

## استكشاف الأخطاء

### مشكلة: "Cannot find module"
```bash
# حل: أعد تثبيت المكتبات
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### مشكلة: "Database connection failed"
```bash
# تحقق من:
# 1. DATABASE_URL صحيح في .env.local
# 2. خادم MySQL/TiDB يعمل
# 3. قاعدة البيانات موجودة
```

### مشكلة: "Port 3000 already in use"
```bash
# حل: استخدم منفذ مختلف
PORT=3001 pnpm dev
```

## الدعم والمساعدة

للمزيد من المعلومات، راجع:
- [README.md](./README.md) - معلومات عامة عن المشروع
- [Documentation](./docs/) - التوثيق الكامل (إن وجد)

---

**آخر تحديث**: ديسمبر 2024
