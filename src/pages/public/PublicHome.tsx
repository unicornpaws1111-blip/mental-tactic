import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  ShoppingBag,
  HeartHandshake,
  ExternalLink,
  Loader2,
  Search,
  Filter,
} from 'lucide-react';
import { PublicLayout } from '../../components/public/PublicLayout';
import { useRouter } from '../../context/RouterContext';
import { Article, HomepageSettings, Product, DonationSettings, Category } from '../../types';
import { api } from '../../services/api';

export const PublicHome: React.FC = () => {
  const { navigate } = useRouter();

  const [homepage, setHomepage] = useState<HomepageSettings | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [donations, setDonations] = useState<DonationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter state on homepage (Don's Tools style)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    let isMounted = true;

    const fetchPublicData = async () => {
      try {
        setLoading(true);

        try {
          const res = await api.getPublicData();
          if (isMounted) {
            setHomepage(res.homepage || null);
            setArticles(res.articles || []);
            setProducts(res.products || []);
            setDonations(res.donations || null);
            return;
          }
        } catch {
          // Fallback to separate endpoints
        }

        const [hpRes, artsRes, prodsRes, donRes, catsRes] = await Promise.allSettled([
          api.getHomepageSettings(),
          api.getArticles(),
          api.getProducts(),
          api.getDonationSettings(),
          api.getCategories(),
        ]);

        if (isMounted) {
          if (hpRes.status === 'fulfilled') setHomepage(hpRes.value.homepage || null);
          if (artsRes.status === 'fulfilled') setArticles(artsRes.value.articles || []);
          if (prodsRes.status === 'fulfilled') setProducts(prodsRes.value.products || []);
          if (donRes.status === 'fulfilled') setDonations(donRes.value.donations || null);
          if (catsRes.status === 'fulfilled') setCategories(catsRes.value.categories || []);
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPublicData();
    return () => {
      isMounted = false;
    };
  }, []);

  const headline = homepage?.headline || 'MENTAL TACTIC';
  const tagline =
    homepage?.tagline ||
    'Master the psychological advantage. Strategic insights, mental resilience, and tactical cognition.';
  const introText = homepage?.introText || '';
  const articlesTitle = homepage?.articlesTitle || 'Tactical Intelligence';
  const storeTitle = homepage?.storeTitle || 'Field Gear & Resources';
  const donationsTitle = homepage?.donationsTitle || 'Support the Initiative';

  // Derived category list from articles if categories endpoint is empty
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    categories.forEach((c) => {
      if (c.name) set.add(c.name);
    });
    return Array.from(set);
  }, [articles, categories]);

  // Filtered articles list based on home search & category filter
  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      const matchesSearch =
        !searchQuery.trim() ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.category && a.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        selectedCategory === 'all' ||
        (a.category && a.category.toLowerCase() === selectedCategory.toLowerCase()) ||
        (a.categoryId && categories.find((c) => c.id === a.categoryId)?.name.toLowerCase() === selectedCategory.toLowerCase());

      return matchesSearch && matchesCat;
    });
  }, [articles, searchQuery, selectedCategory, categories]);

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* ========================================================================= */}
        {/* HERO / INTRO SECTION: Compact, Centered (Don's Tools Style)              */}
        {/* ========================================================================= */}
        <section className="pt-8 sm:pt-10 pb-6 text-center">
          {/* Eyebrow Kicker */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-[10px] font-semibold uppercase tracking-wider mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            <span>Tactical Psychology & Strategy</span>
          </div>

          {/* Punchy Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-tight">
            {headline}
          </h1>

          {/* Subtitle / Tagline */}
          <p className="mt-2 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto leading-relaxed">
            {tagline}
          </p>

          {introText && (
            <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500 max-w-lg mx-auto">
              {introText}
            </p>
          )}

          {/* ========================================================================= */}
          {/* SEARCH & FILTER CONTROLS: Clean, Compact, Immediate Access               */}
          {/* ========================================================================= */}
          <div className="mt-6 max-w-2xl mx-auto space-y-3">
            {/* Search Input Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search briefings, psychological tactics, research..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-[#111111] border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-red-600 transition-colors shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 font-medium cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Filter Pills (Horizontal Scrollable) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none justify-start sm:justify-center">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white border border-neutral-200/80 dark:border-neutral-800/80'
                }`}
              >
                All Topics ({articles.length})
              </button>
              {categoryOptions.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white border border-neutral-200/80 dark:border-neutral-800/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* ARTICLES GRID: High-Density, Compact Cards (Don's Tools Style)           */}
        {/* ========================================================================= */}
        <section className="py-6 border-t border-neutral-200/80 dark:border-neutral-800/80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                {articlesTitle}
              </h2>
              <span className="text-xs text-neutral-400 font-mono">
                ({filteredArticles.length})
              </span>
            </div>

            <button
              onClick={() => navigate('/articles')}
              className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-500 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Repository Archive</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-neutral-500">
              <Loader2 className="w-6 h-6 text-red-600 animate-spin mx-auto mb-2" />
              <p className="text-xs font-mono text-neutral-400">Loading intelligence briefings...</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="py-12 px-4 text-center rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#111111]/60 max-w-sm mx-auto">
              <BookOpen className="w-7 h-7 text-neutral-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">No Briefings Found</h3>
              <p className="text-xs text-neutral-500 mt-1">
                {searchQuery || selectedCategory !== 'all'
                  ? 'No briefings match your search criteria. Try selecting "All Topics" or clearing the search.'
                  : 'No briefings are currently published. Check back soon.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {filteredArticles.map((article) => (
                <article
                  key={article.id}
                  onClick={() => navigate(`/articles/${article.slug}`)}
                  className="group cursor-pointer bg-white dark:bg-[#111111] border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 rounded-xl overflow-hidden transition-all duration-150 flex flex-col hover:-translate-y-0.5 hover:shadow-sm"
                >
                  {/* Card Thumbnail */}
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

                    {article.category && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-semibold bg-white/95 dark:bg-black/90 text-red-600 dark:text-red-400 border border-neutral-200/60 dark:border-neutral-800/60 shadow-xs">
                        {article.category}
                      </span>
                    )}
                  </div>

                  {/* Card Content Body */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Metadata */}
                      <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mb-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5 text-red-600" />
                          {new Date(article.publishedAt || article.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span>·</span>
                        <span className="truncate max-w-[90px]">{article.author || 'Mental Tactic'}</span>
                      </div>

                      <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors line-clamp-2 leading-snug">
                        {article.title}
                      </h3>

                      {article.description && (
                        <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                          {article.description}
                        </p>
                      )}
                    </div>

                    {/* Card Action Link */}
                    <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-500">
                      <span>Read Briefing</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* STORE SECTION: Compact Directory-Style Grid                              */}
        {/* ========================================================================= */}
        {products.length > 0 && (
          <section className="py-8 border-t border-neutral-200/80 dark:border-neutral-800/80">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                  {storeTitle}
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Field gear, manuals, and tactical resources.
                </p>
              </div>
              <button
                onClick={() => navigate('/store')}
                className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-500 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Store</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {products.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="bg-white dark:bg-[#111111] border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 rounded-xl overflow-hidden p-3 flex flex-col justify-between transition-all group"
                >
                  <div>
                    <div className="aspect-square bg-neutral-100 dark:bg-neutral-900 rounded-lg overflow-hidden mb-2.5 relative">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <h4 className="font-bold text-neutral-900 dark:text-white text-xs sm:text-sm truncate group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors">
                      {p.name}
                    </h4>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white tabular-nums">
                      {p.price.toFixed(2)} {p.currency}
                    </span>
                    {p.url && (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-semibold rounded-md transition-colors flex items-center gap-1 active:scale-95"
                      >
                        <span>Acquire</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* DONATIONS / PATRONAGE SECTION: Compact Centered Card                     */}
        {/* ========================================================================= */}
        {donations && donations.active && donations.donationUrl && (
          <section className="py-8 border-t border-neutral-200/80 dark:border-neutral-800/80">
            <div className="p-6 sm:p-8 rounded-2xl bg-neutral-50 dark:bg-[#111111] border border-neutral-200 dark:border-neutral-800 text-center max-w-2xl mx-auto shadow-xs">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-red-600 dark:text-red-500 mb-2.5">
                <HeartHandshake className="w-5 h-5" />
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
                {donations.title || donationsTitle}
              </h2>

              {donations.description && (
                <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto leading-relaxed">
                  {donations.description}
                </p>
              )}

              <div className="mt-4 flex items-center justify-center">
                <a
                  href={donations.donationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 active:scale-95 shadow-xs"
                >
                  <span>{donations.buttonText || 'Support the Initiative'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {donations.paymentMethods && (
                <p className="mt-3 text-[10px] font-mono text-neutral-400">
                  {donations.paymentMethods}
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </PublicLayout>
  );
};
