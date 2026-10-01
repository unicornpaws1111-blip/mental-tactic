import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Mail, Shield, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';

export const AdminLogin: React.FC = () => {
  const { isAuthenticated, hasAdmin, login, setupAdmin, isLoading } = useAuth();
  const { replace } = useRouter();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      replace('/admin/dashboard');
    }
  }, [isAuthenticated, isLoading, replace]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide all required fields.');
      return;
    }

    if (!hasAdmin) {
      // First-time setup flow
      if (password.length < 8) {
        setError('Master password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      try {
        setSubmitting(true);
        await setupAdmin({
          email: email.trim(),
          username: username.trim() || undefined,
          password,
        });
        replace('/admin/dashboard');
      } catch (err: any) {
        setError(err.message || 'Setup failed. Please try again.');
      } finally {
        setSubmitting(false);
      }
    } else {
      // Regular login flow
      try {
        setSubmitting(true);
        await login({ email: email.trim(), password });
        replace('/admin/dashboard');
      } catch (err: any) {
        setError(err.message || 'Invalid login credentials. Access denied.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-64 h-64 bg-red-900/10 rounded-full blur-2xl pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl relative z-10">
        {/* Brand Icon & Heading */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900 border border-red-600/50 shadow-[0_0_25px_rgba(220,38,38,0.4)] mb-4">
            <Shield className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-wider text-white">
            MENTAL TACTIC
          </h1>
          <p className="text-xs font-mono tracking-widest text-red-500 uppercase mt-1">
            Master Admin Access
          </p>
        </div>

        {/* Quick Demo Sign In Button */}
        <div className="mb-6 p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-center">
          <p className="text-[11px] text-zinc-400 font-mono mb-2">
            Default credentials: <span className="text-zinc-200">admin@mentaltactic.com</span>
          </p>
          <button
            type="button"
            onClick={async () => {
              try {
                setSubmitting(true);
                setError('');
                await login({ email: 'admin@mentaltactic.com', password: 'admin12345' });
                replace('/admin/articles');
              } catch (err: any) {
                setError(err.message || 'Quick login failed');
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={submitting}
            className="w-full py-2 px-3 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-xs font-semibold text-white rounded-lg border border-zinc-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>⚡ Quick 1-Click Admin Access</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-3 text-sm text-red-300 animate-shake">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email / Username Field */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              {hasAdmin ? 'Email or Username' : 'Administrator Email'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={hasAdmin ? 'text' : 'email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={hasAdmin ? 'admin@mentaltactic.com' : 'your.email@example.com'}
                required
                disabled={submitting}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Setup-only Username field */}
          {!hasAdmin && (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Display Username (Optional)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. Commander"
                disabled={submitting}
                className="w-full px-4 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all disabled:opacity-50"
              />
            </div>
          )}

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                {hasAdmin ? 'Password' : 'Create Master Password'}
              </label>
              {!hasAdmin && (
                <span className="text-[10px] text-zinc-500">Min 8 chars</span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                disabled={submitting}
                className="w-full pl-10 pr-10 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Setup-only Confirm Password */}
          {!hasAdmin && (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Confirm Master Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  disabled={submitting}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all disabled:opacity-50"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-6 py-3 px-4 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-semibold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{hasAdmin ? 'Authenticating...' : 'Initializing System...'}</span>
              </>
            ) : (
              <>
                <span>{hasAdmin ? 'Sign In to CMS' : 'Create Master Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-8 pt-6 border-t border-zinc-900 text-center">
          <p className="text-[11px] text-zinc-600 font-mono">
            SECURE PROTECTED ENDPOINT • MENTAL TACTIC CMS
          </p>
        </div>
      </div>
    </div>
  );
};
