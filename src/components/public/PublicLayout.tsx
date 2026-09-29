import React, { useState, useEffect } from 'react';
import { Shield, Menu, X, ArrowUpRight, LogOut, ChevronDown, Lock, Sun, Moon } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { WebsiteSettings } from '../../types';
import { api } from '../../services/api';
import { AuthModal } from './AuthModal';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const { path, navigate } = useRouter();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    let isMounted = true;
    api.getWebsiteSettings()
      .then((res) => {
        if (isMounted && res?.settings) {
          setSettings(res.settings);
        }
      })
      .catch(() => {
        // Safe default branding
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const openAuth = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { label: 'Articles', href: '/articles' },
    { label: 'Store', href: '/store' },
    { label: 'Donate', href: '/donations' },
  ];

  const brandName = settings?.websiteName || 'MENTAL TACTIC';

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-150">
      {/* Top Header - Compact, Modern Minimalist (Don's Tools Style) */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md border-b border-neutral-200/90 dark:border-neutral-800/90 transition-colors duration-150">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Left: Brand Logo & Title */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 text-left cursor-pointer group transition-opacity hover:opacity-85"
          >
            {settings?.logo ? (
              <img
                src={settings.logo}
                alt={brandName}
                className="w-6 h-6 rounded-md object-contain"
              />
            ) : (
              <div className="w-6 h-6 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-black flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 fill-red-600 text-red-600 stroke-[2.5]" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-neutral-900 dark:text-white text-base leading-none">
                {brandName}
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40">
                Cognitive Hub
              </span>
            </div>
          </button>

          {/* Center/Right: Desktop Navigation + Actions */}
          <div className="hidden md:flex items-center gap-5">
            <nav className="flex items-center gap-1">
              {navLinks.map((link) => {
                const active = path.startsWith(link.href);
                return (
                  <button
                    key={link.href}
                    onClick={() => navigate(link.href)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      active
                        ? 'bg-neutral-100 dark:bg-neutral-900 text-red-600 dark:text-red-500 font-bold'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900/60'
                    }`}
                  >
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Subtle Divider */}
            <div className="h-4 w-px bg-neutral-200 dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800" />

            {/* Auth Actions: Log In & Sign Up */}
            <div className="flex items-center gap-2">
              {isAuthenticated && user ? (
                /* Authenticated User Menu */
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-900 dark:text-white transition-colors cursor-pointer"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-4.5 h-4.5 rounded-full object-cover border border-red-500/40"
                      />
                    ) : (
                      <div className="w-4.5 h-4.5 rounded-full bg-red-600 text-white flex items-center justify-center text-[9px] font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="max-w-[100px] truncate">{user.username}</span>
                    {isAdmin && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60 font-semibold">
                        Admin
                      </span>
                    )}
                    <ChevronDown className="w-3 h-3 text-neutral-400" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#111111] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl py-1 z-50 animate-fade-in">
                      <div className="px-3.5 py-2 border-b border-neutral-100 dark:border-neutral-800 text-xs">
                        <span className="block font-semibold text-neutral-900 dark:text-white truncate">{user.username}</span>
                        <span className="block text-[10px] text-neutral-500 truncate">{user.email}</span>
                      </div>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            navigate('/admin');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 flex items-center gap-2 transition-colors cursor-pointer border-b border-neutral-100 dark:border-neutral-800 font-medium"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>Admin Dashboard</span>
                        </button>
                      )}

                      <button
                        onClick={async () => {
                          await logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Unauthenticated: Clean Minimal Log In & Sign Up */
                <>
                  <button
                    onClick={() => openAuth('login')}
                    className="px-2.5 py-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900"
                  >
                    Log In
                  </button>

                  <button
                    onClick={() => openAuth('signup')}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors active:scale-95 cursor-pointer shadow-xs"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>

            {/* TOP RIGHT: Compact Dark Mode / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors flex items-center justify-center cursor-pointer"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* Mobile Right Controls: Theme Toggle + Menu */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 flex items-center justify-center"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-8 h-8 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800 px-4 py-3 space-y-2 animate-fade-in">
            <nav className="space-y-1">
              <button
                onClick={() => {
                  navigate('/');
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  path === '/'
                    ? 'bg-neutral-100 dark:bg-neutral-900 text-red-600 dark:text-red-500 font-bold'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900'
                }`}
              >
                Home
              </button>
              {navLinks.map((link) => {
                const active = path.startsWith(link.href);
                return (
                  <button
                    key={link.href}
                    onClick={() => {
                      navigate(link.href);
                      setMobileMenuOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      active
                        ? 'bg-neutral-100 dark:bg-neutral-900 text-red-600 dark:text-red-500 font-bold'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900'
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </nav>

            {/* Mobile Auth Actions */}
            <div className="pt-2.5 border-t border-neutral-200 dark:border-neutral-800 flex flex-col gap-2">
              {isAuthenticated && user ? (
                <div className="space-y-2">
                  <div className="px-3 py-1 text-xs text-neutral-600 dark:text-neutral-400 flex items-center justify-between">
                    <span>Signed in as <strong className="text-neutral-950 dark:text-white">{user.username}</strong></span>
                    {isAdmin && (
                      <span className="text-[10px] font-mono uppercase bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900/60 font-semibold">
                        Admin
                      </span>
                    )}
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        navigate('/admin');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center justify-center gap-2"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Admin Dashboard</span>
                    </button>
                  )}

                  <button
                    onClick={async () => {
                      await logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => openAuth('login')}
                    className="py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-xs font-semibold text-neutral-800 dark:text-neutral-200 text-center"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => openAuth('signup')}
                    className="py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider text-center"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Public Content */}
      <main className="flex-1">{children}</main>

      {/* Public Footer - Compact Minimalist */}
      <footer className="bg-white dark:bg-[#0a0a0a] border-t border-neutral-200 dark:border-neutral-800 py-8 px-4 sm:px-6 mt-12 transition-colors duration-150">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-md">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-5 h-5 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-black flex items-center justify-center">
                <Shield className="w-3 h-3 fill-red-600 text-red-600" />
              </div>
              <span className="font-extrabold text-neutral-900 dark:text-white tracking-tight text-sm">
                {brandName}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              {settings?.websiteDescription ||
                'Tactical psychology, cognitive resilience, calculated risk, and high-performance mental architecture.'}
            </p>
          </div>

          {/* Navigation Links & Socials */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400 font-medium">
            <button
              onClick={() => navigate('/')}
              className="hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => navigate('/articles')}
              className="hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            >
              Articles
            </button>
            <button
              onClick={() => navigate('/store')}
              className="hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            >
              Store
            </button>
            <button
              onClick={() => navigate('/donations')}
              className="hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            >
              Donate
            </button>

            {/* Social Links if present */}
            {settings?.socialLinks?.x && (
              <a
                href={settings.socialLinks.x}
                target="_blank"
                rel="noreferrer"
                className="hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1 font-mono text-[11px]"
              >
                <span>X</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            )}
            {settings?.socialLinks?.instagram && (
              <a
                href={settings.socialLinks.instagram}
                target="_blank"
                rel="noreferrer"
                className="hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1 font-mono text-[11px]"
              >
                <span>IG</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            )}
            {settings?.contactEmail && (
              <a
                href={`mailto:${settings.contactEmail}`}
                className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-mono text-[11px]"
              >
                {settings.contactEmail}
              </a>
            )}

            {/* Admin link ONLY for authenticated admins */}
            {isAuthenticated && isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors text-[11px] font-mono uppercase tracking-wider cursor-pointer ml-1"
                title="Admin Management Console"
              >
                <Lock className="w-3 h-3 text-red-600 dark:text-red-500" />
                <span>Admin Dashboard</span>
              </button>
            )}
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-6 pt-4 border-t border-neutral-200/80 dark:border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-neutral-400 font-mono">
          <div>&copy; {new Date().getFullYear()} {brandName}. All rights reserved.</div>
          <div>
            Psychological Mastery & Strategic Cognition
          </div>
        </div>
      </footer>

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
};
