import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { MessageCircle, Mail, Send, Zap, Code2, Shield, Smartphone, Cloud } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { data: posts } = trpc.posts.getAll.useQuery();
  const { data: categories } = trpc.categories.getAll.useQuery();
  const { data: settings } = trpc.settings.getAll.useQuery();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const whatsappNumber = settings?.find(s => s.key === 'whatsapp')?.value || '';
  const telegramHandle = settings?.find(s => s.key === 'telegram')?.value || '';
  const email = settings?.find(s => s.key === 'email')?.value || '';

  const filteredPosts = selectedCategory
    ? posts?.filter(p => p.categoryId === selectedCategory) || []
    : posts?.slice(0, 6) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Zap className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              RAMEZ TECH
            </span>
          </div>
          <div className="flex gap-3">
            {isAuthenticated ? (
              <Link href="/admin/dashboard">
                <Button variant="default" size="sm">
                  لوحة التحكم
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/admin/login">
                  <Button variant="outline" size="sm">
                    دخول Admin
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            خدمات تقنية متقدمة
          </h1>
          <p className="text-xl text-slate-600 mb-8 leading-relaxed">
            نقدم حلولاً تقنية شاملة متخصصة في إدارة السيرفرات والخدمات السحابية والحماية الرقمية
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2 bg-green-600 hover:bg-green-700">
                <MessageCircle className="w-5 h-5" />
                واتساب
              </Button>
            </a>
            <a href={`https://t.me/${telegramHandle}`} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="gap-2">
                <Send className="w-5 h-5" />
                تلغرام
              </Button>
            </a>
            <a href={`mailto:${email}`}>
              <Button size="lg" variant="outline" className="gap-2">
                <Mail className="w-5 h-5" />
                بريد إلكتروني
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">خدماتنا</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <Server className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">إدارة السيرفرات</h3>
              <p className="text-slate-600">
                خدمات احترافية لإدارة وصيانة السيرفرات بكفاءة عالية وأمان مضمون
              </p>
            </Card>
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <Shield className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">الحماية الرقمية</h3>
              <p className="text-slate-600">
                حلول أمان شاملة لحماية بياناتك من التهديدات السيبرانية
              </p>
            </Card>
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <Cloud className="w-12 h-12 text-pink-600 mb-4" />
              <h3 className="text-xl font-bold mb-3">الخدمات السحابية</h3>
              <p className="text-slate-600">
                منصات سحابية موثوقة لتخزين ومعالجة البيانات بسهولة
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Posts Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">المنشورات والشروحات</h2>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
          >
            الكل
          </Button>
          {categories?.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map(post => (
            <Link key={post.id} href={`/posts/${post.slug}`}>
              <Card className="h-full hover:shadow-lg transition-all cursor-pointer overflow-hidden group">
                {post.image && (
                  <div className="overflow-hidden h-48 bg-slate-200">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      {categories?.find(c => c.id === post.categoryId)?.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(post.createdAt).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 line-clamp-2">{post.title}</h3>
                  <p className="text-slate-600 text-sm line-clamp-3 mb-4">
                    {post.excerpt || post.content.substring(0, 100)}
                  </p>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>👁️ {post.views} مشاهدة</span>
                    <Button variant="ghost" size="sm">
                      اقرأ المزيد →
                    </Button>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-slate-600">لا توجد منشورات في هذه الفئة حالياً</p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">هل تريد خدماتنا المتقدمة؟</h2>
          <p className="text-xl mb-8 opacity-90">
            تواصل معنا الآن للحصول على استشارة مجانية
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-slate-100">
                <MessageCircle className="w-5 h-5 mr-2" />
                تواصل عبر واتساب
              </Button>
            </a>
            <a href={`https://t.me/${telegramHandle}`} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Send className="w-5 h-5 mr-2" />
                تواصل عبر تلغرام
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">عن الموقع</h4>
              <p className="text-slate-400">منصة متخصصة في الخدمات التقنية المتقدمة</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">الفئات</h4>
              <ul className="space-y-2 text-slate-400">
                {categories?.map(cat => (
                  <li key={cat.id}>
                    <button
                      onClick={() => setSelectedCategory(cat.id)}
                      className="hover:text-white transition-colors"
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">التواصل</h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <a href={`https://wa.me/${whatsappNumber}`} className="hover:text-white transition-colors">
                    واتساب
                  </a>
                </li>
                <li>
                  <a href={`https://t.me/${telegramHandle}`} className="hover:text-white transition-colors">
                    تلغرام
                  </a>
                </li>
                <li>
                  <a href={`mailto:${email}`} className="hover:text-white transition-colors">
                    البريد الإلكتروني
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">الخدمات</h4>
              <ul className="space-y-2 text-slate-400">
                <li>إدارة السيرفرات</li>
                <li>الحماية الرقمية</li>
                <li>الخدمات السحابية</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
            <p>&copy; 2024 RAMEZ TECH. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Icon components
function Server(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="8" rx="1" />
      <rect x="2" y="14" width="20" height="8" rx="1" />
      <line x1="6" y1="6" x2="6" y2="6.01" />
      <line x1="6" y1="18" x2="6" y2="18.01" />
    </svg>
  );
}
