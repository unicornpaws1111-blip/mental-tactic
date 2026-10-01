import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  User,
  Share2,
  Check,
  Loader2,
  AlertTriangle,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { PublicLayout } from '../../components/public/PublicLayout';
import { useRouter } from '../../context/RouterContext';
import { Article, Category } from '../../types';
import { api } from '../../services/api';

interface PublicArticleDetailProps {
  slug: string;
}

export const PublicArticleDetail: React.FC<PublicArticleDetailProps> = ({ slug }) => {
  const { navigate } = useRouter();

  const [article, setArticle] = useState<Article | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Track reading scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) return;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchArticle = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.getArticle(slug);
        if (!isMounted) return;
        setArticle(res.article);

        // Fetch category & related articles
        const [catsRes, artsRes] = await Promise.allSettled([
          api.getCategories(),
          api.getArticles(),
        ]);

        if (isMounted) {
          if (catsRes.status === 'fulfilled' && res.article.categoryId) {
            const match = catsRes.value.categories.find(
              (c) => c.id === res.article.categoryId
            );
            if (match) setCategory(match);
          }

          if (artsRes.status === 'fulfilled') {
            const allPublished = artsRes.value.articles || [];
            // Filter out current article and pick up to 3 related
            const others = allPublished.filter((a) => a.slug !== slug).slice(0, 3);
            setRelatedArticles(others);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError('The requested article was not found or is currently unpublished.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchArticle();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="py-40 flex flex-col items-center justify-center text-zinc-500">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-3" />
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-400">
            Decrypting Intelligence Briefing...
          </p>
        </div>
      </PublicLayout>
    );
  }

  if (error || !article) {
    return (
      <PublicLayout>
        <div className="max-w-xl mx-auto py-40 px-4 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500/80 mx-auto mb-4" />
          <h1 className="font-serif text-3xl font-bold text-white mb-3">Briefing Unavailable</h1>
          <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
            The requested intelligence briefing does not exist, has been restricted, or is currently undergoing editorial review.
          </p>
          <button
            onClick={() => navigate('/articles')}
            className="inline-flex items-center gap-2.5 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl border border-zinc-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Repository</span>
          </button>
        </div>
      </PublicLayout>
    );
  }

  const categoryName = category?.name || article.category;

  return (
    <PublicLayout>
      {/* Subtle Top Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 h-1 bg-red-600 z-50 transition-all duration-150 shadow-[0_0_12px_#ef4444]"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Top Back Navigation & Action Bar */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => navigate('/articles')}
            className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-500 transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform text-red-600 dark:text-red-500" />
            <span>All Briefings</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#111111] border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-500 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors cursor-pointer shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-red-600 dark:text-red-500" />
                <span className="text-red-600 dark:text-red-500 font-medium">Link Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-neutral-500" />
                <span>Share Briefing</span>
              </>
            )}
          </button>
        </div>

        {/* Clean Metadata */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mb-3">
          {categoryName && (
            <>
              <span className="text-red-600 dark:text-red-400 font-semibold">
                {categoryName}
              </span>
              <span aria-hidden="true">·</span>
            </>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-neutral-400" />
            {new Date(article.publishedAt || article.createdAt).toLocaleDateString(
              undefined,
              { year: 'numeric', month: 'short', day: 'numeric' }
            )}
          </span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
            <User className="w-3 h-3 text-neutral-400" />
            <span>{article.author || 'Mental Tactic'}</span>
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-tight mb-4">
          {article.title}
        </h1>

        {/* Subhead / Abstract Quote */}
        {article.description && (
          <div className="mb-6 p-3.5 rounded-lg bg-neutral-50 dark:bg-[#111111] border-l-2 border-red-600 border border-neutral-200/60 dark:border-neutral-800/60">
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-normal">
              {article.description}
            </p>
          </div>
        )}

        {/* Featured Image */}
        {article.featuredImage && (
          <div className="mb-8 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 relative shadow-xs">
            <img
              src={article.featuredImage}
              alt={article.title}
              className="w-full h-auto max-h-[460px] object-cover"
            />
          </div>
        )}

        {/* Prose Reading Content */}
        <div
          className="prose dark:prose-invert max-w-none text-neutral-800 dark:text-neutral-200 leading-relaxed text-sm sm:text-base font-sans
            [&>h1]:text-2xl sm:[&>h1]:text-3xl [&>h1]:font-extrabold [&>h1]:text-neutral-900 dark:[&>h1]:text-white [&>h1]:mt-8 [&>h1]:mb-4 [&>h1]:tracking-tight
            [&>h2]:text-xl sm:[&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-neutral-900 dark:[&>h2]:text-white [&>h2]:mt-6 [&>h2]:mb-3 [&>h2]:tracking-tight
            [&>h3]:text-base sm:[&>h3]:text-lg [&>h3]:font-bold [&>h3]:text-neutral-900 dark:[&>h3]:text-white [&>h3]:mt-5 [&>h3]:mb-2
            [&>p]:my-4 [&>p]:leading-relaxed
            [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:my-4 [&>ul]:space-y-1.5
            [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:my-4 [&>ol]:space-y-1.5
            [&>blockquote]:border-l-2 [&>blockquote]:border-red-600 [&>blockquote]:pl-4 [&>blockquote]:text-neutral-700 dark:[&>blockquote]:text-neutral-300 [&>blockquote]:my-5 [&>blockquote]:bg-neutral-50 dark:[&>blockquote]:bg-[#111111] [&>blockquote]:py-2.5 [&>blockquote]:rounded-r-lg
            [&>pre]:bg-neutral-100 dark:[&>pre]:bg-neutral-900 [&>pre]:border [&>pre]:border-neutral-200 dark:[&>pre]:border-neutral-800 [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:text-red-600 dark:[&>pre]:text-red-400 [&>pre]:my-6
            [&>img]:rounded-xl [&>img]:border [&>img]:border-neutral-200 dark:[&>img]:border-neutral-800 [&>img]:my-6
            [&>a]:text-red-600 dark:[&>a]:text-red-500 [&>a]:underline hover:[&>a]:text-red-700 dark:hover:[&>a]:text-red-400"
          dangerouslySetInnerHTML={{
            __html: article.content || '<p>No briefing content provided.</p>',
          }}
        />

        {/* Article Endmark */}
        <div className="mt-10 pt-6 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-px bg-neutral-200 dark:bg-neutral-800" />
            <div className="w-1.5 h-1.5 rotate-45 bg-red-600" />
            <div className="w-8 h-px bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </div>

        {/* Related Briefings Section */}
        {relatedArticles.length > 0 && (
          <section className="mt-10 pt-8 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight">
                  Related Intelligence
                </h2>
              </div>
              <button
                onClick={() => navigate('/articles')}
                className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-500 transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>View Repository</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {relatedArticles.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => navigate(`/articles/${rel.slug}`)}
                  className="group cursor-pointer bg-white dark:bg-[#111111] border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 rounded-xl overflow-hidden p-3 flex flex-col justify-between transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xs"
                >
                  <div>
                    <div className="aspect-[16/9] bg-neutral-100 dark:bg-neutral-900 rounded-lg overflow-hidden mb-2.5 relative">
                      {rel.featuredImage ? (
                        <img
                          src={rel.featuredImage}
                          alt={rel.title}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                          <BookOpen className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <h4 className="font-bold text-neutral-900 dark:text-white text-xs sm:text-sm group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors line-clamp-2 leading-snug">
                      {rel.title}
                    </h4>
                  </div>
                  <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-500">
                    <span>Read Briefing</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </article>
    </PublicLayout>
  );
};
