import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Loader2,
  AlertCircle,
  X,
  Upload,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { Product } from '../../types';
import { api } from '../../services/api';

export const AdminStore: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('0');
  const [formCurrency, setFormCurrency] = useState('USD');
  const [formImage, setFormImage] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formStatus, setFormStatus] = useState<'Draft' | 'Published'>('Draft');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Media picker
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Deletion modal
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await api.getProducts();
      setProducts(res.products);
    } catch (err: any) {
      showToast(err.message || 'Failed to load store products.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormDescription('');
    setFormPrice('0');
    setFormCurrency('USD');
    setFormImage('');
    setFormUrl('');
    setFormStatus('Draft');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormDescription(p.description);
    setFormPrice(p.price.toString());
    setFormCurrency(p.currency);
    setFormImage(p.image || '');
    setFormUrl(p.url || '');
    setFormStatus(p.status);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('Product name is required.');
      return;
    }

    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('Please enter a valid price (greater than or equal to 0).');
      return;
    }

    try {
      setFormSubmitting(true);
      const payload: Partial<Product> = {
        name: formName.trim(),
        description: formDescription.trim(),
        price: priceNum,
        currency: formCurrency.trim().toUpperCase(),
        image: formImage,
        url: formUrl.trim(),
        status: formStatus,
      };

      if (editingProduct) {
        const res = await api.updateProduct(editingProduct.id, payload);
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? res.product : p))
        );
        showToast('Product updated successfully.');
      } else {
        const res = await api.createProduct(payload);
        setProducts((prev) => [res.product, ...prev]);
        showToast('Product created successfully.');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    const nextStatus = product.status === 'Published' ? 'Draft' : 'Published';
    try {
      const res = await api.updateProduct(product.id, { status: nextStatus });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? res.product : p))
      );
      showToast(
        nextStatus === 'Published'
          ? 'Product published to store.'
          : 'Product hidden as draft.'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle product status.', 'error');
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      setIsDeleting(true);
      await api.deleteProduct(productToDelete.id);
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      showToast('Product deleted successfully.');
      setProductToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Unable to delete product.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AdminLayout
      title="Store Management"
      subtitle="Manage tactical gear, books, equipment, and merchandise."
      actions={
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-md shadow-red-900/30 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
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

      {/* Products Table */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-500">
            <Loader2 className="w-7 h-7 text-red-500 animate-spin mb-2" />
            <span className="text-xs font-mono uppercase tracking-wider">Loading products...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 px-4 text-center">
            <ShoppingBag className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-zinc-300">No products yet</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Add your first store product, tactical manual, or branded merchandise.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-md shadow-red-900/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/60 text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">URL</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-12 h-12 rounded-lg object-cover border border-zinc-800 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 text-zinc-400">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-semibold text-white truncate max-w-xs">{p.name}</h4>
                          <p className="text-xs text-zinc-500 truncate max-w-xs">
                            {p.description || 'No description provided'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-white">
                      {p.price.toFixed(2)} {p.currency}
                    </td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(p)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${
                          p.status === 'Published'
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
                            : 'bg-amber-950/80 text-amber-400 border-amber-800/60'
                        }`}
                        title="Click to toggle status"
                      >
                        {p.status === 'Published' ? (
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3 h-3 text-amber-400" />
                        )}
                        <span>{p.status}</span>
                      </button>
                    </td>

                    <td className="py-3 px-4 text-xs text-zinc-400 max-w-xs truncate font-mono">
                      {p.url ? (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-red-400 hover:underline flex items-center gap-1"
                        >
                          <span className="truncate">{p.url}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(p)}
                          title="Edit Product"
                          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setProductToDelete(p)}
                          title="Delete Product"
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white tracking-wide">
                {editingProduct ? 'Edit Product' : 'Add Store Product'}
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

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Tactical Mindset Field Manual"
                  required
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Product specs, features, or tactical description..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Currency
                  </label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="AUD">AUD ($)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Product Image
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    placeholder="/uploads/... or image link"
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

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Product Purchase / Checkout URL
                </label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://store.example.com/checkout/..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Publish Status
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFormStatus('Draft')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border ${
                      formStatus === 'Draft'
                        ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                        : 'bg-zinc-950 text-zinc-500 border-zinc-800'
                    }`}
                  >
                    Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormStatus('Published')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border ${
                      formStatus === 'Published'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                        : 'bg-zinc-950 text-zinc-500 border-zinc-800'
                    }`}
                  >
                    Published
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
                  <span>{editingProduct ? 'Update Product' : 'Add Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Picker */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={(url) => setFormImage(url)}
        title="Select Product Image"
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!productToDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${productToDelete?.name}"?\n\nThis will remove it from the store permanently.`}
        confirmText="Delete Product"
        isLoading={isDeleting}
        onConfirm={handleDeleteProduct}
        onCancel={() => setProductToDelete(null)}
      />
    </AdminLayout>
  );
};
