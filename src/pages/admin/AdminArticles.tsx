import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink,
  FileText,
  Loader2,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { Article, Category } from '../../types';
import { api } from '../../services/api';
import { useRouter } from '../../context/RouterContext';

export const AdminArticles: React.FC = () => {
  const { navigate } = useRouter();

  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Deletion modal state
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status toggle loading state
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Success / error toast
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [articlesRes, categoriesRes] = await Promise.all([
        api.getArticles({
          admin: true,
          search: search.trim() || undefined,
          category: selectedCategory || undefined,
          status: selectedStatus || undefined,
          sort: sortOrder,
        }),
        api.getCategories(),
      ]);
      setArticles(articlesRes.articles);
      setCategories(categoriesRes.categories);
    } catch (err: any) {
      showNotification(err.message || 'Failed to load articles.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedCategory, selectedStatus, sortOrder]);

  const handleToggleStatus = async (article: Article) => {
    try {
      setTogglingId(article.id);
      const res = await api.toggleArticleStatus(article.id);
      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? res.article : a))
      );
      showNotification(
        res.article.status === 'Published'
          ? 'Article published successfully.'
          : 'Article unpublished and saved as draft.'
      );
    } catch (err: any) {
      showNotification(err.message || 'Failed to update article status.', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteArticle = async () => {
    if (!articleToDelete) return;

    try {
      setIsDeleting(true);
      await api.deleteArticle(articleToDelete.id);
      setArticles((prev) => prev.filter((a) => a.id !== articleToDelete.id));
      showNotification('Article deleted successfully.');
      setArticleToDelete(null);
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete article.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Uncategorized';
    const found = categories.find((c) => c.id === categoryId);
    return found ? found.name : 'Uncategorized';
  };

  return (
    <AdminLayout
      title="Articles"
      subtitle="Create, edit, manage, and publish articles across the platform."
      actions={
        <button
          type="button"
          onClick={() => navigate('/admin/articles/new')}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-md shadow-red-900/30 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Article</span>
        </button>
      }
    >
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-900">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Articles
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Create, edit, manage, and publish articles across the platform.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/articles/new')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow-md shadow-red-900/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Article</span>
        </button>
      </div>
      {/* Toast Notification */}
      {notification && (
        <div
          className={`mb-6 p-4 rounded-xl border flex items-center justify-between text-sm animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-red-950/40 border-red-800 text-red-300'
          }`}
        >
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-xs uppercase font-mono tracking-wider opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="mb-6 p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1.5 border border-zinc-800 rounded-lg text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-zinc-900 text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1.5 border border-zinc-800 rounded-lg text-xs">
            <span className="text-zinc-500 font-mono">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Published" className="bg-zinc-900 text-white">
                Published
              </option>
              <option value="Draft" className="bg-zinc-900 text-white">
                Draft
              </option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1.5 border border-zinc-800 rounded-lg text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="bg-transparent text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-zinc-900 text-white">
                Newest First
              </option>
              <option value="oldest" className="bg-zinc-900 text-white">
                Oldest First
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Articles Content / Table */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-500">
            <Loader2 className="w-7 h-7 text-red-500 animate-spin mb-2" />
            <span className="text-xs font-mono uppercase tracking-wider">Loading articles...</span>
          </div>
        ) : articles.length === 0 ? (
          <div className="py-20 px-4 text-center">
            <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-zinc-300">No articles yet.</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              {search || selectedCategory || selectedStatus
                ? 'No articles match your active filter criteria.'
                : 'Your database has no articles yet.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/admin/articles/new')}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-md shadow-red-900/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Article</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Article</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {articles.map((article) => {
                  const isToggling = togglingId === article.id;
                  return (
                    <tr
                      key={article.id}
                      className="hover:bg-zinc-800/30 transition-colors group"
                    >
                      {/* Thumbnail & Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {article.featuredImage ? (
                            <img
                              src={article.featuredImage}
                              alt={article.title}
                              className="w-12 h-12 rounded-lg object-cover border border-zinc-800 flex-shrink-0 bg-zinc-950"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 text-zinc-500">
                              <FileText className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-semibold text-white truncate max-w-xs md:max-w-md">
                              {article.title}
                            </h4>
                            <p className="text-[11px] font-mono text-zinc-500 truncate mt-0.5">
                              /{article.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                          {getCategoryName(article.categoryId)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(article)}
                          disabled={isToggling}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold transition-all border ${
                            article.status === 'Published'
                              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60 hover:bg-emerald-900/60'
                              : 'bg-amber-950/80 text-amber-400 border-amber-800/60 hover:bg-amber-900/60'
                          }`}
                          title="Click to toggle publish status"
                        >
                          {isToggling ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : article.status === 'Published' ? (
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-amber-400" />
                          )}
                          <span>{article.status}</span>
                        </button>
                      </td>

                      {/* Author */}
                      <td className="py-3 px-4 text-zinc-400 text-xs truncate">
                        {article.author || 'Mental Tactic'}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-zinc-400 text-xs font-mono whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* Publish / Unpublish Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(article)}
                            disabled={isToggling}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 cursor-pointer border ${
                              article.status === 'Published'
                                ? 'bg-zinc-800 hover:bg-zinc-700 text-amber-300 border-zinc-700'
                                : 'bg-red-950/60 hover:bg-red-900/80 text-red-200 border-red-800/80'
                            }`}
                            title={article.status === 'Published' ? 'Unpublish article' : 'Publish article'}
                          >
                            {isToggling ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : article.status === 'Published' ? (
                              <XCircle className="w-3 h-3 text-amber-400" />
                            ) : (
                              <CheckCircle className="w-3 h-3 text-red-400" />
                            )}
                            <span>{article.status === 'Published' ? 'Unpublish' : 'Publish'}</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/articles/${article.id}/edit`)}
                            title="Edit article"
                            className="px-2 py-1 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors flex items-center gap-1 cursor-pointer border border-zinc-700"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {/* View on site (if published) */}
                          {article.status === 'Published' && (
                            <button
                              type="button"
                              onClick={() => window.open(`/articles/${article.slug}`, '_blank')}
                              title="View published article on site"
                              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setArticleToDelete(article)}
                            title="Delete article"
                            className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-950/50 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!articleToDelete}
        title="Delete Article"
        message="Are you sure you want to delete this article?"
        confirmText="Delete Article"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteArticle}
        onCancel={() => setArticleToDelete(null)}
      />
    </AdminLayout>
  );
};
