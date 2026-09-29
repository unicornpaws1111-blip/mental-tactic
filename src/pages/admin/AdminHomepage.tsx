import React, { useState, useEffect } from 'react';
import {
  Home,
  Save,
  CheckCircle,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  Upload,
  Trash2,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { HomepageSettings } from '../../types';
import { api } from '../../services/api';

export const AdminHomepage: React.FC = () => {
  const [homepage, setHomepage] = useState<HomepageSettings>({
    headline: '',
    tagline: '',
    introText: '',
    heroImage: '',
    ctaText: '',
    ctaUrl: '',
    articlesTitle: '',
    storeTitle: '',
    donationsTitle: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getHomepageSettings();
      setHomepage(res.homepage);
    } catch (err: any) {
      setError(err.message || 'Failed to load homepage settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setSaving(true);
      const res = await api.updateHomepageSettings(homepage);
      setHomepage(res.homepage);
      setSuccess('Homepage configuration updated successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to update homepage settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Homepage Content"
      subtitle="Customize headline, hero messaging, and featured sections displayed to public visitors."
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {error && (
          <div className="p-4 bg-red-950/40 border border-red-800 rounded-xl flex items-start gap-3 text-sm text-red-300">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-800 rounded-xl flex items-start gap-3 text-sm text-emerald-300">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-zinc-500">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-3" />
            <p className="text-xs font-mono uppercase tracking-wider">Loading Homepage Settings...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Hero Section */}
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-6 space-y-5">
              <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-4">
                <Home className="w-5 h-5 text-red-500" />
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                    Hero Section
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Primary headline, tagline, and call to action shown above the fold.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Main Headline
                </label>
                <input
                  type="text"
                  value={homepage.headline}
                  onChange={(e) => setHomepage({ ...homepage, headline: e.target.value })}
                  placeholder="e.g. Master the Psychological Advantage"
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Tagline / Subheading
                </label>
                <input
                  type="text"
                  value={homepage.tagline}
                  onChange={(e) => setHomepage({ ...homepage, tagline: e.target.value })}
                  placeholder="e.g. Strategic cognition, mental discipline, and tactical resilience."
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Introduction Text
                </label>
                <textarea
                  rows={4}
                  value={homepage.introText}
                  onChange={(e) => setHomepage({ ...homepage, introText: e.target.value })}
                  placeholder="Detailed introductory message welcoming visitors..."
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Hero Image */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Hero Image
                  </label>
                  {homepage.heroImage && (
                    <button
                      type="button"
                      onClick={() => setHomepage({ ...homepage, heroImage: '' })}
                      className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {homepage.heroImage && (
                    <img
                      src={homepage.heroImage}
                      alt="Hero preview"
                      className="w-20 h-14 rounded-lg object-cover border border-zinc-800 flex-shrink-0"
                    />
                  )}
                  <input
                    type="text"
                    value={homepage.heroImage}
                    onChange={(e) => setHomepage({ ...homepage, heroImage: e.target.value })}
                    placeholder="/uploads/... or external image URL"
                    className="flex-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setIsMediaModalOpen(true)}
                    className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Select Image
                  </button>
                </div>
              </div>

              {/* Call to action */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Call-to-Action Button Text
                  </label>
                  <input
                    type="text"
                    value={homepage.ctaText}
                    onChange={(e) => setHomepage({ ...homepage, ctaText: e.target.value })}
                    placeholder="e.g. Read Field Articles"
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Call-to-Action Link URL
                  </label>
                  <input
                    type="text"
                    value={homepage.ctaUrl}
                    onChange={(e) => setHomepage({ ...homepage, ctaUrl: e.target.value })}
                    placeholder="/articles"
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Section Titles Customization */}
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-6 space-y-5">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-zinc-800 pb-3">
                Section Titles on Homepage
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Articles Section Title
                  </label>
                  <input
                    type="text"
                    value={homepage.articlesTitle}
                    onChange={(e) => setHomepage({ ...homepage, articlesTitle: e.target.value })}
                    placeholder="Default: Tactical Intelligence"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Store Section Title
                  </label>
                  <input
                    type="text"
                    value={homepage.storeTitle}
                    onChange={(e) => setHomepage({ ...homepage, storeTitle: e.target.value })}
                    placeholder="Default: Tactical Gear & Books"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Donations Section Title
                  </label>
                  <input
                    type="text"
                    value={homepage.donationsTitle}
                    onChange={(e) => setHomepage({ ...homepage, donationsTitle: e.target.value })}
                    placeholder="Default: Support the Movement"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-md shadow-red-900/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Homepage Settings</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Media Picker */}
      <MediaPickerModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={(url) => setHomepage({ ...homepage, heroImage: url })}
        title="Select Homepage Hero Image"
      />
    </AdminLayout>
  );
};
