import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Image as ImageIcon,
  ShoppingBag,
  HeartHandshake,
  Home,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldAlert,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
}) => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { path, navigate, replace } = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Protected route enforcement
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      replace('/admin/login');
    }
  }, [isAuthenticated, isLoading, replace]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-red-600/30 border-t-red-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-red-600 rounded-full shadow-[0_0_12px_#ef4444]" />
          </div>
        </div>
        <p className="mt-4 text-xs font-mono uppercase tracking-widest text-zinc-400">
          Verifying Master Session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      replace('/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
      replace('/admin/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Articles', path: '/admin/articles', icon: FileText },
    { label: 'Categories', path: '/admin/categories', icon: FolderTree },
    { label: 'Media', path: '/admin/media', icon: ImageIcon },
    { label: 'Store', path: '/admin/store', icon: ShoppingBag },
    { label: 'Donations', path: '/admin/donations', icon: HeartHandshake },
    { label: 'Homepage', path: '/admin/homepage', icon: Home },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const isCurrentActive = (itemPath: string) => {
    if (itemPath === '/admin/dashboard') {
      return path === '/admin/dashboard' || path === '/admin';
    }
    return path.startsWith(itemPath);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col md:flex-row antialiased selection:bg-red-950 selection:text-red-200">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-900 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-red-950/80 border border-red-600/50 flex items-center justify-center shadow-[0_0_10px_rgba(220,38,38,0.4)]">
            <span className="font-serif font-black text-red-500 text-xs">M</span>
          </div>
          <div>
            <span className="font-serif tracking-wider font-bold text-white text-sm">
              MENTAL TACTIC
            </span>
            <span className="block text-[9px] font-mono text-red-500 font-semibold tracking-widest uppercase">
              CMS PORTAL
            </span>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar for Desktop */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen z-50 md:z-30 w-64 bg-zinc-950/95 md:bg-zinc-950 border-r border-zinc-900 flex flex-col transition-transform duration-300 backdrop-blur-md ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-950 border border-red-600/60 flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.5)]">
              <span className="font-serif font-black text-red-500 text-sm">MT</span>
            </div>
            <div>
              <h1 className="font-serif text-sm font-extrabold text-white tracking-widest leading-none">
                MENTAL TACTIC
              </h1>
              <p className="text-[10px] font-mono text-red-500 tracking-wider font-semibold uppercase mt-1">
                PRIVATE CMS
              </p>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-zinc-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="px-5 py-3.5 border-b border-zinc-900/80 bg-zinc-900/30 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
            {user?.username?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {user?.username || 'Administrator'}
            </p>
            <p className="text-[10px] font-mono text-zinc-500 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isCurrentActive(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                  active
                    ? 'bg-zinc-900 text-white font-semibold border-l-2 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.15)]'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    active ? 'text-red-500' : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}
                />
                <span className="flex-1 text-left">{item.label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 text-red-500 opacity-80" />}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-zinc-900 space-y-2 bg-zinc-950/60">
          {/* Quick link to view public website in new tab */}
          <button
            type="button"
            onClick={() => window.open('/', '_blank')}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 hover:bg-zinc-900 rounded-lg border border-zinc-800/80 transition-colors"
            title="Open public website in a new window"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
              <span>Public Website</span>
            </span>
            <span className="text-[10px] text-zinc-600 font-mono">/</span>
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-400 hover:text-white bg-red-950/20 hover:bg-red-950/50 border border-red-900/30 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoggingOut ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5 text-red-500" />
            )}
            <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-zinc-950 min-h-screen">
        {/* Top Header */}
        <header className="px-6 py-5 border-b border-zinc-900/90 bg-zinc-950/80 sticky top-0 z-20 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              {title}
            </h2>
            {subtitle && <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>}
          </div>

          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </header>

        {/* Content Body */}
        <div className="p-6 flex-1">{children}</div>
      </main>
    </div>
  );
};
