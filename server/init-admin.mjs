import { drizzle } from 'drizzle-orm/mysql2';
import * as crypto from 'crypto';

const db = drizzle(process.env.DATABASE_URL);

async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ':' + derivedKey.toString('hex'));
    });
  });
}

async function initAdmin() {
  try {
    console.log('جاري إنشاء حساب Admin افتراضي...');
    
    const hashedPassword = await hashPassword('admin123');
    const openId = `admin_${Date.now()}`;
    
    await db.insert(users).values({
      openId,
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin',
      loginMethod: 'email',
      role: 'admin',
    }).catch(() => {
      console.log('حساب Admin موجود بالفعل');
    });
    
    console.log('✅ تم إعداد حساب Admin بنجاح');
    console.log('البريد الإلكتروني: admin@example.com');
    console.log('كلمة المرور: admin123');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

initAdmin();
