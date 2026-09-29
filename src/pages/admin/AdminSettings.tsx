import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle,
  Loader2,
  AlertCircle,
  Lock,
  Globe,
  Share2,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { WebsiteSettings } from '../../types';
import { api } from '../../services/api';

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<WebsiteSettings>({
    websiteName: '',
    websiteDescription: '',
    logo: '',
    favicon: '',
    defaultSeoTitle: '',
    defaultSeoDescription: '',
    contactEmail: '',
    socialLinks: {
      x: '',
      instagram: '',
      youtube: '',
      discord: '',
      telegram: '',
    },
  });

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Media picker
  const [isLogoPickerOpen, setIsLogoPickerOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getWebsiteSettings();
      setSettings(res.settings);
    } catch (err: any) {
      setSettingsError(err.message || 'Failed to load website settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');

    try {
      setSavingSettings(true);
      const res = await api.updateWebsiteSettings(settings);
      setSettings(res.settings);
      setSettingsSuccess('Website configuration updated successfully.');
    } catch (err: any) {
      setSettingsError(err.message || 'Failed to update website settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword) {
      setPasswordError('Please fill out all password fields.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password confirmation does not match.');
      return;
    }

    try {
      setChangingPassword(true);
      const res = await api.changePassword(currentPassword, newPassword);
      setPasswordSuccess(res.message || 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password. Please verify current password.');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <AdminLayout
      title="Website Settings"
      subtitle="Configure global brand identity, SEO defaults, social channels, and administrator security."
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-zinc-500">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-3" />
            <p className="text-xs font-mono uppercase tracking-wider">Loading Configuration...</p>
          </div>
        ) : (
          <>
            {/* General & SEO Settings */}
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {settingsError && (
                <div className="p-4 bg-red-950/40 border border-red-800 rounded-xl flex items-start gap-3 text-sm text-red-300">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{settingsError}</span>
                </div>
              )}

              {settingsSuccess && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-800 rounded-xl flex items-start gap-3 text-sm text-emerald-300">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>{settingsSuccess}</span>
                </div>
              )}

              {/* Brand Identity */}
              <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-6 space-y-5">
                <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-4">
                  <Globe className="w-5 h-5 text-red-500" />
                  <div>
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                      Brand Identity & SEO
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Website meta values and contact channel.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Website Name
                    </label>
                    <input
                      type="text"
                      value={settings.websiteName}
                      onChange={(e) => setSettings({ ...settings, websiteName: e.target.value })}
                      placeholder="Mental Tactic"
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Contact Email</span>
                    </label>
                    <input
                      type="email"
                      value={settings.contactEmail}
                      onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                      placeholder="contact@mentaltactic.com"
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Website Description
                  </label>
                  <textarea
                    rows={3}
                    value={settings.websiteDescription}
                    onChange={(e) =>
                      setSettings({ ...settings, websiteDescription: e.target.value })
                    }
                    placeholder="Short description summarizing the purpose and mission..."
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Logo Image URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={settings.logo}
                      onChange={(e) => setSettings({ ...settings, logo: e.target.value })}
                      placeholder="/uploads/... or image URL"
                      className="flex-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setIsLogoPickerOpen(true)}
                      className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Select
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Default SEO Title
                    </label>
                    <input
                      type="text"
                      value={settings.defaultSeoTitle}
                      onChange={(e) => setSettings({ ...settings, defaultSeoTitle: e.target.value })}
                      placeholder="Mental Tactic | Strategic Mindset"
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Default SEO Description
                    </label>
                    <input
                      type="text"
                      value={settings.defaultSeoDescription}
                      onChange={(e) =>
                        setSettings({ ...settings, defaultSeoDescription: e.target.value })
                      }
                      placeholder="Master tactical cognition and psychological resilience."
                      className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Social Channels */}
              <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
                  <Share2 className="w-5 h-5 text-red-500" />
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                    Social Media Channels
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1 font-mono">
                      X (Twitter) URL
                    </label>
                    <input
                      type="url"
                      value={settings.socialLinks.x || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          socialLinks: { ...settings.socialLinks, x: e.target.value },
                        })
                      }
                      placeholder="https://x.com/mentaltactic"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1 font-mono">
                      Instagram URL
                    </label>
                    <input
                      type="url"
                      value={settings.socialLinks.instagram || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          socialLinks: { ...settings.socialLinks, instagram: e.target.value },
                        })
                      }
                      placeholder="https://instagram.com/mentaltactic"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1 font-mono">
                      YouTube URL
                    </label>
                    <input
                      type="url"
                      value={settings.socialLinks.youtube || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          socialLinks: { ...settings.socialLinks, youtube: e.target.value },
                        })
                      }
                      placeholder="https://youtube.com/@mentaltactic"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1 font-mono">
                      Discord URL
                    </label>
                    <input
                      type="url"
                      value={settings.socialLinks.discord || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          socialLinks: { ...settings.socialLinks, discord: e.target.value },
                        })
                      }
                      placeholder="https://discord.gg/..."
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1 font-mono">
                      Telegram URL
                    </label>
                    <input
                      type="url"
                      value={settings.socialLinks.telegram || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          socialLinks: { ...settings.socialLinks, telegram: e.target.value },
                        })
                      }
                      placeholder="https://t.me/mentaltactic"
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-md shadow-red-900/30 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {savingSettings ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save Website Settings</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Administrator Password Change */}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
                  <ShieldCheck className="w-5 h-5 text-red-500" />
                  <div>
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                      Security & Password Management
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Update your administrator master password.
                    </p>
                  </div>
                </div>

                {passwordError && (
                  <div className="p-3 bg-red-950/40 border border-red-800 rounded-lg text-xs text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <div className="space-y-3 max-w-md">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-10 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      New Password (Min 8 Chars)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-10 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-10 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-lg border border-zinc-700 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {changingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Update Password</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Media Picker for Logo */}
      <MediaPickerModal
        isOpen={isLogoPickerOpen}
        onClose={() => setIsLogoPickerOpen(false)}
        onSelect={(url) => setSettings({ ...settings, logo: url })}
        title="Select Logo Image"
      />
    </AdminLayout>
  );
};
