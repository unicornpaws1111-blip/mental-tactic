import React, { useState, useEffect } from 'react';
import {
  Upload,
  Search,
  Trash2,
  Copy,
  Check,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { MediaItem } from '../../types';
import { api } from '../../services/api';

export const AdminMedia: React.FC = () => {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Deletion state
  const [mediaToDelete, setMediaToDelete] = useState<MediaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [inUseWarning, setInUseWarning] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadMedia = async () => {
    try {
      setLoading(true);
      const res = await api.getMedia(search.trim() || undefined);
      setMediaList(res.media);
    } catch (err: any) {
      showToast(err.message || 'Failed to load media files.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [search]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowed.includes(file.type.toLowerCase())) {
      showToast('Invalid format. Please upload JPG, PNG, or WEBP images only.', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('File size exceeds the 10MB limit.', 'error');
      return;
    }

    try {
      setUploading(true);
      const res = await api.uploadMedia(file);
      setMediaList((prev) => [res.media, ...prev]);
      showToast('Image uploaded successfully.');
    } catch (err: any) {
      showToast(err.message || 'Image upload failed.', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleCopyUrl = (item: MediaItem) => {
    navigator.clipboard.writeText(window.location.origin + item.url);
    setCopiedId(item.id);
    showToast('Image URL copied to clipboard.');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const initiateDelete = (item: MediaItem) => {
    setInUseWarning(null);
    setMediaToDelete(item);
  };

  const handleDelete = async (force = false) => {
    if (!mediaToDelete) return;

    try {
      setIsDeleting(true);
      await api.deleteMedia(mediaToDelete.id, force);
      setMediaList((prev) => prev.filter((m) => m.id !== mediaToDelete.id));
      showToast('Media file deleted successfully.');
      setMediaToDelete(null);
      setInUseWarning(null);
    } catch (err: any) {
      if (err.details?.error === 'IN_USE') {
        setInUseWarning(err.details.message);
      } else {
        showToast(err.message || 'Unable to delete image.', 'error');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
    return (bytes / 1024).toFixed(0) + ' KB';
  };

  return (
    <AdminLayout
      title="Media Library"
      subtitle="Manage, upload, and inspect images used across the Mental Tactic platform."
      actions={
        <label className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-md shadow-red-900/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50">
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </label>
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

      {/* Search Bar */}
      <div className="mb-6 p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-xl flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search media by filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* Media Grid */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 shadow-xl min-h-[400px]">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-zinc-500">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-3" />
            <p className="text-xs font-mono uppercase tracking-wider">Loading Media Library...</p>
          </div>
        ) : mediaList.length === 0 ? (
          <div className="py-24 text-center">
            <ImageIcon className="w-14 h-14 text-zinc-700 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-zinc-300">No media uploaded yet</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              {search
                ? 'No media matches your search term.'
                : 'Upload article headers, tactical diagrams, and product imagery (JPG, PNG, WEBP up to 10MB).'}
            </p>
            <label className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-md shadow-red-900/30 transition-all cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Upload Image</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mediaList.map((item) => (
              <div
                key={item.id}
                className="bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden group hover:border-zinc-700 transition-all flex flex-col"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-zinc-900 overflow-hidden">
                  <img
                    src={item.url}
                    alt={item.originalName}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(item)}
                      title="Copy URL"
                      className="p-1.5 bg-black/80 hover:bg-black text-white rounded-md backdrop-blur-xs transition-colors"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => initiateDelete(item)}
                      title="Delete Image"
                      className="p-1.5 bg-black/80 hover:bg-red-950 text-zinc-400 hover:text-red-400 rounded-md backdrop-blur-xs transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate" title={item.originalName}>
                      {item.originalName}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                      <span>{item.mimeType.replace('image/', '').toUpperCase()}</span>
                      <span>{formatFileSize(item.size)}</span>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500">
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    <button
                      onClick={() => handleCopyUrl(item)}
                      className="text-red-500 hover:text-red-400 font-medium flex items-center gap-1"
                    >
                      {copiedId === item.id ? 'Copied' : 'Copy link'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete / In-Use Modal */}
      <ConfirmModal
        isOpen={!!mediaToDelete}
        title={inUseWarning ? 'Warning: Image Is In Active Use' : 'Delete Media File'}
        message={
          inUseWarning
            ? `${inUseWarning}\n\nAre you sure you want to FORCE delete this image? This will permanently remove the file from storage and cause broken image links.`
            : `Are you sure you want to permanently delete "${mediaToDelete?.originalName}"?\n\nThis action cannot be undone.`
        }
        confirmText={inUseWarning ? 'Force Delete' : 'Delete File'}
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={() => handleDelete(!!inUseWarning)}
        onCancel={() => {
          setMediaToDelete(null);
          setInUseWarning(null);
        }}
      />
    </AdminLayout>
  );
};
