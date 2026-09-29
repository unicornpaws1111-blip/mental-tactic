import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Save,
  CheckCircle,
  Loader2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DonationSettings } from '../../types';
import { api } from '../../services/api';

export const AdminDonations: React.FC = () => {
  const [donations, setDonations] = useState<DonationSettings>({
    title: '',
    description: '',
    buttonText: '',
    donationUrl: '',
    paymentMethods: '',
    active: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getDonationSettings();
      setDonations(res.donations);
    } catch (err: any) {
      setError(err.message || 'Failed to load donation settings.');
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
      const res = await api.updateDonationSettings(donations);
      setDonations(res.donations);
      setSuccess('Donation configuration saved successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to save donation settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Donation Configuration"
      subtitle="Configure support methods, funding links, and contributor messaging."
    >
      <div className="max-w-3xl mx-auto space-y-6">
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
            <p className="text-xs font-mono uppercase tracking-wider">Loading Donation Settings...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <HeartHandshake className="w-5 h-5 text-red-500" />
                  <div>
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                      Public Donation Module
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Control visibility and details on the public site.
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-zinc-300 font-medium">Enable on site</span>
                  <input
                    type="checkbox"
                    checked={donations.active}
                    onChange={(e) => setDonations({ ...donations, active: e.target.checked })}
                    className="w-4 h-4 accent-red-600 rounded bg-zinc-950 border-zinc-700"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Donation Section Title
                </label>
                <input
                  type="text"
                  value={donations.title}
                  onChange={(e) => setDonations({ ...donations, title: e.target.value })}
                  placeholder="e.g. Back the Tactical Mindset Movement"
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Donation Description
                </label>
                <textarea
                  rows={4}
                  value={donations.description}
                  onChange={(e) => setDonations({ ...donations, description: e.target.value })}
                  placeholder="Explain how contributions power research, operations, and independent publications..."
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={donations.buttonText}
                    onChange={(e) => setDonations({ ...donations, buttonText: e.target.value })}
                    placeholder="e.g. Support via Stripe or Crypto"
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Donation / Payment URL
                  </label>
                  <input
                    type="url"
                    value={donations.donationUrl}
                    onChange={(e) => setDonations({ ...donations, donationUrl: e.target.value })}
                    placeholder="https://buy.stripe.com/... or Ko-fi / PayPal link"
                    className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Payment Methods Information
                </label>
                <textarea
                  rows={2}
                  value={donations.paymentMethods}
                  onChange={(e) => setDonations({ ...donations, paymentMethods: e.target.value })}
                  placeholder="e.g. Supports Credit Card, Apple Pay, Bitcoin, and Bank Wire..."
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-md shadow-red-900/30 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Donation Settings</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
};
