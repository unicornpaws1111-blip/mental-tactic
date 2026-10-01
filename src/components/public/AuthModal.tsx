import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User as UserIcon, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { signInWithGoogleFirebase, FirebaseClientConfig } from '../../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { login, register, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseClientConfig | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccess(null);
  }, [initialMode, isOpen]);

  // Fetch public Google / Firebase configuration
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    api.getAuthConfig()
      .then((cfg) => {
        if (!isMounted) return;
        if (cfg?.firebase) {
          setFirebaseConfig(cfg.firebase);
        }
      })
      .catch(() => {
        // Fallback to client-side env variables
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // 1. Authenticate with Firebase Google Provider
      const authResult = await signInWithGoogleFirebase(firebaseConfig || undefined);
      if (!authResult || typeof authResult !== 'object' || !('token' in authResult) || !authResult.token) {
        throw new Error('Google sign-in did not return a valid credentials token.');
      }

      // 2. Establish authenticated session with backend (or direct fallback session)
      await loginWithGoogle(authResult.token, authResult.user);
      setSuccess('Google authentication verified.');
      setTimeout(() => onClose(), 600);
    } catch (err: any) {
      console.error('Firebase Google sign-in failed:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completing.');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        // Ignored
      } else {
        setError(err?.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login({ email: email.trim(), password });
        setSuccess('Logged in successfully.');
        setTimeout(() => onClose(), 500);
      } else {
        if (!username.trim()) {
          throw new Error('Please enter a display name or username.');
        }
        await register({
          email: email.trim(),
          username: username.trim(),
          password,
        });
        setSuccess('Member account created successfully.');
        setTimeout(() => onClose(), 500);
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication request failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* Modal Surface: Compact, restrained width and height */}
      <div className="relative w-full max-w-[360px] max-h-[85vh] flex flex-col bg-white dark:bg-[#111111] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-10 animate-fade-in text-neutral-900 dark:text-neutral-100">
        {/* Top red accent line */}
        <div className="h-1 w-full bg-red-600 shrink-0" />

        {/* Modal Header */}
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight">
              {mode === 'login' ? 'Member Log In' : 'Create Account'}
            </h2>
            <p className="text-[11px] text-neutral-400">
              {mode === 'login' ? 'Access tactical intelligence' : 'Join Mental Tactic'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-black dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="px-5 pt-3 shrink-0">
          <div className="grid grid-cols-2 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg border border-neutral-200/80 dark:border-neutral-800/80 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-1.5 rounded-md transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white dark:bg-[#1a1a1a] text-neutral-900 dark:text-white shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-black dark:hover:text-white'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`py-1.5 rounded-md transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white dark:bg-[#1a1a1a] text-neutral-900 dark:text-white shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-black dark:hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-3">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-red-600 dark:text-red-500 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Google Sign-In Action */}
          <div className="space-y-1.5">
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full py-2 px-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-all flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer disabled:opacity-60 shadow-xs"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 8.9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1c0 2.8.7 5.4 1.9 7.8l3.7-2.9c-.2-.7-.4-1.5-.4-2.3z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.5-2.3-6.4-5.2L1.9 17C3.7 20.6 7.5 24 12 24z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center py-0.5">
            <div className="border-t border-neutral-200 dark:border-neutral-800 w-full" />
            <span className="bg-white dark:bg-[#111111] px-2 text-[9px] uppercase tracking-wider text-neutral-400">
              or with email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-2.5">
            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Display Name
                </label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. Commander Marcus"
                    className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 dark:bg-[#161616] border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-red-600 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@mentaltactic.com"
                  className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 dark:bg-[#161616] border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-red-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 dark:bg-[#161616] border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-red-600 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2 bg-red-600 hover:bg-red-700 disabled:bg-neutral-200 dark:disabled:bg-neutral-800 disabled:text-neutral-400 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-xs"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{mode === 'login' ? 'Log In' : 'Create Account'}</span>
            </button>
          </form>

          {/* Privacy Note */}
          <p className="text-[10px] text-neutral-400 text-center leading-relaxed pt-0.5">
            By proceeding, you agree to our terms of access.
          </p>
        </div>
      </div>
    </div>
  );
};
