import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { BarChart3, FileText, MessageSquare, Settings, LogOut, Plus, Edit2, Trash2, Eye, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Tab = 'dashboard' | 'posts' | 'categories' | 'comments' | 'users' | 'settings';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showPostModal, setShowPostModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  // Form states
  const [postForm, setPostForm] = useState({ title: '', content: '', excerpt: '', categoryId: 0, image: '', youtubeUrl: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', description: '' });
  const [settingsForm, setSettingsForm] = useState({ whatsapp: '', telegram: '', email: '' });

  // Queries
  const { data: posts } = trpc.posts.getAll.useQuery();
  const { data: categories } = trpc.categories.getAll.useQuery();
  const { data: comments } = trpc.comments.getByPost.useQuery({ postId: 0 });
  const { data: users } = trpc.users.getAll.useQuery();
  const { data: analytics } = trpc.analytics.get.useQuery();
  const { data: settings } = trpc.settings.getAll.useQuery();

  // Mutations
  const createPostMutation = trpc.posts.create.useMutation();
  const updatePostMutation = trpc.posts.update.useMutation();
  const deletePostMutation = trpc.posts.delete.useMutation();
  const createCategoryMutation = trpc.categories.create.useMutation();
  const updateCategoryMutation = trpc.categories.update.useMutation();
  const deleteCategoryMutation = trpc.categories.delete.useMutation();
  const setSettingMutation = trpc.settings.set.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">غير مصرح</h1>
          <p className="text-slate-600 mb-6">ليس لديك صلاحية للوصول إلى لوحة التحكم</p>
          <Button onClick={() => setLocation('/')}>العودة للصفحة الرئيسية</Button>
        </Card>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setLocation('/');
    } catch (error) {
      toast.error('فشل تسجيل الخروج');
    }
  };

  const handleSavePost = async () => {
    if (!postForm.title || !postForm.content || !postForm.categoryId) {
      toast.error('الرجاء ملء الحقول المطلوبة');
      return;
    }

    try {
      if (editingPost) {
        await updatePostMutation.mutateAsync({ id: editingPost.id, ...postForm });
        toast.success('تم تحديث المنشور');
      } else {
        await createPostMutation.mutateAsync(postForm);
        toast.success('تم إنشاء المنشور');
      }
      setShowPostModal(false);
      setPostForm({ title: '', content: '', excerpt: '', categoryId: 0, image: '', youtubeUrl: '' });
      setEditingPost(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name) {
      toast.error('الرجاء إدخال اسم الفئة');
      return;
    }

    try {
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({ id: editingCategory.id, ...categoryForm });
        toast.success('تم تحديث الفئة');
      } else {
        await createCategoryMutation.mutateAsync(categoryForm);
        toast.success('تم إنشاء الفئة');
      }
      setShowCategoryModal(false);
      setCategoryForm({ name: '', slug: '', description: '' });
      setEditingCategory(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await setSettingMutation.mutateAsync({ key: 'whatsapp', value: settingsForm.whatsapp });
      await setSettingMutation.mutateAsync({ key: 'telegram', value: settingsForm.telegram });
      await setSettingMutation.mutateAsync({ key: 'email', value: settingsForm.email });
      toast.success('تم حفظ الإعدادات');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Sidebar */}
      <div className="fixed right-0 top-0 w-64 h-screen bg-slate-900 text-white shadow-lg">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-2xl font-bold">RAMEZ TECH</h2>
          <p className="text-sm text-slate-400">لوحة التحكم</p>
        </div>

        <nav className="p-4 space-y-2">
          <NavButton
            icon={<BarChart3 className="w-5 h-5" />}
            label="الإحصائيات"
            active={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
          />
          <NavButton
            icon={<FileText className="w-5 h-5" />}
            label="المنشورات"
            active={activeTab === 'posts'}
            onClick={() => setActiveTab('posts')}
          />
          <NavButton
            icon={<Plus className="w-5 h-5" />}
            label="الفئات"
            active={activeTab === 'categories'}
            onClick={() => setActiveTab('categories')}
          />
          <NavButton
            icon={<MessageSquare className="w-5 h-5" />}
            label="التعليقات"
            active={activeTab === 'comments'}
            onClick={() => setActiveTab('comments')}
          />
          <NavButton
            icon={<Users className="w-5 h-5" />}
            label="المستخدمون"
            active={activeTab === 'users'}
            onClick={() => setActiveTab('users')}
          />
          <NavButton
            icon={<Settings className="w-5 h-5" />}
            label="الإعدادات"
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          />
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-white border-slate-700 hover:bg-slate-800"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="mr-64 p-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <h1 className="text-4xl font-bold mb-8">الإحصائيات</h1>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <StatCard
                title="إجمالي الزوار"
                value={analytics?.totalVisitors || 0}
                icon={<Eye className="w-8 h-8" />}
              />
              <StatCard
                title="المستخدمون المسجلون"
                value={analytics?.totalRegistered || 0}
                icon={<Users className="w-8 h-8" />}
              />
              <StatCard
                title="إجمالي المشاهدات"
                value={analytics?.totalViews || 0}
                icon={<BarChart3 className="w-8 h-8" />}
              />
            </div>
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-bold">المنشورات</h1>
              <Button onClick={() => { setEditingPost(null); setShowPostModal(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                منشور جديد
              </Button>
            </div>

            <div className="space-y-4">
              {posts?.map(post => (
                <Card key={post.id} className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">{post.title}</h3>
                    <p className="text-sm text-slate-600">
                      {categories?.find(c => c.id === post.categoryId)?.name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingPost(post);
                        setPostForm({
                          title: post.title,
                          content: post.content,
                          excerpt: post.excerpt || '',
                          categoryId: post.categoryId,
                          image: post.image || '',
                          youtubeUrl: post.youtubeUrl || '',
                        });
                        setShowPostModal(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        deletePostMutation.mutate({ id: post.id });
                        toast.success('تم حذف المنشور');
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-bold">الفئات</h1>
              <Button onClick={() => { setEditingCategory(null); setShowCategoryModal(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                فئة جديدة
              </Button>
            </div>

            <div className="space-y-4">
              {categories?.map(cat => (
                <Card key={cat.id} className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">{cat.name}</h3>
                    <p className="text-sm text-slate-600">{cat.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCategory(cat);
                        setCategoryForm({
                          name: cat.name,
                          slug: cat.slug,
                          description: cat.description || '',
                        });
                        setShowCategoryModal(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        deleteCategoryMutation.mutate({ id: cat.id });
                        toast.success('تم حذف الفئة');
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <h1 className="text-4xl font-bold mb-8">الإعدادات</h1>
            <Card className="p-8 max-w-2xl">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">رقم واتساب</label>
                  <Input
                    placeholder="966501234567"
                    value={settingsForm.whatsapp}
                    onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">معرف تلغرام</label>
                  <Input
                    placeholder="@username"
                    value={settingsForm.telegram}
                    onChange={(e) => setSettingsForm({ ...settingsForm, telegram: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">البريد الإلكتروني</label>
                  <Input
                    type="email"
                    placeholder="contact@example.com"
                    value={settingsForm.email}
                    onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                  />
                </div>
                <Button onClick={handleSaveSettings} className="w-full">
                  حفظ الإعدادات
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <h1 className="text-4xl font-bold mb-8">المستخدمون المسجلون</h1>
            <div className="space-y-4">
              {users?.map(u => (
                <Card key={u.id} className="p-4">
                  <div>
                    <h3 className="font-bold">{u.name}</h3>
                    <p className="text-sm text-slate-600">{u.email}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Post Modal */}
      <Dialog open={showPostModal} onOpenChange={setShowPostModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPost ? 'تعديل المنشور' : 'منشور جديد'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="العنوان"
              value={postForm.title}
              onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
            />
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={postForm.categoryId}
              onChange={(e) => setPostForm({ ...postForm, categoryId: parseInt(e.target.value) })}
            >
              <option value={0}>اختر الفئة</option>
              {categories?.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <Input
              placeholder="الملخص"
              value={postForm.excerpt}
              onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })}
            />
            <Textarea
              placeholder="المحتوى"
              value={postForm.content}
              onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
              className="min-h-32"
            />
            <Input
              placeholder="رابط الصورة"
              value={postForm.image}
              onChange={(e) => setPostForm({ ...postForm, image: e.target.value })}
            />
            <Input
              placeholder="رابط يوتيوب"
              value={postForm.youtubeUrl}
              onChange={(e) => setPostForm({ ...postForm, youtubeUrl: e.target.value })}
            />
            <Button onClick={handleSavePost} className="w-full">
              {editingPost ? 'تحديث' : 'إنشاء'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'تعديل الفئة' : 'فئة جديدة'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="اسم الفئة"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            />
            <Input
              placeholder="الـ Slug"
              value={categoryForm.slug}
              onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
            />
            <Textarea
              placeholder="الوصف"
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            />
            <Button onClick={handleSaveCategory} className="w-full">
              {editingCategory ? 'تحديث' : 'إنشاء'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
        active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-600 text-sm font-medium">{title}</p>
          <p className="text-4xl font-bold mt-2">{value}</p>
        </div>
        <div className="text-blue-600">{icon}</div>
      </div>
    </Card>
  );
}
