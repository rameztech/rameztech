import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import { useState } from "react";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function PostDetail() {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const { data: post, isLoading: postLoading } = trpc.posts.getBySlug.useQuery({ slug: slug || '' });
  const { data: comments, refetch: refetchComments } = trpc.comments.getByPost.useQuery(
    { postId: post?.id || 0 },
    { enabled: !!post?.id }
  );
  const { data: categories } = trpc.categories.getAll.useQuery();
  const createCommentMutation = trpc.comments.create.useMutation();
  const deleteCommentMutation = trpc.comments.delete.useMutation();

  if (postLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold mb-4">المنشور غير موجود</h1>
          <Link href="/">
            <Button className="gap-2">
              <ArrowRight className="w-4 h-4" />
              العودة للصفحة الرئيسية
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const category = categories?.find(c => c.id === post.categoryId);

  const handleAddComment = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (!commentContent.trim()) {
      toast.error('الرجاء كتابة تعليق');
      return;
    }

    setIsSubmittingComment(true);
    try {
      await createCommentMutation.mutateAsync({
        postId: post.id,
        content: commentContent,
      });
      setCommentContent('');
      refetchComments();
      toast.success('تم إضافة التعليق بنجاح');
    } catch (error) {
      toast.error('حدث خطأ في إضافة التعليق');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!user || user.role !== 'admin') {
      toast.error('ليس لديك صلاحية لحذف التعليقات');
      return;
    }

    try {
      await deleteCommentMutation.mutateAsync({ id: commentId });
      refetchComments();
      toast.success('تم حذف التعليق');
    } catch (error) {
      toast.error('حدث خطأ في حذف التعليق');
    }
  };

  const externalLinks = Array.isArray(post.externalLinks) 
    ? post.externalLinks 
    : (typeof post.externalLinks === 'string' ? JSON.parse(post.externalLinks) : []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowRight className="w-4 h-4" />
              العودة
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <article className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {category?.name}
            </span>
            <span className="text-sm text-slate-500">
              {new Date(post.createdAt).toLocaleDateString('ar-SA')}
            </span>
            <span className="text-sm text-slate-500">👁️ {post.views} مشاهدة</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">{post.title}</h1>
          {post.excerpt && (
            <p className="text-xl text-slate-600">{post.excerpt}</p>
          )}
        </div>

        {/* Featured Image */}
        {post.image && (
          <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none mb-12">
          <div
            className="text-slate-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* YouTube Embed */}
        {post.youtubeUrl && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-4">الفيديو</h3>
            <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${extractYoutubeId(post.youtubeUrl)}`}
                title="YouTube video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* External Links */}
        {externalLinks && externalLinks.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-4">الروابط المفيدة</h3>
            <ul className="space-y-2">
              {externalLinks.map((link: string, idx: number) => (
                <li key={idx}>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Comments Section */}
        <div className="border-t pt-12">
          <h2 className="text-3xl font-bold mb-8">التعليقات</h2>

          {/* Add Comment Form */}
          <Card className="p-6 mb-8">
            <h3 className="text-xl font-bold mb-4">أضف تعليقاً</h3>
            {isAuthenticated ? (
              <div className="space-y-4">
                <Textarea
                  placeholder="اكتب تعليقك هنا..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  className="min-h-24"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={isSubmittingComment}
                  className="w-full"
                >
                  {isSubmittingComment ? 'جاري الإرسال...' : 'إرسال التعليق'}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-600 mb-4">يجب تسجيل الدخول لإضافة تعليق</p>
                <Button onClick={() => setShowLoginModal(true)}>
                  تسجيل الدخول
                </Button>
              </div>
            )}
          </Card>

          {/* Comments List */}
          <div className="space-y-6">
            {comments && comments.length > 0 ? (
              comments.map(comment => (
                <Card key={comment.id} className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-slate-900">مستخدم</p>
                      <p className="text-sm text-slate-500">
                        {new Date(comment.createdAt).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    {user?.role === 'admin' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        حذف
                      </Button>
                    )}
                  </div>
                  <p className="text-slate-700">{comment.content}</p>
                </Card>
              ))
            ) : (
              <p className="text-center text-slate-600 py-8">لا توجد تعليقات حالياً</p>
            )}
          </div>
        </div>
      </article>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>سجل دخول مجاناً</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-600">
              يجب تسجيل الدخول لإضافة تعليق. التسجيل مجاني بالكامل!
            </p>
            <Link href="/auth/register">
              <Button className="w-full">
                إنشاء حساب جديد
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" className="w-full">
                لديّ حساب بالفعل
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function extractYoutubeId(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : '';
}
