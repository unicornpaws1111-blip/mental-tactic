import React, { useState, useEffect } from 'react';
import { ShoppingBag, ExternalLink, Loader2, ArrowRight } from 'lucide-react';
import { PublicLayout } from '../../components/public/PublicLayout';
import { Product } from '../../types';
import { api } from '../../services/api';

export const PublicStore: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.getProducts()
      .then((res) => {
        if (isMounted) setProducts(res?.products || []);
      })
      .catch(() => {
        if (isMounted) setProducts([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Header */}
        <div className="max-w-2xl mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-[10px] font-semibold uppercase tracking-wider mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            <span>Store · Equipment & Field Manuals</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-tight">
            Field Gear & Manuals
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Strategic books, psychological fieldwork manuals, and cognitive performance artifacts designed to reinforce execution under pressure.
          </p>
        </div>

        {/* Store Catalogue Grid */}
        {loading ? (
          <div className="py-20 text-center text-neutral-500">
            <Loader2 className="w-6 h-6 text-red-600 animate-spin mx-auto mb-2" />
            <p className="text-xs font-mono text-neutral-400">Loading store catalogue...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#111111]/60 max-w-sm mx-auto">
            <ShoppingBag className="w-7 h-7 text-neutral-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Catalogue Updating</h3>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Store inventory is currently being replenished. Check back soon for official physical artifacts and manuals.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-[#111111] border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700 rounded-xl overflow-hidden p-3 flex flex-col justify-between transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xs group"
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

                  <h3 className="font-bold text-neutral-900 dark:text-white text-xs sm:text-sm group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors truncate">
                    {p.name}
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed mt-0.5 mb-2">
                    {p.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white tabular-nums">
                    {p.price.toFixed(2)} <span className="text-[10px] text-neutral-500 font-normal">{p.currency}</span>
                  </span>

                  {p.url ? (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-semibold rounded-md transition-colors flex items-center gap-1 active:scale-95 cursor-pointer shadow-xs"
                    >
                      <span>Acquire</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <span className="text-[10px] text-neutral-400 font-mono">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  );
};
