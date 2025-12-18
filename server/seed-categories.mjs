import { drizzle } from 'drizzle-orm/mysql2';
import { categories } from '../drizzle/schema.js';

const db = drizzle(process.env.DATABASE_URL);

const defaultCategories = [
  { name: 'FRP', slug: 'frp', description: 'شروحات وحلول FRP', order: 1 },
  { name: 'IMEI', slug: 'imei', description: 'شروحات وحلول IMEI', order: 2 },
  { name: 'أدوات', slug: 'tools', description: 'أدوات مفيدة وبرامج', order: 3 },
  { name: 'شروحات', slug: 'tutorials', description: 'شروحات تقنية متنوعة', order: 4 },
  { name: 'تعليم', slug: 'education', description: 'محتوى تعليمي', order: 5 },
];

async function seed() {
  try {
    console.log('جاري إضافة الفئات الافتراضية...');
    
    for (const cat of defaultCategories) {
      await db.insert(categories).values(cat).catch(() => {
        // تجاهل الأخطاء إذا كانت الفئة موجودة بالفعل
      });
    }
    
    console.log('✅ تم إضافة الفئات بنجاح');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

seed();
