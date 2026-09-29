import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  FileText,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { Category, Article } from '../../types';
import { api } from '../../services/api';

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Media picker for category image
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Delete modal state
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [catsRes, artsRes] = await Promise.all([
        api.getCategories(),
        api.getArticles({ admin: true }),
      ]);
      setCategories(catsRes.categories);
      setArticles(artsRes.articles);
    } catch (err: any) {
      showToast(err.message || 'Failed to load categories.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setFormImage('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormSlug(category.slug);
    setFormDescription(category.description || '');
    setFormImage(category.image || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSlugify = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingCategory) {
      setFormSlug(handleSlugify(val));
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('Category name is required.');
      return;
    }

    const slug = formSlug.trim() || handleSlugify(formName);
    if (!slug) {
      setFormError('A valid slug is required.');
      return;
    }

    try {
      setFormSubmitting(true);
      if (editingCategory) {
        const res = await api.updateCategory(editingCategory.id, {
          name: formName.trim(),
          slug,
          description: formDescription.trim(),
          image: formImage,
        });
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? res.category : c))
        );
        showToast('Category updated successfully.');
      } else {
        const res = await api.createCategory({
          name: formName.trim(),
          slug,
          description: formDescription.trim(),
          image: formImage,
        });
        setCategories((prev) => [...prev, res.category]);
        showToast('Category created successfully.');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save category.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const confirmDeleteCategory = (cat: Category) => {
    setDeleteError('');
    // Check if category is used
    const usingArticles = articles.filter((a) => a.categoryId === cat.id);
    if (usingArticles.length > 0) {
      setDeleteError(
        `Unable to delete this category because it is currently assigned to ${usingArticles.length} article(s). Please reassign those articles before deleting.`
      );
    }
    setCategoryToDelete(cat);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      setIsDeleting(true);
      await api.deleteCategory(categoryToDelete.id);
      setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id));
      showToast('Category deleted successfully.');
      setCategoryToDelete(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Unable to delete this category.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getArticleCount = (categoryId: string) => {
    return articles.filter((a) => a.categoryId === categoryId).length;
  };

  return (
    <AdminLayout
      title="Categories"
      subtitle="Organize articles under distinct tactical categories."
      actions={
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-md shadow-red-900/30 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      }
    >
      {/* Toast Notification */}
      {toast && (
        <div
          className={`mb-6 p-4 rounded-xl border flex items-center justify-between text-sm animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-red-950/40 border-red-800 text-red-300'
          }`}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-xs uppercase font-mono tracking-wider opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Categories Table / List */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-500">
            <Loader2 className="w-7 h-7 text-red-500 animate-spin mb-2" />
            <span className="text-xs font-mono uppercase tracking-wider">Loading categories...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="py-20 px-4 text-center">
            <FolderTree className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-zinc-300">No categories yet</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Create categories such as "Cognitive Warfare", "Mental Resilience", or "Tactical Operations".
            </p>
            <button
              onClick={openCreateModal}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-md shadow-red-900/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Articles</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {categories.map((cat) => {
                  const count = getArticleCount(cat.id);
                  return (
                    <tr key={cat.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {cat.image ? (
                            <img
                              src={cat.image}
                              alt={cat.name}
                              className="w-10 h-10 rounded-lg object-cover border border-zinc-800 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 text-zinc-400">
                              <FolderTree className="w-4 h-4" />
                            </div>
                          )}
                          <span className="font-semibold text-white">{cat.name}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-xs text-zinc-400">
                        /{cat.slug}
                      </td>

                      <td className="py-3 px-4 text-xs text-zinc-400 max-w-sm truncate">
                        {cat.description || '—'}
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs bg-zinc-800 font-mono text-zinc-300 border border-zinc-700/60">
                          <FileText className="w-3 h-3 text-red-500" />
                          <span>{count}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(cat)}
                            title="Edit Category"
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => confirmDeleteCategory(cat)}
                            title="Delete Category"
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors"
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

      {/* Create / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white tracking-wide">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-red-950/40 border border-red-800 rounded-lg text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Cognitive Dominance"
                  required
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Category Slug *
                </label>
                <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs">
                  <span className="font-mono text-zinc-600">/</span>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="cognitive-dominance"
                    required
                    className="flex-1 bg-transparent text-white font-mono focus:outline-none pl-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief description of this category topic..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Optional Category Image
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    placeholder="/uploads/... or URL"
                    className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIsMediaPickerOpen(true)}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Select
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md shadow-red-900/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {formSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Picker for Category Image */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(url) => setFormImage(url)}
        title="Select Category Thumbnail"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!categoryToDelete}
        title="Delete Category"
        message={
          deleteError
            ? deleteError
            : `Are you sure you want to delete the category "${categoryToDelete?.name}"?`
        }
        confirmText="Delete Category"
        isLoading={isDeleting}
        onConfirm={handleDeleteCategory}
        onCancel={() => {
          setCategoryToDelete(null);
          setDeleteError('');
        }}
      />
    </AdminLayout>
  );
};
