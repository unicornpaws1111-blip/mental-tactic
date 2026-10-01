import React, { useState, useEffect } from 'react';
import { HeartHandshake, ExternalLink, Loader2, ShieldCheck, Lock } from 'lucide-react';
import { PublicLayout } from '../../components/public/PublicLayout';
import { DonationSettings } from '../../types';
import { api } from '../../services/api';

export const PublicDonations: React.FC = () => {
  const [donations, setDonations] = useState<DonationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.getDonationSettings()
      .then((res) => {
        if (isMounted) setDonations(res?.donations || null);
      })
      .catch(() => {
        if (isMounted) setDonations(null);
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {loading ? (
          <div className="py-20 text-center text-neutral-500">
            <Loader2 className="w-6 h-6 text-red-600 animate-spin mx-auto mb-2" />
            <p className="text-xs font-mono text-neutral-400">
              Loading Patronage Portal...
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#111111] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 text-center shadow-xs">
            {/* Heart icon and Donate title */}
            <div className="flex flex-col items-center justify-center mb-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-red-600 dark:text-red-500 mb-3">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-tight text-center">
                {donations?.title || 'Support Mental Tactic'}
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-lg mx-auto mb-6">
              {donations?.description ||
                'Contributions sustain independent tactical research, non-commercial psychological briefings, investigative essays, and cognitive training resources.'}
            </p>

            {donations?.donationUrl ? (
              <div className="space-y-3">
                <a
                  href={donations.donationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors active:scale-95 cursor-pointer shadow-xs"
                >
                  <span>{donations.buttonText || 'Make a Contribution'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                {donations.paymentMethods && (
                  <p className="text-[11px] text-neutral-400 font-mono mt-2 max-w-md mx-auto">
                    Supported channels: {donations.paymentMethods}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg max-w-sm mx-auto text-xs text-neutral-400 font-mono">
                Patronage channels are currently undergoing secure maintenance.
              </div>
            )}

            <div className="mt-8 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-center gap-4 text-[10px] text-neutral-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
                <span>100% Independent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-red-600" />
                <span>Secure External Processing</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
};
