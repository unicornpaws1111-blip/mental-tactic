import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  FileClock,
  FolderTree,
  Plus,
  ArrowRight,
  Loader2,
  Calendar,
  Eye,
  Edit,
  ExternalLink,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DashboardStats } from '../../types';
import { api } from '../../services/api';
import { useRouter } from '../../context/RouterContext';

export const AdminDashboard: React.FC = () => {
  const { navigate } = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <AdminLayout
      title="System Overview"
      subtitle="Real-time status of Mental Tactic content, media, and records."
      actions={
        <button
          onClick={() => navigate('/admin/articles/new')}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-md shadow-red-900/30 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Article</span>
        </button>
      }
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-3" />
          <p className="text-xs font-mono uppercase tracking-wider">Loading Database Metrics...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-950/30 border border-red-800 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      ) : stats ? (
        <div className="space-y-8">
          {/* Real Metrics Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Articles */}
            <div className="p-5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl relative overflow-hidden group hover:border-zinc-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                  Total Articles
                </span>
                <div className="p-2 rounded-lg bg-zinc-800/80 text-zinc-300 group-hover:text-white transition-colors">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-white tracking-tight">
                  {stats.totalArticles}
                </span>
                <span className="text-xs text-zinc-500">records</span>
              </div>
            </div>

            {/* Published Articles */}
            <div className="p-5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl relative overflow-hidden group hover:border-red-900/60 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                  Published Articles
                </span>
                <div className="p-2 rounded-lg bg-red-950/40 text-red-400 border border-red-800/40">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-white tracking-tight">
                  {stats.publishedArticles}
                </span>
                <span className="text-xs text-emerald-500 font-medium">live public</span>
              </div>
            </div>

            {/* Draft Articles */}
            <div className="p-5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl relative overflow-hidden group hover:border-zinc-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                  Draft Articles
                </span>
                <div className="p-2 rounded-lg bg-amber-950/30 text-amber-400 border border-amber-800/30">
                  <FileClock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-white tracking-tight">
                  {stats.draftArticles}
                </span>
                <span className="text-xs text-zinc-500">unpublished</span>
              </div>
            </div>

            {/* Categories */}
            <div className="p-5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl relative overflow-hidden group hover:border-zinc-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                  Categories
                </span>
                <div className="p-2 rounded-lg bg-zinc-800/80 text-zinc-300">
                  <FolderTree className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono text-white tracking-tight">
                  {stats.categories}
                </span>
                <span className="text-xs text-zinc-500">defined</span>
              </div>
            </div>
          </div>

          {/* Quick Management Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/admin/articles/new')}
              className="p-4 bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 hover:border-red-900/50 rounded-xl flex items-center justify-between text-left transition-all group"
            >
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors">
                  Create New Article
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Draft or publish strategic insights
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => navigate('/admin/categories')}
              className="p-4 bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 hover:border-red-900/50 rounded-xl flex items-center justify-between text-left transition-all group"
            >
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors">
                  Organize Categories
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Set topics & taxonomy
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => navigate('/admin/homepage')}
              className="p-4 bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800 hover:border-red-900/50 rounded-xl flex items-center justify-between text-left transition-all group"
            >
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors">
                  Edit Homepage
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Headlines, hero & call to action
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
            </button>
          </div>

          {/* Recent Articles Section */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Recent Articles
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Latest entries stored in persistent database
                </p>
              </div>
              {stats.totalArticles > 0 && (
                <button
                  onClick={() => navigate('/admin/articles')}
                  className="text-xs text-red-500 hover:text-red-400 font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>View All ({stats.totalArticles})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {stats.recentArticles.length === 0 ? (
              <div className="text-center py-16 px-4">
                <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-zinc-300">No articles yet</h4>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  The database currently has no articles. Create your first tactical article to populate the platform.
                </p>
                <button
                  onClick={() => navigate('/admin/articles/new')}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-md shadow-red-900/30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Article</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/60">
                {stats.recentArticles.map((article) => (
                  <div
                    key={article.id}
                    className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-zinc-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {article.featuredImage ? (
                        <img
                          src={article.featuredImage}
                          alt={article.title}
                          className="w-12 h-12 rounded-lg object-cover border border-zinc-800 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center flex-shrink-0 text-zinc-500">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                              article.status === 'Published'
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                                : 'bg-amber-950/80 text-amber-400 border border-amber-800/50'
                            }`}
                          >
                            {article.status}
                          </span>
                          <span className="text-[11px] text-zinc-500 flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3" />
                            {new Date(article.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-white truncate mt-1">
                          {article.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {article.status === 'Published' && (
                        <button
                          onClick={() => window.open(`/articles/${article.slug}`, '_blank')}
                          title="View on public site"
                          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/admin/articles/${article.id}/edit`)}
                        title="Edit article"
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
};
