import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Calendar,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { PublicLayout } from '../../components/public/PublicLayout';
import { useRouter } from '../../context/RouterContext';
import { Article, Category } from '../../types';
import { api } from '../../services/api';

export const PublicArticles: React.FC = () => {
  const { navigate } = useRouter();

  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [artsRes, catsRes] = await Promise.allSettled([
          api.getArticles({
            search: search.trim() || undefined,
            category: selectedCategory || undefined,
          }),
          api.getCategories(),
        ]);
        if (isMounted) {
          if (artsRes.status === 'fulfilled') setArticles(artsRes.value.articles || []);
          if (catsRes.status === 'fulfilled') setCategories(catsRes.value.categories || []);
        }
      } catch {
        // Safe empty state retained
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [search, selectedCategory]);

  const getCategoryName = (catId?: string) => {
    if (!catId) return null;
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.name : null;
  };

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Header - Compact, Strong Sans Headline */}
        <div className="max-w-2xl mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-[10px] font-semibold uppercase tracking-wider mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            <span>Public Archive · Tactical Papers</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-tight">
            Articles & Intelligence
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Calculated essays on tactical cognition, psychological strategy, high-stress resilience, and decisional dominance.
          </p>
        </div>

        {/* Search & Filter Toolbar: Clean, Compact (Don's Tools Style) */}
        <div className="mb-6 p-2 bg-neutral-50 dark:bg-[#111111] border border-neutral-200 dark:border-neutral-800 rounded-xl flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between shadow-xs">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search briefing titles, keywords, subjects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === ''
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-white dark:bg-[#0a0a0a] text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white border border-neutral-200 dark:border-neutral-800'
              }`}
            >
              All Topics ({articles.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-white dark:bg-[#0a0a0a] text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white border border-neutral-200 dark:border-neutral-800'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Articles List / Grid */}
        {loading ? (
          <div className="py-20 text-center text-neutral-500">
            <Loader2 className="w-6 h-6 text-red-600 animate-spin mx-auto mb-2" />
            <p className="text-xs font-mono text-neutral-400">Loading intelligence briefings...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#111111]/60 max-w-sm mx-auto">
            <BookOpen className="w-7 h-7 text-neutral-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">No Briefings Found</h3>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              {search || selectedCategory
                ? 'No published briefings match your current search or topic filter.'
                : 'There are currently no published articles in the archive. Please check back soon.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {articles.map((article) => {
              const catName = getCategoryName(article.categoryId) || article.category;
              return (
                <article
                  key={article.id}
                  onClick={() => navigate(`/articles/${article.slug}`)}
                  className="group cursor-pointer bg-white dark:bg-[#111111] border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 rounded-xl overflow-hidden transition-all duration-150 flex flex-col hover:-translate-y-0.5 hover:shadow-sm"
                >
                  {/* Thumbnail */}
                  <div className="aspect-[16/9] bg-neutral-100 dark:bg-neutral-900 overflow-hidden relative">
                    {article.featuredImage ? (
                      <img
                        src={article.featuredImage}
                        alt={article.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400">
                        <BookOpen className="w-6 h-6" />
                      </div>
                    )}

                    {catName && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-semibold bg-white/95 dark:bg-black/90 text-red-600 dark:text-red-400 border border-neutral-200/60 dark:border-neutral-800/60 shadow-xs">
                        {catName}
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Clean Unboxed Metadata */}
                      <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mb-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5 text-red-600" />
                          {new Date(
                            article.publishedAt || article.createdAt
                          ).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate max-w-[85px]">{article.author || 'Mental Tactic'}</span>
                      </div>

                      <h2 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors line-clamp-2 leading-snug">
                        {article.title}
                      </h2>

                      {article.description && (
                        <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                          {article.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-500">
                      <span>Read Briefing</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </PublicLayout>
  );
};
