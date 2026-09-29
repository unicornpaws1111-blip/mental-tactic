import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Save,
  CheckCircle,
  Upload,
  Trash2,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Calendar,
  Globe,
  Tag,
  User,
  X,
  FileImage,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { RichTextEditor } from '../../components/admin/RichTextEditor';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { Article, Category } from '../../types';
import { api } from '../../services/api';
import { useRouter } from '../../context/RouterContext';

interface AdminArticleEditorProps {
  articleId?: string;
}

export const AdminArticleEditor: React.FC<AdminArticleEditorProps> = ({ articleId }) => {
  const { navigate } = useRouter();
  const isEditing = !!articleId;

  // Form states (10 required fields)
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [customSlugModified, setCustomSlugModified] = useState(false);
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [author, setAuthor] = useState('');
  const [publicationDate, setPublicationDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<'Draft' | 'Published'>('Draft');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // Categories list
  const [categories, setCategories] = useState<Category[]>([]);

  // State management
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Image Upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-generate slug from title
  const generateSlug = (val: string) => {
    return val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!customSlugModified && !isEditing) {
      setSlug(generateSlug(val));
    }
  };

  // Load article & categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catsRes] = await Promise.all([api.getCategories()]);
        setCategories(catsRes.categories);

        if (isEditing && articleId) {
          const res = await api.getArticle(articleId);
          const a = res.article;
          setTitle(a.title);
          setSlug(a.slug);
          setDescription(a.description || '');
          setContent(a.content || '');
          setFeaturedImage(a.featuredImage || '');
          setCategoryId(a.categoryId || '');
          setAuthor(a.author || '');
          const normalizedStatus = (a.status || 'Draft').toLowerCase() === 'published' ? 'Published' : 'Draft';
          setStatus(normalizedStatus);
          setSeoTitle(a.seoTitle || a.title);
          setSeoDescription(a.seoDescription || a.description || '');
          if (a.publishedAt) {
            setPublicationDate(a.publishedAt.split('T')[0]);
          }
          setCustomSlugModified(true);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load article data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [articleId, isEditing]);

  // Real file upload handler for featured image
  const handleFileUpload = async (file: File) => {
    setImageError('');
    if (!file) return;

    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const validExts = ['jpg', 'jpeg', 'png', 'webp'];

    if (!validMimes.includes(file.type.toLowerCase()) && !validExts.includes(ext)) {
      setImageError('Invalid format. Supported formats: JPG, JPEG, PNG, WEBP.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setImageError('File size exceeds the 10MB limit.');
      return;
    }

    try {
      setUploadingImage(true);
      const res = await api.uploadMedia(file);
      setFeaturedImage(res.media.url);
    } catch (err: any) {
      setImageError(err.message || 'Image upload failed. Please try again.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSave = async (targetStatus: 'Draft' | 'Published') => {
    setError('');
    setSuccessMsg('');

    if (!title.trim()) {
      setError('Article title is required.');
      return;
    }

    const finalSlug = slug.trim() || generateSlug(title);
    if (!finalSlug) {
      setError('A valid slug is required.');
      return;
    }

    try {
      setSaving(true);

      const payload: Partial<Article> = {
        title: title.trim(),
        slug: finalSlug,
        description: description.trim(),
        content,
        featuredImage,
        categoryId: categoryId || undefined,
        author: author.trim(),
        status: targetStatus,
        publishedAt: targetStatus === 'Published' ? new Date(publicationDate).toISOString() : undefined,
        seoTitle: (seoTitle || title).trim(),
        seoDescription: (seoDescription || description).trim(),
      };

      if (isEditing && articleId) {
        await api.updateArticle(articleId, payload);
        setStatus(targetStatus);
        setSuccessMsg(
          targetStatus === 'Published'
            ? 'Article published successfully.'
            : 'Article saved successfully.'
        );
      } else {
        await api.createArticle(payload);
        setStatus(targetStatus);
        setSuccessMsg(
          targetStatus === 'Published'
            ? 'Article published successfully.'
            : 'Article saved successfully.'
        );
      }

      // After saving an article, return to /admin/articles
      setTimeout(() => {
        navigate('/admin/articles');
      }, 750);
    } catch (err: any) {
      setError(err.message || 'Unable to save article. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title={isEditing ? 'Edit Article' : 'New Article'}
      subtitle={
        isEditing
          ? `Editing: ${title || 'Untitled Article'}`
          : 'Compose high-impact strategic content with full control over SEO, media, and taxonomy.'
      }
      actions={
        <div className="flex items-center gap-2">
          {/* CANCEL Button */}
          <button
            type="button"
            onClick={() => navigate('/admin/articles')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>

          {/* SAVE DRAFT Button */}
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('Draft')}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-200 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 rounded-lg transition-all disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Draft</span>
          </button>

          {/* PUBLISH ARTICLE Button */}
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave('Published')}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-900/30 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            <span>Publish Article</span>
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-zinc-500">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-3" />
          <p className="text-xs font-mono uppercase tracking-wider">Loading Article Editor...</p>
        </div>
      ) : (
        <div className="space-y-6 max-w-6xl mx-auto">
          {/* Notifications */}
          {error && (
            <div className="p-4 bg-red-950/40 border border-red-800 rounded-xl flex items-start gap-3 text-sm text-red-300">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError('')} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {successMsg && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-800 rounded-xl flex items-start gap-3 text-sm text-emerald-300">
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span className="flex-1 font-medium">{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Title, Slug, Description, Content, SEO */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title & Slug Card */}
              <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                    1. Article Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Cognitive Dominance Under Pressure"
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-lg font-semibold placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>2. URL Slug *</span>
                    <span className="text-[10px] text-zinc-500 font-normal">Auto-generated or custom</span>
                  </label>
                  <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-400">
                    <span className="font-mono text-zinc-600 text-xs">/articles/</span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value);
                        setCustomSlugModified(true);
                      }}
                      placeholder="cognitive-dominance-under-pressure"
                      className="flex-1 bg-transparent text-white font-mono text-xs focus:outline-none pl-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                    3. Short Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief tactical overview summarizing this piece..."
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Rich Content Editor Card */}
              <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    7. Article Content (Rich-Text Editor)
                  </label>
                  <span className="text-[11px] text-zinc-500 font-mono">Headings, Lists, Quotes, Media, Links</span>
                </div>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Structure your tactical ideas here with headings, quotes, lists, and media..."
                />
              </div>

              {/* SEO Settings Card */}
              <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                  <Globe className="w-4 h-4 text-red-500" />
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                    SEO & Search Metadata
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    8. SEO Title
                  </label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder={title || 'Leave blank to use article title'}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    9. SEO Description
                  </label>
                  <textarea
                    rows={2}
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    placeholder={description || 'Leave blank to use short description'}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Right 1 Col: Featured Image, Category, Author, Status */}
            <div className="space-y-6">
              {/* Featured Image Card with REAL upload */}
              <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileImage className="w-3.5 h-3.5 text-red-500" />
                    <span>4. Featured Image</span>
                  </h3>
                  {featuredImage && (
                    <button
                      type="button"
                      onClick={() => setFeaturedImage('')}
                      className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {imageError && (
                  <div className="p-2.5 bg-red-950/40 border border-red-800/80 rounded-lg text-xs text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    <span>{imageError}</span>
                  </div>
                )}

                {featuredImage ? (
                  <div className="space-y-3">
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
                      <img
                        src={featuredImage}
                        alt="Featured Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload New</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsMediaModalOpen(true)}
                        className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Media Library</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                      isDragOver
                        ? 'border-red-500 bg-red-950/20'
                        : 'border-zinc-800 hover:border-red-600/60 bg-zinc-950/40 hover:bg-zinc-950'
                    }`}
                  >
                    {uploadingImage ? (
                      <div className="py-4">
                        <Loader2 className="w-7 h-7 text-red-500 animate-spin mx-auto mb-2" />
                        <p className="text-xs text-zinc-300 font-medium">Uploading & storing image...</p>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-zinc-300">
                          Upload Featured Image
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-1">
                          Drag & drop or click below (JPG, PNG, WEBP)
                        </p>
                        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full sm:w-auto px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload File</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsMediaModalOpen(true)}
                            className="w-full sm:w-auto px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>From Library</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Hidden Real File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="hidden"
                />

                {/* Direct Image URL fallback */}
                <div className="pt-2 border-t border-zinc-800/60">
                  <label className="block text-[11px] text-zinc-500 mb-1">
                    Or direct image URL:
                  </label>
                  <input
                    type="text"
                    value={featuredImage}
                    onChange={(e) => setFeaturedImage(e.target.value)}
                    placeholder="https://... or /uploads/..."
                    className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              {/* Taxonomy & Metadata Card */}
              <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider border-b border-zinc-800 pb-3">
                  Article Metadata
                </h3>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-zinc-500" />
                    <span>5. Category</span>
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer"
                  >
                    <option value="">No Category (Uncategorized)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Author */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-zinc-500" />
                    <span>6. Author</span>
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Enter author name..."
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Publication Date */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Publication Date</span>
                  </label>
                  <input
                    type="date"
                    value={publicationDate}
                    onChange={(e) => setPublicationDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              {/* Status & Actions Card */}
              <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider border-b border-zinc-800 pb-3">
                  10. Status & Publishing
                </h3>

                <div className="space-y-2">
                  <label className="block text-xs text-zinc-400">Current Status</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus('Draft')}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        status === 'Draft'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-700/60 shadow-sm'
                          : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                      }`}
                    >
                      Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('Published')}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        status === 'Published'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 shadow-sm'
                          : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                      }`}
                    >
                      Published
                    </button>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSave('Published')}
                    className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs uppercase tracking-wider rounded-lg shadow-md shadow-red-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    <span>PUBLISH ARTICLE</span>
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSave('Draft')}
                    className="w-full py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-semibold text-xs uppercase tracking-wider rounded-lg border border-zinc-700/80 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>SAVE DRAFT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/admin/articles')}
                    className="w-full py-2 px-4 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs font-medium uppercase tracking-wider rounded-lg border border-zinc-800 transition-colors text-center cursor-pointer"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="lg:col-span-3 pt-6 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-4 bg-zinc-900/40 p-4 rounded-xl">
              <button
                type="button"
                onClick={() => navigate('/admin/articles')}
                className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold uppercase tracking-wider rounded-lg border border-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave('Draft')}
                  className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-semibold text-xs uppercase tracking-wider rounded-lg border border-zinc-700 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Draft</span>
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave('Published')}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs uppercase tracking-wider rounded-lg shadow-md shadow-red-900/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  <span>Publish Article</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={(url) => setFeaturedImage(url)}
        title="Choose Featured Image"
      />
    </AdminLayout>
  );
};
